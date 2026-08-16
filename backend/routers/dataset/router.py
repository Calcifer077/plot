"""
This file is responsible for routing the requests to the appropriate endpoints for datasets.
"""

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Annotated
import pandas as pd
import io
import uuid
import redis.asyncio as redis
import numpy as np

from config import get_redis_client
from utils import get_all_keys
from routers.dataset import service as dataset_service

router = APIRouter(prefix="/dataset", tags=["dataset"])

@router.get('/{redis_key}')
async def get_dataset(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    df = await dataset_service.get_dataframe(redis_key, redis_client)

    preview_df = df.head(5).replace({np.nan: None})

    return {"num_rows": len(df), "preview": preview_df.to_dict(orient="records")}

@router.post('/upload')
async def upload_file(
    file: Annotated[UploadFile, File(description="A file read as UploadFile")],
    redis_client: Annotated[redis.Redis, Depends(get_redis_client)]
):
    if file.content_type not in ["text/csv", "application/json"]:
        raise HTTPException(
            status_code=400,
            detail="Invalid file type. Only CSV and JSON files are allowed.",
        )

    contents = await file.read()
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")

    try:
        if file.content_type == "text/csv":
            df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        elif file.content_type == "application/json":
            df = pd.read_json(io.StringIO(contents.decode("utf-8")), orient="records")
        else:
            raise HTTPException(
                status_code=400,
                detail="Invalid Invalid file type. Only CSV and JSON files are allowed.",
            )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

    # --- REDIS STORAGE BLOCK ---
    # 1. Serialize DataFrame to Arrow/Feather bytes
    buffer = io.BytesIO()
    df.to_feather(buffer)
    feather_bytes = buffer.getvalue()

    # 2. Generate a unique key for this dataset
    redis_key = f"dataset:{uuid.uuid4()}"

    # 3. Save to Redis (ex=3600 sets an optional 1-hour expiration time)
    await redis_client.set(redis_key, feather_bytes, ex=3600)
    # -----------------------

    print(redis_key)

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "redis_key": redis_key,
    }

@router.get('/list')
async def list_datasets(redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    previews = await get_all_keys(redis_client)
    return {"datasets": previews}

@router.delete('/{redis_key}')
async def delete_dataset(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    deleted_count = await redis_client.delete(redis_key)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"message": f"Dataset with key {redis_key} deleted successfully."}