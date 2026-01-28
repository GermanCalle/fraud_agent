from datetime import UTC, datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import AuditTrail, HITLQueue, Transaction
from app.models.schemas import FraudDetectionState, TransactionInput


class TransactionService:
    @staticmethod
    async def create_transaction(session: AsyncSession, tx_input: TransactionInput) -> Transaction:
        db_tx = Transaction(
            id=tx_input.transaction_id,
            customer_id=tx_input.customer_id,
            amount=tx_input.amount,
            currency=tx_input.currency,
            country=tx_input.country,
            channel=tx_input.channel,
            device_id=tx_input.device_id,
            timestamp=tx_input.timestamp,
            merchant_id=tx_input.merchant_id,
        )
        session.add(db_tx)
        await session.commit()
        await session.refresh(db_tx)
        return db_tx

    @staticmethod
    async def get_transaction(session: AsyncSession, transaction_id: str):
        result = await session.execute(select(Transaction).where(Transaction.id == transaction_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_transactions(session: AsyncSession):
        result = await session.execute(select(Transaction))
        return result.scalars().all()

    @staticmethod
    async def update_analysis_results(session: AsyncSession, state: FraudDetectionState):
        stmt = (
            update(Transaction)
            .where(Transaction.id == state.transaction.transaction_id)
            .values(
                decision=state.decision,
                confidence=state.confidence,
                signals=state.signals,
                explanation_customer=state.explanation_customer,
                explanation_audit=state.explanation_audit,
                agent_route=state.agent_route,
                citations_internal=[
                    c.model_dump() if hasattr(c, "model_dump") else c
                    for c in state.citations_internal
                ],
                citations_external=[
                    c.model_dump() if hasattr(c, "model_dump") else c
                    for c in state.citations_external
                ],
                processing_time_ms=int(
                    (datetime.now(UTC) - state.start_time).total_seconds() * 1000
                ),
            )
        )
        await session.execute(stmt)

        # Si la decisión es ESCALATE, agregar a la cola de HITL
        if state.decision == "ESCALATE_TO_HUMAN":
            hitl_entry = HITLQueue(transaction_id=state.transaction.transaction_id)
            session.add(hitl_entry)

        await session.commit()

    @staticmethod
    async def save_audit_trail(session: AsyncSession, state: FraudDetectionState):
        for i, evidence in enumerate(state.evidences):
            audit = AuditTrail(
                transaction_id=state.transaction.transaction_id,
                agent_name=evidence.agent_name,
                step_order=i,
                output_data={
                    "reasoning": evidence.reasoning,
                    "confidence": evidence.confidence,
                    "signals": [
                        s.model_dump() if hasattr(s, "model_dump") else s for s in evidence.signals
                    ],
                },
            )
            session.add(audit)
        await session.commit()

    @staticmethod
    async def get_audit_trails(session: AsyncSession, transaction_id: str):
        result = await session.execute(
            select(AuditTrail).where(AuditTrail.transaction_id == transaction_id)
        )
        return result.scalars().all()


class HITLService:
    @staticmethod
    async def get_pending_queue(session: AsyncSession):
        result = await session.execute(select(HITLQueue).where(HITLQueue.status == "PENDING"))
        return result.scalars().all()

    @staticmethod
    async def submit_review(
        session: AsyncSession, transaction_id: str, decision: str, comments: str
    ):
        stmt = (
            update(HITLQueue)
            .where(HITLQueue.transaction_id == transaction_id)
            .values(
                status="REVIEWED",
                reviewer_decision=decision,
                reviewer_comments=comments,
                reviewed_at=datetime.now(UTC),
            )
        )
        await session.execute(stmt)

        # También actualizar la decisión final en la transacción
        tx_stmt = (
            update(Transaction).where(Transaction.id == transaction_id).values(decision=decision)
        )
        await session.execute(tx_stmt)
        await session.commit()
