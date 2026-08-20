"""
This file is responsible for routing the requests to the appropriate endpoints for datasets.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
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

@router.get('/list')
async def list_datasets(redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    print('hello');
    previews = await get_all_keys(redis_client)
    return {"datasets": previews}

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

@router.delete('/{redis_key}')
async def delete_dataset(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    deleted_count = await redis_client.delete(redis_key)
    if deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return {"message": f"Dataset with key {redis_key} deleted successfully."}

@router.get('/check-if-dataset-exists/{redis_key}')
async def check_if_dataset_exists(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]) -> bool:
    res = await dataset_service.check_if_dataframe_exists(redis_key, redis_client)

    if res: 
        return True
    else: 
        return False
    

@router.get('/metadata/{redis_key}')
async def get_metadata_for_dataset(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    try:
        df = await dataset_service.get_dataframe(redis_key, redis_client)

        total_rows = int(len(df))
        total_columns = int(len(df.columns))
        
        # 'isnull() returns true for missing values
        # first '.sum()' sums true column by column and produces a series
        # second '.sum()' sums that series
        missing_values= int(df.isnull().sum().sum())
        numeric_cols = int(len(df.select_dtypes(include='number').columns))
        categorical_cols = total_columns - numeric_cols

        return {
            "total_rows": total_rows,
            "total_columns": total_columns,
            "missing_values": missing_values,
            "numeric_cols": numeric_cols,
            "categorical_cols": categorical_cols
        }
    
    except ValueError as e: 
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get('/values/{redis_key}')
async def get_values_for_dataset(
    redis_key: str,
    redis_client: Annotated[redis.Redis, Depends(get_redis_client)],
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100)
):
    try:
        df = await dataset_service.get_dataframe(redis_key, redis_client)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail="Internal server error")

    total_rows = len(df)
    if total_rows == 0:
        return {
            "page": page,
            "per_page": per_page,
            "total_rows": 0,
            "total_pages": 0,
            "data": []
        }

    offset = (page - 1) * per_page
    if offset >= total_rows:
        return {
            "page": page,
            "per_page": per_page,
            "total_rows": total_rows,
            "total_pages": (total_rows + per_page - 1) // per_page,
            "data": []
        }

    values_to_return = df.iloc[offset:offset + per_page].replace({np.nan: None})

    return {
        "page": page,
        "per_page": per_page,
        "total_rows": total_rows,
        "total_pages": (total_rows + per_page - 1) // per_page,
        "data": values_to_return.to_dict(orient="records")
    }

@router.get('/{redis_key}')
async def get_dataset(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    try:

        df = await dataset_service.get_dataframe(redis_key, redis_client)

        preview_df = df.head(10).replace({np.nan: None})

        # total rows, columns, missing values, numeric cols, categorical
        # first 10 rows
        total_rows = int(len(df))
        total_columns = int(len(df.columns))

        # 'isnull) returns true for missing values
        # first '.sum()' sums true column by column and produces a series
        # second '.sum()' sums that series
        missing_values= int(df.isnull().sum().sum())
        numeric_cols = int(len(df.select_dtypes(include='number').columns))
        categorical_cols = total_columns - numeric_cols

        return {"total_rows": total_rows, "total_columns": total_columns, "missing_values": missing_values, "numeric_cols": numeric_cols, "categorical_cols": categorical_cols, "preview": preview_df.to_dict(orient="records")}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))