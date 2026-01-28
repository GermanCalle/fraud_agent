from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_tavily import TavilySearch

from app.core.config import settings
from app.core.constants import EXTERNAL_THREAT_INTEL_AGENT_NAME, MAP_AGENT_MODEL
from app.core.llm import get_llm
from app.models.schemas import AgentEvidence, AgentSignal, ExternalCitation, FraudDetectionState


async def external_threat_intel_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Busca inteligencia de amenazas externa en la web usando Tavily.
    """
    print(
        f"🤖 [External Threat Intel Agent] Buscando alertas externas para merchant {state.transaction.merchant_id}..."
    )

    if not settings.TAVILY_API_KEY:
        print("⚠️ TAVILY_API_KEY no configurada. Saltando búsqueda externa.")
        state.evidences.append(
            AgentEvidence(
                agent_name="External Threat Intel Agent",
                reasoning="Búsqueda externa deshabilitada (falta API KEY).",
                confidence=0.5,
            )
        )
        return state

    search = TavilySearch(k=3)
    query = f"fraud alerts or security reports for merchant {state.transaction.merchant_id} {state.transaction.country}"

    try:
        search_results = await search.ainvoke(query)

        model = MAP_AGENT_MODEL[EXTERNAL_THREAT_INTEL_AGENT_NAME]
        llm = get_llm(model)
        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """Eres un analista de inteligencia de ciber-fraude.
            Analiza los resultados de búsqueda web sobre el merchant y el contexto actual.
            Identifica si hay reportes de fraude recientes, estafas conocidas o alertas.

            Resultados Web:
            {search_results}

            Responder en JSON:
            {{
                "found_threats": bool,
                "signals": [
                    {{ "signal_type": "external_threat", "description": "string", "severity": "high|medium|low" }}
                ],
                "citations": [
                    {{ "url": "string", "summary": "string" }}
                ],
                "reasoning": "string",
                "confidence": float (0-1)
            }}
            """,
                ),
                ("human", "Analizar para Merchant: {merchant_id}, País: {country}"),
            ]
        )

        chain = prompt | llm | JsonOutputParser()

        response = await chain.ainvoke(
            {
                "search_results": str(search_results),
                "merchant_id": state.transaction.merchant_id,
                "country": state.transaction.country,
            }
        )

        print("agent_name: External Threat Intel Agent", f"\n{response}")

        citations = [ExternalCitation(**c) for c in response.get("citations", [])]
        signals = [AgentSignal(**s) for s in response.get("signals", [])]

        evidence = AgentEvidence(
            agent_name="External Threat Intel Agent",
            signals=signals,
            citations=citations,
            reasoning=response.get("reasoning", "Búsqueda externa realizada exitosamente"),
            confidence=response.get("confidence", 0.8),
        )

        state.evidences.append(evidence)
        state.citations_external.extend(citations)
        state.agent_route.append("external_threat_intel_agent")

        for s in signals:
            state.signals.append(f"[EXTERNAL] {s.description}")

    except Exception as e:
        print(f"❌ Error en External Threat Intel Agent: {e}")

    return state
