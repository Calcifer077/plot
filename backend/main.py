from typing import Annotated
import matplotlib
import pandas as pd
import io
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
import matplotlib.pyplot as plt
import numpy as np
import redis

# non-interactive backend, REQUIRED for servers, avoid GUI/threading issues
matplotlib.use("Agg")

app = FastAPI()

r = redis.Redis(host='localhost', port=6379, decode_responses=True)
print(r.ping())
r.set('foo', 'bar')

class PNGStreamingResponse(StreamingResponse):
    media_type = "image/png"

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


@app.post("/upload")
async def upload_file(
    file: Annotated[UploadFile, File(description="A file read as UploadFile")],
):
    print(file.content_type)

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

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "columns": list(df.columns),
        "num_rows": len(df),
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Hello World"}

r.close()