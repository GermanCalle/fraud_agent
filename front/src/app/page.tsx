"use client";

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  Play,
  TrendingUp,
  Fingerprint,
  Activity
} from 'lucide-react';
import {
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { analyzeTransaction, TransactionInput, FraudDetectionResult } from '@/lib/api';

const mockData = [
  { name: 'Mon', transactions: 400, fraud: 24 },
  { name: 'Tue', transactions: 300, fraud: 13 },
  { name: 'Wed', transactions: 200, fraud: 98 },
  { name: 'Thu', transactions: 278, fraud: 39 },
  { name: 'Fri', transactions: 189, fraud: 48 },
  { name: 'Sat', transactions: 239, fraud: 38 },
  { name: 'Sun', transactions: 349, fraud: 43 },
];

const decisionColors = {
  APPROVE: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
  CHALLENGE: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
  BLOCK: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  ESCALATE_TO_HUMAN: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
};

export default function Dashboard() {
  const [results, setResults] = useState<FraudDetectionResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runSampleAnalysis = async () => {
    setIsAnalyzing(true);
    const sample: TransactionInput = {
      transaction_id: `T-${Math.floor(Math.random() * 10000)}`,
      customer_id: "CU-002",
      amount: 9500.00,
      currency: "PEN",
      country: "PE",
      channel: "mobile",
      device_id: "D-02",
      timestamp: new Date().toISOString(),
      merchant_id: "M-002"
    };

    try {
      const res = await analyzeTransaction(sample);
      setResults(prev => [res, ...prev]);
    } catch (error) {
      console.error("Error analyzing:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">Fraud Operations</h1>
          <p className="text-slate-400 mt-2">Real-time multi-agent transaction monitoring</p>
        </div>
        <button
          onClick={runSampleAnalysis}
          disabled={isAnalyzing}
          className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white px-6 py-3 rounded-2xl font-semibold flex items-center space-x-2 transition-all shadow-xl shadow-blue-900/20"
        >
          {isAnalyzing ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Play className="h-5 w-5 fill-current" />
          )}
          <span>{isAnalyzing ? "Analyzing..." : "Run Test Transaction"}</span>
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Scanned', value: '1,284', icon: Activity, color: 'text-emerald-500' },
          { label: 'Blocked Threats', value: '42', icon: ShieldAlert, color: 'text-rose-500' },
          { label: 'Manual Reviews', value: '18', icon: Fingerprint, color: 'text-blue-500' },
          { label: 'Risk Score', value: '12.4%', icon: TrendingUp, color: 'text-amber-500' },
        ].map((stat, i) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold">Threat Indicators</h3>
              <div className="flex space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-slate-400">Normal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-slate-400">Risk</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height="80%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="transactions" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTx)" />
                <Area type="monotone" dataKey="fraud" stroke="#f43f5e" fillOpacity={0.1} fill="#f43f5e" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Recent Analysis Feed */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xl font-bold">Live Analysis Activity</h3>
              <span className="px-3 py-1 bg-blue-500/10 text-blue-500 rounded-full text-xs font-bold animate-pulse">LIVE BROADCAST</span>
            </div>
            <div className="divide-y divide-slate-800">
              {results.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <div className="mx-auto w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8" />
                  </div>
                  <p>No analysis performed yet. Click the button to start.</p>
                </div>
              ) : (
                results.map((res, i) => (
                  <div key={i} className="p-6 hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-3">
                          <span className="font-mono text-sm text-blue-400">{res.transaction_id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${decisionColors[res.decision]}`}>
                            {res.decision}
                          </span>
                        </div>
                        <p className="font-medium text-lg">{res.explanation_customer}</p>
                        <div className="flex items-center space-x-4 text-xs text-slate-500">
                          <span>Confidence: {(res.confidence * 100).toFixed(1)}%</span>
                          <span>Time: {res.processing_time_ms}ms</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex -space-x-2">
                          {res.agent_route.slice(0, 4).map((agent, j) => (
                            <div key={j} className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[8px] font-bold" title={agent}>
                              {agent.split('_').map(w => w[0]).join('')}
                            </div>
                          ))}
                          {res.agent_route.length > 4 && (
                            <div className="h-8 w-8 rounded-full border-2 border-slate-900 bg-slate-700 flex items-center justify-center text-[10px]">
                              +{res.agent_route.length - 4}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Info Column */}
        <div className="space-y-8 h-fit lg:sticky lg:top-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-2xl shadow-blue-500/20">
            <h3 className="text-2xl font-bold mb-4">System Integrity</h3>
            <p className="text-blue-100 mb-6">Multi-agent consensus mechanism is active across 8 specialized validation nodes.</p>
            <div className="space-y-4">
              {[
                { label: 'RAG Core', status: 'Optimal' },
                { label: 'Threat Intel', status: 'Connected' },
                { label: 'Audit Trail', status: 'Secured' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center bg-white/10 px-4 py-3 rounded-2xl">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-xs font-bold uppercase py-1 px-2 bg-emerald-500/20 text-emerald-300 rounded-lg">{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-3xl">
            <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
              <span>Policies Active</span>
            </h3>
            <div className="space-y-6">
              {[
                { id: 'FP-01', rule: 'Amount > 3x Average' },
                { id: 'FP-02', rule: 'Inter-Country Logic' },
                { id: 'FP-05', rule: 'Volume Surge Detection' },
              ].map((policy, i) => (
                <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-1 before:h-4 before:w-1 before:bg-blue-500 before:rounded-full">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{policy.id}</p>
                  <p className="font-medium text-slate-200">{policy.rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
