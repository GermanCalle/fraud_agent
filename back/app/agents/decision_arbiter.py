from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm import get_llm
from app.core.logger import get_logger
from app.models.schemas import AgentEvidence, FraudDetectionState

logger = get_logger(__name__)


async def decision_arbiter_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Analiza las evidencias y el debate para tomar una decisión final estructurada.
    """

    logger.info("⚖️ [Decision Arbiter Agent] Evaluando evidencias y debate para decisión final...")

    llm = get_llm()

    debate_text = ""
    for ev in state.evidences:
        if "Debate Agent" in ev.agent_name:
            debate_text += f"\n--- {ev.agent_name} ---\n{ev.reasoning}\n"

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Eres el Árbitro Final de Decisiones en un sistema de detección de fraude.
        Tu tarea es evaluar las señales, la síntesis de evidencia y los argumentos del debate.

        Debes estimar:

        - risk_score: Probabilidad estimada de que la transacción sea fraudulenta (0-1).
        - confidence: Qué tan seguro estás de tu propio análisis, dada la calidad, cantidad y consistencia de la evidencia (0-1).

        Definiciones:
        - risk_score alto = mayor probabilidad de fraude.
        - confidence bajo = evidencia insuficiente, contradictoria o ambigua.
        - confidence NO representa riesgo, sino certeza epistemológica.


        Responder EXCLUSIVAMENTE en formato JSON:
        {{
            "confidence": float (0-1),
            "risk_score": float (0-1)
            "reasoning": "string"
        }}
        """,
            ),
            (
                "human",
                "Debate y Evidencias:\n{debate}\n\nTransacción:\n{transaction}",
            ),
        ]
    )

    chain = prompt | llm | JsonOutputParser()

    try:
        response = await chain.ainvoke(
            {
                "debate": debate_text,
                "transaction": state.transaction.model_dump_json(),
            }
        )

        risk_score = response.get("risk_score", 0.5)
        confidence = response.get("confidence", 0.5)
        if confidence < 0.6:
            state.decision = "ESCALATE_TO_HUMAN"
        else:
            if risk_score >= 0.85:
                state.decision = "BLOCK"
            elif risk_score >= 0.65:
                state.decision = "ESCALATE_TO_HUMAN"
            elif risk_score >= 0.35:
                state.decision = "CHALLENGE"
            else:
                state.decision = "APPROVE"

        state.confidence = confidence
        state.evidences.append(
            AgentEvidence(
                agent_name="Decision Arbiter Agent",
                reasoning=response.get("reasoning", "Decisión final tomada por el árbitro"),
                confidence=state.confidence,
            )
        )
        state.agent_route.append("decision_arbiter_agent")

    except Exception as e:
        logger.error(f"❌ Error en Decision Arbiter Agent: {e}")
        state.decision = "ESCALATE_TO_HUMAN"

    return state
