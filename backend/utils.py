from config import redis_client

import pandas as pd
import io


def get_all_keys():
    for key in redis_client.scan_iter("datasetL*"):
        print(key)
        raw = redis_client.get(key)
        df = pd.read_feather(io.BytesIO(raw))
        print(df.head())
