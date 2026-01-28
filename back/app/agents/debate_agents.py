from langchain_core.prompts import ChatPromptTemplate

from app.core.constants import (
    DEBATE_AGENT_PRO_CUSTOMER_NAME,
    DEBATE_AGENT_PRO_FRAUD_NAME,
    MAP_AGENT_MODEL,
)
from app.core.llm import get_llm
from app.core.logger import get_logger
from app.models.schemas import AgentEvidence, FraudDetectionState

logger = get_logger(__name__)


async def debate_agents(state: FraudDetectionState) -> FraudDetectionState:
    """
    Simula un debate entre dos posturas: 'Pro-Fraud' y 'Pro-Customer'.
    """
    logger.info("🤖 [Debate Agents] Iniciando debate Pro vs Con...")

    evidences_text = "\n".join([f"- {ev.agent_name}: {ev.reasoning}" for ev in state.evidences])

    model = MAP_AGENT_MODEL[DEBATE_AGENT_PRO_FRAUD_NAME]  # both use the same model

    llm = get_llm(model)

    fraud_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Eres un fiscal especializado en delitos cibernéticos. Tu objetivo es encontrar CUALQUIER indicio de fraude en las evidencias y argumentar por qué la transacción es sospechosa.",
            ),
            ("human", "Evidencias: {evidences}\n\nArgumenta por qué esto PODRÍA ser fraude:"),
        ]
    )

    customer_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "Eres un defensor del cliente y experto en experiencia de usuario. Tu objetivo es encontrar justificaciones legítimas para el comportamiento y defender la buena fe del cliente basándote en las evidencias.",
            ),
            (
                "human",
                "Evidencias: {evidences}\n\nArgumenta por qué esto PODRÍA ser una transacción legítima del cliente:",
            ),
        ]
    )

    try:
        fraud_chain = fraud_prompt | llm
        customer_chain = customer_prompt | llm

        fraud_argument = await fraud_chain.ainvoke({"evidences": evidences_text})
        customer_argument = await customer_chain.ainvoke({"evidences": evidences_text})

        logger.debug(f"agent_name: Debate Agent (Pro-Fraud) \n{fraud_argument}")
        logger.debug(f"agent_name: Debate Agent (Pro-Customer) \n{customer_argument}")

        state.evidences.append(
            AgentEvidence(
                agent_name=DEBATE_AGENT_PRO_FRAUD_NAME,
                reasoning=fraud_argument.content,
                confidence=0.5,
            )
        )

        state.evidences.append(
            AgentEvidence(
                agent_name=DEBATE_AGENT_PRO_CUSTOMER_NAME,
                reasoning=customer_argument.content,
                confidence=0.5,
            )
        )

        state.agent_route.append("debate_agents")

    except Exception as e:
        logger.error(f"❌ Error en Debate Agents: {e}")

    return state
