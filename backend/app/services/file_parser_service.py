import asyncio
import json
import math
from pathlib import Path
from typing import Any

import pandas as pd
import numpy as np
from pypdf import PdfReader
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.uploaded_file import FileStatus, UploadedFile
from app.services.nlp_service import analyze_document_async
from app.utils.text_utils import data_preview, truncate_text


def _safe_json_value(value: Any) -> Any:
    if value is None or (isinstance(value, float) and not math.isfinite(value)):
        return None
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value) if math.isfinite(float(value)) else None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    return value


def _tabular_profile(frame: pd.DataFrame) -> dict[str, Any]:
    missing = {
        str(column): int(count)
        for column, count in frame.isna().sum().items()
        if int(count) > 0
    }
    numeric_columns = list(frame.select_dtypes(include="number").columns[:12])
    numeric_profiles: list[dict[str, Any]] = []
    anomalies: list[dict[str, Any]] = []
    for column in numeric_columns:
        series = pd.to_numeric(frame[column], errors="coerce").dropna()
        if series.empty:
            continue
        q1, q3 = series.quantile([0.25, 0.75])
        iqr = q3 - q1
        lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        outliers = series[(series < lower) | (series > upper)]
        numeric_profiles.append(
            {
                "column": str(column),
                "count": int(series.count()),
                "mean": round(float(series.mean()), 4),
                "median": round(float(series.median()), 4),
                "min": round(float(series.min()), 4),
                "max": round(float(series.max()), 4),
                "sum": round(float(series.sum()), 4),
            }
        )
        if len(outliers):
            anomalies.append(
                {
                    "column": str(column),
                    "count": int(len(outliers)),
                    "lower_bound": round(float(lower), 4),
                    "upper_bound": round(float(upper), 4),
                    "sample_values": [round(float(value), 4) for value in outliers.head(5)],
                }
            )

    categorical_profiles: list[dict[str, Any]] = []
    categorical_columns = [
        column for column in frame.columns if column not in numeric_columns
    ][:10]
    for column in categorical_columns:
        counts = frame[column].fillna("Missing").astype(str).value_counts().head(8)
        categorical_profiles.append(
            {
                "column": str(column),
                "labels": [str(value) for value in counts.index],
                "values": [int(value) for value in counts.values],
            }
        )

    time_series: list[dict[str, Any]] = []
    for column in frame.columns:
        if len(time_series) >= 3:
            break
        if not any(term in str(column).lower() for term in ("date", "time", "month", "year")):
            continue
        dates = pd.to_datetime(frame[column], errors="coerce")
        valid = dates.notna()
        if valid.sum() < 2:
            continue
        grouped = (
            pd.DataFrame({"period": dates[valid].dt.to_period("M").astype(str)})
            .value_counts()
            .sort_index()
        )
        time_series.append(
            {
                "column": str(column),
                "labels": [index[0] for index in grouped.index],
                "values": [int(value) for value in grouped.values],
                "metric": "record_count",
            }
        )

    correlations: list[dict[str, Any]] = []
    if len(numeric_columns) >= 2:
        matrix = frame[numeric_columns].corr(numeric_only=True)
        pairs: list[tuple[float, float, str, str]] = []
        for index, first in enumerate(numeric_columns):
            for second in numeric_columns[index + 1 :]:
                value = matrix.loc[first, second]
                if pd.notna(value):
                    pairs.append((abs(float(value)), float(value), str(first), str(second)))
        correlations = [
            {"first": first, "second": second, "coefficient": round(value, 4)}
            for _, value, first, second in sorted(pairs, reverse=True)[:8]
        ]

    return {
        "missing_values": missing,
        "numeric_profiles": numeric_profiles,
        "categorical_profiles": categorical_profiles,
        "time_series": time_series,
        "anomalies": anomalies,
        "correlations": correlations,
    }


def _parse_tabular(path: Path, file_type: str) -> tuple[str, dict[str, Any]]:
    frame = pd.read_csv(path) if file_type == "csv" else pd.read_excel(path)
    preview_frame = frame.head(100).astype(object).where(pd.notnull(frame.head(100)), None)
    preview = [
        {str(key): _safe_json_value(value) for key, value in row.items()}
        for row in preview_frame.to_dict(orient="records")
    ]
    parsed = {
        "columns": [str(column) for column in frame.columns],
        "row_count": int(len(frame)),
        "column_count": int(len(frame.columns)),
        "preview": preview,
        "analytics": _tabular_profile(frame),
    }
    lines = [
        f"Dataset contains {parsed['row_count']} records and {parsed['column_count']} columns.",
        f"Columns: {', '.join(parsed['columns'])}.",
    ]
    for profile in parsed["analytics"]["numeric_profiles"]:
        lines.append(
            f"{profile['column']} has an average of {profile['mean']}, median "
            f"{profile['median']}, minimum {profile['min']}, and maximum {profile['max']}."
        )
    for category in parsed["analytics"]["categorical_profiles"][:5]:
        distribution = ", ".join(
            f"{label}: {value}"
            for label, value in zip(category["labels"], category["values"])
        )
        lines.append(f"{category['column']} distribution is {distribution}.")
    for anomaly in parsed["analytics"]["anomalies"]:
        lines.append(
            f"{anomaly['column']} contains {anomaly['count']} anomalous values. "
            f"Examples: {', '.join(str(value) for value in anomaly['sample_values'])}."
        )
    lines.append("Representative records:")
    for index, row in enumerate(preview[:100], start=1):
        values = "; ".join(f"{key}: {value}" for key, value in row.items())
        lines.append(f"Record {index}: {values}.")
    return truncate_text("\n".join(lines)), parsed


def _parse_file(path: Path, file_type: str) -> tuple[str | None, dict | list | None]:
    if file_type in {"csv", "xlsx"}:
        return _parse_tabular(path, file_type)
    if file_type == "txt":
        return truncate_text(path.read_text(encoding="utf-8", errors="replace")), None
    if file_type == "json":
        data = json.loads(path.read_text(encoding="utf-8"))
        structure = {
            "root_type": type(data).__name__,
            "item_count": len(data) if hasattr(data, "__len__") else None,
            "preview": data[:20] if isinstance(data, list) else data,
        }
        return data_preview(structure), structure
    if file_type == "pdf":
        reader = PdfReader(str(path))
        text = "\n\n".join(page.extract_text() or "" for page in reader.pages)
        return truncate_text(text), {"page_count": len(reader.pages)}
    raise ValueError(f"Unsupported parser for {file_type}")


async def process_file(db: AsyncSession, uploaded_file: UploadedFile) -> UploadedFile:
    uploaded_file.status = FileStatus.processing
    uploaded_file.error_message = None
    await db.commit()
    try:
        text, data = await asyncio.to_thread(
            _parse_file, Path(uploaded_file.file_path), uploaded_file.file_type
        )
        document_analysis = await analyze_document_async(text or "")
        if isinstance(data, dict):
            data["document_analysis"] = document_analysis
        else:
            data = {"content": data, "document_analysis": document_analysis}
        uploaded_file.extracted_text = text
        uploaded_file.parsed_data = data
        uploaded_file.status = FileStatus.parsed
    except Exception as exc:
        uploaded_file.status = FileStatus.failed
        uploaded_file.error_message = str(exc)[:2000]
    await db.commit()
    await db.refresh(uploaded_file)
    return uploaded_file
