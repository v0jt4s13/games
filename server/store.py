"""SQLite storage (WAL). One short-lived connection per request; writes in BEGIN IMMEDIATE."""
import contextlib
import sqlite3

from . import config

SCHEMA = """
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, created REAL NOT NULL, seen REAL NOT NULL);
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY, game TEXT NOT NULL, opts TEXT NOT NULL, host TEXT NOT NULL,
  phase TEXT NOT NULL,            -- lobby | playing | over
  seats TEXT NOT NULL,            -- JSON: [{kind: human|ai|empty, pid, name}, x2]
  state TEXT, view0 TEXT, view1 TEXT,
  version INTEGER NOT NULL DEFAULT 1, ai_due REAL,
  chat_open INTEGER NOT NULL DEFAULT 1, chat_epoch INTEGER NOT NULL DEFAULT 0,
  created REAL NOT NULL, updated REAL NOT NULL);
CREATE TABLE IF NOT EXISTS invites (
  id TEXT PRIMARY KEY, table_id TEXT NOT NULL, seat INTEGER NOT NULL, hash TEXT NOT NULL,
  expires REAL NOT NULL, used_by TEXT, revoked INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS invites_table ON invites(table_id);
CREATE TABLE IF NOT EXISTS chat (
  id INTEGER PRIMARY KEY AUTOINCREMENT, table_id TEXT NOT NULL, player_id TEXT NOT NULL,
  name TEXT NOT NULL, text TEXT NOT NULL, created REAL NOT NULL);
CREATE INDEX IF NOT EXISTS chat_table ON chat(table_id, id);
CREATE TABLE IF NOT EXISTS hits (ip TEXT NOT NULL, kind TEXT NOT NULL, at REAL NOT NULL);
CREATE INDEX IF NOT EXISTS hits_ip ON hits(ip, kind, at);
CREATE TABLE IF NOT EXISTS mutes (
  table_id TEXT NOT NULL, player_id TEXT NOT NULL, PRIMARY KEY (table_id, player_id));
"""


def connect():
    config.DATA_DIR.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(config.DATA_DIR / "games.sqlite", timeout=10, isolation_level=None)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.executescript(SCHEMA)
    return conn


@contextlib.contextmanager
def tx(conn):
    conn.execute("BEGIN IMMEDIATE")
    try:
        yield conn
    except BaseException:
        conn.execute("ROLLBACK")
        raise
    else:
        conn.execute("COMMIT")
