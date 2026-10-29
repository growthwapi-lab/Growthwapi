import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import {
  Bot,
  Globe,
  Sparkles,
  Lock,
  RefreshCw,
  Power,
  Trash2,
  Save,
  CheckCircle2,
  AlertTriangle,
  FileText,
  BarChart3,
  DollarSign,
  PlusCircle,
  BookOpen,
} from 'lucide-react';

export default function AiAgent() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState(null);
  const [plan, setPlan] = useState('starter');
  const [isLocked, setIsLocked] = useState(false);
  const [quotaLimit, setQuotaLimit] = useState(0);
  const [monthlyUsage, setMonthlyUsage] = useState(0);
  const [monthlyCostUSD, setMonthlyCostUSD] = useState('0.0000');
  const [totalTokens, setTotalTokens] = useState(0);

  // Form states for creation
  const [trainingType, setTrainingType] = useState('website'); // 'website' | 'custom'
  const [formData, setFormData] = useState({
    name: 'Growthwapi Assistant',
    website_url: '',
    business_type: 'E-commerce',
    custom_instructions: 'Be polite, helpful, and answer concisely. If a user asks for human support, direct them to wait for a live team member.',
    custom_knowledge: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Form states for editing instructions & extra knowledge
  const [editInstructions, setEditInstructions] = useState('');
  const [savingInstructions, setSavingInstructions] = useState(false);
  const [retraining, setRetraining] = useState(false);

  // Extra knowledge addition state
  const [extraKnowledgeText, setExtraKnowledgeText] = useState('');
  const [extraKnowledgeLabel, setExtraKnowledgeLabel] = useState('Custom FAQ / Policy');
  const [addingKnowledge, setAddingKnowledge] = useState(false);

  // Fetch Agent data from backend
  const fetchAgentData = async () => {
    try {
      const res = await api.get('/api/ai-agent');
      setAgent(res.data.agent);
      setPlan(res.data.plan);
      setIsLocked(res.data.isLocked);
      setQuotaLimit(res.data.quotaLimit);
      setMonthlyUsage(res.data.monthlyUsage);
      setMonthlyCostUSD(res.data.monthlyCostUSD);
      setTotalTokens(res.data.totalTokens);
      if (res.data.agent) {
        setEditInstructions(res.data.agent.custom_instructions || '');
      }
    } catch (err) {
      console.error('Failed to fetch AI Agent data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentData();
  }, []);

  // Poll status while agent is in 'crawling' state
  useEffect(() => {
    let interval;
    if (agent && agent.status === 'crawling') {
      interval = setInterval(() => {
        fetchAgentData();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [agent]);

  // Handle AI Agent Creation
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Please enter an Agent Name.');
      return;
    }

    if (trainingType === 'website' && !formData.website_url.trim()) {
      toast.error('Please enter your Website URL.');
      return;
    }

    if (trainingType === 'custom' && (!formData.custom_knowledge || formData.custom_knowledge.trim().length < 10)) {
      toast.error('Please enter your custom business details or FAQs in the knowledge box.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        training_type: trainingType,
      };
      const res = await api.post('/api/ai-agent/create', payload);
      toast.success(res.data.message || 'AI Agent created successfully!');
      setAgent(res.data.agent);
      fetchAgentData();
    } catch (err) {
      console.error('Create agent error:', err);
      toast.error(err.response?.data?.error || 'Failed to create AI Agent.');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleStatus = async () => {
    if (!agent) return;
    try {
      const res = await api.patch(`/api/ai-agent/${agent.id}/toggle`);
      setAgent(res.data.agent);
      toast.success(res.data.message);
    } catch (err) {
      toast.error('Failed to update agent status.');
    }
  };

  // Retrain / Re-crawl
  const handleRetrain = async () => {
    if (!agent) return;
    setRetraining(true);
    try {
      await api.post(`/api/ai-agent/${agent.id}/retrain`);
      toast.success('Website re-crawling started in background!');
      fetchAgentData();
    } catch (err) {
      toast.error('Failed to initiate re-crawling.');
    } finally {
      setRetraining(false);
    }
  };

  // Save instructions
  const handleSaveInstructions = async () => {
    if (!agent) return;
    setSavingInstructions(true);
    try {
      const res = await api.put(`/api/ai-agent/${agent.id}/instructions`, {
        custom_instructions: editInstructions,
      });
      setAgent(res.data.agent);
      toast.success('Custom instructions saved successfully!');
    } catch (err) {
      toast.error('Failed to save instructions.');
    } finally {
      setSavingInstructions(false);
    }
  };

  // Add extra custom knowledge
  const handleAddExtraKnowledge = async (e) => {
    e.preventDefault();
    if (!extraKnowledgeText.trim() || extraKnowledgeText.trim().length < 5) {
      toast.error('Please enter text to add to the knowledge base.');
      return;
    }

    setAddingKnowledge(true);
    try {
      const res = await api.post(`/api/ai-agent/${agent.id}/add-knowledge`, {
        custom_knowledge: extraKnowledgeText,
        source_label: extraKnowledgeLabel || 'Custom Entry',
      });
      toast.success(res.data.message || 'Custom knowledge added!');
      setExtraKnowledgeText('');
      fetchAgentData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add custom knowledge.');
    } finally {
      setAddingKnowledge(false);
    }
  };

  // Delete Agent
  const handleDeleteAgent = async () => {
    if (!agent) return;
    if (!window.confirm('Are you sure you want to delete this AI Agent? All learned knowledge chunks will be removed.')) {
      return;
    }
    try {
      await api.delete(`/api/ai-agent/${agent.id}`);
      toast.success('AI Agent deleted.');
      setAgent(null);
      fetchAgentData();
    } catch (err) {
      toast.error('Failed to delete AI Agent.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-orange" />
      </div>
    );
  }

  // Locked View for Starter / Free Trial
  if (isLocked) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-brand-orange" />
            AI Agent Assistant
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Automatically answer customer WhatsApp inquiries 24/7 using OpenAI trained on your website or custom business text.
          </p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-8 text-center max-w-3xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 text-brand-orange shadow-md border border-orange-100">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">AI Agent Feature is Locked</h2>
          <p className="text-gray-600 mt-2 max-w-lg mx-auto text-sm leading-relaxed">
            Your current plan (<span className="font-semibold capitalize text-brand-blue">{plan}</span>) does not include the AI WhatsApp Assistant. Upgrade to <b>Growth</b> or <b>Pro</b> to launch your custom AI agent.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-xl mx-auto text-left">
            <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs">
              <div className="font-bold text-gray-900 text-lg">Growth Plan</div>
              <div className="text-brand-orange font-semibold">500 AI Replies / mo</div>
              <p className="text-xs text-gray-500 mt-1">Ideal for growing businesses needing 24/7 automated support.</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-orange-200 shadow-xs">
              <div className="font-bold text-gray-900 text-lg">Pro Plan</div>
              <div className="text-brand-orange font-semibold">2,000 AI Replies / mo</div>
              <p className="text-xs text-gray-500 mt-1">For high volume sales & customer service teams.</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/dashboard/wallet')}
            className="mt-8 px-8 py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white font-semibold rounded-xl shadow-md hover:opacity-95 transition-all transform hover:-translate-y-0.5"
          >
            Upgrade Plan Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bot className="w-7 h-7 text-brand-orange" />
            AI Agent Assistant
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Train an intelligent chatbot using your Website or Custom Business Knowledge to reply to WhatsApp customers automatically.
          </p>
        </div>

        {agent && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-xs ${
                agent.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              <Power className="w-4 h-4" />
              {agent.status === 'active' ? 'Active (Replying 24/7)' : 'Paused'}
            </button>

            {agent.website_url && !agent.website_url.includes('Custom') && (
              <button
                onClick={handleRetrain}
                disabled={retraining || agent.status === 'crawling'}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 shadow-xs transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${retraining || agent.status === 'crawling' ? 'animate-spin' : ''}`} />
                {agent.status === 'crawling' ? 'Learning Website...' : 'Re-Crawl Website'}
              </button>
            )}

            <button
              onClick={handleDeleteAgent}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"
              title="Delete AI Agent"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* NO AGENT YET — CREATE AGENT FORM */}
      {!agent ? (
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm max-w-3xl">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
            <div className="p-2 bg-orange-100 text-brand-orange rounded-lg">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Setup Your AI WhatsApp Agent</h2>
              <p className="text-xs text-gray-500">Choose how you want to train your AI Assistant.</p>
            </div>
          </div>

          {/* Training Mode Selector */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              type="button"
              onClick={() => setTrainingType('website')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                trainingType === 'website'
                  ? 'border-brand-orange bg-orange-50/60 ring-2 ring-brand-orange/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${trainingType === 'website' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600'}`}>
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">🌐 Website Crawler</div>
                <div className="text-xs text-gray-500 mt-0.5">Scan your website & internal pages automatically.</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTrainingType('custom')}
              className={`p-4 rounded-xl border text-left flex items-start gap-3 transition-all ${
                trainingType === 'custom'
                  ? 'border-brand-orange bg-orange-50/60 ring-2 ring-brand-orange/20'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg ${trainingType === 'custom' ? 'bg-brand-orange text-white' : 'bg-gray-100 text-gray-600'}`}>
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">📝 Custom Text / Q&A</div>
                <div className="text-xs text-gray-500 mt-0.5">Paste product info, pricing, policies, or FAQs directly.</div>
              </div>
            </button>
          </div>

          <form onSubmit={handleCreateAgent} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Agent Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Support Bot, Sales Assistant"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none text-sm"
                required
              />
            </div>

            {trainingType === 'website' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Website URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Globe className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    value={formData.website_url}
                    onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                    placeholder="https://yourdomain.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none text-sm"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Our crawler will scan up to 20 internal pages of your website automatically.</p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Custom Business Knowledge & FAQs <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={6}
                  value={formData.custom_knowledge}
                  onChange={(e) => setFormData({ ...formData, custom_knowledge: e.target.value })}
                  placeholder={`Paste your business details, pricing, product list, or Q&A pairs here...\n\nExample:\n- Store Timings: 10 AM to 8 PM (Mon-Sat)\n- Return Policy: 7 days hassle-free return\n- Q: What are your shipping rates?\n  A: Free delivery on orders above ₹499.`}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none text-sm font-mono text-xs"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">The AI will convert your custom text into vector embeddings and answer customer WhatsApp queries from this knowledge!</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Business Industry / Type</label>
              <select
                value={formData.business_type}
                onChange={(e) => setFormData({ ...formData, business_type: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none text-sm bg-white"
              >
                <option value="E-commerce">E-commerce / Retail</option>
                <option value="Healthcare">Healthcare & Wellness</option>
                <option value="Education">Education & Courses</option>
                <option value="Real Estate">Real Estate</option>
                <option value="Finance">Finance & Banking</option>
                <option value="SaaS">SaaS & Software</option>
                <option value="Services">Professional Services</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Custom System Prompt / Instructions</label>
              <textarea
                rows={3}
                value={formData.custom_instructions}
                onChange={(e) => setFormData({ ...formData, custom_instructions: e.target.value })}
                placeholder="Specify tone, discounts, business hours, or guidelines..."
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-brand-orange to-orange-600 text-white font-semibold rounded-xl shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Training AI Agent...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create & Train AI Agent
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        /* ACTIVE / EXISTING AGENT DASHBOARD */
        <div className="space-y-6">
          {/* Status Banner */}
          {agent.status === 'crawling' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-4 text-amber-800 animate-pulse">
              <RefreshCw className="w-6 h-6 animate-spin text-amber-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">Website Crawling & Training in Progress...</div>
                <div className="text-xs text-amber-700">We are scanning {agent.website_url} and generating AI knowledge vectors. This page will auto-update once ready!</div>
              </div>
            </div>
          )}

          {agent.status === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4 text-red-800">
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
              <div>
                <div className="font-bold text-sm">Crawling Encountered an Issue</div>
                <div className="text-xs text-red-700">Unable to reach or parse {agent.website_url}. Click "Re-Crawl Website" above to try again.</div>
              </div>
            </div>
          )}

          {/* Key Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Metric 1: Monthly Usage */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monthly AI Replies</span>
                <div className="p-2 bg-blue-50 text-brand-blue rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {monthlyUsage} <span className="text-sm font-normal text-gray-400">/ {quotaLimit}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                <div
                  className="bg-brand-orange h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((monthlyUsage / quotaLimit) * 100))}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Plan: <b className="capitalize text-gray-700">{plan}</b></span>
                <span>{quotaLimit - monthlyUsage} remaining</span>
              </div>
            </div>

            {/* Metric 2: Pages / Sections Learned */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Knowledge Learned</span>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">
                {agent.pages_crawled} <span className="text-sm font-normal text-gray-400">sections</span>
              </div>
              <p className="text-xs text-gray-500 mt-3 truncate">
                Source: {agent.website_url}
              </p>
            </div>

            {/* Metric 3: Cost Estimation */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">OpenAI Cost (Est.)</span>
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-extrabold text-gray-900">${monthlyCostUSD}</div>
              <p className="text-xs text-gray-500 mt-3">
                ~{totalTokens.toLocaleString()} total tokens processed this month.
              </p>
            </div>
          </div>

          {/* Add Extra Custom Knowledge Section */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-4">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <PlusCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Add Extra Custom Knowledge / FAQs</h2>
                <p className="text-xs text-gray-500">Paste new business info, product details, or Q&A pairs anytime to expand your AI's knowledge.</p>
              </div>
            </div>

            <form onSubmit={handleAddExtraKnowledge} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Source / Topic Label</label>
                <input
                  type="text"
                  value={extraKnowledgeLabel}
                  onChange={(e) => setExtraKnowledgeLabel(e.target.value)}
                  placeholder="e.g. Return Policy, Pricing FAQ, Store Location"
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Knowledge Text / Q&A Content</label>
                <textarea
                  rows={4}
                  value={extraKnowledgeText}
                  onChange={(e) => setExtraKnowledgeText(e.target.value)}
                  placeholder="Paste details or Q&A here..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl outline-none text-xs font-mono"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={addingKnowledge}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-semibold rounded-xl text-xs hover:bg-emerald-700 transition-all disabled:opacity-50"
                >
                  {addingKnowledge ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
                  Add to Knowledge Base
                </button>
              </div>
            </form>
          </div>

          {/* Agent Configuration & Custom Instructions Card */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-brand-orange rounded-lg">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{agent.name}</h2>
                  <p className="text-xs text-gray-500">{agent.business_type} • Source: {agent.website_url}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                agent.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {agent.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Custom System Instructions & Guidelines
                </label>
                <textarea
                  rows={5}
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="e.g. Maintain a polite tone, offer promo code SAVE10 for new orders, transfer to human if customer requests human representative..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-orange focus:border-brand-orange outline-none text-sm"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveInstructions}
                  disabled={savingInstructions}
                  className="flex items-center gap-2 px-6 py-2.5 bg-brand-orange text-white font-semibold rounded-xl shadow-xs hover:bg-orange-600 transition-all text-sm disabled:opacity-50"
                >
                  {savingInstructions ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Instructions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
