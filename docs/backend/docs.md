# Plot Notes

## Backend

### FastAPI

FastAPI-related notes will be added here.

---

## Running Redis with Python

Redis can be run locally using **Docker**, allowing your Python application to connect to a Redis instance without installing Redis directly on your machine.

### 1. Run Redis using Docker

First, install **Docker Desktop** from the official Docker website.

Once Docker Desktop is installed and running, open a terminal and run:

```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

If the `redis:latest` image doesn't already exist locally, Docker will automatically pull it from the registry.

#### Understanding the flags

| Flag           | Description                                                          |
| -------------- | -------------------------------------------------------------------- |
| `-d`           | Runs the container in detached/background mode                       |
| `--name redis` | Gives the container the name `redis`                                 |
| `-p 6379:6379` | Maps port `6379` on your machine to port `6379` inside the container |
| `redis:latest` | Uses the official Redis image with the `latest` tag                  |

To verify that Redis is running:

```bash
docker ps
```

This lists all currently running containers.

> **Note:** `docker ps` lists running **containers**, not images. Use `docker images` to list locally available Docker images.

---

### 2. Install the Redis Python Client

Python applications communicate with Redis through a Redis client library.

Install it using `pip`:

```bash
pip install redis
```

Or, since this project uses `uv`:

```bash
uv add redis
```

> Note: The official guide asks us to install `redis[hiredis]` which gives faster performance.
> `redis[hiredis]` is installed in this project.

---

### 3. Connect to Redis from Python

Create a Redis client and test the connection:

```python
import redis

r = redis.Redis(
    host="localhost",
    port=6379,
    decode_responses=True,
)

print(r.ping())
```

If everything is configured correctly, the output should be:

```text
True
```

This confirms that your Python application can successfully connect to the Redis server running inside Docker.
