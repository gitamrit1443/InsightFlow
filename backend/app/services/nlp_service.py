import asyncio
import math
import os
import re
from collections import Counter
from dataclasses import dataclass
from typing import Any

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings

TOKEN_PATTERN = re.compile(r"[A-Za-z][A-Za-z0-9'-]{2,}")
ENTITY_PATTERN = re.compile(
    r"\b(?:[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,3}|[A-Z]{2,}(?:\s+[A-Z]{2,})*)\b"
)
STOP_WORDS = {
    "about", "after", "again", "also", "among", "and", "are", "because", "been",
    "before", "being", "between", "both", "but", "can", "could", "data", "does",
    "each", "from", "have", "into", "more", "most", "not", "only", "other",
    "over", "same", "should", "some", "such", "than", "that", "their", "then",
    "there", "these", "they", "this", "through", "under", "very", "was", "were",
    "what", "when", "where", "which", "while", "will", "with", "would", "your",
}
POSITIVE_WORDS = {
    "achieve", "benefit", "best", "better", "excellent", "gain", "good", "growth",
    "happy", "improve", "increased", "opportunity", "positive", "profit", "success",
    "strong", "satisfied", "valuable",
}
NEGATIVE_WORDS = {
    "bad", "churn", "complaint", "decline", "decrease", "delay", "difficult",
    "error", "failed", "frustrated", "loss", "negative", "poor", "problem", "risk",
    "slow", "unhappy", "weak", "worse",
}


@dataclass
class EmbeddingResult:
    vectors: list[list[float]]
    backend: str
    model: str


def chunk_text(text: str) -> list[str]:
    cleaned = re.sub(r"\s+", " ", text).strip()
    if not cleaned:
        return []
    chunks: list[str] = []
    start = 0
    while start < len(cleaned) and len(chunks) < settings.nlp_max_chunks:
        end = min(start + settings.nlp_chunk_size, len(cleaned))
        if end < len(cleaned):
            boundary = cleaned.rfind(" ", start, end)
            if boundary > start + settings.nlp_chunk_size // 2:
                end = boundary
        chunks.append(cleaned[start:end].strip())
        if end >= len(cleaned):
            break
        next_start = max(end - settings.nlp_chunk_overlap, start + 1)
        if next_start > 0 and not cleaned[next_start - 1].isspace():
            boundary = cleaned.find(" ", next_start, end)
            if boundary != -1:
                next_start = boundary + 1
        start = next_start
    return chunks


class TensorFlowEmbeddingBackend:
    def __init__(self) -> None:
        self._tokenizer = None
        self._model = None
        self._load_error: str | None = None

    def _load(self) -> None:
        if self._model is not None or self._load_error:
            return
        try:
            os.environ.setdefault("TF_USE_LEGACY_KERAS", "1")
            import tensorflow as tf
            from transformers import AutoTokenizer, TFAutoModel

            self._tf = tf
            settings.nlp_model_cache_dir.mkdir(parents=True, exist_ok=True)
            load_options = {
                "cache_dir": str(settings.nlp_model_cache_dir),
                "local_files_only": not settings.nlp_allow_model_download,
            }
            self._tokenizer = AutoTokenizer.from_pretrained(
                settings.nlp_transformer_model, **load_options
            )
            self._model = TFAutoModel.from_pretrained(
                settings.nlp_transformer_model, **load_options
            )
        except Exception as exc:
            self._load_error = str(exc)

    def embed(self, texts: list[str]) -> EmbeddingResult:
        self._load()
        if self._model is None or self._tokenizer is None:
            raise RuntimeError(self._load_error or "TensorFlow transformer is unavailable.")
        vectors: list[list[float]] = []
        for start in range(0, len(texts), settings.nlp_embedding_batch_size):
            batch = texts[start : start + settings.nlp_embedding_batch_size]
            tokens = self._tokenizer(
                batch,
                padding=True,
                truncation=True,
                max_length=256,
                return_tensors="tf",
            )
            output = self._model(tokens, training=False).last_hidden_state
            mask = self._tf.cast(tokens["attention_mask"][..., None], output.dtype)
            pooled = self._tf.reduce_sum(output * mask, axis=1) / self._tf.maximum(
                self._tf.reduce_sum(mask, axis=1), 1e-9
            )
            normalized = self._tf.math.l2_normalize(pooled, axis=1).numpy()
            vectors.extend(np.round(normalized, 6).tolist())
        return EmbeddingResult(
            vectors=vectors,
            backend="tensorflow-transformer",
            model=settings.nlp_transformer_model,
        )


