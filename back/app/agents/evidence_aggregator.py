from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate

from app.core.llm import get_llm
from app.models.schemas import AgentEvidence, FraudDetectionState


async def evidence_aggregator_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Consolida todas las evidencias recogidas hasta el momento.
    Prepara el resumen para el debate pro/con fraude.
    """
    print("🤖 [Evidence Aggregator Agent] Consolidando evidencias...")

    if not state.evidences:
        print("⚠️ No hay evidencias para consolidar.")
        return state

    llm = get_llm(temperature=0)

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

        print("agent_name: Evidence Aggregator Agent", f"\n{response}")

        state.evidences.append(
            AgentEvidence(
                agent_name="Evidence Aggregator Agent",
                reasoning=response.get("executive_summary", "Consolidación de evidencias"),
                confidence=1.0,
                signals=[],
            )
        )

        state.agent_route.append("evidence_aggregator_agent")

    except Exception as e:
        print(f"❌ Error en Evidence Aggregator Agent: {e}")

    return state
