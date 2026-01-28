"use client";

import {
  AuditTrail,
  getAuditTrails,
  getTransaction,
  getTransactionSummary,
  Transaction,
  TransactionSummary
} from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  Clock,
  Cpu,
  FileText,
  Loader2,
  Printer,
  ShieldCheck,
  Wand2,
  X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface AuditTrailModalProps {
  transactionId: string;
  onClose: () => void;
}

export default function AuditTrailModal({ transactionId, onClose }: AuditTrailModalProps) {
  const [trails, setTrails] = useState<AuditTrail[]>([]);
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [trailsData, txData] = await Promise.all([
          getAuditTrails(transactionId),
          getTransaction(transactionId)
        ]);
        setTrails(trailsData.sort((a, b) => a.step_order - b.step_order));
        setTransaction(txData);
      } catch (error) {
        console.error("Error fetching audit data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [transactionId]);

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setShowSummary(true);
    try {
      const summaryData = await getTransactionSummary(transactionId);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error generating summary:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[60] flex items-center justify-center p-4 print:p-0 print:bg-white">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-6xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 print:max-h-none print:shadow-none print:border-none print:rounded-none print:overflow-visible print:bg-white print:text-black">

        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 print:hidden text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <ShieldCheck className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Audit Dossier</h2>
              <p className="text-sm text-slate-400 font-mono">TX-REF: {transactionId}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400 hover:text-white"
              title="Print Official Report"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block p-8 border-b-2 border-black mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter">Official Fraud Audit Report</h1>
              <p className="text-sm font-mono mt-2">Reference ID: {transactionId}</p>
              <p className="text-xs mt-1 text-slate-500">Generated on: {new Date().toLocaleString()}</p>
            </div>
            <div className="text-right">
              <div className="inline-block px-4 py-2 bg-black text-white font-bold rounded-lg uppercase">
                {transaction?.decision}
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col md:flex-row print:flex-col print:overflow-visible">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-20 text-white">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
              <p className="text-slate-500 font-medium tracking-widest uppercase text-xs">Assembling Evidence Dossier...</p>
            </div>
          ) : (
            <>
              {/* Sidebar: Summary & Evidence */}
              <div className="w-full md:w-80 bg-slate-950/50 border-r border-slate-800 overflow-y-auto p-6 space-y-8 print:w-full print:border-r-0 print:border-b-2 print:border-slate-100 print:bg-white print:text-black">

                {/* AI Summary Action */}
                <div className="print:hidden">
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGeneratingSummary}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white p-4 rounded-2xl font-bold flex items-center justify-center space-x-3 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] group disabled:opacity-50"
                  >
                    {isGeneratingSummary ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Wand2 className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                    )}
                    <span>{isGeneratingSummary ? "Generating..." : "AI Intelligence Report"}</span>
                  </button>
                </div>

                {/* Final Determination */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] print:text-black">Final Determination</h3>
                  <div className={cn(
                    "p-4 rounded-2xl border flex items-center justify-between",
                    transaction?.decision === 'APPROVE' ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500 print:text-emerald-700" :
                      transaction?.decision === 'BLOCK' ? "bg-rose-500/5 border-rose-500/20 text-rose-500 print:text-rose-700" :
                        "bg-amber-500/5 border-amber-500/20 text-amber-500 print:text-amber-700"
                  )}>
                    <span className="font-bold">{transaction?.decision || 'Unknown'}</span>
                    <span className="text-xs font-mono">{(transaction?.confidence ? transaction.confidence * 100 : 0).toFixed(0)}%</span>
                  </div>
                </div>

                {/* Audit Explanation */}
                <div className="space-y-3 print:break-inside-avoid">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 print:text-black">
                    <FileText className="h-3 w-3" /> Audit Summary
                  </h3>
                  <div className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5 italic print:text-black print:bg-slate-50 print:border-slate-100">
                    "{transaction?.explanation_audit || 'No technical explanation available.'}"
                  </div>
                </div>

                {/* Policy Citations */}
                <div className="space-y-4 print:break-inside-avoid">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2 print:text-black">
                    <BookOpen className="h-3 w-3" /> Policy Citations
                  </h3>
                  <div className="space-y-2">
                    {transaction?.citations_internal && transaction.citations_internal.length > 0 ? (
                      transaction.citations_internal.map((cit, idx) => (
                        <div key={idx} className="bg-blue-500/5 border border-blue-500/10 p-3 rounded-xl flex items-center space-x-3 print:bg-white print:border-slate-200">
                          <div className="h-2 w-2 rounded-full bg-blue-500 print:bg-black" />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-blue-200 print:text-black">{cit.policy_id}</p>
                            <p className="text-[10px] text-blue-500/70 font-mono print:text-slate-600">v{cit.version} • Chunk {cit.chunk_id}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-600 italic px-1">No internal policies cited.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content: AI Summary + Agent Timeline */}
              <div className="flex-1 overflow-y-auto p-10 bg-slate-900 print:bg-white print:text-black print:p-8 print:overflow-visible scroll-smooth">
                <div className="max-w-3xl mx-auto space-y-12">

                  {/* AI Generated Report Section */}
                  {showSummary && (
                    <div className="space-y-6 animate-in slide-in-from-top-4 duration-500 print:break-inside-avoid">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-black">
                        <h3 className="text-xl font-bold text-white flex items-center gap-3 print:text-black">
                          <Wand2 className="h-5 w-5 text-indigo-400 print:text-black" />
                          Executive AI Insight
                        </h3>
                        <button
                          onClick={() => setShowSummary(false)}
                          className="text-xs text-slate-500 hover:text-white print:hidden"
                        >
                          Hide
                        </button>
                      </div>

                      <div className="bg-gradient-to-br from-indigo-500/5 to-blue-500/5 border border-indigo-500/10 rounded-3xl p-8 relative overflow-hidden print:bg-white print:border-none print:p-0">
                        {isGeneratingSummary ? (
                          <div className="flex flex-col items-center justify-center space-y-4 py-8">
                            <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Synthesizing Intel...</p>
                          </div>
                        ) : (
                          <div className="prose prose-invert prose-slate max-w-none print:prose-neutral">
                            <ReactMarkdown
                              components={{
                                h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-white mb-4 print:text-black" {...props} />,
                                h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-white mb-3 mt-6 print:text-black" {...props} />,
                                h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-white mb-2 mt-4 print:text-black" {...props} />,
                                p: ({ node, ...props }) => <p className="text-slate-300 leading-relaxed mb-4 print:text-black" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-5 space-y-2 mb-4 print:text-black" {...props} />,
                                li: ({ node, ...props }) => <li className="text-slate-300 print:text-black" {...props} />,
                                strong: ({ node, ...props }) => <strong className="text-indigo-400 font-bold print:text-black" {...props} />,
                              }}
                            >
                              {summary?.summary_text || ""}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 print:border-black print:mt-12">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3 print:text-black">
                      <Activity className="h-5 w-5 text-blue-500 print:text-black" />
                      Consensus Execution Trail
                    </h3>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 print:hidden">
                      <span className="px-3 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Historical Metadata</span>
                    </div>
                  </div>

                  {trails.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center space-y-4 text-slate-500">
                      <Clock className="h-12 w-12 opacity-20" />
                      <p className="text-sm">Consensus trail is being indexed...</p>
                    </div>
                  ) : (
                    <div className="relative border-l border-slate-800 ml-4 pl-10 space-y-12 print:border-slate-200">
                      {trails.map((trail, index) => (
                        <div key={trail.id} className="relative group print:break-inside-avoid">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[45px] top-0 h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10 print:bg-black print:shadow-none" />
                          <div className="absolute -left-[48px] -top-[3px] h-[14px] w-[14px] rounded-full border border-blue-500/30 group-hover:scale-150 transition-transform duration-500 print:hidden" />

                          <div className="bg-slate-800/20 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 transition-all print:bg-white print:border-slate-200 print:p-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl group-hover:rotate-12 transition-transform print:hidden text-blue-400">
                                  <Cpu className="h-5 w-5" />
                                </div>
                                <div className="text-white print:text-black">
                                  <h3 className="font-bold uppercase tracking-wider">
                                    {trail.agent_name.replace(/_/g, ' ')}
                                  </h3>
                                  <span className="text-[10px] font-mono text-slate-500">Node ID: {trail.id} • Seq: 0{trail.step_order + 1}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-6">
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-500 font-black uppercase">Confidence</p>
                                  <p className={cn(
                                    "text-lg font-mono font-bold leading-tight",
                                    trail.output_data.confidence > 0.7 ? "text-emerald-500" : trail.output_data.confidence > 0.4 ? "text-amber-500" : "text-rose-500"
                                  )}>
                                    {(trail.output_data.confidence * 100).toFixed(0)}%
                                  </p>
                                </div>
                                <div className="text-right print:hidden">
                                  <p className="text-[10px] text-slate-500 font-black uppercase">Latency</p>
                                  <p className="text-lg font-mono text-slate-300 leading-tight">{trail.execution_time_ms || '—'}ms</p>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-6">
                              <div className="bg-slate-950/40 rounded-2xl p-5 border border-white/5 relative overflow-hidden print:bg-slate-50 print:border-slate-100">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600/50 print:bg-black" />
                                <p className="text-[11px] font-black text-blue-500 uppercase mb-3 flex items-center gap-2 print:text-black">
                                  <Activity className="h-3 w-3" /> Agent Cognition
                                </p>
                                <p className="text-slate-300 leading-relaxed text-sm print:text-black">
                                  {trail.output_data.reasoning}
                                </p>
                              </div>

                              {trail.output_data.signals && trail.output_data.signals.length > 0 && (
                                <div className="grid grid-cols-1 gap-3">
                                  <div className="flex flex-wrap gap-2">
                                    {trail.output_data.signals.map((signal: any, sIdx: number) => (
                                      <div key={sIdx} className="px-3 py-1.5 bg-rose-500/5 border border-rose-500/10 text-rose-400 rounded-xl text-[10px] font-bold flex items-center gap-2 print:text-rose-700 print:bg-white print:border-rose-200">
                                        <AlertTriangle className="h-3 w-3" />
                                        {typeof signal === 'string' ? signal : (signal.name || signal.description || JSON.stringify(signal))}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            Close Audit
          </button>
        </div>
      </div>
    </div>
  );
}
