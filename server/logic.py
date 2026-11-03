"""Domain logic: players, tables, seats, invitations, game flow (with AI seats) and chat.

Every function takes an open connection; the ones that change data are called inside store.tx().
Errors meant for the player are ApiError (HTTP status + Polish message).
"""
import hashlib
import json
import re
import secrets
import time

from . import config, engine


class ApiError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status, self.message = status, message


def now():
    return time.time()


def digest(value):
    return hashlib.sha256(value.encode()).hexdigest()


def dumps(value):
    return json.dumps(value, separators=(",", ":"), ensure_ascii=False)


# --- players ----------------------------------------------------------------------------------
# A player is an anonymous browser identity: a random token in an HttpOnly cookie, stored hashed.
def clean_name(raw, fallback=None):
    name = re.sub(r"\s+", " ", re.sub(r"[\x00-\x1f\x7f<>]", "", str(raw or ""))).strip()[:24]
    return name or fallback or f"Gracz {secrets.randbelow(900) + 100}"


def player_for(conn, token):
    if not token or not re.fullmatch(r"[A-Za-z0-9_-]{20,80}", token):
        return None
    row = conn.execute("SELECT * FROM players WHERE id=?", (digest(token),)).fetchone()
    if row and now() - row["seen"] > 5:
        conn.execute("UPDATE players SET seen=? WHERE id=?", (now(), row["id"]))
    return row


def throttle(conn, ip, kind):
    """Sliding-window limit per client IP; raises 429. Call inside its own transaction so the hit is kept."""
    limit, window = config.THROTTLE[kind]
    used = conn.execute("SELECT COUNT(*) FROM hits WHERE ip=? AND kind=? AND at>?", (ip, kind, now() - window)).fetchone()[0]
    if used >= limit:
        raise ApiError(429, "Zbyt wiele żądań. Spróbuj za chwilę.")
    conn.execute("INSERT INTO hits(ip,kind,at) VALUES(?,?,?)", (ip, kind, now()))
    if secrets.randbelow(50) == 0:
        conn.execute("DELETE FROM hits WHERE at<?", (now() - 3600,))


def create_player(conn):
    if conn.execute("SELECT COUNT(*) FROM players").fetchone()[0] >= config.MAX_PLAYERS:
        raise ApiError(503, "Serwer ma teraz zbyt wielu graczy. Spróbuj później.")
    token = secrets.token_urlsafe(32)
    conn.execute("INSERT INTO players(id,name,created,seen) VALUES(?,?,?,?)",
                 (digest(token), clean_name(None), now(), now()))
    return token, conn.execute("SELECT * FROM players WHERE id=?", (digest(token),)).fetchone()


def rename(conn, player, name):
    conn.execute("UPDATE players SET name=? WHERE id=?", (clean_name(name, player["name"]), player["id"]))
    return conn.execute("SELECT * FROM players WHERE id=?", (player["id"],)).fetchone()


# --- tables -----------------------------------------------------------------------------------
def get_table(conn, table_id):
    row = conn.execute("SELECT * FROM tables WHERE id=?", (str(table_id),)).fetchone()
    if not row:
        raise ApiError(404, "Nie ma takiego stołu.")
    return row


def seats_of(table):
    return json.loads(table["seats"])


def seat_index(table, player):
    for i, seat in enumerate(seats_of(table)):
        if seat["kind"] == "human" and seat["pid"] == player["id"]:
            return i
    return None


def require_member(table, player):
    seat = seat_index(table, player)
    if seat is None:
        raise ApiError(403, "To nie Twój stół.")
    return seat


def require_host(table, player):
    if table["host"] != player["id"]:
        raise ApiError(403, "Tylko gospodarz może to zrobić.")


def _touch(conn, table_id, **fields):
    """Update columns of a table and bump its version (clients poll the version)."""
    fields["updated"] = now()
    cols = ", ".join(f"{k}=?" for k in fields)
    conn.execute(f"UPDATE tables SET {cols}, version=version+1 WHERE id=?", (*fields.values(), table_id))


def _save_seats(conn, table, seats, **extra):
    _touch(conn, table["id"], seats=dumps(seats), **extra)


def _check_seat(seats, index):
    if isinstance(index, bool) or not isinstance(index, int) or not 0 <= index < len(seats):
        raise ApiError(400, "Nieprawidłowe miejsce.")


