"""HTTP layer: routing of /api/*, identity cookie, JSON in/out, error mapping."""
import json
import random
import re
import sqlite3
import sys
import traceback
from http.cookies import SimpleCookie
from urllib.parse import parse_qs

from . import config, engine, logic, store

COOKIE = "games_pid"
CSRF_HEADER = "HTTP_X_REQUESTED_WITH"     # a custom header cannot be sent cross-site without a CORS preflight
STATUS = {200: "200 OK", 400: "400 Bad Request", 401: "401 Unauthorized", 403: "403 Forbidden",
          404: "404 Not Found", 405: "405 Method Not Allowed", 409: "409 Conflict", 413: "413 Payload Too Large",
          429: "429 Too Many Requests", 500: "500 Internal Server Error", 503: "503 Service Unavailable"}


class Ctx:
    def __init__(self, conn, environ, player, body, query):
        self.conn, self.environ, self.player, self.body, self.query = conn, environ, player, body, query
        # nginx overwrites X-Real-IP with the real client address; a client cannot choose it
        self.ip = (environ.get("HTTP_X_REAL_IP") or environ.get("REMOTE_ADDR") or "?")[:64]
        self.set_cookie = None

    def arg(self, name, default=0):
        try:
            return int(self.query.get(name, [default])[0])
        except (TypeError, ValueError):
            return default


def _int(value, name="miejsce"):
    if isinstance(value, bool) or not isinstance(value, int):
        raise logic.ApiError(400, f"Nieprawidłowe pole: {name}.")
    return value


# --- handlers ---------------------------------------------------------------------------------
def health(ctx):
    return {"ok": True, "node": engine.version(), "games": list(config.GAMES)}


def me(ctx):
    if ctx.player is None:
        logic.throttle(ctx.conn, ctx.ip, "identity")
        token, ctx.player = logic.create_player(ctx.conn)
        ctx.set_cookie = token
    return {"name": ctx.player["name"]}


def me_rename(ctx):
    player = logic.rename(ctx.conn, ctx.player, ctx.body.get("name"))
    return {"name": player["name"]}


def tables_list(ctx):
    return {"tables": logic.my_tables(ctx.conn, ctx.player)}


def tables_create(ctx):
    if random.random() < 0.05:
        logic.cleanup(ctx.conn)
    table = logic.create_table(ctx.conn, ctx.player, ctx.body.get("game"), ctx.body.get("faction"), ctx.body.get("players", 2))
    return {"id": table["id"]}


def join(ctx):
    table = logic.join_with_code(ctx.conn, ctx.player, ctx.body.get("code"))
    return {"id": table["id"]}


def table_sync(ctx, table_id):
    conn, player = ctx.conn, ctx.player
    table = logic.get_table(conn, table_id)
    logic.require_member(table, player)
    if table["ai_due"] and logic.now() >= table["ai_due"]:
        with store.tx(conn):                      # re-read inside the lock: another poll may have moved already
            table = logic.get_table(conn, table_id)
            logic.advance_ai(conn, table)
        table = logic.get_table(conn, table_id)
    version, last_chat, epoch = ctx.arg("v"), ctx.arg("c"), ctx.arg("ce", -1)
    if version == table["version"] and epoch == table["chat_epoch"]:
        fresh = logic.chat_after(conn, table, player, last_chat)
        return {"changed": False, "version": version, "presence": logic.presence(conn, table), "messages": fresh}
    return {"changed": True, **logic.table_payload(conn, table, player, last_chat if epoch == table["chat_epoch"] else 0)}


def _with_table(fn):
    def handler(ctx, table_id):
        with store.tx(ctx.conn):
            table = logic.get_table(ctx.conn, table_id)
            return fn(ctx, table) or {}
    return handler


@_with_table
def table_seat(ctx, table):
    if ctx.body.get("op") == "swap":
        return logic.swap_seats(ctx.conn, table, ctx.player)
    return logic.set_seat(ctx.conn, table, ctx.player, _int(ctx.body.get("seat")), ctx.body.get("kind"))


@_with_table
def table_invite(ctx, table):
    return logic.create_invite(ctx.conn, table, ctx.player, _int(ctx.body.get("seat")))


@_with_table
def table_invite_revoke(ctx, table):
    return logic.revoke_invite(ctx.conn, table, ctx.player, ctx.body.get("id"))


@_with_table
def table_start(ctx, table):
    return logic.start_game(ctx.conn, table, ctx.player)


@_with_table
def table_action(ctx, table):
    return logic.perform_action(ctx.conn, table, ctx.player, ctx.body.get("action"))


@_with_table
def table_leave(ctx, table):
    return logic.leave_table(ctx.conn, table, ctx.player)


@_with_table
def table_close(ctx, table):
    return logic.close_table(ctx.conn, table, ctx.player)


@_with_table
def chat_send(ctx, table):
    return {"id": logic.send_chat(ctx.conn, table, ctx.player, ctx.body.get("text"))}


@_with_table
def chat_admin(ctx, table):
    seat = ctx.body.get("seat")
    return logic.chat_admin(ctx.conn, table, ctx.player, ctx.body.get("op"), None if seat is None else _int(seat))


