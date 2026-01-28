from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.constants import BEHAVIORAL_PATTERN_AGENT_NAME, MAP_AGENT_MODEL
from app.core.llm import get_llm
from app.core.logger import get_logger
from app.data.loader import get_customer_behavior
from app.models.schemas import AgentEvidence, AgentSignal, FraudDetectionState

logger = get_logger(__name__)


async def behavioral_pattern_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Compara la transacción actual con el perfil de comportamiento histórico del cliente.
    """
    logger.info(
        f"🤖 [Behavioral Pattern Agent] Analizando historial de {state.transaction.customer_id}..."
    )

    behavior = await get_customer_behavior(state.transaction.customer_id)
    state.customer_behavior = behavior

    if not behavior:
        logger.warning("⚠️ No hay historial para este cliente.")
        state.evidences.append(
            AgentEvidence(
                agent_name="Behavioral Pattern Agent",
                reasoning="No se encontró historial previo para el cliente. Se requiere precaución inicial.",
                confidence=0.5,
            )
        )
        return state

    model = MAP_AGENT_MODEL[BEHAVIORAL_PATTERN_AGENT_NAME]
    llm = get_llm(model)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Eres un analista de comportamiento de clientes financieros.
        Compara la transacción actual con el comportamiento habitual del cliente.

        Datos de Comportamiento Habitual:
        - Monto promedio: {usual_amount}
        - Horarios usuales: {usual_hours}
        - Países usuales: {usual_countries}
        - Dispositivos usuales: {usual_devices}

        Debes identificar desviaciones significativas.
        Responder en JSON:
        {{
            "signals": [
                {{ "signal_type": "behavior_anomaly", "description": "string", "severity": "low|medium|high", "value": "string" }}
            ],
            "reasoning": "string",
            "confidence": float (0-1)
        }}
        """,
            ),
            ("human", "Transacción Actual: {transaction}"),
        ]
    )

    chain = prompt | llm | JsonOutputParser()

    try:
        response = await chain.ainvoke(
            {
                "usual_amount": behavior.usual_amount_avg,
                "usual_hours": behavior.usual_hours,
                "usual_countries": behavior.usual_countries,
                "usual_devices": behavior.usual_devices,
                "transaction": state.transaction.model_dump_json(),
            }
        )

        logger.debug(f"agent_name: Behavioral Pattern Agent \n{response}")

        signals = [AgentSignal(**s) for s in response.get("signals", [])]

        evidence = AgentEvidence(
            agent_name=BEHAVIORAL_PATTERN_AGENT_NAME,
            signals=signals,
            reasoning=response.get("reasoning", "Detección de anomalías basada en historial"),
            confidence=response.get("confidence", 0.7),
        )

        state.evidences.append(evidence)
        state.agent_route.append("behavioral_pattern_agent")
        for s in signals:
            state.signals.append(f"[BEHAVIOR] {s.description}")

    except Exception as e:
        logger.error(f"❌ Error en Behavioral Pattern Agent: {e}")

    return state
