import pandas as pd
import io
import redis.asyncio as redis

async def get_dataframe(redis_key: str, redis_client: redis.Redis) -> pd.DataFrame:
    data = await redis_client.get(redis_key)

    if data is None:
        raise ValueError(f"Dataset {redis_key} not found or expired")
    
    df = pd.read_feather(io.BytesIO(data))
    return df

async def check_if_dataframe_exists(redis_key: str, redis_client: redis.Redis) -> bool:
    data = await redis_client.get(redis_key)

    if data is None: 
        return False
    else:
        return True 
