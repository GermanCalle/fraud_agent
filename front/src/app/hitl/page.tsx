"use client";

import AuditTrailModal from '@/components/AuditTrailModal';
import { getHITLQueue, HITLItem, submitHITLReview } from '@/lib/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Filter,
  MessageSquare,
  Search,
  XCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';

export default function HITLQueuePage() {
  const [queue, setQueue] = useState<HITLItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<HITLItem | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuditId, setShowAuditId] = useState<string | null>(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getHITLQueue();
      setQueue(data);
    } catch (error) {
      console.error("Error fetching HITL queue:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = async (decision: 'APPROVE' | 'BLOCK') => {
    if (!selectedItem) return;
    setIsSubmitting(true);
    try {
      await submitHITLReview(selectedItem.transaction_id, decision, reviewNote);
      setSelectedItem(null);
      setReviewNote("");
      fetchQueue();
    } catch (error) {
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Manual Review Queue</h1>
        <p className="text-slate-400 mt-2">Human-in-the-loop escalation monitoring</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search transaction ID..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
            <button className="bg-slate-900 border border-slate-800 p-3 rounded-2xl hover:bg-slate-800 transition-colors">
              <Filter className="h-5 w-5" />
            </button>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden">
            {isLoading ? (
              <div className="p-20 flex flex-col items-center justify-center space-y-4">
                <div className="h-10 w-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <p className="text-slate-500 font-medium">Synchronizing queue...</p>
              </div>
            ) : queue.length === 0 ? (
              <div className="p-20 text-center space-y-4">
                <div className="mx-auto h-20 w-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold">Queue is Clear</h3>
                <p className="text-slate-500 max-w-xs mx-auto">No pending escalations require human intervention at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={cn(
                      "p-6 cursor-pointer transition-all hover:bg-white/5",
                      selectedItem?.id === item.id ? "bg-white/5 border-l-4 border-blue-500" : ""
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400">
                          <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <p className="font-mono text-sm font-bold text-white">{item.transaction_id}</p>
                          <p className="text-xs text-slate-500">Escalated: {format(new Date(item.created_at), 'MMM d, HH:mm:ss')}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-[10px] font-bold py-1 px-3 bg-amber-500/10 text-amber-500 rounded-full uppercase border border-amber-500/20 tracking-wider">PENDING</span>
                        <ExternalLink className="h-4 w-4 text-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Review Column */}
        <div className="h-fit lg:sticky lg:top-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 min-h-[500px] flex flex-col">
            {!selectedItem ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 text-slate-500">
                <MessageSquare className="h-12 w-12 mb-2 opacity-20" />
                <p>Select a transaction from the queue to start manual audit.</p>
              </div>
            ) : (
              <div className="space-y-8 flex-1 flex flex-col animate-in fade-in slide-in-from-right-4 duration-300">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Manual Audit</h3>
                  <div className="flex items-center space-x-2 text-slate-400">
                    <span className="font-mono">{selectedItem.transaction_id}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Audit Alert</h4>
                    <button
                      onClick={() => setShowAuditId(selectedItem.transaction_id)}
                      className="flex items-center space-x-1 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      <span>View Full Trail</span>
                    </button>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-300">
                    Agent consensus was inconclusive. Security node report indicates ambiguous behavior patterns and high-risk threshold crossing.
                  </p>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-slate-400">Reviewer Comments</label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Enter reasoning for manual decision..."
                    className="w-full h-32 bg-slate-800 border border-slate-700 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-auto">
                  <button
                    onClick={() => handleReview('BLOCK')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center space-x-2 bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white py-4 rounded-2xl font-bold transition-all"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                  <button
                    onClick={() => handleReview('APPROVE')}
                    disabled={isSubmitting}
                    className="flex items-center justify-center space-x-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white py-4 rounded-2xl font-bold transition-all"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Approve</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showAuditId && (
        <AuditTrailModal
          transactionId={showAuditId}
          onClose={() => setShowAuditId(null)}
        />
      )}
    </div>
  );
}
