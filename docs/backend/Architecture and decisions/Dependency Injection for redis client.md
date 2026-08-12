# Dependency Injection for the Redis Client

## What is Dependency Injection?

[Source](https://fastapi.tiangolo.com/tutorial/dependencies/)

**"Dependency Injection"** means your code (in this case, your _path operation functions_) declares things it needs to work — "dependencies" — without constructing them itself. FastAPI takes care of building those dependencies and passing ("injecting") them in when the function is called.

Concretely for us: our endpoints need a Redis connection. Instead of each endpoint creating its own `redis.Redis(...)` instance, we write one factory function and let FastAPI hand it to every endpoint that asks for it.

## Step 1 — Define the dependency (`config.py`)

```python
import redis.asyncio as redis
from functools import lru_cache

@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.Redis(host='localhost', port=6379, decode_responses=False)
```

**Why `@lru_cache`?** Without it, every request would call `get_redis_client()` and construct a _new_ `redis.Redis` instance — wasteful, and it defeats connection pooling. `@lru_cache` memoizes the function: the first call builds the client, every call after that (with the same, empty, arguments) returns the cached object. This gives us a de-facto singleton without a global variable.

**Why `decode_responses=False`?** We're storing binary Feather/Arrow bytes in Redis, not text. If `decode_responses=True`, redis-py would try to decode every value as UTF-8 text on the way out and corrupt our binary data.

**Why the async client (`redis.asyncio`)?** Our path operations are `async def`. The _synchronous_ `redis-py` client makes blocking network calls — if we used it inside an `async def` route, that call would freeze FastAPI's entire event loop until Redis responded, stalling every other concurrent request too. The async client awaits I/O instead, so the event loop stays free to handle other rquests while waiting on Redis.

> **Note:** `redis.asyncio.Redis(...)` doesn't open a real connection at construction time — it connects lazily on the _first_ awaited command. So you can't `await redis_client.ping()` right here inside `get_redis_client` (the function itself isn't async). If you want a startup connectivity check, do it in FastAPI's `lifespan` handler instead, where you _can_ await things.

## Step 2 — Use the dependency in path operations (`main.py`)

```python
from typing import Annotated
from fastapi import FastAPI, File, UploadFile, HTTPException, Depends
import redis.asyncio as redis

from config import get_redis_client

@app.get("/dataset/{redis_key}")
async def get_dataset(
    redis_key: str,
    redis_client: Annotated[redis.Redis, Depends(get_redis_client)]
):
    data_bytes = await redis_client.get(redis_key)

    if not data_bytes:
        raise HTTPException(status_code=404, detail="Dataset not found or expired")

    df = pd.read_feather(io.BytesIO(data_bytes))
    return {"num_rows": len(df), "preview": df.head(5).to_dict(orient="records")}
```

**Reading the signature:** `Annotated[redis.Redis, Depends(get_redis_client)]` means "this parameter is _typed_ as `redis.Redis`, and FastAPI should _populate_ it by calling `get_redis_client()`." The `Annotated[Type, ...]` part is standard Python typing syntax; `Depends(...)` is what tells FastAPI this specific parameter is a dependency, not a request body or query param.

**Every await matters here.** Since we switched to the async client, _every_ Redis call (`.get`, `.set`, `.scan_iter`, etc.) must be awaited. Forgetting `await` won't always error loudly — it'll just silently give you a coroutine object instead of your data, which is a confusing bug to chase.

```python
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
        else:  # application/json
            df = pd.read_json(io.StringIO(contents.decode("utf-8")), orient="records")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse file: {e}")

    # Both CSV and JSON end up as the same in-memory DataFrame here — from
    # this point on, the two file types are handled identically.

    buffer = io.BytesIO()
    df.to_feather(buffer)
    feather_bytes = buffer.getvalue()

    redis_key = f"dataset:{uuid.uuid4()}"
    await redis_client.set(redis_key, feather_bytes, ex=3600)  # ex=3600 -> 1hr TTL

    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "redis_key": redis_key,
    }
```

> **Path operation notes:**
>
> - In `/dataset/{redis_key}`, `redis_key` is a _path parameter_ and is required by default. To make a path parameter optional you'd need to type it as `str | None = None` — but note that's unusual for path params specifically; optional params are far more common as _query_
>   params.
> - `/upload` accepts a file upload, which requires `POST` or `PUT` — `GET` requests can't carry a body.

## Step 3 — A dependency that itself depends on the dependency (`utils.py`)

```python
import io
import json
import pandas as pd
import redis.asyncio as redis


async def get_all_keys(redis_client: redis.Redis, pattern: str = "dataset:*"):
    """
    Iterate over all keys matching the pattern and return a JSON-safe preview
    of each DataFrame stored in Redis.
    """
    results = []
    async for key in redis_client.scan_iter(pattern):
        raw = await redis_client.get(key)
        if raw is None:
            continue

        try:
            df = pd.read_feather(io.BytesIO(raw))
            # Use pandas' own JSON serializer (not df.to_dict) — it correctly
            # handles NaN, NaT, Timestamps, and numpy int64/float64, which
            # Python's default JSON encoder chokes on.
            preview_json = df.head(5).to_json(orient="records", date_format="iso")
            results.append({
                "key": key.decode("utf-8"),
                "preview": json.loads(preview_json),
            })
        except Exception as e:
            results.append({"key": key.decode("utf-8"), "error": str(e)})

    return results
```

`get_all_keys` isn't itself a FastAPI dependency — it's a plain helper function that _needs_ a `redis_client` to do its job. It doesn't get one from `Depends()` directly; instead, whichever _path operation_ calls it is responsible for obtaining the client (via DI) and passing it down.

## Step 4 — Wire the helper into a path operation

```python
from typing import Annotated
import redis.asyncio as redis  # NOTE: was "import redis.asyncio from redis" — fixed
from utils import get_all_keys

@app.get('/list-datasets')
async def list_datasets(
    redis_client: Annotated[redis.Redis, Depends(get_redis_client)],
):
    previews = await get_all_keys(redis_client)
    return {"datasets": previews}
```

This is the pattern to remember: **DI happens at the path-operation level.** `get_all_keys` just takes `redis_client` as a normal argument — FastAPI never sees it, never resolves it. It's `list_datasets` that asks FastAPI for the client and then manually forwards it into the helper.

## Further reading

- [Redis asyncio (redis-py docs)](https://redis.io/docs/latest/develop/clients/redis-py/async/)
- [FastAPI: Dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/)
