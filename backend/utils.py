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
            # Use pandas' own JSON serializer to safely handle NaN, NaT,
            # Timestamps, numpy int64/float64, etc. — then parse back into
            # plain Python objects so FastAPI can re-encode it.
            preview_json = df.head(5).to_json(orient="records", date_format="iso")
            results.append({
                "key": key.decode("utf-8"),
                "preview": json.loads(preview_json),
            })
        except Exception as e:
            results.append({"key": key.decode("utf-8"), "error": str(e)})

    return results