def geo_opts(faction, opponent=None):
    """Frakcje stołu Geopolitix: miejsce 0 gra `faction`, miejsce 1 `opponent` (domyślnie europe <-> america)."""
    faction = faction if faction in config.GEO_FACTIONS else "europe"
    if opponent not in config.GEO_FACTIONS or opponent == faction:
        opponent = "america" if faction == "europe" else "europe"
    return {"faction": faction, "opponent": opponent}


def create_table(conn, player, game, faction, players=2, opponent=None):
    if game not in config.GAMES:
        raise ApiError(400, "Nieznana gra.")
    low, high = config.GAME_SEATS[game]
    if isinstance(players, bool) or not isinstance(players, int) or not low <= players <= high:
        raise ApiError(400, f"Ta gra obsługuje od {low} do {high} graczy." if low != high else "Ta gra jest dla dwóch graczy.")
    if conn.execute("SELECT COUNT(*) FROM tables").fetchone()[0] >= config.MAX_TABLES:
        raise ApiError(503, "Serwer ma teraz zbyt wiele stołów. Spróbuj później.")
    mine = conn.execute("SELECT COUNT(*) FROM tables WHERE host=?", (player["id"],)).fetchone()[0]
    if mine >= config.MAX_TABLES_PER_PLAYER:
        raise ApiError(429, "Masz zbyt wiele stołów. Zamknij nieużywane.")
    opts = geo_opts(faction, opponent) if game == "geo" else {"players": players}
    seats = [{"kind": "human", "pid": player["id"], "name": player["name"]}] + \
            [{"kind": "empty", "pid": None, "name": None} for _ in range(players - 1)]
    table_id = secrets.token_urlsafe(6)
    conn.execute("INSERT INTO tables(id,game,opts,host,phase,seats,created,updated) VALUES(?,?,?,?,?,?,?,?)",
                 (table_id, game, dumps(opts), player["id"], "lobby", dumps(seats), now(), now()))
    return get_table(conn, table_id)


def set_seat(conn, table, player, index, kind):
    require_host(table, player)
    if table["phase"] != "lobby":
        raise ApiError(409, "Miejsca można zmieniać tylko przed startem.")
    seats = seats_of(table)
    _check_seat(seats, index)
    if kind not in ("ai", "empty"):
        raise ApiError(400, "Nieprawidłowy rodzaj miejsca.")
    if seats[index]["kind"] == "human" and seats[index]["pid"] == table["host"]:
        raise ApiError(400, "Nie możesz zająć miejsca gospodarza.")
    seats[index] = ({"kind": "ai", "pid": None, "name": config.AI_NAME} if kind == "ai"
                    else {"kind": "empty", "pid": None, "name": None})
    conn.execute("UPDATE invites SET revoked=1 WHERE table_id=? AND seat=?", (table["id"], index))
    _save_seats(conn, table, seats)


def swap_seats(conn, table, player):
    require_host(table, player)
    if table["phase"] != "lobby":
        raise ApiError(409, "Miejsca można zamienić tylko przed startem.")
    seats = seats_of(table)
    if len(seats) != 2:
        raise ApiError(400, "Zamiana miejsc dotyczy tylko stołu dwuosobowego.")
    seats = seats[::-1]
    opts = json.loads(table["opts"])
    if table["game"] == "geo":     # seat 0 plays the chosen faction; keep each player's faction when seats swap
        cur = geo_opts(opts.get("faction"), opts.get("opponent"))
        opts = {**opts, "faction": cur["opponent"], "opponent": cur["faction"]}
    conn.execute("UPDATE invites SET seat=1-seat WHERE table_id=?", (table["id"],))
    _save_seats(conn, table, seats, opts=dumps(opts))


def leave_table(conn, table, player):
    seat = require_member(table, player)
    if table["host"] == player["id"]:
        raise ApiError(400, "Gospodarz zamyka stół zamiast go opuszczać.")
    seats = seats_of(table)
    # names are baked into the game log, so a seat vacated mid-game remembers who sat there
    seats[seat] = {"kind": "empty", "pid": None, "name": None,
                   **({"keep": seats[seat]["name"]} if table["phase"] != "lobby" else {})}
    _save_seats(conn, table, seats, ai_due=None)


def close_table(conn, table, player):
    require_host(table, player)
    for sql in ("DELETE FROM chat WHERE table_id=?", "DELETE FROM mutes WHERE table_id=?",
                "DELETE FROM invites WHERE table_id=?", "DELETE FROM tables WHERE id=?"):
        conn.execute(sql, (table["id"],))


