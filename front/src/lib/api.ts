import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Transaction {
  id: string;
  customer_id: string;
  amount: number;
  currency: string;
  country: string;
  channel: string;
  device_id: string;
  timestamp: string;
  merchant_id: string;
  decision?: string;
  confidence?: number;
  signals?: any;
  explanation_customer?: string;
  explanation_audit?: string;
  agent_route?: string[];
  citations_internal?: any[];
  citations_external?: any[];
  processing_time_ms?: number;
  created_at: string;
}

export interface TransactionInput {
  transaction_id: string;
  customer_id: string;
  amount: number;
  currency: string;
  country: string;
  channel: string;
  device_id: string;
  timestamp: string;
  merchant_id: string;
}

export interface FraudDetectionResult {
  transaction_id: string;
  decision: 'APPROVE' | 'CHALLENGE' | 'BLOCK' | 'ESCALATE_TO_HUMAN';
  confidence: number;
  signals: string[];
  citations_internal: any[];
  citations_external: any[];
  explanation_customer: string;
  explanation_audit: string;
  agent_route: string[];
  processing_time_ms: number;
}

export interface HITLItem {
  id: number;
  transaction_id: string;
  status: 'PENDING' | 'OWNED' | 'REVIEWED';
  assigned_to: string | null;
  reviewed_at: string | null;
  reviewer_decision: string | null;
  reviewer_comments: string | null;
  created_at: string;
}

export interface AuditTrail {
  id: number;
  transaction_id: string;
  agent_name: string;
  step_order: number;
  input_data: any;
  output_data: {
    reasoning: string;
    confidence: number;
    signals: any[];
  };
  execution_time_ms: number;
  timestamp: string;
}

export interface TransactionSummary {
  transaction_id: string;
  summary_text: string;
}

export const analyzeTransaction = async (data: TransactionInput) => {
  const response = await api.post<FraudDetectionResult>('/api/transactions/analyze', data);
  return response.data;
};

export const getHITLQueue = async () => {
  const response = await api.get<HITLItem[]>('/api/hitl/queue');
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get<Transaction[]>('/api/transactions');
  return response.data;
};

export const getTransaction = async (transactionId: string) => {
  const response = await api.get<Transaction>(`/api/transactions/${transactionId}`);
  return response.data;
};

export const getAuditTrails = async (transactionId: string) => {
  const response = await api.get<AuditTrail[]>(`/api/transactions/${transactionId}/audit-trails`);
  return response.data;
};

export const getTransactionSummary = async (transactionId: string) => {
  const response = await api.get<TransactionSummary>(`/api/transactions/${transactionId}/summary`);
  return response.data;
};

export const submitHITLReview = async (transactionId: string, decision: string, comments: string) => {
  const response = await api.post(`/api/hitl/${transactionId}/review`, { decision, comments });
  return response.data;
};

export default api;
