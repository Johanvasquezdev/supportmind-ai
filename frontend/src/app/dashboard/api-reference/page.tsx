'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { 
  Code, 
  Terminal, 
  Key, 
  MessageSquare, 
  Search, 
  FileText, 
  Activity,
  Copy,
  Check,
  Play
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const API_V1_URL = `${API_BASE_URL}/api/v1`;

export default function ApiReferencePage() {
  const api = useApi();
  const { show: toast } = useToast();
  const [apiKey, setApiKey] = useState('smk_live_************************');
  const [copied, setCopied] = useState(false);
  const [activeEndpoint, setActiveEndpoint] = useState('chat');

  useEffect(() => {
    async function fetchData() {
      try {
        const keysRes = await api.get('/auth/keys');
        setApiKey(keysRes.data.apiKey || 'YOUR_API_KEY');
      } catch (err) {
        console.error('Failed to fetch API key', err);
        toast('Could not load API key');
      }
    }
    fetchData();
  }, [toast]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
  };

  const endpoints = [
    { id: 'chat', name: 'Chat AI', icon: MessageSquare, method: 'POST', path: '/chat' },
    { id: 'search', name: 'Hybrid Search', icon: Search, method: 'POST', path: '/search' },
    { id: 'documents', name: 'List Documents', icon: FileText, method: 'GET', path: '/documents' },
    { id: 'usage', name: 'Check Usage', icon: Activity, method: 'GET', path: '/usage' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="space-y-4 border-b border-white/10 pb-10">
        <div className="flex items-center gap-3 text-purple-400">
          <Terminal className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-widest">Developer Platform</span>
        </div>
        <h1 className="text-4xl font-bold text-[#F0EEE9]">API Reference</h1>
        <p className="text-xl text-[#94a3b8] max-w-3xl">
          Build custom AI experiences using SupportMind's knowledge infrastructure. 
          Our REST API allows you to query documents, manage conversations, and get analytics programmatically.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Navigation Sidebar */}
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#6B6A72] uppercase tracking-widest px-4">Introduction</h3>
            <button className="w-full text-left px-4 py-2 text-sm text-[#F0EEE9] hover:bg-white/5 rounded-lg transition-colors">
              Getting Started
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-[#94a3b8] hover:bg-white/5 rounded-lg transition-colors">
              Authentication
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-[#94a3b8] hover:bg-white/5 rounded-lg transition-colors">
              Rate Limiting
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#6B6A72] uppercase tracking-widest px-4">Endpoints</h3>
            {endpoints.map((ep) => (
              <button
                key={ep.id}
                onClick={() => setActiveEndpoint(ep.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all ${
                  activeEndpoint === ep.id 
                    ? 'bg-purple-500/10 text-purple-400 font-semibold border border-purple-500/20 shadow-lg shadow-purple-500/5' 
                    : 'text-[#94a3b8] hover:bg-white/5 hover:text-[#F0EEE9]'
                }`}
              >
                <ep.icon className="w-4 h-4" />
                {ep.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-12">
          {/* Auth Block */}
          <div className="bg-[#1a1429] border border-white/10 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 blur-3xl -mr-32 -mt-32"></div>
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Key className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-[#F0EEE9]">Your API Key</h2>
                </div>
                <button className="text-xs text-purple-400 hover:underline">Regenerate Key</button>
              </div>
              
              <div className="flex items-center gap-3 bg-black/40 border border-white/10 rounded-xl p-4">
                <code className="flex-1 font-mono text-sm text-purple-200">{apiKey}</code>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(apiKey);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg text-[#94a3b8] transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              
              <p className="text-sm text-[#94a3b8]">
                Include this key in every request as the <code className="text-purple-300">x-api-key</code> header.
              </p>
            </div>
          </div>

          {/* Endpoint Documentation */}
          {activeEndpoint === 'chat' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="bg-green-500/10 text-green-500 text-xs font-bold px-2.5 py-1 rounded border border-green-500/20">POST</span>
                  <code className="text-xl font-mono text-[#F0EEE9]">/chat</code>
                </div>
                <p className="text-[#94a3b8] text-lg">
                  Ask a question to your knowledge base and get a grounded AI response with source citations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Parameters */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-[#F0EEE9]">Body Parameters</h3>
                  <div className="space-y-4">
                    <div className="border-l-2 border-purple-500/30 pl-4 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[#F0EEE9]">message</span>
                        <span className="text-[10px] bg-white/5 text-[#6B6A72] px-1.5 py-0.5 rounded uppercase font-bold">Required</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] mt-1">The user question to answer. Max 1000 chars.</p>
                    </div>
                    <div className="border-l-2 border-white/10 pl-4 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[#F0EEE9]">conversationId</span>
                        <span className="text-[10px] bg-white/5 text-[#6B6A72] px-1.5 py-0.5 rounded uppercase font-bold">Optional</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] mt-1">UUID to maintain conversation context.</p>
                    </div>
                    <div className="border-l-2 border-white/10 pl-4 py-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-[#F0EEE9]">mode</span>
                        <span className="text-[10px] bg-white/5 text-[#6B6A72] px-1.5 py-0.5 rounded uppercase font-bold">Optional</span>
                      </div>
                      <p className="text-sm text-[#94a3b8] mt-1">One of: <code className="text-purple-300">answer</code>, <code className="text-purple-300">summary</code>, <code className="text-purple-300">exact</code>.</p>
                    </div>
                  </div>
                </div>

                {/* Example Code */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#6B6A72] uppercase tracking-widest">Example Request</h3>
                    <button onClick={() => copyToClipboard('curl ...')} className="text-[#6B6A72] hover:text-[#F0EEE9]"><Copy className="w-4 h-4" /></button>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-xl p-6 overflow-hidden">
                    <pre className="font-mono text-xs text-purple-200 leading-relaxed overflow-x-auto">
{`curl -X POST ${API_V1_URL}/chat \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": "What is the policy for vacation days?",
    "mode": "answer"
  }'`}
                    </pre>
                  </div>
                </div>
              </div>
              
              {/* Response Preview */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-[#6B6A72] uppercase tracking-widest">Response Object</h3>
                <div className="bg-[#1a1429] border border-white/10 rounded-xl p-6">
                  <pre className="font-mono text-xs text-blue-200 leading-relaxed overflow-x-auto">
{`{
  "id": "msg_98765",
  "answer": "Employees are entitled to 20 days of paid vacation per year...",
  "conversationId": "550e8400-e29b-41d4-a716-446655440000",
  "sources": [
    {
      "documentId": "doc_123",
      "documentTitle": "Employee Handbook",
      "excerpt": "Full-time employees accrue 1.66 days per month...",
      "score": 0.92
    }
  ],
  "usage": { "totalTokens": 142 },
  "latencyMs": 840
}`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Add more endpoint sections as needed */}
          {activeEndpoint !== 'chat' && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
              <div className="p-4 bg-white/5 rounded-full">
                <Code className="w-8 h-8 text-[#94a3b8]" />
              </div>
              <p className="text-[#94a3b8]">Documentation for <span className="text-[#F0EEE9] font-semibold">{activeEndpoint}</span> is coming soon.</p>
              <button 
                onClick={() => setActiveEndpoint('chat')}
                className="text-sm text-purple-400 hover:underline"
              >
                Back to Chat API
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Try it out floating action */}
      <div className="fixed bottom-10 right-10">
        <button className="flex items-center gap-2 bg-[#7c3aed] text-white px-6 py-3 rounded-full font-bold shadow-2xl hover:scale-105 transition-all group">
          <Play className="w-4 h-4 fill-current" />
          Interactive API Playground
          <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded ml-2 group-hover:bg-white/30 transition-colors">BETA</span>
        </button>
      </div>
    </div>
  );
}
