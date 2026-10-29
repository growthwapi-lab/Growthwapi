import { useState, useEffect } from 'react'
import {
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  XCircle,
  PauseCircle,
  Trash2,
  Copy,
  Eye,
  AlertTriangle,
  Info,
  Send,
  X,
  Smartphone
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Templates() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingTemplate, setViewingTemplate] = useState(null)
  const [activeTab, setActiveTab] = useState('ALL')

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: 'MARKETING',
    language: 'en_US',
    header_type: 'none',
    header_content: '',
    body_text: '',
    footer_text: '',
    buttons: []
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/whatsapp/templates')
      setTemplates(res.data || [])
    } catch (err) {
      console.error('Error fetching templates:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNow = async () => {
    setSyncing(true)
    try {
      const res = await api.post('/api/whatsapp/templates/sync')
      toast.success(`🎉 Synced ${res.data?.count || 0} template(s) from your WABA!`)
      fetchTemplates()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to sync templates from Meta WABA.')
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async (templateName) => {
    if (!confirm(`Are you sure you want to delete template "${templateName}"? This will also remove it from Meta.`)) {
      return
    }
    try {
      await api.delete(`/api/whatsapp/templates/${templateName}`)
      toast.success(`Template "${templateName}" deleted successfully!`)
      setTemplates(prev => prev.filter(t => t.name !== templateName))
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete template.')
    }
  }

  const handleDuplicate = (template) => {
    setFormData({
      name: `${template.name}_copy`,
      category: template.category || 'MARKETING',
      language: template.language || 'en_US',
      header_type: template.header_type || 'none',
      header_content: template.header_content || '',
      body_text: template.body_text || '',
      footer_text: template.footer_text || '',
      buttons: template.buttons || []
    })
    setShowCreateModal(true)
  }

  // Auto-format name to lowercase_with_underscores
  const handleNameChange = (e) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_')
    setFormData({ ...formData, name: val })
  }

  // Insert Variable {{1}}, {{2}}, etc. into Body Text
  const insertVariable = () => {
    const matches = formData.body_text.match(/\{\{(\d+)\}\}/g) || []
    const nextVarNum = matches.length + 1
    setFormData({
      ...formData,
      body_text: formData.body_text + ` {{${nextVarNum}}}`
    })
  }

  // Add Button
  const addButton = (type) => {
    if (formData.buttons.length >= 3) {
      return toast.error('Maximum 3 buttons allowed per template.')
    }
    const newBtn =
      type === 'QUICK_REPLY'
        ? { type: 'QUICK_REPLY', text: '' }
        : type === 'URL'
        ? { type: 'URL', text: '', url: '' }
        : { type: 'PHONE_NUMBER', text: '', phone_number: '' }

    setFormData({ ...formData, buttons: [...formData.buttons, newBtn] })
  }

  const removeButton = (idx) => {
    setFormData({
      ...formData,
      buttons: formData.buttons.filter((_, i) => i !== idx)
    })
  }

  const updateButton = (idx, field, val) => {
    const updated = [...formData.buttons]
    updated[idx][field] = val
    setFormData({ ...formData, buttons: updated })
  }

  // Validation warnings
  const isAllCaps = formData.body_text.length > 10 && formData.body_text === formData.body_text.toUpperCase()
  const hasTooManyExclamations = (formData.body_text.match(/!/g) || []).length > 3
  const promoKeywords = ['discount', 'offer', 'sale', 'buy now', 'promo', 'limited time', 'cashback', 'coupon']
  const looksPromotional = promoKeywords.some(kw => formData.body_text.toLowerCase().includes(kw))
  const showCategoryWarning = formData.category === 'UTILITY' && looksPromotional

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      return toast.error('Template name is required.')
    }
    if (!formData.body_text.trim()) {
      return toast.error('Body text is required.')
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/whatsapp/templates', formData)
      toast.success(res.data.message || '🎉 Template submitted to Meta!')
      setShowCreateModal(false)
      setFormData({
        name: '',
        category: 'MARKETING',
        language: 'en_US',
        header_type: 'none',
        header_content: '',
        body_text: '',
        footer_text: '',
        buttons: []
      })
      fetchTemplates()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit template to Meta.')
    } finally {
      setSubmitting(false)
    }
  }

  // Helper to render formatted live preview text
  const renderPreviewText = (text) => {
    if (!text) return ''
    return text.replace(/\{\{(\d+)\}\}/g, (_, num) => `[Sample Var ${num}]`)
  }

  const filteredTemplates = templates.filter(t => {
    if (activeTab === 'ALL') return true
    return t.status === activeTab
  })

  const StatusBadge = ({ status, reason }) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <CheckCircle2 size={12} /> Approved
          </span>
        )
      case 'PENDING':
        return (
          <span className="bg-amber-100 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <Clock size={12} /> Pending Review
          </span>
        )
      case 'REJECTED':
        return (
          <span
            title={reason || 'Rejected by Meta'}
            className="bg-red-100 text-red-700 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max cursor-help"
          >
            <XCircle size={12} /> Rejected
          </span>
        )
      case 'PAUSED':
        return (
          <span className="bg-gray-100 text-gray-700 border border-gray-200 px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max">
            <PauseCircle size={12} /> Paused
          </span>
        )
      default:
        return (
          <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-medium uppercase">
            {status || 'PENDING'}
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">WhatsApp Message Templates</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create, manage, and sync official Meta-approved templates for broadcasting.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin text-brand-blue' : 'text-gray-500'} />
            {syncing ? 'Syncing WABA...' : 'Sync Now'}
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-brand-orange hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-md shadow-orange-200"
          >
            <Plus size={18} /> Create Template
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3 overflow-x-auto">
        {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'PAUSED'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-brand-blue text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab} {tab === 'ALL' ? `(${templates.length})` : `(${templates.filter(t => t.status === tab).length})`}
          </button>
        ))}
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="flex items-center justify-center h-64 bg-white rounded-2xl border border-gray-200">
          <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-2xl flex items-center justify-center mb-4">
            <FileText size={32} />
          </div>
          <h3 className="font-bold text-brand-dark text-lg mb-1">No Message Templates Found</h3>
          <p className="text-gray-500 text-sm max-w-md mb-6">
            Click <strong>"Sync Now"</strong> to import existing templates from your Meta WABA account, or click <strong>"Create Template"</strong> to submit a new one for approval.
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleSyncNow}
              className="bg-white border border-gray-300 text-brand-blue font-bold px-4 py-2 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Sync from WABA
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand-orange text-white font-bold px-4 py-2 rounded-xl text-sm hover:bg-orange-600 transition-colors"
            >
              Create New Template
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => (
            <div
              key={template.id || template.name}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-mono font-bold text-brand-dark text-base break-all">{template.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        template.category === 'MARKETING'
                          ? 'bg-orange-100 text-orange-700'
                          : template.category === 'UTILITY'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {template.category}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {template.language || 'en_US'}
                      </span>
                    </div>
                  </div>
                  <StatusBadge status={template.status} reason={template.rejection_reason} />
                </div>

                {template.rejection_reason && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 mb-3 flex items-start gap-1.5">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span><strong>Rejection Reason:</strong> {template.rejection_reason}</span>
                  </div>
                )}

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-xs text-gray-700 mb-4 font-sans space-y-1">
                  {template.header_content && (
                    <p className="font-bold text-brand-dark text-xs mb-1">Header: {template.header_content}</p>
                  )}
                  <p className="line-clamp-4 whitespace-pre-wrap">{template.body_text}</p>
                  {template.footer_text && (
                    <p className="text-[10px] text-gray-400 mt-1 italic">{template.footer_text}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-100 text-xs">
                <span className="text-gray-400">
                  {template.created_at ? new Date(template.created_at).toLocaleDateString() : 'Active on WABA'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewingTemplate(template)}
                    title="View Full Preview"
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleDuplicate(template)}
                    title="Duplicate as New Template"
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-brand-blue transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.name)}
                    title="Delete Template"
                    className="p-1.5 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE TEMPLATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col my-8">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
                <Plus size={20} className="text-brand-orange" /> Create & Submit Template to Meta
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 grid lg:grid-cols-2 gap-6 flex-1">
              {/* Form Side */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleNameChange}
                    placeholder="e.g. order_update_1"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none font-mono text-sm"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Lowercase letters, numbers, and underscores only.</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={e => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm font-semibold"
                    >
                      <option value="MARKETING">Marketing</option>
                      <option value="UTILITY">Utility</option>
                      <option value="AUTHENTICATION">Authentication</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                      Language
                    </label>
                    <select
                      value={formData.language}
                      onChange={e => setFormData({ ...formData, language: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                    >
                      <option value="en_US">English (US)</option>
                      <option value="en">English (UK)</option>
                      <option value="hi">Hindi</option>
                      <option value="es">Spanish</option>
                      <option value="pt_BR">Portuguese (BR)</option>
                    </select>
                  </div>
                </div>

                {/* Header Option */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Header (Optional)
                  </label>
                  <div className="grid grid-cols-5 gap-2 mb-2">
                    {['none', 'text', 'image', 'video', 'document'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({ ...formData, header_type: type, header_content: '' })}
                        className={`py-1.5 rounded-lg text-xs font-bold border capitalize transition-colors ${
                          formData.header_type === type
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {formData.header_type === 'text' && (
                    <input
                      type="text"
                      value={formData.header_content}
                      onChange={e => setFormData({ ...formData, header_content: e.target.value })}
                      placeholder="Header text (e.g. Welcome {{1}})"
                      className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"
                    />
                  )}

                  {['image', 'video', 'document'].includes(formData.header_type) && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                      <label className="block font-bold text-gray-700 capitalize">
                        Attach Header {formData.header_type} (File Upload or Media URL)
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="file"
                          accept={
                            formData.header_type === 'image'
                              ? 'image/*'
                              : formData.header_type === 'video'
                              ? 'video/*'
                              : '.pdf,.doc,.docx,.txt'
                          }
                          onChange={e => {
                            const file = e.target.files[0]
                            if (file) {
                              const reader = new FileReader()
                              reader.onload = (event) => {
                                setFormData({ ...formData, header_content: event.target.result })
                              }
                              reader.readAsDataURL(file)
                            }
                          }}
                          className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-blue file:text-white hover:file:bg-blue-900"
                        />
                        <span className="text-gray-400 self-center text-xs">OR</span>
                        <input
                          type="url"
                          value={formData.header_content.startsWith('data:') ? '' : formData.header_content}
                          onChange={e => setFormData({ ...formData, header_content: e.target.value })}
                          placeholder={`Paste ${formData.header_type} URL (https://...)`}
                          className="flex-1 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400">
                        Upload a sample {formData.header_type} file or enter a public URL for Meta approval review and preview.
                      </p>
                    </div>
                  )}
                </div>

                {/* Body Text */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Body Text <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={insertVariable}
                      className="text-xs text-brand-blue hover:underline font-bold"
                    >
                      + Insert Variable
                    </button>
                  </div>
                  <textarea
                    required
                    rows={5}
                    value={formData.body_text}
                    onChange={e => setFormData({ ...formData, body_text: e.target.value })}
                    placeholder="Hello {{1}}, your order {{2}} has been confirmed!"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm resize-none"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Use `&#123;&#123;1&#125;&#125;`, `&#123;&#123;2&#125;&#125;` for dynamic variables.</p>
                </div>

                {/* Spam & Content Warnings */}
                {isAllCaps && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>Avoid using ALL CAPS as Meta may flag it as spam.</span>
                  </div>
                )}
                {hasTooManyExclamations && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>Avoid excessive exclamation marks (!!!) to prevent rejection.</span>
                  </div>
                )}
                {showCategoryWarning && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={14} className="flex-shrink-0" />
                    <span>Promotional content detected. Meta may reject Utility templates with promotional text. Consider selecting MARKETING.</span>
                  </div>
                )}

                {/* Footer */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
                    Footer (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.footer_text}
                    onChange={e => setFormData({ ...formData, footer_text: e.target.value })}
                    placeholder="e.g. Reply STOP to unsubscribe"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm"
                  />
                </div>

                {/* Buttons */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide">
                      Buttons (Max 3)
                    </label>
                    {formData.buttons.length < 3 && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => addButton('QUICK_REPLY')}
                          className="text-[11px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold"
                        >
                          + Quick Reply
                        </button>
                        <button
                          type="button"
                          onClick={() => addButton('URL')}
                          className="text-[11px] bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded font-bold"
                        >
                          + Call to Action (URL)
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    {formData.buttons.map((btn, idx) => (
                      <div key={idx} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-gray-700 uppercase text-[10px]">{btn.type} Button</span>
                          <button
                            type="button"
                            onClick={() => removeButton(idx)}
                            className="text-red-500 font-bold hover:underline text-[11px]"
                          >
                            Remove
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder="Button Text (e.g. Visit Website)"
                          value={btn.text}
                          onChange={e => updateButton(idx, 'text', e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs"
                        />
                        {btn.type === 'URL' && (
                          <input
                            type="url"
                            placeholder="URL (e.g. https://example.com/deal)"
                            value={btn.url}
                            onChange={e => updateButton(idx, 'url', e.target.value)}
                            className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-mono"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-brand-orange text-white py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting to Meta...' : 'Submit for Approval'}
                  </button>
                </div>
              </form>

              {/* Live WhatsApp Preview Side */}
              <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-brand-dark text-sm mb-3 flex items-center gap-1.5">
                    <Smartphone size={16} className="text-green-600" /> WhatsApp Live Preview
                  </h3>

                  {/* WhatsApp Message Bubble */}
                  <div className="bg-[#ECE5DD] p-4 rounded-2xl shadow-inner min-h-[300px] flex items-end">
                    <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-md w-full max-w-[90%] space-y-2 text-sm text-gray-800">
                      {/* Header Preview */}
                      {formData.header_type !== 'none' && (
                        <div className="font-bold text-brand-dark pb-1 border-b border-gray-100 overflow-hidden">
                          {formData.header_type === 'text' ? (
                            <span>{renderPreviewText(formData.header_content) || '[Header Text]'}</span>
                          ) : formData.header_type === 'image' && formData.header_content ? (
                            <img
                              src={formData.header_content}
                              alt="Header Preview"
                              className="w-full h-36 object-cover rounded-lg shadow-sm"
                              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                          ) : formData.header_type === 'video' && formData.header_content ? (
                            <video
                              src={formData.header_content}
                              controls
                              className="w-full h-36 object-cover rounded-lg shadow-sm bg-black"
                            />
                          ) : (
                            <div className="bg-gray-100 border border-gray-200 h-24 rounded-lg flex flex-col items-center justify-center text-xs text-gray-500 font-bold uppercase gap-1">
                              <span>📷 [{formData.header_type.toUpperCase()} HEADER MEDIA]</span>
                              <span className="text-[10px] text-gray-400 font-normal">Attach file or URL on left</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Body Preview */}
                      <p className="whitespace-pre-wrap leading-relaxed text-sm">
                        {renderPreviewText(formData.body_text) || 'Your message preview will appear here...'}
                      </p>

                      {/* Footer Preview */}
                      {formData.footer_text && (
                        <p className="text-[11px] text-gray-400 italic pt-1">{formData.footer_text}</p>
                      )}

                      <div className="text-[10px] text-gray-400 text-right">12:00 PM</div>

                      {/* Buttons Preview */}
                      {formData.buttons.length > 0 && (
                        <div className="pt-2 border-t border-gray-100 space-y-1.5">
                          {formData.buttons.map((b, i) => (
                            <div
                              key={i}
                              className="w-full text-center py-1.5 bg-gray-50 border border-gray-200 text-brand-blue rounded-xl text-xs font-bold"
                            >
                              {b.text || `[Button ${i + 1}]`}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800">
                  💡 Meta template approval usually takes between 1 minute to a few hours. Click <strong>"Sync Now"</strong> anytime to update approval status.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TEMPLATE PREVIEW MODAL */}
      {viewingTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-mono font-bold text-brand-dark text-lg">{viewingTemplate.name}</h3>
                <span className="text-xs text-gray-500">{viewingTemplate.category} • {viewingTemplate.language}</span>
              </div>
              <button
                onClick={() => setViewingTemplate(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* WhatsApp Bubble View */}
            <div className="bg-[#ECE5DD] p-4 rounded-2xl">
              <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md space-y-2 text-sm text-gray-800">
                {viewingTemplate.header_content && (
                  <div className="font-bold text-brand-dark pb-1 border-b border-gray-100">
                    {viewingTemplate.header_content}
                  </div>
                )}
                <p className="whitespace-pre-wrap">{viewingTemplate.body_text}</p>
                {viewingTemplate.footer_text && (
                  <p className="text-xs text-gray-400 italic pt-1">{viewingTemplate.footer_text}</p>
                )}
                {viewingTemplate.buttons && viewingTemplate.buttons.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    {viewingTemplate.buttons.map((b, i) => (
                      <div key={i} className="text-center py-1.5 bg-gray-50 border border-gray-200 text-brand-blue rounded-xl text-xs font-bold">
                        {b.text || b.type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewingTemplate(null)}
                className="bg-brand-blue text-white px-5 py-2 rounded-xl text-sm font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
