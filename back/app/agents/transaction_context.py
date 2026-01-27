from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm import get_llm
from app.models.schemas import AgentEvidence, AgentSignal, FraudDetectionState


async def transaction_context_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Analiza señales internas inmediatas: monto, horario, país y dispositivo.
    """
    print("🤖 [Transaction Context Agent] Analizando señales básicas...")

    tx = state.transaction
    llm = get_llm(temperature=0)

    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Eres un experto en detección de fraude financiero.
        Analiza los datos de la transacción y detecta anomalías básicas.
        Considera:
        - Montos muy altos (e.g. > 5000 PEN)
        - Horarios inusuales (madrugada 00:00 - 05:00)
        - Canales de riesgo.

        Debes responder EXCLUSIVAMENTE en formato JSON con la siguiente estructura:
        {{
            "signals": [
                {{ "signal_type": "string", "description": "string", "severity": "low|medium|high", "value": "string" }}
            ],
            "reasoning": "string",
            "confidence": float (0-1)
        }}
        """,
            ),
            ("human", "Transacción: {transaction}"),
        ]
    )

    chain = prompt | llm | JsonOutputParser()

    try:
        response = await chain.ainvoke({"transaction": tx.model_dump_json()})

        print("agent_name: Transaction Context Agent", f"\n{response}")
        signals = [AgentSignal(**s) for s in response.get("signals", [])]

        evidence = AgentEvidence(
            agent_name="Transaction Context Agent",
            signals=signals,
            reasoning=response.get("reasoning", "Análisis manual de señales internas"),
            confidence=response.get("confidence", 0.5),
        )

        state.evidences.append(evidence)
        state.agent_route.append("transaction_context_agent")
        for s in signals:
            state.signals.append(f"[{s.severity.upper()}] {s.description}")

    except Exception as e:
        print(f"❌ Error en Transaction Context Agent: {e}")
        state.signals.append(f"Error en análisis de contexto: {str(e)}")

    return state