# --- invitations ------------------------------------------------------------------------------
def create_invite(conn, table, player, index):
    require_host(table, player)
    _check_seat(seats_of(table), index)
    seat = seats_of(table)[index]
    if seat["kind"] == "ai":
        raise ApiError(409, "To miejsce zajmuje SI - najpierw ustaw je jako puste.")
    if seat["kind"] == "human" and seat["pid"] == table["host"]:
        raise ApiError(400, "To Twoje miejsce.")
    conn.execute("UPDATE invites SET revoked=1 WHERE table_id=? AND seat=? AND used_by IS NULL", (table["id"], index))
    active = conn.execute("SELECT COUNT(*) FROM invites WHERE table_id=? AND used_by IS NULL AND revoked=0 AND expires>?",
                          (table["id"], now())).fetchone()[0]
    if active >= config.MAX_ACTIVE_INVITES:
        raise ApiError(429, "Za dużo aktywnych zaproszeń. Odwołaj wcześniejsze.")
    secret, invite_id = secrets.token_urlsafe(18), secrets.token_urlsafe(6)
    expires = now() + config.INVITE_TTL
    conn.execute("INSERT INTO invites(id,table_id,seat,hash,expires) VALUES(?,?,?,?,?)",
                 (invite_id, table["id"], index, digest(secret), expires))
    _touch(conn, table["id"])
    return {"code": f"{table['id']}.{secret}", "id": invite_id, "seat": index, "expires": expires}


def revoke_invite(conn, table, player, invite_id):
    require_host(table, player)
    conn.execute("UPDATE invites SET revoked=1 WHERE id=? AND table_id=?", (str(invite_id), table["id"]))
    _touch(conn, table["id"])


def join_with_code(conn, player, code):
    """One-time code -> the player takes the invited seat (or recovers their own)."""
    if not isinstance(code, str) or "." not in code or len(code) > 120:
        raise ApiError(400, "Nieprawidłowy kod zaproszenia.")
    table_id, secret = code.split(".", 1)
    table = get_table(conn, table_id)
    invite = conn.execute("SELECT * FROM invites WHERE table_id=? AND hash=?", (table_id, digest(secret))).fetchone()
    if not invite or invite["revoked"] or invite["expires"] < now():
        raise ApiError(403, "Zaproszenie wygasło, zostało odwołane albo już użyte.")
    mine = seat_index(table, player)
    if mine is not None:
        if mine == invite["seat"]:
            return table
        raise ApiError(409, "Siedzisz już przy tym stole.")
    if invite["used_by"]:
        raise ApiError(403, "Zaproszenie zostało już użyte.")
    seats = seats_of(table)
    seat = seats[invite["seat"]]
    if seat["kind"] == "ai" or (seat["kind"] == "human" and seat["pid"] == table["host"]):
        raise ApiError(409, "To miejsce nie jest już dostępne.")
    # names are baked into the game log at start: a recovered seat keeps its original name
    baked = seat.get("name") or seat.get("keep")
    name = baked if table["phase"] != "lobby" and baked else player["name"]
    taken = {s["name"] for j, s in enumerate(seats) if j != invite["seat"] and s["name"]}
    base, n = name, 1
    while name in taken:                              # names must be unique: the game log is written with them
        n += 1
        name = f"{base[:20]} ({n})"
    seats[invite["seat"]] = {"kind": "human", "pid": player["id"], "name": name}
    conn.execute("UPDATE invites SET used_by=? WHERE id=?", (player["id"], invite["id"]))
    _save_seats(conn, table, seats)
    return get_table(conn, table_id)


# --- game flow --------------------------------------------------------------------------------
def _names(seats):
    return [s["name"] or "?" for s in seats]


def _ai_seats(seats):
    return [i for i, s in enumerate(seats) if s["kind"] == "ai"]


def _store_state(conn, table, seats, result, **extra):
    state = result["state"]
    over = state.get("phase") == "over"
    ai_due = None if over or not _ai_seats(seats) else now() + config.AI_DELAY
    _touch(conn, table["id"], state=dumps(state), views=dumps(result["views"]),
           phase="over" if over else "playing", ai_due=ai_due, **extra)


