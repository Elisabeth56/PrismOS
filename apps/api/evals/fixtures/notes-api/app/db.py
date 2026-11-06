import sqlite3
from collections.abc import Iterator

from app.config import DATABASE_PATH

SCHEMA = """
create table if not exists users (
  id integer primary key autoincrement,
  email text not null unique,
  password_hash text not null,
  created_at text not null default (datetime('now'))
);
create table if not exists notes (
  id integer primary key autoincrement,
  user_id integer not null references users (id),
  title text not null,
  body text not null default '',
  tags text not null default '',
  created_at text not null default (datetime('now')),
  updated_at text not null default (datetime('now'))
);
"""


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn


def get_db() -> Iterator[sqlite3.Connection]:
    conn = connect()
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()
