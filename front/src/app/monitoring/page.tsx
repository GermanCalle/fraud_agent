"use client";

import { Activity, Cpu, HardDrive, Network, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MonitoringPage() {
  const nodes = [
    { name: 'Transaction Context Node', type: 'Logic', load: '12%', status: 'Healthy', latency: '45ms' },
    { name: 'Behavioral Neural Node', type: 'ML', load: '45%', status: 'Healthy', latency: '128ms' },
    { name: 'Policy RAG Engine', type: 'Vector', load: '22%', status: 'Healthy', latency: '89ms' },
    { name: 'External Threat Crawler', type: 'HTTP', load: '8%', status: 'Healthy', latency: '340ms' },
    { name: 'Evidence Aggregator', type: 'Synthesis', load: '15%', status: 'Healthy', latency: '12ms' },
    { name: 'Debate Oracle', type: 'LLM', load: '67%', status: 'Heavy', latency: '2100ms' },
    { name: 'Decision Arbiter', type: 'Logic', load: '4%', status: 'Healthy', latency: '8ms' },
    { name: 'Explainability Core', type: 'LLM', load: '31%', status: 'Healthy', latency: '1500ms' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">System Infrastructure</h1>
        <p className="text-slate-400 mt-2">Agent node health and performance telemetry</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'CPU Usage', value: '24.8%', icon: Cpu },
          { label: 'Memory', value: '4.2GB / 16GB', icon: HardDrive },
          { label: 'Latency (Avg)', value: '412ms', icon: (props: any) => <Zap {...props} className="h-6 w-6 text-yellow-500" /> },
          { label: 'Throughput', value: '142 req/s', icon: Network },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
                {(() => {
                  const Icon = stat.icon;
                  return <Icon className="h-5 w-5" />;
                })()}
              </div>
            </div>
            <p className="text-2xl font-bold font-mono tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-800">
              <th className="p-6 text-xs font-bold text-slate-500 uppercase">Node Name</th>
              <th className="p-6 text-xs font-bold text-slate-500 uppercase">Type</th>
              <th className="p-6 text-xs font-bold text-slate-500 uppercase">Load</th>
              <th className="p-6 text-xs font-bold text-slate-500 uppercase">Latency</th>
              <th className="p-6 text-xs font-bold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {nodes.map((node, i) => (
              <tr key={i} className="hover:bg-white/5 transition-colors group">
                <td className="p-6">
                  <span className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors cursor-default">{node.name}</span>
                </td>
                <td className="p-6 text-sm text-slate-400 font-mono italic">{node.type}</td>
                <td className="p-6">
                  <div className="flex items-center space-x-3">
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: node.load }} />
                    </div>
                    <span className="text-xs font-mono text-slate-500">{node.load}</span>
                  </div>
                </td>
                <td className="p-6 text-xs font-mono text-slate-300">{node.latency}</td>
                <td className="p-6">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                    node.status === 'Healthy' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                  )}>
                    {node.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
