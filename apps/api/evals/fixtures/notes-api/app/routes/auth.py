import sqlite3

from fastapi import APIRouter, Depends, HTTPException

from app.db import get_db
from app.models import Credentials, Token
from app.security import check_password, hash_password, issue_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=Token, status_code=201)
def signup(body: Credentials, db: sqlite3.Connection = Depends(get_db)):
    try:
        cursor = db.execute(
            "insert into users (email, password_hash) values (?, ?)", (body.email.lower(), hash_password(body.password))
        )
    except sqlite3.IntegrityError as error:
        raise HTTPException(409, "An account with that email already exists") from error
    return Token(access_token=issue_token(cursor.lastrowid))


@router.post("/login", response_model=Token)
def login(body: Credentials, db: sqlite3.Connection = Depends(get_db)):
    user = db.execute("select id, password_hash from users where email = ?", (body.email.lower(),)).fetchone()
    if user is None:
        raise HTTPException(401, "No account with that email")
    if not check_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Wrong password")
    return Token(access_token=issue_token(user["id"]))
