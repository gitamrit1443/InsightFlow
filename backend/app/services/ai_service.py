import asyncio
import hashlib
import json
import time
from abc import ABC, abstractmethod
from collections import Counter, deque
from typing import Any

import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.models.project import Project
from app.models.uploaded_file import UploadedFile
from app.services.nlp_service import nlp_service

SYSTEM_PROMPT = """You are InsightFlow AI, a professional data analysis assistant.

Your role is to analyze uploaded business data, reports, customer feedback, spreadsheets, PDFs, and structured or unstructured information.

You must produce clear, accurate, actionable insights for business users.

When analyzing data, always provide:
1. A short executive summary.
2. Key findings.
3. Important trends.
4. Possible anomalies or risks.
5. Business opportunities.
6. Recommended next actions.
7. Questions the user may want to investigate next.

Use simple business language. Avoid unnecessary jargon unless the user asks for technical detail.
When data is incomplete, say what is missing. Do not invent exact numbers unless they exist in the provided data.
When giving recommendations, make them practical, prioritized, and tied to the evidence in the uploaded data.
Format responses with headings, bullet points, and concise explanations."""


class AIProvider(ABC):
    @abstractmethod
    async def complete(self, prompt: str) -> dict[str, Any]:
        raise NotImplementedError


class LocalNLPProvider(AIProvider):
    async def complete(self, prompt: str) -> dict[str, Any]:
        payload = json.loads(prompt)
        operation = payload.get("operation")
        if operation == "ask_project_question":
            return self._answer_question(payload)
        if operation == "generate_dashboard_plan":
            return self._dashboard(payload)
        if operation == "generate_report":
            return self._report(payload)
        return self._insights(payload)

    @staticmethod
    def _files(payload: dict[str, Any]) -> list[dict[str, Any]]:
        return payload.get("files", [])

    def _insights(self, payload: dict[str, Any]) -> dict[str, Any]:
        files = self._files(payload)
        summaries: list[str] = []
        findings: list[str] = []
        trends: list[str] = []
        anomalies: list[str] = []
        opportunities: list[str] = []
        recommendations: list[str] = []
        questions: list[str] = []
        total_rows = 0
        sentiments: list[float] = []
        keywords: Counter[str] = Counter()

        for file in files:
            parsed = file.get("parsed_data") or {}
            analysis = parsed.get("document_analysis", {})
            analytics = parsed.get("analytics", {})
            if analysis.get("summary"):
                summaries.append(f"{file['name']}: {analysis['summary']}")
            for keyword in analysis.get("keywords", [])[:8]:
                keywords[keyword["term"]] += int(keyword["count"])
            sentiment = analysis.get("sentiment", {})
            if sentiment:
                sentiments.append(float(sentiment.get("score", 0)))
            row_count = int(parsed.get("row_count", 0))
            total_rows += row_count
            if row_count:
                findings.append(
                    f"{file['name']} contains {row_count:,} records across "
                    f"{int(parsed.get('column_count', 0))} columns."
                )
            for profile in analytics.get("categorical_profiles", [])[:2]:
                if profile.get("labels"):
                    findings.append(
                        f"The leading {profile['column']} category is "
                        f"{profile['labels'][0]} with {profile['values'][0]:,} records."
                    )
            for series in analytics.get("time_series", [])[:2]:
                values = series.get("values", [])
                labels = series.get("labels", [])
                if len(values) >= 2:
                    direction = "increased" if values[-1] > values[0] else "decreased"
                    trends.append(
                        f"Monthly record volume for {series['column']} {direction} from "
                        f"{values[0]:,} in {labels[0]} to {values[-1]:,} in {labels[-1]}."
                    )
            for correlation in analytics.get("correlations", [])[:3]:
                strength = abs(float(correlation["coefficient"]))
                if strength >= 0.5:
                    trends.append(
                        f"{correlation['first']} and {correlation['second']} show a "
                        f"{'positive' if correlation['coefficient'] > 0 else 'negative'} "
                        f"correlation of {correlation['coefficient']:.2f}."
                    )
            for anomaly in analytics.get("anomalies", [])[:3]:
                anomalies.append(
                    f"{anomaly['column']} has {anomaly['count']} IQR outliers outside "
                    f"{anomaly['lower_bound']:.2f} to {anomaly['upper_bound']:.2f}."
                )
            missing = analytics.get("missing_values", {})
            if missing:
                worst = max(missing.items(), key=lambda item: item[1])
                anomalies.append(f"{worst[0]} has {worst[1]:,} missing values.")

        top_terms = [term for term, _ in keywords.most_common(5)]
        average_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0.0
        if top_terms:
            findings.append(f"Most frequent document themes: {', '.join(top_terms)}.")
            opportunities.append(
                f"Create a focused review around the dominant themes: {', '.join(top_terms[:3])}."
            )
        if sentiments:
            trends.append(
                f"Document sentiment is {'positive' if average_sentiment > 0.15 else 'negative' if average_sentiment < -0.15 else 'neutral'} "
                f"with a lexical score of {average_sentiment:.2f}."
            )
        if anomalies:
            recommendations.append("Validate detected outliers and missing values against the source system.")
        if total_rows:
            recommendations.append("Track the strongest numeric and category signals in a recurring dashboard.")
        recommendations.append("Review the highest-ranked retrieved passages before making a high-impact decision.")
        questions.extend(
            [
                "Which category contributes the largest share of records?",
                "Which numeric columns contain the most significant outliers?",
                "What evidence in the documents supports the strongest recommendation?",
            ]
        )
        executive = (
            f"InsightFlow processed {len(files)} file(s)"
            + (f" containing {total_rows:,} structured records" if total_rows else "")
            + ". "
            + (" ".join(summaries[:2]) if summaries else "The extracted content is ready for retrieval and analysis.")
        )
        return {
            "executive_summary": executive,
            "key_findings": findings or ["No structured findings were detected in the extracted content."],
            "trends": trends or ["No reliable time or correlation trend was detected."],
            "anomalies": anomalies or ["No IQR-based numeric anomaly was detected."],
            "opportunities": opportunities or ["Add more representative data to improve segmentation."],
            "recommendations": recommendations,
            "follow_up_questions": questions,
            "confidence_score": 0.84 if files else 0.3,
            "provider": "local-nlp",
            "sentiment_score": round(average_sentiment, 4),
            "top_keywords": top_terms,
        }

    def _dashboard(self, payload: dict[str, Any]) -> dict[str, Any]:
        files = self._files(payload)
        widgets: list[dict[str, Any]] = []
        total_rows = sum(int((file.get("parsed_data") or {}).get("row_count", 0)) for file in files)
        widgets.append({"type": "kpi", "title": "Records analyzed", "value": total_rows})
        widgets.append({"type": "kpi", "title": "Files processed", "value": len(files)})
        for file in files:
            parsed = file.get("parsed_data") or {}
            analytics = parsed.get("analytics", {})
            document = parsed.get("document_analysis", {})
            sentiment = document.get("sentiment", {})
            if sentiment:
                widgets.append(
                    {
                        "type": "kpi",
                        "title": f"{file['name']} sentiment",
                        "value": f"{float(sentiment.get('score', 0)) * 100:.0f}%",
                    }
                )
            for profile in analytics.get("numeric_profiles", [])[:2]:
                widgets.append(
                    {
                        "type": "kpi",
                        "title": f"Average {profile['column']}",
                        "value": profile["mean"],
                    }
                )
            for category in analytics.get("categorical_profiles", [])[:2]:
                widgets.append(
                    {
                        "type": "pie",
                        "title": f"{category['column']} distribution",
                        "labels": category["labels"],
                        "series": category["values"],
                    }
                )
            for series in analytics.get("time_series", [])[:2]:
                widgets.append(
                    {
                        "type": "line",
                        "title": f"{series['column']} monthly trend",
                        "labels": series["labels"],
                        "series": series["values"],
                    }
                )
            keywords = document.get("keywords", [])[:8]
            if keywords:
                widgets.append(
                    {
                        "type": "bar",
                        "title": f"{file['name']} top themes",
                        "labels": [item["term"] for item in keywords],
                        "series": [item["count"] for item in keywords],
                    }
                )
        return {
            "widgets": widgets[:12],
            "provider": "local-nlp",
            "data_grounded": True,
        }

    def _answer_question(self, payload: dict[str, Any]) -> dict[str, Any]:
        passages = payload.get("retrieved_passages", [])
        if not passages:
            answer = "No relevant passage was found. Process a document or ask a question using terms present in the uploaded data."
        else:
            evidence = " ".join(item["text"] for item in passages[:3])
            summary = nlp_service.extractive_summary(
                [evidence], nlp_service.keywords(evidence)
            )
            answer = f"{summary}\n\nEvidence was retrieved from {len(passages)} relevant document chunks."
        return {
            "executive_summary": answer,
            "recommendations": [
                "Verify the cited evidence against the original uploaded file.",
                "Refine the question with a category, date, metric, or entity for a narrower answer.",
            ],
            "retrieved_passages": passages,
            "confidence_score": round(passages[0]["score"], 4) if passages else 0.0,
            "provider": "local-rag",
        }

    def _report(self, payload: dict[str, Any]) -> dict[str, Any]:
        insights = payload.get("insights", [])
        content = "\n".join(insights)
        return {
            "executive_summary": nlp_service.extractive_summary(
                [content], nlp_service.keywords(content)
            ),
            "key_findings": insights[:4],
            "trends": ["See the project trend insights and generated dashboard series."],
            "anomalies": ["Review the anomaly section for IQR outliers and missing values."],
            "opportunities": ["Prioritize actions supported by multiple retrieved passages or metrics."],
            "recommendations": ["Assign owners and target dates to the highest-priority actions."],
            "follow_up_questions": ["What changed after the recommended actions were implemented?"],
            "provider": "local-nlp",
        }


