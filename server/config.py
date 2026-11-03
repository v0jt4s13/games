"""Runtime configuration (environment) and the Node.js runner location."""
import os
import shutil
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
DATA_DIR = Path(os.environ.get("GAMES_DATA_DIR") or BASE / "data")
RUNNER = BASE / "geopolitics" / "server" / "runner.mjs"

# Public path prefix (nginx forwards /games/...); used for the cookie path.
PREFIX = "/" + os.environ.get("SCRIPT_NAME", "").strip().strip("/")

GAMES = ("geo", "rummy", "poker")
GEO_FACTIONS = ("europe", "america", "asia", "africa", "south_america")      # zgodne z factions w geopolitics/src/data/geopolitix.mjs
GAME_SEATS = {"geo": (2, 2), "rummy": (2, 4), "poker": (2, 4)}      # (min, max) players per table
AI_NAME = "SI"
AI_DELAY = float(os.environ.get("GAMES_AI_DELAY", "0.9"))      # seconds between AI moves (so humans can follow)
INVITE_TTL = 24 * 3600
MAX_ACTIVE_INVITES = 6
MAX_TABLES_PER_PLAYER = 10
CHAT_MAX_LEN = 2000
CHAT_RETENTION = 30 * 24 * 3600
CHAT_RATE = (20, 60)                  # at most 20 messages per 60 s per player
TABLE_RETENTION = 30 * 24 * 3600
PRESENCE_TTL = 15                     # seconds since the last poll that still counts as "online"
MAX_BODY = 32 * 1024
# The app shares a host with other services: bound what an anonymous client can cost (CPU: every
# start/move spawns a Node process; disk: rows). Per client IP (nginx sends X-Real-IP): (limit, window s).
THROTTLE = {"identity": (30, 3600), "write": (240, 60)}
MAX_PLAYERS = 50000
MAX_TABLES = 2000


def node_bin():
    """Node.js executable. The systemd unit has a minimal PATH, so the build step records the
    absolute path (NODE_PATH_FILE) from the login shell that has node (apt, nvm, ...)."""
    explicit = os.environ.get("NODE_BIN")
    if explicit and os.access(explicit, os.X_OK):
        return explicit
    recorded = os.environ.get("NODE_PATH_FILE")
    if recorded:
        try:
            path = Path(recorded).read_text(encoding="utf-8").strip()
        except OSError:
            path = ""
        if path and os.access(path, os.X_OK):
            return path
    return shutil.which("node")
