from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm import get_llm
from app.models.schemas import FraudDetectionState


async def explainability_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Genera explicaciones claras para el cliente y reportes detallados para auditoría.
    """
    print("📝 [Explainability Agent] Generando explicaciones y reporte de auditoría...")

    llm = get_llm(temperature=0.3)

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

        print("agent_name: Explain Agent", f"\n{response}")

        state.explanation_customer = response.get("explanation_customer", "")
        state.explanation_audit = response.get("explanation_audit", "")

        state.agent_route.append("explainability_agent")

    except Exception as e:
        print(f"❌ Error en Explainability Agent: {e}")

    return state
