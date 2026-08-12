"""
This file is responsible for routing the requests to the appropriate endpoints for charts.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/charts", tags=["charts"])

