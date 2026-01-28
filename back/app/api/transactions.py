from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.graph import fraud_graph
from app.db.session import get_db
from app.models.schemas import (
    FraudDetectionResult,
    FraudDetectionState,
    TransactionInput,
    TransactionSummary,
)
from app.services.db_service import TransactionService
from app.services.reporting_service import ReportingService

router = APIRouter()


@router.get("/")
async def get_transactions(db: AsyncSession = Depends(get_db)):
    return await TransactionService.get_transactions(db)


@router.get("/{transaction_id}")
async def get_transaction_details(transaction_id: str, db: AsyncSession = Depends(get_db)):
    return await TransactionService.get_transaction(db, transaction_id)


@router.get("/{transaction_id}/audit-trails")
async def get_audit_trails_by_transaction(transaction_id: str, db: AsyncSession = Depends(get_db)):
    return await TransactionService.get_audit_trails(db, transaction_id)


@router.get("/{transaction_id}/summary", response_model=TransactionSummary)
async def get_transaction_summary(transaction_id: str, db: AsyncSession = Depends(get_db)):
    summary_text = await ReportingService.generate_audit_summary(db, transaction_id)
    return TransactionSummary(transaction_id=transaction_id, summary_text=summary_text)


@router.post("/analyze", response_model=FraudDetectionResult)
async def analyze_transaction(tx_input: TransactionInput, db: AsyncSession = Depends(get_db)):
    try:
        await TransactionService.create_transaction(db, tx_input)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Transaction already exists")

    initial_state = FraudDetectionState(transaction=tx_input, start_time=datetime.now(UTC))

    print(f"🚀 Iniciando análisis de Agentes para {tx_input.transaction_id}...")
    final_state_dict = await fraud_graph.ainvoke(initial_state)

    final_state = FraudDetectionState(**final_state_dict)

    await TransactionService.update_analysis_results(db, final_state)
    await TransactionService.save_audit_trail(db, final_state)

    return FraudDetectionResult(
        transaction_id=final_state.transaction.transaction_id,
        decision=final_state.decision,
        confidence=final_state.confidence,
        signals=final_state.signals,
        citations_internal=final_state.citations_internal,
        citations_external=final_state.citations_external,
        explanation_customer=final_state.explanation_customer,
        explanation_audit=final_state.explanation_audit,
        agent_route=final_state.agent_route,
        processing_time_ms=int((datetime.now(UTC) - final_state.start_time).total_seconds() * 1000),
    )
