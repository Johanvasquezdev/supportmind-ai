'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/use-api';
import { 
  Settings, 
  Palette, 
  MessageSquare, 
  Code, 
  Save, 
  Check, 
  Copy, 
  ExternalLink,
  Eye,
  Info
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WidgetConfig {
  primaryColor: string;
  position: string;
  placeholder: string;
  title: string;
  welcomeMessage: string;
  isEnabled: boolean;
  allowedOrigins: string[];
}

export default function WidgetSettingsPage() {
  const api = useApi();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const { show: toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [configRes, tenantRes] = await Promise.all([
        api.get('/widget-admin/config'),
        api.get('/auth/me') 
      ]);
      
      setConfig(configRes.data);
      const keysRes = await api.get('/auth/keys');
      setApiKey(keysRes.data.apiKey || 'YOUR_API_KEY');
    } catch (err) {
      console.error('Failed to fetch widget settings', err);
      toast('Could not load widget settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await api.put('/widget-admin/config', config);
      toast('Widget configuration saved');
      
      // Refresh the widget if it's already on the page
      window.location.reload();
    } catch (err) {
      toast('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const copyEmbedCode = () => {
    const code = `<script 
  src="${window.location.origin}/widget/supportmind-widget.js" 
  data-api-key="${apiKey}" 
  defer
></script>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast('Embed code copied to clipboard');
  };

  useEffect(() => {
    if (!apiKey) return;

    // Remove existing script if any
    const existingScript = document.getElementById('smk-widget-script');
    if (existingScript) {
      existingScript.remove();
    }

    // Remove existing host if any (to allow fresh load)
    const existingHost = document.getElementById('supportmind-widget-host');
    if (existingHost) {
      existingHost.remove();
    }

    const script = document.createElement('script');
    script.id = 'smk-widget-script';
    script.src = '/widget/supportmind-widget.js';
    script.setAttribute('data-api-key', apiKey);
    script.setAttribute('data-backend-url', API_BASE_URL);
    script.async = true;
    
    document.body.appendChild(script);

    return () => {
      script.remove();
      const host = document.getElementById('supportmind-widget-host');
      if (host) host.remove();
    };
  }, [apiKey]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#F0EEE9]">Chat Widget</h1>
          <p className="text-[#94a3b8] mt-1">Embed SupportMind on your own website</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/20"
        >
          {saving ? <div className="h-4 w-4 animate-spin border-2 border-white/30 border-t-white rounded-full" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appearance Section */}
          <div className="bg-[#1a1429] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Palette className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#F0EEE9]">Appearance</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8]">Brand Color</label>
                  <div className="flex gap-3">
                    <input 
                      type="color" 
                      value={config?.primaryColor || '#7c3aed'}
                      onChange={(e) => setConfig(prev => prev ? {...prev, primaryColor: e.target.value} : null)}
                      className="w-12 h-10 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={config?.primaryColor || '#7c3aed'}
                      onChange={(e) => setConfig(prev => prev ? {...prev, primaryColor: e.target.value} : null)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[#F0EEE9] focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#94a3b8]">Position</label>
                  <select 
                    value={config?.position || 'bottom-right'}
                    onChange={(e) => setConfig(prev => prev ? {...prev, position: e.target.value} : null)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[#F0EEE9] focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="bg-[#1a1429] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#F0EEE9]">Widget Content</h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#94a3b8]">Widget Title</label>
                <input 
                  type="text" 
                  value={config?.title || ''}
                  onChange={(e) => setConfig(prev => prev ? {...prev, title: e.target.value} : null)}
                  placeholder="Support Assistant"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[#F0EEE9] focus:outline-none focus:border-purple-500/50"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#94a3b8]">Welcome Message</label>
                <textarea 
                  value={config?.welcomeMessage || ''}
                  onChange={(e) => setConfig(prev => prev ? {...prev, welcomeMessage: e.target.value} : null)}
                  placeholder="Hi! How can I help you today?"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[#F0EEE9] focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#94a3b8]">Input Placeholder</label>
                <input 
                  type="text" 
                  value={config?.placeholder || ''}
                  onChange={(e) => setConfig(prev => prev ? {...prev, placeholder: e.target.value} : null)}
                  placeholder="Ask us anything..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[#F0EEE9] focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </div>
          </div>

          {/* Installation Section */}
          <div className="bg-[#1a1429] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Code className="w-5 h-5 text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-[#F0EEE9]">Installation</h2>
            </div>
            <div className="p-8 space-y-4">
              <p className="text-sm text-[#94a3b8]">
                Add this script to your website's <code className="bg-white/5 px-1.5 py-0.5 rounded">&lt;body&gt;</code> or <code className="bg-white/5 px-1.5 py-0.5 rounded">&lt;head&gt;</code> tag to enable the widget.
              </p>
              <div className="relative group">
                <pre className="bg-black/40 border border-white/10 rounded-xl p-6 overflow-x-auto text-sm text-purple-200 font-mono leading-relaxed">
                  {`<script 
  src="${typeof window !== 'undefined' ? window.location.origin : ''}/widget/supportmind-widget.js" 
  data-api-key="${apiKey}" 
  defer
></script>`}
                </pre>
                <button 
                  onClick={copyEmbedCode}
                  className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[#94a3b8] hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-100/70">
                  Your API key is private. Only use it on domains you control. You can restrict allowed origins in the API settings.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview / Stats */}
        <div className="space-y-6">
          <div className="bg-[#1a1429] border border-white/10 rounded-2xl overflow-hidden shadow-xl sticky top-8">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-400" />
                </div>
                <h2 className="text-xl font-semibold text-[#F0EEE9]">Live Preview</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-green-500 font-medium uppercase tracking-wider">Live</span>
              </div>
            </div>
            <div className="p-8 aspect-[3/4] bg-black/20 flex items-center justify-center relative group">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
                  <Settings className="w-8 h-8 text-[#94a3b8] group-hover:rotate-90 transition-transform duration-500" />
                </div>
                <p className="text-sm text-[#94a3b8]">
                  The widget is visible in the <br/>bottom corner of this page.
                </p>
              </div>
              
              {/* Overlay for "interactive" feel without actually blocking the widget */}
              <div className="absolute inset-0 border-2 border-dashed border-white/5 rounded-xl pointer-events-none"></div>
            </div>
            <div className="p-6 bg-white/5 border-t border-white/10">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#94a3b8]">Widget Status</span>
                <button 
                  onClick={() => setConfig(prev => prev ? {...prev, isEnabled: !prev.isEnabled} : null)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                    config?.isEnabled 
                      ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                      : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}
                >
                  {config?.isEnabled ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-[#7c3aed]/20 to-transparent border border-[#7c3aed]/30 rounded-2xl p-6 space-y-4">
            <h3 className="font-semibold text-[#F0EEE9] flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Need a Custom UI?
            </h3>
            <p className="text-sm text-[#94a3b8] leading-relaxed">
              Use our Developer API to build your own custom chat interface while leveraging SupportMind's knowledge infrastructure.
            </p>
            <button className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition-colors border border-white/10">
              View API Docs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
