"""
Pydantic models for fraud detection system
"""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class TransactionInput(BaseModel):
    """Input model for a transaction to analyze"""

    transaction_id: str = Field(..., description="Unique transaction ID")
    customer_id: str = Field(..., description="Customer ID")
    amount: float = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(..., description="Currency code (e.g., PEN, USD)")
    country: str = Field(..., description="Country code (e.g., PE, US)")
    channel: str = Field(..., description="Channel (web, mobile, atm)")
    device_id: str = Field(..., description="Device ID")
    timestamp: datetime = Field(..., description="Transaction timestamp")
    merchant_id: str = Field(..., description="Merchant ID")

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "T-1001",
                "customer_id": "CU-001",
                "amount": 1800.00,
                "currency": "PEN",
                "country": "PE",
                "channel": "web",
                "device_id": "D-01",
                "timestamp": "2025-12-17T03:15:00",
                "merchant_id": "M-001",
            }
        }


class CustomerBehavior(BaseModel):
    """Customer historical behavior model"""

    customer_id: str
    usual_amount_avg: float = Field(..., description="Average transaction amount")
    usual_hours: str = Field(..., description="Usual transaction hours (e.g., '08-20')")
    usual_countries: str = Field(..., description="Usual countries (comma-separated)")
    usual_devices: str = Field(..., description="Usual devices (comma-separated)")


class FraudPolicy(BaseModel):
    """Fraud detection policy model"""

    policy_id: str
    rule: str = Field(..., description="Policy rule description")
    version: str = Field(..., description="Policy version")


DecisionType = Literal["APPROVE", "CHALLENGE", "BLOCK", "ESCALATE_TO_HUMAN"]


class Citation(BaseModel):
    """Citation for internal policy"""

    policy_id: str
    chunk_id: str
    version: str


class ExternalCitation(BaseModel):
    """Citation for external source"""

    url: str
    summary: str


class FraudDetectionResult(BaseModel):
    """Result of fraud detection analysis"""

    transaction_id: str
    decision: DecisionType
    confidence: float = Field(..., ge=0, le=1, description="Confidence score (0-1)")
    signals: list[str] = Field(default_factory=list, description="Detected signals")
    citations_internal: list[Citation] = Field(
        default_factory=list, description="Internal policy citations"
    )
    citations_external: list[ExternalCitation] = Field(
        default_factory=list, description="External source citations"
    )
    explanation_customer: str = Field(..., description="Customer-facing explanation")
    explanation_audit: str = Field(..., description="Audit trail explanation")
    agent_route: list[str] = Field(default_factory=list, description="Route of agents executed")
    processing_time_ms: int = Field(..., description="Processing time in milliseconds")

    class Config:
        json_schema_extra = {
            "example": {
                "transaction_id": "T-1002",
                "decision": "CHALLENGE",
                "confidence": 0.65,
                "signals": ["Monto fuera de rango", "Horario no habitual", "Alerta externa"],
                "citations_internal": [
                    {"policy_id": "FP-01", "chunk_id": "1", "version": "2025.1"}
                ],
                "citations_external": [
                    {
                        "url": "https://example.com/fraud-alert",
                        "summary": "Alerta de fraude reciente en el merchant",
                    }
                ],
                "explanation_customer": "La transacción requiere validación adicional por monto y horario inusual.",
                "explanation_audit": "Se aplicó la política FP-01 y se detectó alerta externa. Ruta de agentes: Context → RAG → Web → Debate → Decisión.",
                "agent_route": [
                    "context_agent",
                    "behavioral_agent",
                    "rag_agent",
                    "threat_intel_agent",
                    "evidence_aggregator",
                    "debate_agents",
                    "decision_arbiter",
                    "explainability_agent",
                ],
                "processing_time_ms": 2500,
            }
        }


class AgentSignal(BaseModel):
    """Signal detected by an agent"""

    signal_type: str
    description: str
    severity: Literal["low", "medium", "high"]
    value: str | float | None = None


class AgentEvidence(BaseModel):
    """Evidence gathered by an agent"""

    agent_name: str
    signals: list[AgentSignal] = Field(default_factory=list)
    citations: list[Citation | ExternalCitation] = Field(default_factory=list)
    reasoning: str
    confidence: float = Field(..., ge=0, le=1)


class FraudDetectionState(BaseModel):
    """State shared across all agents in LangGraph"""

    transaction: TransactionInput
    customer_behavior: CustomerBehavior | None = None

    evidences: list[AgentEvidence] = Field(default_factory=list)
    signals: list[str] = Field(default_factory=list)
    citations_internal: list[Citation] = Field(default_factory=list)
    citations_external: list[ExternalCitation] = Field(default_factory=list)

    decision: DecisionType | None = None
    confidence: float = 0.0
    explanation_customer: str = ""
    explanation_audit: str = ""

    agent_route: list[str] = Field(default_factory=list)
    start_time: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True


class TransactionSummary(BaseModel):
    """AI generated summary of the transaction audit"""

    transaction_id: str
    summary_text: str
