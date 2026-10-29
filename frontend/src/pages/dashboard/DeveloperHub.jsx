import { useState, useEffect } from 'react'
import {
  Code,
  Key,
  Webhook,
  BookOpen,
  Plus,
  Trash2,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  Terminal,
  Layers,
  Send,
  X
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function DeveloperHub() {
  const [activeTab, setActiveTab] = useState('keys') // 'keys', 'webhooks', 'docs'
  
  // API Keys state
  const [apiKeys, setApiKeys] = useState([])
  const [loadingKeys, setLoadingKeys] = useState(true)
  const [showKeyModal, setShowKeyModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [generatedKey, setGeneratedKey] = useState(null)
  const [generating, setGenerating] = useState(false)

  // Webhooks state
  const [webhooks, setWebhooks] = useState([])
  const [loadingWebhooks, setLoadingWebhooks] = useState(true)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [webhookData, setWebhookData] = useState({
    name: '',
    target_url: '',
    events: ['message.received', 'message.sent']
  })
  const [addingWebhook, setAddingWebhook] = useState(false)

  // Documentation state
  const [docLang, setDocLang] = useState('curl') // 'curl', 'nodejs', 'python', 'php', 'js'
  const [copiedKey, setCopiedKey] = useState(false)

  useEffect(() => {
    fetchApiKeys()
    fetchWebhooks()
  }, [])

  const fetchApiKeys = async () => {
    setLoadingKeys(true)
    try {
      const res = await api.get('/api/developer/keys')
      setApiKeys(res.data || [])
    } catch (err) {
      console.error('Error fetching API keys:', err)
    } finally {
      setLoadingKeys(false)
    }
  }

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true)
    try {
      const res = await api.get('/api/developer/webhooks')
      setWebhooks(res.data || [])
    } catch (err) {
      console.error('Error fetching webhooks:', err)
    } finally {
      setLoadingWebhooks(false)
    }
  }

  const handleGenerateKey = async (e) => {
    e.preventDefault()
    if (!newKeyName.trim()) {
      return toast.error('API key name is required (e.g. Shopify Store)')
    }

    setGenerating(true)
    try {
      const res = await api.post('/api/developer/keys', { name: newKeyName.trim() })
      setGeneratedKey(res.data.apiKey)
      toast.success('🎉 API Key generated successfully!')
      setNewKeyName('')
      fetchApiKeys()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate API Key.')
    } finally {
      setGenerating(false)
    }
  }

  const handleRevokeKey = async (id, name) => {
    if (!confirm(`Are you sure you want to revoke API Key "${name}"? External apps using this key will lose access.`)) {
      return
    }
    try {
      await api.delete(`/api/developer/keys/${id}`)
      toast.success('API Key revoked.')
      setApiKeys(prev => prev.filter(k => k.id !== id))
    } catch (err) {
      toast.error('Failed to revoke API Key.')
    }
  }

  const handleAddWebhook = async (e) => {
    e.preventDefault()
    if (!webhookData.target_url.trim()) {
      return toast.error('Target URL is required.')
    }

    setAddingWebhook(true)
    try {
      await api.post('/api/developer/webhooks', webhookData)
      toast.success('🎉 Webhook endpoint created!')
      setShowWebhookModal(false)
      setWebhookData({ name: '', target_url: '', events: ['message.received', 'message.sent'] })
      fetchWebhooks()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add webhook.')
    } finally {
      setAddingWebhook(false)
    }
  }

  const handleDeleteWebhook = async (id) => {
    if (!confirm('Delete this webhook endpoint?')) return
    try {
      await api.delete(`/api/developer/webhooks/${id}`)
      toast.success('Webhook endpoint removed.')
      setWebhooks(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      toast.error('Failed to remove webhook.')
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedKey(false), 2000)
  }

  const activeKeySample = apiKeys.length > 0 && apiKeys[0].key ? apiKeys[0].key : 'gw_live_YOUR_API_KEY'
  const apiBaseUrl = window.location.origin.replace('5173', '5000')

  // Code Snippets Generator
  const getCodeSnippet = (lang) => {
    switch (lang) {
      case 'curl':
        return `curl -X POST "${apiBaseUrl}/api/v1/messages/send" \\
  -H "x-api-key: ${activeKeySample}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "order_confirmation",
      "language": { "code": "en_US" },
      "components": [
        {
          "type": "body",
          "parameters": [
            { "type": "text", "text": "John Doe" },
            { "type": "text", "text": "#ORD-8921" }
          ]
        }
      ]
    },
    "messageCategory": "utility"
  }'`
      case 'nodejs':
        return `const axios = require('axios');

async function sendWhatsAppMessage() {
  try {
    const response = await axios.post('${apiBaseUrl}/api/v1/messages/send', {
      to: '919876543210',
      type: 'template',
      template: {
        name: 'order_confirmation',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'John Doe' },
              { type: 'text', text: '#ORD-8921' }
            ]
          }
        ]
      },
      messageCategory: 'utility'
    }, {
      headers: {
        'x-api-key': '${activeKeySample}',
        'Content-Type': 'application/json'
      }
    });

    console.log('Message sent:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

sendWhatsAppMessage();`
      case 'python':
        return `import requests

url = "${apiBaseUrl}/api/v1/messages/send"
headers = {
    "x-api-key": "${activeKeySample}",
    "Content-Type": "application/json"
}
payload = {
    "to": "919876543210",
    "type": "template",
    "template": {
        "name": "order_confirmation",
        "language": {"code": "en_US"},
        "components": [
            {
                "type": "body",
                "parameters": [
                    {"type": "text", "text": "John Doe"},
                    {"type": "text", "text": "#ORD-8921"}
                ]
            }
        ]
    },
    "messageCategory": "utility"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`
      case 'php':
        return `<?php

$ch = curl_init('${apiBaseUrl}/api/v1/messages/send');

$payload = json_encode([
    'to' => '919876543210',
    'type' => 'template',
    'template' => [
        'name' => 'order_confirmation',
        'language' => ['code' => 'en_US'],
        'components' => [
            [
                'type' => 'body',
                'parameters' => [
                    ['type' => 'text', 'text' => 'John Doe'],
                    ['type' => 'text', 'text' => '#ORD-8921']
                ]
            ]
        ]
    ],
    'messageCategory' => 'utility'
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'x-api-key: ${activeKeySample}',
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`
      case 'js':
        return `fetch('${apiBaseUrl}/api/v1/messages/send', {
  method: 'POST',
  headers: {
    'x-api-key': '${activeKeySample}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '919876543210',
    type: 'template',
    template: {
      name: 'order_confirmation',
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'John Doe' },
            { type: 'text', text: '#ORD-8921' }
          ]
        }
      ]
    },
    messageCategory: 'utility'
  })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));`
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <Code size={26} className="text-brand-blue" /> Developer Hub & API Credentials
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Manage API Keys, Webhook integrations (Shopify, Zapier, CRMs), and view API documentation.
          </p>
        </div>
      </div>

      {/* 3-Card Organized Tabs Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            id: 'keys',
            label: 'API Keys',
            sub: 'Access & secret project keys',
            icon: Key,
            color: 'text-brand-orange',
            activeStyle: 'bg-orange-50 border-brand-orange shadow-xs ring-2 ring-brand-orange/20',
            badge: `${apiKeys.length} Active`
          },
          {
            id: 'webhooks',
            label: 'Webhooks',
            sub: 'Real-time event endpoints',
            icon: Webhook,
            color: 'text-brand-purple',
            activeStyle: 'bg-purple-50 border-brand-purple shadow-xs ring-2 ring-brand-purple/20',
            badge: `${webhooks.length} Active`
          },
          {
            id: 'docs',
            label: 'API Documentation',
            sub: 'SDKs, cURL & code snippets',
            icon: BookOpen,
            color: 'text-brand-blue',
            activeStyle: 'bg-blue-50 border-brand-blue shadow-xs ring-2 ring-brand-blue/20',
            badge: 'V1 REST'
          },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`p-3.5 sm:p-4 rounded-2xl border text-left flex items-start justify-between transition-all ${
              activeTab === tab.id
                ? tab.activeStyle
                : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs hover:shadow-xs'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 sm:p-2.5 rounded-xl ${activeTab === tab.id ? 'bg-white shadow-2xs' : 'bg-gray-100'} ${tab.color}`}>
                <tab.icon size={20} />
              </div>
              <div>
                <div className="font-bold text-sm text-gray-900">{tab.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{tab.sub}</div>
              </div>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              activeTab === tab.id ? 'bg-white text-gray-700 shadow-2xs' : 'bg-gray-100 text-gray-500'
            }`}>
              {tab.badge}
            </span>
          </button>
        ))}
      </div>

      {/* TAB 1: API KEYS */}
      {activeTab === 'keys' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                  <ShieldCheck size={20} className="text-brand-orange" /> API Project Keys
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  API keys allow your website, Shopify store, or CRM to send WhatsApp messages through Growthwapi.
                </p>
              </div>
              <button
                onClick={() => {
                  setGeneratedKey(null)
                  setShowKeyModal(true)
                }}
                className="bg-brand-orange hover:bg-orange-600 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-md shadow-orange-200"
              >
                <Plus size={16} /> Generate New API Key
              </button>
            </div>

            {loadingKeys ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                No active API keys found. Click <strong>"Generate New API Key"</strong> to connect your external apps.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Key Name</th>
                      <th className="px-4 py-3 text-left">API Key Token</th>
                      <th className="px-4 py-3 text-left">Created</th>
                      <th className="px-4 py-3 text-left">Last Used</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {apiKeys.map(k => (
                      <tr key={k.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-brand-dark">{k.name}</td>
                        <td className="px-4 py-3 font-mono text-xs text-brand-blue font-bold">
                          {k.masked_key || `${(k.key || '').substring(0, 12)}...`}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {new Date(k.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleRevokeKey(k.id, k.name)}
                            title="Revoke Key"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WEBHOOKS */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                  <Webhook size={20} className="text-brand-purple" /> Outgoing Webhooks
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive instant real-time HTTP callbacks when incoming messages arrive or templates update.
                </p>
              </div>
              <button
                onClick={() => setShowWebhookModal(true)}
                className="bg-brand-purple hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-md"
              >
                <Plus size={16} /> Add Webhook Endpoint
              </button>
            </div>

            {loadingWebhooks ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-4 border-brand-purple border-t-transparent rounded-full animate-spin" />
              </div>
            ) : webhooks.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">
                No webhook endpoints configured. Click <strong>"Add Webhook Endpoint"</strong> to receive real-time events.
              </div>
            ) : (
              <div className="space-y-3">
                {webhooks.map(w => (
                  <div key={w.id} className="p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-dark text-sm">{w.name}</span>
                        <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      </div>
                      <code className="text-xs font-mono text-brand-blue block mt-1">{w.target_url}</code>
                      <div className="flex gap-1.5 mt-2">
                        {(w.events || []).map(ev => (
                          <span key={ev} className="bg-gray-100 text-gray-600 text-[10px] font-semibold px-2 py-0.5 rounded">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(w.secret)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1"
                      >
                        <Copy size={12} /> Copy Secret
                      </button>
                      <button
                        onClick={() => handleDeleteWebhook(w.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTATION & CODE GENERATOR */}
      {activeTab === 'docs' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
              <Terminal size={20} className="text-brand-blue" /> Public V1 API Reference & Code Generator
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              Use your API Key in the <code className="bg-gray-100 px-1.5 py-0.5 rounded text-brand-blue font-mono font-bold">x-api-key</code> request header to trigger automated WhatsApp messages from any programming language or platform.
            </p>
          </div>

          {/* Quick Guide Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-1">
              <h3 className="font-bold text-brand-blue text-xs uppercase tracking-wide">1. Header Authentication</h3>
              <p className="text-xs text-gray-600">
                Pass <code className="bg-white px-1 font-mono font-bold text-brand-blue">x-api-key: gw_live_...</code> in HTTP request headers.
              </p>
            </div>
            <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-xl space-y-1">
              <h3 className="font-bold text-brand-orange text-xs uppercase tracking-wide">2. Recipient Phone Format</h3>
              <p className="text-xs text-gray-600">
                Format recipient phone numbers with country code (e.g. <code className="bg-white px-1 font-mono font-bold">919876543210</code>).
              </p>
            </div>
            <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-1">
              <h3 className="font-bold text-brand-purple text-xs uppercase tracking-wide">3. E-commerce / Zapier Sync</h3>
              <p className="text-xs text-gray-600">
                Use templates to trigger instant order updates, booking confirmations, and cart reminders.
              </p>
            </div>
          </div>

          {/* Code Snippet Selector */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Select Programming Language / Tool</span>
              <button
                onClick={() => copyToClipboard(getCodeSnippet(docLang))}
                className="text-xs bg-brand-blue text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm hover:bg-blue-900 transition-colors"
              >
                {copiedKey ? <Check size={14} /> : <Copy size={14} />} Copy Code
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-gray-200 pb-2 mb-4 overflow-x-auto">
              {[
                { id: 'curl', name: 'cURL' },
                { id: 'nodejs', name: 'Node.js (Axios)' },
                { id: 'python', name: 'Python (Requests)' },
                { id: 'php', name: 'PHP' },
                { id: 'js', name: 'JavaScript (Fetch)' },
              ].map(l => (
                <button
                  key={l.id}
                  onClick={() => setDocLang(l.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    docLang === l.id
                      ? 'bg-brand-blue text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {l.name}
                </button>
              ))}
            </div>

            <pre className="bg-slate-900 text-slate-100 p-5 rounded-xl font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
              <code>{getCodeSnippet(docLang)}</code>
            </pre>
          </div>
        </div>
      )}

      {/* GENERATE API KEY MODAL */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <Key size={18} className="text-brand-orange" /> Generate New API Key
              </h2>
              <button onClick={() => setShowKeyModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-2">
                  <span className="text-xs font-bold text-green-700 block">🎉 API Key Created Successfully!</span>
                  <p className="text-xs text-gray-600">Copy and store this API key in a secure location. It will not be shown again.</p>
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedKey}
                      className="w-full font-mono text-xs font-bold bg-white p-2.5 border border-green-300 rounded-lg text-brand-dark"
                    />
                    <button
                      onClick={() => copyToClipboard(generatedKey)}
                      className="bg-brand-blue text-white px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="w-full bg-brand-blue text-white py-2.5 rounded-xl font-bold text-sm"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateKey} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    API Key Name / Integration Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                    placeholder="e.g. Shopify Store Integration"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="px-5 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-600 disabled:opacity-50"
                  >
                    {generating ? 'Generating...' : 'Generate API Key'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD WEBHOOK MODAL */}
      {showWebhookModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h2 className="text-lg font-bold text-brand-dark flex items-center gap-2">
                <Webhook size={18} className="text-brand-purple" /> Add Webhook Endpoint
              </h2>
              <button onClick={() => setShowWebhookModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddWebhook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Webhook Name
                </label>
                <input
                  type="text"
                  value={webhookData.name}
                  onChange={e => setWebhookData({ ...webhookData, name: e.target.value })}
                  placeholder="e.g. Shopify Order Sync Webhook"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Target URL (HTTPS)
                </label>
                <input
                  type="url"
                  required
                  value={webhookData.target_url}
                  onChange={e => setWebhookData({ ...webhookData, target_url: e.target.value })}
                  placeholder="https://my-store.com/api/growthwapi-webhook"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-brand-blue"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowWebhookModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingWebhook}
                  className="px-5 py-2 bg-brand-purple text-white rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50"
                >
                  {addingWebhook ? 'Creating...' : 'Create Endpoint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
