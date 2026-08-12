"""
This file is responsible for routing the requests to the appropriate endpoints for charts.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from enum import Enum
from typing import Optional
import redis.asyncio as redis
import matplotlib.pyplot as plt
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

class ChartConfig(BaseModel):
    chart_type: ChartType
    x_column: str
    y_column: Optional[str] = None

    color: Optional[str] = Field(default="None", description="Hex or named color, e.g. #FF5733 or 'blue'")

    title: Optional[str] = None
    x_label: Optional[str] = None
    y_label: Optional[str] = None

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

    # Chart types that only need a single column (y_column not required/used)
    single_column_types = {ChartType.histogram, ChartType.pie, ChartType.box}
    if config.chart_type not in single_column_types and not config.y_column:
        raise HTTPException(
            status_code=400,
            detail=f"'{config.chart_type}' requires a y_column"
        )

    fig, ax = plt.subplots()
    color = config.color if config.color and config.color != "None" else None

    x = df[config.x_column]
    y = df[config.y_column] if config.y_column else None

    if config.chart_type == ChartType.line:
        ax.plot(x, y, color=color)

    elif config.chart_type == ChartType.bar:
        ax.bar(x, y, color=color)

    elif config.chart_type == ChartType.scatter:
        ax.scatter(x, y, color=color)

    elif config.chart_type == ChartType.histogram:
        ax.hist(x, color=color)

    elif config.chart_type == ChartType.pie:
        # pie needs labels + values; x_column as labels, values from x itself if numeric
        ax.pie(x, labels=x.index.astype(str) if y is None else y, autopct='%1.1f%%')

    elif config.chart_type == ChartType.box:
        ax.boxplot(x.dropna())

    else:
        raise HTTPException(status_code=400, detail=f"Unsupported chart type: {config.chart_type}")

    # fallback for labels
    if config.x_column and config.x_column != 'string':
        ax.set_xlabel(config.x_column)
    if config.y_column and config.y_column != 'string':
        ax.set_ylabel(config.y_column)

    if config.title and config.title != 'string':
        ax.set_title(config.title)
    if config.x_label and config.x_label != 'string':
        ax.set_xlabel(config.x_label)
    if config.y_label and config.y_label != 'string':
        ax.set_ylabel(config.y_label)

    buf = io.BytesIO()
    fig.savefig(buf, format='png')
    plt.close(fig)
    buf.seek(0)

    return StreamingResponse(buf, media_type='image/png')