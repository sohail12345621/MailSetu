from contextlib import asynccontextmanager
import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.core.database import init_db
from backend.core.config import settings
from backend.services.scheduler_service import start_scheduler, stop_scheduler
from backend.api.routers import auth, emails, templates, scheduler, uploads

# Setup logging
os.makedirs("logs", exist_ok=True)
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL, logging.INFO),
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("logs/mailsetu.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting MailSetu backend...")
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()
    logger.info("MailSetu backend stopped.")


app = FastAPI(
    title="MailSetu API",
    description="Automated Email Sender — Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins including Vercel deployment
    allow_credentials=False,  # Must be False when allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(emails.router)
app.include_router(templates.router)
app.include_router(scheduler.router)
app.include_router(uploads.router)


@app.get("/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# Serve built React frontend (single-service deployment)
# Must be registered AFTER all API routes
FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse

    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        """Catch-all: serve index.html for all non-API routes (React Router support)."""
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
