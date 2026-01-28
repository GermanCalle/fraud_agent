from langgraph.graph import END, StateGraph

from app.agents import (
    behavioral_pattern_agent,
    debate_agents,
    decision_arbiter_agent,
    evidence_aggregator_agent,
    explainability_agent,
    external_threat_intel_agent,
    internal_policy_rag_agent,
    transaction_context_agent,
)
from app.models.schemas import FraudDetectionState


def create_fraud_detection_graph():
    """
    Crea y compila el flujo de agentes de detección de fraude.
    """
    workflow = StateGraph(FraudDetectionState)

    workflow.add_node("context", transaction_context_agent)
    workflow.add_node("behavioral", behavioral_pattern_agent)
    workflow.add_node("rag", internal_policy_rag_agent)
    workflow.add_node("threat_intel", external_threat_intel_agent)
    workflow.add_node("aggregator", evidence_aggregator_agent)
    workflow.add_node("debate", debate_agents)
    workflow.add_node("arbiter", decision_arbiter_agent)
    workflow.add_node("explainability", explainability_agent)

    workflow.set_entry_point("context")
    workflow.add_edge("context", "behavioral")
    workflow.add_edge("behavioral", "rag")
    workflow.add_edge("rag", "threat_intel")
    workflow.add_edge("threat_intel", "aggregator")
    workflow.add_edge("aggregator", "debate")
    workflow.add_edge("debate", "arbiter")
    workflow.add_edge("arbiter", "explainability")
    workflow.add_edge("explainability", END)

    return workflow.compile()


fraud_graph = create_fraud_detection_graph()
