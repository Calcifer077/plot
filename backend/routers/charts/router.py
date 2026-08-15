"""
This file is responsible for routing the requests to the appropriate endpoints for charts.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
import redis.asyncio as redis
import matplotlib.pyplot as plt
import pandas as pd
import io

from config import get_redis_client
from routers.dataset import service as dataset_service

router = APIRouter(prefix="/charts", tags=["charts"])


class ChartType(str, Enum):
    line = "line"
    bar = "bar"
    scatter = "scatter"
    histogram = "histogram"
    pie = "pie"
    box = "box"


class NullStrategy(str, Enum):
    drop = "drop"          # drop rows where ANY required column is invalid
    zero = "zero"          # replace malformed/missing with 0
    mean = "mean"          # replace with column mean
    median = "median"      # replace with column median
    custom = "custom"      # replace with user-supplied value


class ChartConfig(BaseModel):
    chart_type: ChartType
    x_column: str
    y_column: Optional[str] = None

    color: Optional[str] = Field(default=None, description="Hex or named color, e.g. #FF5733 or 'blue'")

    title: Optional[str] = None
    x_label: Optional[str] = None
    y_label: Optional[str] = None

    # New: how to handle malformed/null values once the user has been told about them
    null_strategy: Optional[NullStrategy] = None
    custom_fill_value: Optional[float] = None  # used only when null_strategy == custom


SINGLE_COLUMN_TYPES = {ChartType.histogram, ChartType.pie, ChartType.box}


def _coerce_numeric(series: pd.Series) -> tuple[pd.Series, pd.Series]:
    """Returns (coerced_series, valid_mask). valid_mask is True where the
    value is both non-null AND numeric-parseable."""

    # converts a our column to numeric, coercing errors to NaN. Then we can use the mask to drop or fill.
    coerced = pd.to_numeric(series, errors="coerce")

    # valid_mask is True where the value is not NaN (i.e., it was successfully coerced to a number)
    valid_mask = coerced.notna()
    return coerced, valid_mask


def _apply_strategy(coerced: pd.Series, valid_mask: pd.Series, strategy: NullStrategy, custom_value: Optional[float]) -> pd.Series:
    """replaces missing values according to the specified strategy. If strategy is 'drop', this function does nothing; the caller should handle dropping rows."""

    if strategy == NullStrategy.zero:
        return coerced.fillna(0)
    if strategy == NullStrategy.mean:
        return coerced.fillna(coerced[valid_mask].mean())
    if strategy == NullStrategy.median:
        return coerced.fillna(coerced[valid_mask].median())
    if strategy == NullStrategy.custom:
        if custom_value is None:
            raise HTTPException(status_code=400, detail="custom_fill_value is required when null_strategy is 'custom'")
        return coerced.fillna(custom_value)
    # 'drop' is handled by the caller via masking, not fillna
    return coerced


@router.post("/generate/{redis_key}")
async def create_chart(redis_key: str, config: ChartConfig, redis_client: redis.Redis = Depends(get_redis_client)):
    try:
        df = await dataset_service.get_dataframe(redis_key, redis_client)
    except ValueError:
        raise HTTPException(status_code=404, detail=f"Dataset {redis_key} not found or expired")

    if config.x_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{config.x_column}' not found in dataset")

    if config.y_column and config.y_column not in df.columns:
        raise HTTPException(status_code=400, detail=f"Column '{config.y_column}' not found in dataset")

    # if the chart types that require a y_column are selected, but the user didn't provide one, raise an error
    if config.chart_type not in SINGLE_COLUMN_TYPES and not config.y_column:
        raise HTTPException(status_code=400, detail=f"'{config.chart_type}' requires a y_column")

    # coerce + mask each required column ----
    x_coerced, x_mask = _coerce_numeric(df[config.x_column])

    # is y needed?
    needs_y = config.chart_type not in SINGLE_COLUMN_TYPES and config.y_column is not None
    if needs_y:
        y_coerced, y_mask = _coerce_numeric(df[config.y_column])

    # ---- single-array chart types ----
    # Just drop invalid values and tell the user via a response header how many were removed.
    if not needs_y:
        # 'x_mask' is a boolean array where True means the value is valid (numeric), and False means it was invalid (non-numeric or NaN).
        # first we flip the boolean mask to count how many were invalid, then we sum the True values to get the count of removed values.
        removed = int((~x_mask).sum())

        # Now we filter the original coerced series to only include valid values for plotting.
        x_clean = x_coerced[x_mask]
        if x_clean.empty:
            raise HTTPException(status_code=422, detail=f"Column '{config.x_column}' has no valid numeric values")

        fig, ax = _build_single_column_chart(config, x_clean)
        buf = _render(fig)
        headers = {"X-Removed-Values": str(removed)} if removed else {}
        return StreamingResponse(buf, media_type="image/png", headers=headers)

    # ---- two-array chart types ----
    x_invalid_count = int((~x_mask).sum())
    y_invalid_count = int((~y_mask).sum())

    # Rows that are invalid in exactly one column but not the other are the
    # "misalignment" case — dropping each column independently would desync x/y.
    combined_mask = x_mask & y_mask
    only_x_invalid = int((~x_mask & y_mask).sum())
    only_y_invalid = int((~y_mask & x_mask).sum())
    misaligned = (only_x_invalid > 0) or (only_y_invalid > 0)

    if misaligned and config.null_strategy is None:
        # Don't guess — ask the user how to handle it.
        return JSONResponse(status_code=200, content={
            "needs_input": True,
            "reason": "misaligned_nulls",
            "detail": (
                f"'{config.x_column}' has {x_invalid_count} invalid values, "
                f"'{config.y_column}' has {y_invalid_count} invalid values, and they don't fully overlap. "
                f"Dropping each column independently would misalign the data."
            ),
            "x_column": config.x_column,
            "y_column": config.y_column,
            "x_invalid_count": x_invalid_count,
            "y_invalid_count": y_invalid_count,
            "options": [s.value for s in NullStrategy],
        })

    if config.null_strategy is None or config.null_strategy == NullStrategy.drop:
        # Either nothing was misaligned (safe to drop), or user explicitly chose drop.
        x_final = x_coerced[combined_mask]
        y_final = y_coerced[combined_mask]
    else:
        x_filled = _apply_strategy(x_coerced, x_mask, config.null_strategy, config.custom_fill_value)
        y_filled = _apply_strategy(y_coerced, y_mask, config.null_strategy, config.custom_fill_value)
        x_final, y_final = x_filled, y_filled

    if x_final.empty or y_final.empty:
        raise HTTPException(status_code=422, detail="No valid overlapping data points across selected columns")

    fig, ax = _build_two_column_chart(config, x_final, y_final)
    buf = _render(fig)
    return StreamingResponse(buf, media_type="image/png")


def _build_single_column_chart(config: ChartConfig, x: pd.Series):
    fig, ax = plt.subplots()
    color = config.color if config.color and config.color != "None" else None

    if config.chart_type == ChartType.histogram:
        ax.hist(x, color=color)
    elif config.chart_type == ChartType.pie:
        ax.pie(x, labels=x.index.astype(str), autopct='%1.1f%%')
    elif config.chart_type == ChartType.box:
        ax.boxplot(x)

    _apply_labels(ax, config)
    return fig, ax


def _build_two_column_chart(config: ChartConfig, x: pd.Series, y: pd.Series):
    fig, ax = plt.subplots()
    color = config.color if config.color and config.color != "None" else None

    if config.chart_type == ChartType.line:
        ax.plot(x, y, color=color)
    elif config.chart_type == ChartType.bar:
        ax.bar(x, y, color=color)
    elif config.chart_type == ChartType.scatter:
        ax.scatter(x, y, color=color)
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported chart type: {config.chart_type}")

    _apply_labels(ax, config)
    return fig, ax


def _apply_labels(ax, config: ChartConfig):
    if config.x_column:
        ax.set_xlabel(config.x_column)
    if config.y_column:
        ax.set_ylabel(config.y_column)
    if config.title and config.title != 'string':
        ax.set_title(config.title)
    if config.x_label and config.x_label != 'string':
        ax.set_xlabel(config.x_label)
    if config.y_label and config.y_label != 'string':
        ax.set_ylabel(config.y_label)


def _render(fig) -> io.BytesIO:
    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)
    return buf