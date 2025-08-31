from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, domains, users, emails, admin
from app.api import chat, files, contacts
# from app.api import rss  # Temporarily disabled due to feedparser Python 3.13 compatibility
from app.core.config import settings
from app.database.database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Webmail Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(domains.router, prefix="/api/domains", tags=["domains"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(emails.router, prefix="/api/emails", tags=["emails"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(chat.router, prefix="/api")
app.include_router(files.router, prefix="/api/files", tags=["files"])
app.include_router(contacts.router, prefix="/api", tags=["contacts"])
# app.include_router(rss.router, prefix="/api")  # Temporarily disabled

@app.get("/")
async def root():
    return {"message": "Webmail Platform API"}