class OpenAICompatibleProvider(AIProvider):
    def __init__(self) -> None:
        self.base_url = "https://api.openai.com/v1"

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=8),
        stop=stop_after_attempt(settings.ai_max_retries),
        reraise=True,
    )
    async def complete(self, prompt: str) -> dict[str, Any]:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is not configured.")
        async with httpx.AsyncClient(timeout=settings.ai_timeout_seconds) as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {settings.openai_api_key}"},
                json={
                    "model": settings.openai_model,
                    "response_format": {"type": "json_object"},
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                },
            )
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return json.loads(content)


class CircuitBreaker:
    def __init__(self, threshold: int = 3, reset_seconds: int = 60) -> None:
        self.failures: deque[float] = deque(maxlen=threshold)
        self.threshold = threshold
        self.reset_seconds = reset_seconds

    @property
    def open(self) -> bool:
        return (
            len(self.failures) >= self.threshold
            and time.monotonic() - self.failures[-1] < self.reset_seconds
        )

    def record_failure(self) -> None:
        self.failures.append(time.monotonic())

    def record_success(self) -> None:
        self.failures.clear()


class AIService:
    def __init__(self, provider: AIProvider | None = None) -> None:
        self.provider = provider or (
            OpenAICompatibleProvider()
            if settings.ai_provider.lower() in {"openai", "openai-compatible"}
            else LocalNLPProvider()
        )
        self.fallback = LocalNLPProvider()
        self.breaker = CircuitBreaker()
        self.cache: dict[str, dict[str, Any]] = {}

    async def _run(self, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
        cache_key = hashlib.sha256(
            json.dumps({"operation": operation, **payload}, default=str, sort_keys=True).encode()
        ).hexdigest()
        if cache_key in self.cache:
            return {**self.cache[cache_key], "cached": True}
        prompt = json.dumps({"operation": operation, **payload}, default=str)
        try:
            if self.breaker.open:
                raise RuntimeError("AI provider circuit is temporarily open.")
            result = await asyncio.wait_for(
                self.provider.complete(prompt), timeout=settings.ai_timeout_seconds
            )
            self.breaker.record_success()
        except Exception:
            self.breaker.record_failure()
            result = await self.fallback.complete(prompt)
            result["fallback"] = True
        self.cache[cache_key] = result
        return result

    @staticmethod
    def project_payload(project: Project, files: list[UploadedFile]) -> dict[str, Any]:
        def compact_parsed_data(file: UploadedFile) -> dict[str, Any] | list | None:
            if not isinstance(file.parsed_data, dict):
                return file.parsed_data
            compact = dict(file.parsed_data)
            document = compact.get("document_analysis")
            if isinstance(document, dict):
                compact["document_analysis"] = {
                    **document,
                    "chunks": [
                        {"index": chunk.get("index"), "text": chunk.get("text")}
                        for chunk in document.get("chunks", [])
                    ],
                }
            return compact

        return {
            "project": {
                "name": project.name,
                "description": project.description,
                "category": project.category,
                "goal": project.goal,
            },
            "files": [
                {
                    "name": file.original_name,
                    "type": file.file_type,
                    "content": (file.extracted_text or "")[:18_000],
                    "parsed_data": compact_parsed_data(file),
                }
                for file in files
            ],
        }

    async def analyze_project_data(self, project: Project, files: list[UploadedFile]) -> dict:
        return await self._run("analyze_project_data", self.project_payload(project, files))

    async def generate_insights(self, project: Project, files: list[UploadedFile]) -> dict:
        return await self._run("generate_insights", self.project_payload(project, files))

    async def generate_dashboard_plan(self, project: Project, files: list[UploadedFile]) -> dict:
        return await self._run("generate_dashboard_plan", self.project_payload(project, files))

    async def generate_report(self, project: Project, insights: list, dashboards: list) -> dict:
        return await self._run(
            "generate_report",
            {
                "project": project.name,
                "insights": [item.content for item in insights],
                "dashboards": [item.layout_config for item in dashboards],
            },
        )

    async def ask_project_question(
        self,
        project: Project,
        files: list[UploadedFile],
        chat_history: list,
        question: str,
    ) -> dict:
        document_analyses = [
            (file.parsed_data or {}).get("document_analysis", {})
            for file in files
            if isinstance(file.parsed_data, dict)
        ]
        retrieved_passages = nlp_service.retrieve(
            question, document_analyses, top_k=5
        )
        return await self._run(
            "ask_project_question",
            {
                "project": project.name,
                "history": [{"role": item.role.value, "content": item.content} for item in chat_history[-20:]],
                "question": question,
                "retrieved_passages": retrieved_passages,
            },
        )


ai_service = AIService()
