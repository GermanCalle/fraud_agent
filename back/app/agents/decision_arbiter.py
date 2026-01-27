from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm import get_llm
from app.models.schemas import AgentEvidence, FraudDetectionState


async def decision_arbiter_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Analiza las evidencias y el debate para tomar una decisión final estructurada.
    """
    print("⚖️ [Decision Arbiter Agent] Evaluando evidencias y debate para decisión final...")

    llm = get_llm(temperature=0)

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

        Debes elegir UNA de las siguientes decisiones:
        - APPROVE: La transacción es legítima.
        - CHALLENGE: Sospechosa, requiere validación extra (OTP, llamada).
        - BLOCK: Fraude altamente probable, bloqueo inmediato.
        - ESCALATE_TO_HUMAN: Señales contradictorias o ambigüedad alta.

        Reglas de Decisión:
        - Si hay señales externas (Web Search) de fraude y violación de políticas -> BLOCK.
        - Si hay anomalías de comportamiento pero el historial es limpio -> CHALLENGE.
        - Si la confianza es menor a 0.6 -> ESCALATE_TO_HUMAN.

        Responder en JSON:
        {{
            "decision": "APPROVE|CHALLENGE|BLOCK|ESCALATE_TO_HUMAN",
            "confidence": float (0-1),
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
            {"debate": debate_text, "transaction": state.transaction.model_dump_json()}
        )

        state.decision = response.get("decision", "ESCALATE_TO_HUMAN")
        state.confidence = response.get("confidence", 0.5)

        state.evidences.append(
            AgentEvidence(
                agent_name="Decision Arbiter Agent",
                reasoning=response.get("reasoning", "Decisión final tomada por el árbitro"),
                confidence=state.confidence,
            )
        )
        state.agent_route.append("decision_arbiter_agent")

    except Exception as e:
        print(f"❌ Error en Decision Arbiter Agent: {e}")
        state.decision = "ESCALATE_TO_HUMAN"

    return state
