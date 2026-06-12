"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import audit, evaluations, health, hitl, simulator, transactions
from app.core.config import get_settings
from app.core.database import close_db, connect_db
from app.core.exceptions import AppError
from scripts.seed_data import run_seed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    await connect_db()
    if settings.seed_on_startup:
        await run_seed()
    logger.info("Application started")
    yield
    await close_db()
    logger.info("Application shutdown")


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Fraud Detection Multi-Agent API",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(transactions.router)
    app.include_router(evaluations.router)
    app.include_router(hitl.router)
    app.include_router(audit.router)
    app.include_router(simulator.router)

    @app.exception_handler(AppError)
    async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
        status = 404 if exc.code == "NOT_FOUND" else 400
        return JSONResponse(status_code=status, content={"detail": exc.message, "code": exc.code})

    return app


app = create_app()
