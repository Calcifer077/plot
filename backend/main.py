from typing import Annotated
import matplotlib
import pandas as pd
import io
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import matplotlib.pyplot as plt
import numpy as np
import uuid
import redis.asyncio as redis
from responses import PNGStreamingResponse

from config import get_redis_client, get_settings
from utils import get_all_keys

# non-interactive backend, REQUIRED for servers, avoid GUI/threading issues
matplotlib.use("Agg")

app = FastAPI()
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_urls_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/plot", response_class=PNGStreamingResponse)
async def plot():
    xpoints = np.array([1, 8])
    ypoints = np.array([3, 10])

    fig, ax = plt.subplots()
    ax.plot(xpoints, ypoints)
    ax.set_title("sample plot")

    # Saving to an in-memory buffer
    buf = io.BytesIO()
    # Exports the generated matplot figure into `buf` stream in png format
    fig.savefig(buf, format="png")
    # destroys the figure object to free up memory
    plt.close(fig)
    # resets the buffer's read pointer back to 0, if we don't do it fastapi will start to read from the last and return an empty response
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.get("/line-plot", response_class=PNGStreamingResponse)
async def line_plot():
    t = np.arange(0.0, 2.0, 0.01)
    s = 1 + np.sin(2 * np.pi * t)

    fig, ax = plt.subplots()
    ax.plot(t, s)

    ax.set(xlabel="time (s)", ylabel="volage (mV)", title="About as simple")
    ax.grid()

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")


@app.post("/upload_read_pandas_return_png", response_class=PNGStreamingResponse)
async def upload_read_pandas_return_png(
    file: Annotated[UploadFile, File(description="A file read as UploadFile")],
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

    data = df["Radius (mean)"]
    # now the file is parsed, we need to plot it
    # print(df['Radius (mean)'][0])
    fig, ax = plt.subplots()
    # Line plot
    # ax.plot(df['Radius (mean)'], 'o:r')

    # histogram
    # ax.hist(df['Radius (mean)'])

    # Bar chart
    # ax.bar(range(len(data)), data)

    # Box plot
    # ax.boxplot(data)

    # Pie chart
    ax.pie(data)
    ax.set_title("Radius (mean) plot")

    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")

    # return {
    #     "filename": file.filename,
    #     "content_type": file.content_type,
    #     "columns": list(df.columns),
    #     "num_rows": len(df),
    # }


@app.get("/dataset/{redis_key}")
async def get_dataset(redis_key: str, redis_client: Annotated[redis.Redis, Depends(get_redis_client)]):
    data_bytes = await redis_client.get(redis_key)

    if not data_bytes:
        raise HTTPException(status_code=404, detail="Dataset not found or expired")

    # Reconstruct the DataFrame from bytes
    df = pd.read_feather(io.BytesIO(data_bytes))

    return {"num_rows": len(df), "preview": df.head(5).to_dict(orient="records")}


@app.post("/upload")
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

@app.get('/list-datasets')
async def list_datasets(
    redis_client: Annotated[redis.Redis, Depends(get_redis_client)],
):
    previews = await get_all_keys(redis_client)
    return {"datasets": previews}

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Hello World"}

