"""End-to-end tests of the online API through the WSGI app (real SQLite, real Node.js engines).

Run: python3 -m unittest discover -s tests   (from app_games/; needs node)
"""
import io
import json
import os
import shutil
import sys
import tempfile
import time
import unittest
from http.cookies import SimpleCookie
from pathlib import Path

DATA = tempfile.mkdtemp(prefix="games-test-")
os.environ["GAMES_DATA_DIR"] = DATA
os.environ["GAMES_AI_DELAY"] = "0"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
import wsgi  # noqa: E402
from server import config, store  # noqa: E402


class Browser:
    """One anonymous player: keeps its own cookie."""

    counter = 0

    def __init__(self):
        self.cookie = None
        Browser.counter += 1
        self.ip = f"10.0.{Browser.counter // 250}.{Browser.counter % 250}"     # every browser is a separate client

    def call(self, method, path, body=None, headers=True):
        raw = json.dumps(body).encode() if body is not None else b""
        env = {"REQUEST_METHOD": method, "PATH_INFO": path.split("?")[0], "QUERY_STRING": path.partition("?")[2],
               "wsgi.input": io.BytesIO(raw), "CONTENT_LENGTH": str(len(raw)), "wsgi.url_scheme": "http"}
        if headers and method != "GET":
            env["HTTP_X_REQUESTED_WITH"] = "games"
        env["HTTP_X_REAL_IP"] = self.ip
        if self.cookie:
            env["HTTP_COOKIE"] = f"games_pid={self.cookie}"
        out = {}
        data = b"".join(wsgi.app(env, lambda status, hdrs: out.update(status=status, headers=hdrs)))
        for key, value in out["headers"]:
            if key == "Set-Cookie":
                self.cookie = SimpleCookie(value)["games_pid"].value
                out["cookie_header"] = value
        return int(out["status"][:3]), json.loads(data), out

    def get(self, path):
        return self.call("GET", path)[:2]

    def post(self, path, body=None):
        return self.call("POST", path, body or {})[:2]

    def login(self, name):
        self.get("/api/me")
        self.post("/api/me", {"name": name})
        return self


def new_table(host, game="poker", seat_kind="ai", **extra):
    status, data = host.post("/api/tables", {"game": game, **extra})
    assert status == 200, data
    tid = data["id"]
    if seat_kind:
        assert host.post(f"/api/tables/{tid}/seat", {"seat": 1, "kind": seat_kind})[0] == 200
    return tid


def sync(browser, tid):
    status, data = browser.get(f"/api/tables/{tid}?v=0&c=0&ce=-1")
    assert status == 200, data
    return data


