"""WSGI server for the card games (production: gunicorn behind nginx).

Serves the static Vite build from geopolitics/dist and nothing else: the games run
entirely in the browser, there is no API. Build first: see BUILD_CMD in
projects_manager/production_projects/games.env or `npm ci && npm run build` in geopolitics/.

Run locally: ./venv/bin/gunicorn --bind 127.0.0.1:8012 wsgi:app
"""
import mimetypes
import os
from pathlib import Path

BASE = Path(__file__).resolve().parent
DIST = Path(os.environ.get("GAMES_DIST") or BASE / "geopolitics" / "dist").resolve()

# === URL PREFIX ===
# nginx forwards the full path (/games/...). gunicorn strips SCRIPT_NAME from PATH_INFO
# on its own; this is a fallback for other servers.
PREFIX = "/" + os.environ.get("SCRIPT_NAME", "").strip().strip("/")

mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")

_STATUS = {404: "404 Not Found", 405: "405 Method Not Allowed", 503: "503 Service Unavailable"}


def _send(start_response, status, body=b"", ctype="text/plain", extra=()):
    start_response(status, [("Content-Type", ctype), ("Content-Length", str(len(body))), *extra])
    return [body]


def _resolve(path):
    """File under DIST for a request path, or None. Blocks .., symlinks out of DIST, dotfiles."""
    relative = path.lstrip("/") or "index.html"
    if any(part.startswith(".") for part in relative.split("/")):
        return None
    candidate = (DIST / relative).resolve()
    if candidate != DIST and DIST not in candidate.parents:
        return None
    return candidate if candidate.is_file() else None


def app(environ, start_response):
    path = environ.get("PATH_INFO", "") or "/"
    if PREFIX != "/" and path.startswith(PREFIX):
        path = path[len(PREFIX):] or "/"
    method = environ.get("REQUEST_METHOD")

    if method not in ("GET", "HEAD"):
        return _send(start_response, _STATUS[405], extra=[("Allow", "GET, HEAD")])

    # The build uses relative URLs (./assets/..., ./cards/...), so /games without the
    # trailing slash would resolve them against the site root and every asset would 404.
    raw = (environ.get("RAW_URI") or environ.get("REQUEST_URI") or "").split("?", 1)[0]
    if PREFIX != "/" and raw.rstrip("/") == PREFIX and not raw.endswith("/"):
        query = environ.get("QUERY_STRING")
        return _send(start_response, "301 Moved Permanently",
                     extra=[("Location", PREFIX + "/" + (f"?{query}" if query else ""))])

    if not (DIST / "index.html").is_file():
        return _send(start_response, _STATUS[503], b"Brak builda: uruchom npm run build w geopolitics/")

    target = _resolve(path)
    if target is None:
        return _send(start_response, _STATUS[404], b"Not Found")

    body = target.read_bytes()
    ctype = mimetypes.guess_type(target.name)[0] or "application/octet-stream"
    if ctype.startswith("text/") or ctype in ("application/javascript", "application/json"):
        ctype += "; charset=utf-8"
    # Vite names hashed bundles assets/<name>-<hash>.<ext>; everything else may change per build.
    cache = "public, max-age=31536000, immutable" if "/assets/" in f"/{path.lstrip('/')}" else "no-cache"
    start_response("200 OK", [("Content-Type", ctype), ("Content-Length", str(len(body))),
                              ("Cache-Control", cache)])
    return [b"" if method == "HEAD" else body]
