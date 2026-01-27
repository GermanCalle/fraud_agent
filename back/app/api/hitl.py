from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.services.db_service import HITLService

router = APIRouter()


class ReviewInput(BaseModel):
    decision: str
    comments: str


@router.get("/queue")
async def get_hitl_queue(db: AsyncSession = Depends(get_db)):
    return await HITLService.get_pending_queue(db)


@router.post("/{transaction_id}/review")
async def submit_manual_review(
    transaction_id: str, review: ReviewInput, db: AsyncSession = Depends(get_db)
):
    await HITLService.submit_review(db, transaction_id, review.decision, review.comments)
    return {
        "status": "success",
        "message": f"Transaction {transaction_id} updated by human reviewer",
    }
