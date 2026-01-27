import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const analyzeTransaction = async (data: TransactionInput) => {
  const response = await api.post<FraudDetectionResult>('/api/transactions/analyze', data);
  return response.data;
};

export const getHITLQueue = async () => {
  const response = await api.get<HITLItem[]>('/api/hitl/queue');
  return response.data;
};

export const submitHITLReview = async (transactionId: string, decision: string, comments: string) => {
  const response = await api.post(`/api/hitl/${transactionId}/review`, { decision, comments });
  return response.data;
};

export default api;