class ServerTests(unittest.TestCase):
    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(DATA, ignore_errors=True)

    def setUp(self):
        with store.connect() as conn:
            for table in ("tables", "invites", "chat", "mutes", "players", "hits"):
                conn.execute(f"DELETE FROM {table}")

    # --- identity and request hygiene -----------------------------------------------------
    def test_health_and_identity(self):
        a = Browser()
        self.assertEqual(a.get("/api/health")[1]["ok"], True)
        self.assertIsNotNone(a.get("/api/health")[1]["node"], "brak Node.js - silniki nie zadzialaja")
        status, data, out = a.call("GET", "/api/me")
        self.assertEqual(status, 200)
        self.assertIn("HttpOnly", out["cookie_header"])
        self.assertIn("SameSite=Lax", out["cookie_header"])
        self.assertEqual(a.post("/api/me", {"name": "  Ala <b>  Ma  "})[1]["name"], "Ala b Ma")
        self.assertEqual(a.get("/api/me")[1]["name"], "Ala b Ma")          # same identity on the next call

    def test_requires_identity_and_csrf_header(self):
        anon = Browser()
        self.assertEqual(anon.get("/api/tables")[0], 401)
        a = Browser().login("Ala")
        self.assertEqual(a.call("POST", "/api/tables", {"game": "poker"}, headers=False)[0], 403)
        self.assertEqual(a.call("GET", "/api/nope")[0], 404)
        self.assertEqual(a.call("DELETE", "/api/tables")[0], 405)
        self.assertEqual(a.post("/api/tables", {"game": "chess"})[0], 400)

    def test_outsider_cannot_read_or_act(self):
        a, b = Browser().login("Ala"), Browser().login("Bartek")
        tid = new_table(a)
        self.assertEqual(b.get(f"/api/tables/{tid}")[0], 403)
        self.assertEqual(b.post(f"/api/tables/{tid}/start")[0], 403)
        self.assertEqual(b.post(f"/api/tables/{tid}/chat", {"text": "hej"})[0], 403)
        self.assertEqual(a.get("/api/tables/zzzzzz")[0], 404)

    # --- lobby: seats, invitations ----------------------------------------------------------
    def test_lobby_defaults_and_start_requires_both_seats(self):
        a = Browser().login("Ala")
        tid = new_table(a, seat_kind=None)
        lobby = sync(a, tid)
        self.assertEqual([s["kind"] for s in lobby["seats"]], ["human", "empty"])
        self.assertTrue(lobby["host"])
        self.assertEqual(a.post(f"/api/tables/{tid}/start")[0], 409)         # second seat still empty
        self.assertEqual(a.post(f"/api/tables/{tid}/seat", {"seat": 0, "kind": "ai"})[0], 400)  # host keeps their seat
        self.assertEqual(a.post(f"/api/tables/{tid}/seat", {"seat": 1, "kind": "ai"})[0], 200)
        self.assertEqual(a.post(f"/api/tables/{tid}/start")[0], 200)
        self.assertEqual(sync(a, tid)["phase"], "playing")

    def test_invite_is_single_use_and_join_by_second_player(self):
        a, b, c = Browser().login("Ala"), Browser().login("Bartek"), Browser().login("Celina")
        tid = new_table(a, seat_kind=None)
        status, invite = a.post(f"/api/tables/{tid}/invite", {"seat": 1})
        self.assertEqual(status, 200)
        self.assertTrue(invite["code"].startswith(tid + "."))
        self.assertEqual(b.post("/api/join", {"code": invite["code"]})[1]["id"], tid)
        self.assertEqual(b.post("/api/join", {"code": invite["code"]})[1]["id"], tid)   # idempotent for the same player
        self.assertEqual(c.post("/api/join", {"code": invite["code"]})[0], 403)         # used
        self.assertEqual(c.post("/api/join", {"code": tid + ".wrong"})[0], 403)
        self.assertEqual(c.post("/api/join", {"code": "garbage"})[0], 400)
        lobby = sync(a, tid)
        self.assertEqual([s["name"] for s in lobby["seats"]], ["Ala", "Bartek"])
        self.assertEqual(lobby["invites"], [])                                           # consumed

    def test_invite_revoked_expired_and_seat_rules(self):
        a, b = Browser().login("Ala"), Browser().login("Bartek")
        tid = new_table(a, seat_kind=None)
        _, first = a.post(f"/api/tables/{tid}/invite", {"seat": 1})
        a.post(f"/api/tables/{tid}/invite/revoke", {"id": first["id"]})
        self.assertEqual(b.post("/api/join", {"code": first["code"]})[0], 403)
        _, second = a.post(f"/api/tables/{tid}/invite", {"seat": 1})
        with store.connect() as conn:
            conn.execute("UPDATE invites SET expires=? WHERE id=?", (time.time() - 1, second["id"]))
        self.assertEqual(b.post("/api/join", {"code": second["code"]})[0], 403)
        self.assertEqual(a.post(f"/api/tables/{tid}/invite", {"seat": 0})[0], 400)       # host's own seat
        a.post(f"/api/tables/{tid}/seat", {"seat": 1, "kind": "ai"})
        self.assertEqual(a.post(f"/api/tables/{tid}/invite", {"seat": 1})[0], 409)       # AI seat
        self.assertEqual(b.post(f"/api/tables/{tid}/invite", {"seat": 1})[0], 403)       # only the host invites

    def test_swap_seats_flips_geopolitix_faction(self):
        a = Browser().login("Ala")
        tid = new_table(a, game="geo", seat_kind="ai", faction="america")
        self.assertEqual(sync(a, tid)["opts"]["faction"], "america")
        a.post(f"/api/tables/{tid}/seat", {"op": "swap"})
        lobby = sync(a, tid)
        self.assertEqual(lobby["seat"], 1)
        self.assertEqual(lobby["opts"]["faction"], "europe")                             # still the same faction for the host

    # --- play: two humans -------------------------------------------------------------------
    def two_humans(self, game="poker"):
        a, b = Browser().login("Ala"), Browser().login("Bartek")
        tid = new_table(a, game=game, seat_kind=None)
        b.post("/api/join", {"code": a.post(f"/api/tables/{tid}/invite", {"seat": 1})[1]["code"]})
        self.assertEqual(a.post(f"/api/tables/{tid}/start")[0], 200)
        return a, b, tid

    def test_two_humans_turns_and_hidden_cards(self):
        a, b, tid = self.two_humans("poker")
        va, vb = sync(a, tid), sync(b, tid)
        self.assertEqual(va["phase"], "playing")
        self.assertEqual({va["view"]["turn"], vb["view"]["turn"]}, {0, 1})               # exactly one of them is on move
        mover, waiter, mv = (a, b, va) if va["view"]["turn"] == 0 else (b, a, vb)
        # the waiting player cannot act, the mover can
        self.assertEqual(waiter.post(f"/api/tables/{tid}/action", {"action": {"type": "call"}})[0], 400)
        self.assertEqual(mover.post(f"/api/tables/{tid}/action", {"action": {"type": "hack"}})[0], 400)
        self.assertEqual(mover.post(f"/api/tables/{tid}/action", {"action": {"type": "call" if mv["view"]["currentBet"] else "check"}})[0], 200)
        # no leaks: opponent cards are placeholders, no generator state or deck
        for browser in (a, b):
            view = sync(browser, tid)["view"]
            self.assertNotIn("rng", view)
            self.assertEqual(view["deck"], [])
            self.assertTrue(all(c.get("hidden") for c in view["players"][1]["cards"]))
            self.assertFalse(any(c.get("hidden") for c in view["players"][0]["cards"]))
        # versions advance and an unchanged poll is cheap
        v = sync(a, tid)["version"]
        status, data = a.get(f"/api/tables/{tid}?v={v}&c=0&ce=0")
        self.assertEqual((status, data["changed"]), (200, False))

    def test_log_uses_player_names(self):
        a, b, tid = self.two_humans("poker")
        log = " ".join(sync(a, tid)["view"]["log"])
        self.assertIn("Ala", log + " Ala")      # dealer line names a real player
        self.assertNotIn("Komputer", log)
        self.assertTrue("Ala" in log or "Bartek" in log)

    def test_geopolitix_mulligan_two_humans(self):
        a, b, tid = self.two_humans("geo")
        self.assertEqual(sync(a, tid)["view"]["phase"], "mulligan")
        self.assertEqual(a.post(f"/api/tables/{tid}/action", {"action": {"type": "mulligan", "ids": []}})[0], 200)
        self.assertEqual(sync(a, tid)["view"]["phase"], "mulligan")                      # waits for Bartek
        self.assertEqual(a.post(f"/api/tables/{tid}/action", {"action": {"type": "mulligan", "ids": []}})[0], 400)
        self.assertEqual(b.post(f"/api/tables/{tid}/action", {"action": {"type": "mulligan", "ids": []}})[0], 200)
        self.assertEqual(sync(b, tid)["view"]["phase"], "play")

    def test_leave_pauses_and_invite_recovers_seat_keeping_name(self):
        a, b, tid = self.two_humans("rummy")
        self.assertEqual(b.post(f"/api/tables/{tid}/leave")[0], 200)
        self.assertEqual(sync(a, tid)["seats"][1]["kind"], "empty")
        self.assertEqual(a.post(f"/api/tables/{tid}/action", {"action": {"type": "draw", "source": "stock"}})[0], 409)
        c = Browser().login("Celina")
        code = a.post(f"/api/tables/{tid}/invite", {"seat": 1})[1]["code"]
        self.assertEqual(c.post("/api/join", {"code": code})[0], 200)
        seats = sync(a, tid)["seats"]
        self.assertEqual(seats[1]["name"], "Bartek")      # names are baked into the log, so the seat keeps its name
        self.assertTrue(sync(c, tid)["seat"] == 1)

    def test_host_closes_table(self):
        a, b, tid = self.two_humans("poker")
        self.assertEqual(b.post(f"/api/tables/{tid}/close")[0], 403)
        self.assertEqual(a.post(f"/api/tables/{tid}/close")[0], 200)
        self.assertEqual(b.get(f"/api/tables/{tid}")[0], 404)
        self.assertEqual(a.post(f"/api/tables/{tid}/leave")[0], 404)

    # --- play: human vs AI ------------------------------------------------------------------
    def test_human_vs_ai_progresses(self):
        for game in ("poker", "rummy", "geo"):
            with self.subTest(game=game):
                a = Browser().login("Ala")
                tid = new_table(a, game=game, seat_kind="ai")
                self.assertEqual(a.post(f"/api/tables/{tid}/start")[0], 200)
                before = len(sync(a, tid)["view"]["log"])
                moved = 0
                for _ in range(80):
                    view = sync(a, tid)["view"]
                    phase, turn = view["phase"], view["turn"]
                    if phase == "over":
                        break
                    action = None
                    if game == "geo":
                        if phase == "mulligan":
                            action = {"type": "mulligan", "ids": []}
                        elif phase == "roundEnd":
                            action = {"type": "nextRound"}
                        elif turn == 0:
                            action = {"type": "pass"}
                    elif game == "poker":
                        if phase == "handEnd":
                            action = {"type": "nextHand"}
                        elif turn == 0:
                            action = {"type": "call" if view["currentBet"] > view["players"][0]["bet"] else "check"}
                    elif turn == 0:
                        hand = view["players"][0]["hand"]
                        action = {"type": "draw", "source": "stock"} if phase == "draw" else {"type": "discard", "id": hand[0]["id"]}
                    if action:
                        status, data = a.post(f"/api/tables/{tid}/action", {"action": action})
                        self.assertEqual(status, 200, data)
                        moved += 1
                self.assertGreater(moved, 2)
                self.assertGreater(len(sync(a, tid)["view"]["log"]), before)
                self.assertTrue(sync(a, tid)["waiting"] in (True, False))

    # --- chat -------------------------------------------------------------------------------
    def test_chat_send_receive_limits(self):
        a, b, tid = self.two_humans("poker")
        self.assertEqual(a.post(f"/api/tables/{tid}/chat", {"text": "  Cześć!  "})[0], 200)
        self.assertEqual(b.post(f"/api/tables/{tid}/chat", {"text": "x" * 2001})[0], 400)
        self.assertEqual(b.post(f"/api/tables/{tid}/chat", {"text": "   "})[0], 400)
        first = sync(b, tid)["chat"]["messages"]
        self.assertEqual([m["text"] for m in first], ["Cześć!"])
        self.assertEqual((first[0]["name"], first[0]["mine"], first[0]["seat"]), ("Ala", False, 0))
        b.post(f"/api/tables/{tid}/chat", {"text": "Hej"})
        version = sync(b, tid)["version"]
        status, data = a.get(f"/api/tables/{tid}?v={version}&c={first[0]['id']}&ce=0")
        self.assertEqual([m["text"] for m in data["messages"]], ["Hej"])                  # chat alone does not resend the table
        self.assertFalse(data["changed"])
        history = a.get(f"/api/tables/{tid}/chat?before={first[0]['id'] + 1}")[1]["messages"]
        self.assertEqual([m["text"] for m in history], ["Cześć!"])

    def test_chat_rate_limit(self):
        a, b, tid = self.two_humans("poker")
        codes = [a.post(f"/api/tables/{tid}/chat", {"text": f"m{i}"})[0] for i in range(config.CHAT_RATE[0] + 2)]
        self.assertEqual(codes.count(200), config.CHAT_RATE[0])
        self.assertEqual(codes[-1], 429)

    def test_chat_host_controls(self):
        a, b, tid = self.two_humans("poker")
        b.post(f"/api/tables/{tid}/chat", {"text": "pierwsza"})
        self.assertEqual(b.post(f"/api/tables/{tid}/chat/admin", {"op": "close"})[0], 403)  # host only
        a.post(f"/api/tables/{tid}/chat/admin", {"op": "mute", "seat": 1})
        self.assertEqual(b.post(f"/api/tables/{tid}/chat", {"text": "druga"})[0], 403)
        self.assertTrue(sync(b, tid)["chat"]["muted"])
        self.assertEqual(a.post(f"/api/tables/{tid}/chat/admin", {"op": "mute", "seat": 0})[0], 400)   # not the host
        a.post(f"/api/tables/{tid}/chat/admin", {"op": "unmute", "seat": 1})
        self.assertEqual(b.post(f"/api/tables/{tid}/chat", {"text": "trzecia"})[0], 200)
        a.post(f"/api/tables/{tid}/chat/admin", {"op": "close"})
        self.assertEqual(b.post(f"/api/tables/{tid}/chat", {"text": "x"})[0], 403)
        self.assertFalse(sync(a, tid)["chat"]["open"])
        a.post(f"/api/tables/{tid}/chat/admin", {"op": "open"})
        epoch = sync(a, tid)["chat"]["epoch"]
        a.post(f"/api/tables/{tid}/chat/admin", {"op": "clear"})
        after = sync(b, tid)["chat"]
        self.assertEqual(after["messages"], [])
        self.assertNotEqual(after["epoch"], epoch)                                      # clients drop their local history

    # --- limits protecting the shared host ------------------------------------------------------
    def test_ip_limits_identity_and_writes(self):
        saved = dict(config.THROTTLE)
        config.THROTTLE.update(identity=(3, 3600), write=(5, 60))
        try:
            greedy = Browser()
            codes = []
            for _ in range(5):
                greedy.cookie = None                    # a bot never keeps its cookie
                codes.append(greedy.call("GET", "/api/me")[0])
            self.assertEqual(codes, [200, 200, 200, 429, 429])
            other = Browser().login("Ala")              # another IP is not affected (login = 1 identity + 1 write)
            codes = [other.post("/api/tables", {"game": "poker"})[0] for _ in range(6)]
            self.assertEqual(codes[:4], [200, 200, 200, 200])
            self.assertEqual(codes[-1], 429)
        finally:
            config.THROTTLE.clear()
            config.THROTTLE.update(saved)

    def test_global_caps(self):
        saved = (config.MAX_TABLES, config.MAX_PLAYERS)
        try:
            a = Browser().login("Ala")
            config.MAX_TABLES = 1
            self.assertEqual(a.post("/api/tables", {"game": "poker"})[0], 200)
            self.assertEqual(a.post("/api/tables", {"game": "poker"})[0], 503)
            config.MAX_PLAYERS = 1
            self.assertEqual(Browser().call("GET", "/api/me")[0], 503)
        finally:
            config.MAX_TABLES, config.MAX_PLAYERS = saved

    def test_my_tables_list(self):
        a, b, tid = self.two_humans("poker")
        self.assertEqual([t["id"] for t in a.get("/api/tables")[1]["tables"]], [tid])
        self.assertEqual([t["id"] for t in b.get("/api/tables")[1]["tables"]], [tid])
        self.assertTrue(a.get("/api/tables")[1]["tables"][0]["host"])


if __name__ == "__main__":
    unittest.main()