def start_game(conn, table, player):
    """Start (or restart) the game with the current seats; host only."""
    require_host(table, player)
    seats = seats_of(table)
    if any(s["kind"] == "empty" for s in seats):
        raise ApiError(409, "Obydwa miejsca muszą być zajęte (gracz albo SI).")
    opts = {**json.loads(table["opts"]), **({} if table["game"] == "geo" else {"players": len(seats)})}
    result = engine.run({"op": "new", "game": table["game"], "opts": opts, "names": _names(seats)})
    _store_state(conn, table, seats, result)


def perform_action(conn, table, player, action):
    seat = require_member(table, player)
    if table["phase"] != "playing":
        raise ApiError(409, "Gra nie trwa.")
    seats = seats_of(table)
    if any(s["kind"] == "empty" for s in seats):
        raise ApiError(409, "Czekamy na drugiego gracza.")
    if not isinstance(action, dict) or len(json.dumps(action)) > 4000:
        raise ApiError(400, "Nieprawidłowy ruch.")
    try:
        result = engine.run({"op": "apply", "game": table["game"], "state": json.loads(table["state"]), "seat": seat,
                             "action": action, "names": _names(seats)})
    except engine.EngineError as error:
        raise ApiError(400, str(error)) from error
    _store_state(conn, table, seats, result)


def advance_ai(conn, table):
    """Make the AI's move when it is due. Called from polls, so no background worker is needed."""
    if table["phase"] != "playing" or not table["ai_due"] or now() < table["ai_due"]:
        return False
    seats = seats_of(table)
    if any(s["kind"] == "empty" for s in seats):
        return False
    try:
        result = engine.run({"op": "auto", "game": table["game"], "state": json.loads(table["state"]),
                             "aiSeats": _ai_seats(seats), "names": _names(seats)})
    except engine.EngineError:
        _touch(conn, table["id"], ai_due=None)          # do not retry a move the engine refuses
        return True
    if not result.get("moved"):
        _touch(conn, table["id"], ai_due=None)
        return True
    _store_state(conn, table, seats, result)
    return True


# --- chat -------------------------------------------------------------------------------------
def _muted(conn, table_id, pid):
    return conn.execute("SELECT 1 FROM mutes WHERE table_id=? AND player_id=?", (table_id, pid)).fetchone() is not None


def send_chat(conn, table, player, text):
    require_member(table, player)
    if not table["chat_open"]:
        raise ApiError(403, "Rozmowa jest zamknięta przez gospodarza.")
    if _muted(conn, table["id"], player["id"]):
        raise ApiError(403, "Gospodarz odebrał Ci możliwość pisania.")
    text = text.replace("\r\n", "\n").strip() if isinstance(text, str) else ""
    if not text:
        raise ApiError(400, "Wiadomość jest pusta.")
    if len(text) > config.CHAT_MAX_LEN:
        raise ApiError(400, f"Wiadomość jest za długa (limit {config.CHAT_MAX_LEN} znaków).")
    limit, window = config.CHAT_RATE
    recent = conn.execute("SELECT COUNT(*) FROM chat WHERE player_id=? AND created>?", (player["id"], now() - window)).fetchone()[0]
    if recent >= limit:
        raise ApiError(429, "Piszesz zbyt szybko. Poczekaj chwilę.")
    seats = seats_of(table)
    name = next((s["name"] for s in seats if s["pid"] == player["id"]), player["name"])
    cur = conn.execute("INSERT INTO chat(table_id,player_id,name,text,created) VALUES(?,?,?,?,?)",
                       (table["id"], player["id"], name, text, now()))
    conn.execute("DELETE FROM chat WHERE created<?", (now() - config.CHAT_RETENTION,))
    return cur.lastrowid


def _chat_rows(rows, player, seats):
    pids = {s["pid"]: i for i, s in enumerate(seats) if s["pid"]}
    return [{"id": r["id"], "name": r["name"], "text": r["text"], "at": r["created"],
             "mine": r["player_id"] == player["id"], "seat": pids.get(r["player_id"])} for r in rows]


def chat_after(conn, table, player, after_id, limit=100):
    rows = conn.execute("SELECT * FROM chat WHERE table_id=? AND id>? ORDER BY id LIMIT ?",
                        (table["id"], int(after_id), limit)).fetchall()
    return _chat_rows(rows, player, seats_of(table))


