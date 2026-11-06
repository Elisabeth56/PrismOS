import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.models import Note, NoteIn, NotePatch
from app.security import current_user_id

router = APIRouter(prefix="/notes", tags=["notes"])


def to_note(row: sqlite3.Row) -> Note:
    return Note(
        id=row["id"],
        title=row["title"],
        body=row["body"],
        tags=[t for t in row["tags"].split(",") if t],
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


def owned_note(db: sqlite3.Connection, note_id: int, user_id: int) -> sqlite3.Row:
    row = db.execute("select * from notes where id = ? and user_id = ?", (note_id, user_id)).fetchone()
    if row is None:
        raise HTTPException(404, "Note not found")
    return row


@router.get("", response_model=list[Note])
def list_notes(user_id: int = Depends(current_user_id), db: sqlite3.Connection = Depends(get_db)):
    rows = db.execute("select * from notes where user_id = ? order by created_at desc", (user_id,)).fetchall()
    return [to_note(r) for r in rows]


@router.post("", response_model=Note, status_code=201)
def create_note(body: NoteIn, user_id: int = Depends(current_user_id), db: sqlite3.Connection = Depends(get_db)):
    cursor = db.execute(
        "insert into notes (user_id, title, body, tags) values (?, ?, ?, ?)",
        (user_id, body.title, body.body, ",".join(body.tags)),
    )
    return to_note(owned_note(db, cursor.lastrowid, user_id))


@router.get("/{note_id}", response_model=Note)
def get_note(note_id: int, user_id: int = Depends(current_user_id), db: sqlite3.Connection = Depends(get_db)):
    return to_note(owned_note(db, note_id, user_id))


@router.patch("/{note_id}", response_model=Note)
def edit_note(
    note_id: int, body: NotePatch, user_id: int = Depends(current_user_id), db: sqlite3.Connection = Depends(get_db)
):
    note = owned_note(db, note_id, user_id)
    title = body.title if body.title is not None else note["title"]
    text = body.body if body.body is not None else note["body"]
    tags = ",".join(body.tags) if body.tags is not None else note["tags"]
    db.execute(
        "update notes set title = ?, body = ?, tags = ?, updated_at = datetime('now') where id = ?",
        (title, text, tags, note_id),
    )
    return to_note(owned_note(db, note_id, user_id))


@router.delete("/{note_id}", status_code=204)
def delete_note(note_id: int, user_id: int = Depends(current_user_id), db: sqlite3.Connection = Depends(get_db)):
    owned_note(db, note_id, user_id)
    db.execute("delete from notes where id = ?", (note_id,))