def chat_history(ctx, table_id):
    table = logic.get_table(ctx.conn, table_id)
    logic.require_member(table, ctx.player)
    return {"messages": logic.chat_before(ctx.conn, table, ctx.player, ctx.arg("before"))}


# (method, pattern, handler, needs identity, writes)
T = r"/api/tables/([A-Za-z0-9_-]{4,16})"
ROUTES = [
    ("GET", r"/api/health", health, False),
    ("GET", r"/api/me", me, False),
    ("POST", r"/api/me", me_rename, True),
    ("GET", r"/api/tables", tables_list, True),
    ("POST", r"/api/tables", tables_create, True),
    ("POST", r"/api/join", join, True),
    ("GET", T, table_sync, True),
    ("POST", T + r"/seat", table_seat, True),
    ("POST", T + r"/invite", table_invite, True),
    ("POST", T + r"/invite/revoke", table_invite_revoke, True),
    ("POST", T + r"/start", table_start, True),
    ("POST", T + r"/action", table_action, True),
    ("POST", T + r"/leave", table_leave, True),
    ("POST", T + r"/close", table_close, True),
    ("GET", T + r"/chat", chat_history, True),
    ("POST", T + r"/chat", chat_send, True),
    ("POST", T + r"/chat/admin", chat_admin, True),
]
WRITES = {table_seat, table_invite, table_invite_revoke, table_start, table_action, table_leave, table_close,
          chat_send, chat_admin}
NEEDS_TX = {me, me_rename, tables_create, join}      # handlers that write but manage no table lock themselves


def _respond(status, data, cookie=None, environ=None):
    headers = [("Content-Type", "application/json; charset=utf-8"), ("Cache-Control", "no-store")]
    if cookie:
        secure = environ and environ.get("wsgi.url_scheme") == "https"
        headers.append(("Set-Cookie", f"{COOKIE}={cookie}; Path={config.PREFIX.rstrip('/')}/; HttpOnly; SameSite=Lax;"
                                      f" Max-Age=34560000{'; Secure' if secure else ''}"))
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode()
    headers.append(("Content-Length", str(len(body))))
    return STATUS.get(status, f"{status} Error"), headers, body


def _read_body(environ):
    try:
        length = int(environ.get("CONTENT_LENGTH") or 0)
    except ValueError:
        length = 0
    if length > config.MAX_BODY:
        raise logic.ApiError(413, "Żądanie jest za duże.")
    raw = environ["wsgi.input"].read(length) if length else b""
    if not raw:
        return {}
    try:
        body = json.loads(raw)
    except ValueError as error:
        raise logic.ApiError(400, "Nieprawidłowy JSON.") from error
    if not isinstance(body, dict):
        raise logic.ApiError(400, "Oczekiwano obiektu JSON.")
    return body


def handle(environ, path):
    """Returns (status, headers, body) for a request under /api/."""
    method = environ.get("REQUEST_METHOD", "GET")
    path = path.rstrip("/") or "/"
    matched = None
    for verb, pattern, handler, needs_player in ROUTES:
        found = re.fullmatch(pattern, path)
        if found and verb == method:
            matched = (handler, needs_player, found.groups())
            break
        if found:
            matched = matched or "method"
    if matched is None:
        return _respond(404, {"error": "Nie ma takiego adresu."})
    if matched == "method":
        return _respond(405, {"error": "Niedozwolona metoda."})
    handler, needs_player, args = matched
    conn = None
    try:
        if method != "GET" and environ.get(CSRF_HEADER) != "games":
            raise logic.ApiError(403, "Brak nagłówka żądania.")
        body = _read_body(environ) if method != "GET" else {}
        conn = store.connect()
        cookies = SimpleCookie(environ.get("HTTP_COOKIE", ""))
        token = cookies[COOKIE].value if COOKIE in cookies else None
        player = logic.player_for(conn, token)
        if needs_player and player is None:
            raise logic.ApiError(401, "Brak tożsamości - odśwież stronę.")
        ctx = Ctx(conn, environ, player, body, parse_qs(environ.get("QUERY_STRING", "")))
        if method != "GET":
            with store.tx(conn):                  # own transaction: the hit counts even when the request fails
                logic.throttle(conn, ctx.ip, "write")
        if handler in NEEDS_TX:
            with store.tx(conn):
                data = handler(ctx, *args)
        else:
            data = handler(ctx, *args)
        return _respond(200, data, ctx.set_cookie, environ)
    except logic.ApiError as error:
        return _respond(error.status, {"error": error.message})
    except engine.EngineUnavailable as error:
        return _respond(503, {"error": str(error)})
    except engine.EngineError as error:
        return _respond(400, {"error": str(error)})
    except sqlite3.OperationalError as error:
        print(f"games: sqlite: {error}", file=sys.stderr)
        return _respond(503, {"error": "Serwer jest chwilowo zajęty. Spróbuj ponownie."})
    except Exception:                                   # noqa: BLE001 - never leak internals to the client
        traceback.print_exc()
        return _respond(500, {"error": "Błąd serwera."})
    finally:
        if conn is not None:
            conn.close()
