"""Restricted ASGI entrypoint for Cloudflare tunnel (not a production security boundary).
Run on 127.0.0.1:8001 instead of app.main:app.
"""
from app.main import app as internal_app

ALLOWED = {
    ("GET", "/healthz"),
    ("GET", "/demo/db-status"),
    ("POST", "/demo/enroll"),
    ("POST", "/demo/verify"),
    ("GET", "/demo/attendance"),
}

# Fail closed: refuse to start when demo routes have no authentication dependency.
for route in internal_app.routes:
    if route.path.startswith("/demo/") and not getattr(route, "dependencies", []):
        raise RuntimeError(f"Unprotected demo route detected: {route.path}")

async def app(scope, receive, send):
    if scope["type"] != "http":
        await internal_app(scope, receive, send)
        return
    method = scope.get("method", "")
    path = scope.get("path", "")
    if (method, path) in ALLOWED or (method == "OPTIONS" and path.startswith("/demo/")):
        await internal_app(scope, receive, send)
        return
    body = b'{"detail":"Not found"}'
    await send({"type":"http.response.start","status":404,"headers":[(b"content-type",b"application/json"),(b"content-length",str(len(body)).encode())]})
    await send({"type":"http.response.body","body":body})
