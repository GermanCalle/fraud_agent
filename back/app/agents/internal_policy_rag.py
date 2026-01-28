from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import OpenAIEmbeddings

from app.core.constants import INTERNAL_POLICY_RAG_AGENT_NAME, MAP_AGENT_MODEL
from app.core.llm import get_llm
from app.core.logger import get_logger
from app.data.loader import load_fraud_policies
from app.models.schemas import AgentEvidence, Citation, FraudDetectionState

logger = get_logger(__name__)


async def internal_policy_rag_agent(state: FraudDetectionState) -> FraudDetectionState:
    """
    Busca y aplica políticas internas de fraude mediante RAG con base vectorial local.
    """
    logger.info("🤖 [Internal Policy RAG Agent] Buscando políticas aplicables...")

    policies = await load_fraud_policies()
    docs = [
        Document(page_content=p.rule, metadata={"policy_id": p.policy_id, "version": p.version})
        for p in policies
    ]

    embeddings = OpenAIEmbeddings()
    vectorstore = FAISS.from_documents(docs, embeddings)

    query = get_better_query(state)
    logger.debug(f"RAG query: `{query}`")

    relevant_docs = vectorstore.similarity_search(query, k=3)

    context_policies = "\n".join(
        [f"- [{d.metadata['policy_id']}]: {d.page_content}" for d in relevant_docs]
    )

    model = MAP_AGENT_MODEL[INTERNAL_POLICY_RAG_AGENT_NAME]
    llm = get_llm(model)
    prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                """Eres un oficial de cumplimiento experto en políticas de fraude.
        Analiza la transacción frente a las políticas recuperadas.

        Políticas Recuperadas:
        {context}

        Resumen de usuario:
        {summary}

        Debes determinar si alguna política se viola o genera una alerta basado en la transacción del usuario.
        Y su actividad histórica.
        Responder en JSON:
        {{
            "applied_policies": [
                {{ "policy_id": "string", "reason": "string", "violated": bool }}
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
        response = await chain.ainvoke(
            {
                "context": context_policies,
                "transaction": state.transaction.model_dump_json(),
                "summary": query,
            }
        )

        logger.debug(f"Customer behavior: {state.customer_behavior}")
        logger.debug(f"agent_name: Internal Policy RAG Agent \n{response}")

        citations = []
        for ap in response.get("applied_policies", []):
            if ap.get("violated"):
                for d in relevant_docs:
                    if d.metadata["policy_id"] == ap["policy_id"]:
                        citations.append(
                            Citation(
                                policy_id=ap["policy_id"],
                                chunk_id="1",
                                version=d.metadata["version"],
                            )
                        )
                        state.signals.append(
                            f"[POLICY] Violación de {ap['policy_id']}: {ap['reason']}"
                        )

        evidence = AgentEvidence(
            agent_name=INTERNAL_POLICY_RAG_AGENT_NAME,
            citations=citations,
            reasoning=response.get("reasoning", "Cumplimiento de políticas internas vía RAG"),
            confidence=response.get("confidence", 0.9),
        )

        state.evidences.append(evidence)
        state.citations_internal.extend(citations)
        state.agent_route.append("internal_policy_rag_agent")

    except Exception as e:
        logger.error(f"❌ Error en Internal Policy RAG Agent: {e}")

    return state


def get_better_query(state: FraudDetectionState) -> str:
    transtaction = state.transaction
    customer_behavior = state.customer_behavior
    if not customer_behavior:
        return (
            f"monto {transtaction.amount} canal {transtaction.channel} país {transtaction.country}"
        )

    ratio = transtaction.amount / max(customer_behavior.usual_amount_avg, 1)
    if ratio < 1:
        inequality = "<="
    else:
        inequality = ">"

    start, end = customer_behavior.usual_hours.split("-")

    time_behavior = "en rango"
    if transtaction.timestamp.hour < int(start) or transtaction.timestamp.hour > int(end):
        time_behavior = "fuera de rango"

    country_behavior = "nacional"
    if transtaction.country not in customer_behavior.usual_countries.split(","):
        country_behavior = "internacional"

    device_behaviror = "usual"
    if transtaction.device_id not in customer_behavior.usual_devices.split(","):
        device_behaviror = "nuevo"

    return (
        f"Monto {inequality} {ratio} promedio habitual, "
        f"horario {time_behavior}, "
        f"transacción {country_behavior}, "
        f"dispositivo {device_behaviror}"
    )
