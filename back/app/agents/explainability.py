from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.constants import EXPLAINABILITY_AGENT_NAME, MAP_AGENT_MODEL
from app.core.llm import get_llm
from app.core.logger import get_logger
from app.models.schemas import FraudDetectionState

logger = get_logger(__name__)


async def explainability_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Genera explicaciones claras para el cliente y reportes detallados para auditoría.
    """
    logger.info("📝 [Explainability Agent] Generando explicaciones y reporte de auditoría...")

    model = MAP_AGENT_MODEL[EXPLAINABILITY_AGENT_NAME]
    llm = get_llm(model)

    signals_text = "\n".join(state.signals)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Eres un experto en comunicación y auditoría financiera.
        Debes generar dos explicaciones basadas en la decisión final y las evidencias.

        1. EXPLICACIÓN AL CLIENTE: Lenguaje empático, claro, informativo. No técnico.
        2. EXPLICACIÓN DE AUDITORÍA: Técnica, detallada, citando evidencias y la ruta de agentes.

        Responder en JSON:
        {{
            "explanation_customer": "string",
            "explanation_audit": "string"
        }}
        """,
            ),
            (
                "human",
                "Decisión: {decision}, Confianza: {confidence}\nSeñales:\n{signals}\n\nRuta: {route}",
            ),
        ]
    )

    chain = prompt | llm | JsonOutputParser()

    try:
        response = await chain.ainvoke(
            {
                "decision": state.decision,
                "confidence": state.confidence,
                "signals": signals_text,
                "route": " -> ".join(state.agent_route),
            }
        )

        logger.debug(f"agent_name: Explain Agent \n{response}")

        state.explanation_customer = response.get("explanation_customer", "")
        state.explanation_audit = response.get("explanation_audit", "")

        state.agent_route.append("explainability_agent")

    except Exception as e:
        logger.error(f"❌ Error en Explainability Agent: {e}")

    return state
