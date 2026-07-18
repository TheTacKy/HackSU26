import json

import redis

from app.config import REDIS_URL


client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
    socket_connect_timeout=1,
    socket_timeout=1,
)


def get_json(key):
    try:
        value = client.get(key)
        return json.loads(value) if value is not None else None
    except (redis.RedisError, json.JSONDecodeError):
        return None


def set_json(key, value, ttl):
    try:
        client.setex(key, ttl, json.dumps(value))
    except (redis.RedisError, TypeError):
        pass
