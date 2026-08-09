import redis

redis_client = redis.Redis(host="localhost", port=6379, decode_responses=False)

# Fail fast if Redis isn't reachable at startup
try:
    redis_client.ping()
    print("Connected to Redis")
except redis.exceptions.ConnectionError as e:
    print(f"Could not connect to Redis: {e}")
    raise