def chat_before(conn, table, player, before_id, limit=50):
    rows = conn.execute("SELECT * FROM chat WHERE table_id=? AND id<? ORDER BY id DESC LIMIT ?",
                        (table["id"], int(before_id) or 2**62, limit)).fetchall()
    return _chat_rows(rows[::-1], player, seats_of(table))


def chat_admin(conn, table, player, op, seat=None):
    require_host(table, player)
    if op == "clear":
        conn.execute("DELETE FROM chat WHERE table_id=?", (table["id"],))
        _touch(conn, table["id"], chat_epoch=int(now() * 1000))
    elif op in ("close", "open"):
        _touch(conn, table["id"], chat_open=0 if op == "close" else 1)
    elif op in ("mute", "unmute"):
        seats = seats_of(table)
        if isinstance(seat, bool) or not isinstance(seat, int) or not 0 <= seat < len(seats) \
                or seats[seat]["kind"] != "human" or seats[seat]["pid"] == table["host"]:
            raise ApiError(400, "Nie można zmienić uprawnień tego uczestnika.")
        if op == "mute":
            conn.execute("INSERT OR IGNORE INTO mutes(table_id,player_id) VALUES(?,?)", (table["id"], seats[seat]["pid"]))
        else:
            conn.execute("DELETE FROM mutes WHERE table_id=? AND player_id=?", (table["id"], seats[seat]["pid"]))
        _touch(conn, table["id"])
    else:
        raise ApiError(400, "Nieznana operacja.")


# --- payloads ---------------------------------------------------------------------------------
def presence(conn, table):
    seats, out = seats_of(table), []
    for s in seats:
        seen = conn.execute("SELECT seen FROM players WHERE id=?", (s["pid"],)).fetchone() if s["pid"] else None
        out.append(s["kind"] == "ai" or bool(seen and now() - seen["seen"] < config.PRESENCE_TTL))
    return out


def table_payload(conn, table, player, chat_after_id=0):
    seat = require_member(table, player)
    seats, host = seats_of(table), table["host"] == player["id"]
    muted = {i for i, s in enumerate(seats) if s["pid"] and _muted(conn, table["id"], s["pid"])}
    online = presence(conn, table)
    payload = {
        "id": table["id"], "game": table["game"], "opts": json.loads(table["opts"]), "phase": table["phase"],
        "version": table["version"], "seat": seat, "host": host,
        "seats": [{"kind": s["kind"], "name": s["name"], "online": online[i], "you": i == seat,
                   "host": s["pid"] == table["host"], "muted": i in muted} for i, s in enumerate(seats)],
        "view": json.loads(table["views"])[seat] if table["phase"] != "lobby" and table["views"] else None,
        "waiting": bool(table["ai_due"]),
        "chat": {"open": bool(table["chat_open"]), "epoch": table["chat_epoch"], "muted": seat in muted,
                 "messages": (chat_after(conn, table, player, chat_after_id) if chat_after_id
                              else chat_before(conn, table, player, 0))},
    }
    if host:
        rows = conn.execute("SELECT id,seat,expires FROM invites WHERE table_id=? AND used_by IS NULL AND revoked=0 AND expires>?",
                            (table["id"], now())).fetchall()
        payload["invites"] = [{"id": r["id"], "seat": r["seat"], "expires": r["expires"]} for r in rows]
    return payload


def my_tables(conn, player):
    rows = conn.execute("SELECT * FROM tables WHERE seats LIKE ? ORDER BY updated DESC LIMIT 20",
                        (f'%"pid":"{player["id"]}"%',)).fetchall()
    return [{"id": t["id"], "game": t["game"], "phase": t["phase"], "host": t["host"] == player["id"],
             "players": [s["name"] for s in seats_of(t) if s["name"]], "updated": t["updated"]} for t in rows]


def cleanup(conn):
    """Drop tables nobody touched for a long time (opportunistic, cheap)."""
    old = [r["id"] for r in conn.execute("SELECT id FROM tables WHERE updated<?", (now() - config.TABLE_RETENTION,))]
    for table_id in old:
        for sql in ("DELETE FROM chat WHERE table_id=?", "DELETE FROM mutes WHERE table_id=?",
                    "DELETE FROM invites WHERE table_id=?", "DELETE FROM tables WHERE id=?"):
            conn.execute(sql, (table_id,))
    conn.execute("DELETE FROM players WHERE seen<? AND id NOT IN (SELECT host FROM tables)", (now() - config.TABLE_RETENTION,))
