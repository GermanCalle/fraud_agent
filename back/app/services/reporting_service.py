from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import EXPLAINABILITY_AGENT_NAME, MAP_AGENT_MODEL
from app.core.llm import get_llm
from app.services.db_service import TransactionService


class ReportingService:
    @staticmethod
    async def generate_audit_summary(session: AsyncSession, transaction_id: str) -> str:
        transaction = await TransactionService.get_transaction(session, transaction_id)
        if not transaction:
            return "Transaction not found."

        trails = await TransactionService.get_audit_trails(session, transaction_id)

        trails_context = ""
        for trail in sorted(trails, key=lambda x: x.step_order):
            trails_context += f"Step {trail.step_order + 1} - Agent: {trail.agent_name}\n"
            trails_context += f"Reasoning: {trail.output_data.get('reasoning')}\n"
            trails_context += f"Confidence: {trail.output_data.get('confidence')}\n"
            signals = trail.output_data.get("signals", [])
            if signals:
                trails_context += f"Signals: {', '.join([str(s) for s in signals])}\n"
            trails_context += "-" * 20 + "\n"

        model = MAP_AGENT_MODEL.get(EXPLAINABILITY_AGENT_NAME, "gpt-4o-mini")
        llm = get_llm(model)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """Eres un Auditor Senior de Fraude Financiero.
            Tu tarea es generar un Resumen Ejecutivo de Auditoría basado en la trazabilidad de agentes de IA.
            El resumen debe ser profesional, conciso y estructurado.
            Debe incluir:
            1. Conclusión General.
            2. Puntos clave detectados por la red de agentes.
            3. Justificación de la decisión final ({decision}).

            Formato: Proporciona el resumen en formato Markdown enriquecido.""",
                ),
                (
                    "human",
                    """Por favor genera el resumen para la transacción {tx_id}.

            DETALLES DE LA TRANSACCIÓN:
            Monto: {amount} {currency}
            Cliente: {customer_id}
            Decisión Final: {decision}
            Confianza: {confidence}

            TRAZABILIDAD DE AGENTES:
            {trails}""",
                ),
            ]
        )

        chain = prompt | llm | StrOutputParser()

        summary = await chain.ainvoke(
            {
                "tx_id": transaction_id,
                "amount": transaction.amount,
                "currency": transaction.currency,
                "customer_id": transaction.customer_id,
                "decision": transaction.decision,
                "confidence": f"{transaction.confidence * 100:.1f}%"
                if transaction.confidence
                else "N/A",
                "trails": trails_context,
            }
        )

        return summary
