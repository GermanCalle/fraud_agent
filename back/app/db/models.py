"""
SQLAlchemy database models
"""

from datetime import datetime

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Transaction(Base):
    """Transaction table"""

    __tablename__ = "transactions"

    id = Column(String, primary_key=True)
    customer_id = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String(3), nullable=False)
    country = Column(String(2), nullable=False)
    channel = Column(String(50), nullable=False)
    device_id = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    merchant_id = Column(String, nullable=False)

    # Analysis results
    decision = Column(String(50), nullable=True)
    confidence = Column(Float, nullable=True)
    signals = Column(JSON, nullable=True)
    processing_time_ms = Column(Integer, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    audit_trail = relationship(
        "AuditTrail", back_populates="transaction", cascade="all, delete-orphan"
    )
    hitl_queue = relationship("HITLQueue", back_populates="transaction", uselist=False)


class AuditTrail(Base):
    """Audit trail for agent execution"""

    __tablename__ = "audit_trail"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)
    step_order = Column(Integer, nullable=False)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    execution_time_ms = Column(Integer, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="audit_trail")


class HITLQueue(Base):
    """Human-in-the-loop queue"""

    __tablename__ = "hitl_queue"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(String, ForeignKey("transactions.id"), unique=True, nullable=False)
    status = Column(String(50), default="PENDING", nullable=False)  # PENDING, APPROVED, REJECTED
    assigned_to = Column(String(100), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reviewer_decision = Column(String(50), nullable=True)
    reviewer_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    transaction = relationship("Transaction", back_populates="hitl_queue")


class CustomerBehaviorDB(Base):
    """Customer behavior historical data"""

    __tablename__ = "customer_behavior"

    customer_id = Column(String, primary_key=True)
    usual_amount_avg = Column(Float, nullable=False)
    usual_hours = Column(String(50), nullable=False)
    usual_countries = Column(String(100), nullable=False)
    usual_devices = Column(String(200), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