class NLPService:
    def __init__(self) -> None:
        self.transformer = TensorFlowEmbeddingBackend()

    @staticmethod
    def _tfidf_embeddings(texts: list[str]) -> EmbeddingResult:
        vectorizer = TfidfVectorizer(max_features=384, stop_words="english")
        try:
            matrix = vectorizer.fit_transform(texts).toarray()
        except ValueError:
            matrix = np.eye(len(texts), dtype=float)
        return EmbeddingResult(
            vectors=np.round(matrix, 6).tolist(),
            backend="tfidf-fallback",
            model="sklearn-tfidf",
        )

    def embed(self, texts: list[str]) -> EmbeddingResult:
        if not texts:
            return EmbeddingResult([], "none", "none")
        if settings.nlp_enable_transformers:
            try:
                return self.transformer.embed(texts)
            except Exception:
                pass
        return self._tfidf_embeddings(texts)

    @staticmethod
    def _lexical_scores(question: str, chunks: list[dict[str, Any]]) -> np.ndarray:
        corpus = [question, *[item["text"] for item in chunks]]
        try:
            matrix = TfidfVectorizer(max_features=512, stop_words="english").fit_transform(corpus)
            return cosine_similarity(matrix[0:1], matrix[1:])[0]
        except ValueError:
            return np.zeros(len(chunks))

    @staticmethod
    def keywords(text: str, limit: int = 15) -> list[dict[str, Any]]:
        tokens = [
            token.lower()
            for token in TOKEN_PATTERN.findall(text)
            if token.lower() not in STOP_WORDS
        ]
        return [{"term": term, "count": count} for term, count in Counter(tokens).most_common(limit)]

    @staticmethod
    def entities(text: str, limit: int = 20) -> list[dict[str, Any]]:
        values = [
            value.strip()
            for value in ENTITY_PATTERN.findall(text)
            if value.lower() not in STOP_WORDS and len(value) > 2
        ]
        return [{"text": text, "count": count} for text, count in Counter(values).most_common(limit)]

    @staticmethod
    def sentiment(text: str) -> dict[str, Any]:
        tokens = [token.lower() for token in TOKEN_PATTERN.findall(text)]
        positive = sum(token in POSITIVE_WORDS for token in tokens)
        negative = sum(token in NEGATIVE_WORDS for token in tokens)
        total = positive + negative
        score = (positive - negative) / total if total else 0.0
        label = "positive" if score > 0.15 else "negative" if score < -0.15 else "neutral"
        return {
            "label": label,
            "score": round(score, 4),
            "positive_signals": positive,
            "negative_signals": negative,
        }

    def analyze_document(self, text: str) -> dict[str, Any]:
        chunks = chunk_text(text)
        embeddings = self.embed(chunks)
        keyword_data = self.keywords(text)
        entity_data = self.entities(text)
        sentiment_data = self.sentiment(text)
        return {
            "status": "complete",
            "embedding_backend": embeddings.backend,
            "embedding_model": embeddings.model,
            "chunk_count": len(chunks),
            "word_count": len(TOKEN_PATTERN.findall(text)),
            "chunks": [
                {"index": index, "text": chunk, "embedding": embeddings.vectors[index]}
                for index, chunk in enumerate(chunks)
            ],
            "keywords": keyword_data,
            "entities": entity_data,
            "sentiment": sentiment_data,
            "summary": self.extractive_summary(chunks, keyword_data),
        }

    @staticmethod
    def extractive_summary(
        chunks: list[str], keywords: list[dict[str, Any]], sentence_limit: int = 4
    ) -> str:
        if not chunks:
            return "No readable text was extracted from this document."
        keyword_weights = {item["term"]: item["count"] for item in keywords}
        sentences = re.split(r"(?<=[.!?])\s+", " ".join(chunks))
        scored: list[tuple[float, int, str]] = []
        for index, sentence in enumerate(sentences):
            tokens = [token.lower() for token in TOKEN_PATTERN.findall(sentence)]
            if not 5 <= len(tokens) <= 80:
                continue
            score = sum(keyword_weights.get(token, 0) for token in tokens) / math.sqrt(len(tokens))
            scored.append((score, index, sentence.strip()))
        selected = sorted(sorted(scored, reverse=True)[:sentence_limit], key=lambda item: item[1])
        return " ".join(item[2] for item in selected) or chunks[0][:600]

    def retrieve(
        self, question: str, document_analyses: list[dict[str, Any]], top_k: int = 5
    ) -> list[dict[str, Any]]:
        all_chunks: list[dict[str, Any]] = []
        for analysis in document_analyses:
            for chunk in analysis.get("chunks", []):
                all_chunks.append(chunk)
        if not all_chunks:
            return []

        backends = {
            analysis.get("embedding_backend")
            for analysis in document_analyses
            if analysis.get("chunks")
        }
        dimensions = {
            len(chunk.get("embedding", []))
            for chunk in all_chunks
            if chunk.get("embedding")
        }
        if backends == {"tensorflow-transformer"} and len(dimensions) == 1:
            query_result = self.embed([question])
            query = query_result.vectors[0]
            if (
                query_result.backend == "tensorflow-transformer"
                and len(query) in dimensions
            ):
                scores = cosine_similarity(
                    np.asarray([query]), np.asarray([item["embedding"] for item in all_chunks])
                )[0]
            else:
                scores = self._lexical_scores(question, all_chunks)
        else:
            scores = self._lexical_scores(question, all_chunks)
        ranked = np.argsort(scores)[::-1][:top_k]
        return [
            {
                "text": all_chunks[index]["text"],
                "score": round(float(scores[index]), 4),
                "chunk_index": all_chunks[index].get("index"),
            }
            for index in ranked
            if scores[index] > 0
        ]


nlp_service = NLPService()


async def analyze_document_async(text: str) -> dict[str, Any]:
    return await asyncio.to_thread(nlp_service.analyze_document, text)
