"use client";

import AuditTrailModal from '@/components/AuditTrailModal';
import TransactionForm from '@/components/TransactionForm';
import {
  FraudDetectionResult,
  getTransactions,
  Transaction
} from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Activity,
  Clock,
  FileText,
  Fingerprint,
  Plus,
  Search,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';
import { useEffect, useState } from 'react';

const decisionColors: Record<string, string> = {
  APPROVE: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  CHALLENGE: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  BLOCK: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  ESCALATE_TO_HUMAN: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const data = await getTransactions();
      // Sort by creation date desc
      setTransactions(data.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalysisSuccess = (result: FraudDetectionResult) => {
    // Refresh the list after a new analysis
    fetchTransactions();
  };

  const filteredTransactions = transactions.filter(tx =>
    tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.customer_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    { label: 'Total Scanned', value: transactions.length, icon: Activity, color: 'text-emerald-500' },
    { label: 'Blocked', value: transactions.filter(t => t.decision === 'BLOCK').length, icon: ShieldAlert, color: 'text-rose-500' },
    { label: 'Escalated', value: transactions.filter(t => t.decision === 'ESCALATE_TO_HUMAN').length, icon: Fingerprint, color: 'text-blue-500' },
    { label: 'Avg Risk', value: transactions.length ? (transactions.reduce((acc, t) => acc + (t.confidence || 0), 0) / transactions.length * 100).toFixed(1) + '%' : '0%', icon: TrendingUp, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Fraud Operations</h1>
          <p className="text-slate-400 mt-2">Real-time multi-agent transaction monitoring</p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center space-x-2 transition-all shadow-xl shadow-blue-900/20 group"
        >
          <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform" />
          <span>New Transaction</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-xl font-bold">Transaction Ledger</h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search ID or Customer..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-white/2">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction Info</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Decision</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-4">
                      <div className="h-8 w-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                      <p>Loading transactions...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <div className="mx-auto w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                      <Clock className="h-8 w-8" />
                    </div>
                    <p>No transactions found.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-blue-400">{tx.id}</span>
                        <div className="flex items-center space-x-2 text-xs text-slate-500 mt-1">
                          <span className="px-1.5 py-0.5 bg-slate-800 rounded">{tx.customer_id}</span>
                          <span>{format(new Date(tx.timestamp), 'MMM d, HH:mm')}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-200">{tx.currency} {tx.amount.toLocaleString()}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{tx.channel} • {tx.country}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {tx.decision ? (
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-black border tracking-tighter",
                          decisionColors[tx.decision] || "bg-slate-800 border-slate-700 text-slate-400"
                        )}>
                          {tx.decision.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500 italic">Processing...</span>
                      )}
                    </td>
                    <td className="p-4">
                      {tx.confidence !== undefined ? (
                        <div className="flex items-center space-x-3">
                          <div className="flex-1 h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-1000",
                                (tx.confidence || 0) > 0.7 ? "bg-emerald-500" : (tx.confidence || 0) > 0.4 ? "bg-amber-500" : "bg-rose-500"
                              )}
                              style={{ width: `${(tx.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-slate-400">
                            {((tx.confidence || 0) * 100).toFixed(0)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        className="flex items-center space-x-2 ml-auto px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 rounded-lg transition-all text-xs font-bold group"
                        onClick={() => setSelectedAuditId(tx.id)}
                      >
                        <FileText className="h-4 w-4" />
                        <span>Audit Analysis</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isFormOpen && (
        <TransactionForm
          onSuccess={handleAnalysisSuccess}
          onClose={() => setIsFormOpen(false)}
        />
      )}

      {selectedAuditId && (
        <AuditTrailModal
          transactionId={selectedAuditId}
          onClose={() => setSelectedAuditId(null)}
        />
      )}
    </div>
  );
}
