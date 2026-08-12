import matplotlib
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from routers.charts.router import router as charts_router
from routers.dataset.router import router as dataset_router

# non-interactive backend, REQUIRED for servers, avoid GUI/threading issues
matplotlib.use("Agg")

app = FastAPI()
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_urls_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dataset_router)
app.include_router(charts_router)

@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/")
async def root():
    return {"message": "Hello World"}

