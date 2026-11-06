from fastapi import FastAPI

from app.routes import auth, notes

app = FastAPI(title="Notes API")
app.include_router(auth.router)
app.include_router(notes.router)


@app.get("/health")
def health():
    return {"status": "ok"}
