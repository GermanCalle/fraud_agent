from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.constants import EVIDENCE_AGGREGATOR_AGENT_NAME, MAP_AGENT_MODEL
from app.core.llm import get_llm
from app.core.logger import get_logger
from app.models.schemas import AgentEvidence, FraudDetectionState

logger = get_logger(__name__)


async def evidence_aggregator_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Consolida todas las evidencias recogidas hasta el momento.
    Prepara el resumen para el debate pro/con fraude.
    """
    logger.info("🤖 [Evidence Aggregator Agent] Consolidando evidencias...")

    if not state.evidences:
        logger.warning("⚠️ No hay evidencias para consolidar.")
        return state

    model = MAP_AGENT_MODEL[EVIDENCE_AGGREGATOR_AGENT_NAME]
    llm = get_llm(model)

    evidences_summary = ""
    for ev in state.evidences:
        evidences_summary += f"\n- AGENTE: {ev.agent_name}\n  Razonamiento: {ev.reasoning}\n  Señales: {[s.description for s in ev.signals]}\n"

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Eres un experto en síntesis de evidencia criminalística financiera.
        Tu tarea es crear un resumen ejecutivo consolidado de todas las evidencias encontradas.
        Este resumen servirá de base para el debate final.

        Debes responder en JSON:
        {{
            "executive_summary": "string",
            "total_risk_score": float (0-1),
            "key_findings": ["string"]
        }}
        """,
            ),
            ("human", "Evidencias recolectadas: {evidences}"),
        ]
    )

    chain = prompt | llm | JsonOutputParser()

    try:
        response = await chain.ainvoke({"evidences": evidences_summary})

        logger.debug(f"agent_name: Evidence Aggregator Agent \n{response}")

        state.evidences.append(
            AgentEvidence(
                agent_name=EVIDENCE_AGGREGATOR_AGENT_NAME,
                reasoning=response.get("executive_summary", "Consolidación de evidencias"),
                confidence=1.0,
                signals=[],
            )
        )

        state.agent_route.append("evidence_aggregator_agent")

    except Exception as e:
        logger.error(f"❌ Error en Evidence Aggregator Agent: {e}")

    return state
