import { useState, useEffect } from 'react'
import {
  Send, Users, FileText, Clock, CheckCircle2, Zap, LayoutTemplate,
  UserCheck, CheckSquare, Square, Search, X, Filter
} from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Broadcast() {
  const [broadcastMode, setBroadcastMode] = useState('template') // 'template' or 'text'
  const [message, setMessage] = useState('')
  const [numbers, setNumbers] = useState('')
  const [msgType, setMsgType] = useState('utility')
  const [campaignName, setCampaignName] = useState('')
  const [loading, setLoading] = useState(false)
  const [broadcastHistory, setBroadcastHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  // Template Broadcast State
  const [approvedTemplates, setApprovedTemplates] = useState([])
  const [selectedTemplate, setSelectedTemplate] = useState(null)
  const [templateVars, setTemplateVars] = useState({})
  const [headerMediaUrl, setHeaderMediaUrl] = useState('')
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Contacts Selection State
  const [contacts, setContacts] = useState([])
  const [showContactPicker, setShowContactPicker] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [selectedTagFilter, setSelectedTagFilter] = useState('ALL')

  useEffect(() => {
    fetchBroadcasts()
    fetchApprovedTemplates()
    fetchContactsList()
  }, [])

  const fetchContactsList = async () => {
    try {
      const res = await api.get('/api/contacts')
      setContacts(res.data || [])
    } catch (err) {
      console.error('Failed to load contacts for broadcast:', err)
    }
  }

  const handleSelectAllContacts = () => {
    if (contacts.length === 0) {
      toast.error('No saved contacts found. Add contacts first!')
      return
    }

    const currentList = numbers.split('\n').map(n => n.trim()).filter(Boolean)
    const existingSet = new Set(currentList)
    const newNumbers = []

    contacts.forEach(c => {
      if (c.phone) {
        let clean = String(c.phone).trim().replace(/[\s\-\(\)\+]/g, '')
        if (clean.length === 10) clean = '91' + clean
        if (!existingSet.has(clean)) {
          newNumbers.push(clean)
          existingSet.add(clean)
        }
      }
    })

    const combined = [...currentList, ...newNumbers].join('\n')
    setNumbers(combined)
    toast.success(`Added ${newNumbers.length} contacts! Total: ${existingSet.size}`)
  }

  const handleToggleSingleContact = (phone) => {
    let clean = String(phone).trim().replace(/[\s\-\(\)\+]/g, '')
    if (clean.length === 10) clean = '91' + clean

    const currentList = numbers.split('\n').map(n => n.trim()).filter(Boolean)
    const idx = currentList.indexOf(clean)

    if (idx !== -1) {
      currentList.splice(idx, 1)
    } else {
      currentList.push(clean)
    }
    setNumbers(currentList.join('\n'))
  }

  const fetchBroadcasts = async () => {
    setLoadingHistory(true)
    try {
      const res = await api.get('/api/whatsapp/broadcasts')
      setBroadcastHistory(res.data || [])
    } catch (err) {
      console.error('Failed to fetch broadcasts history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  const fetchApprovedTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const res = await api.get('/api/whatsapp/templates')
      const all = res.data || []
      const approved = all.filter(t => t.status === 'APPROVED')
      setApprovedTemplates(approved)
      if (approved.length > 0) {
        handleSelectTemplate(approved[0])
      }
    } catch (err) {
      console.error('Failed to fetch approved templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template)
    setHeaderMediaUrl(template.header_content || '')
    setMsgType((template.category || 'utility').toLowerCase())
    
    // Extract variables {{1}}, {{2}} from body text
    const matches = template.body_text?.match(/\{\{(\d+)\}\}/g) || []
    const initialVars = {}
    matches.forEach(m => {
      const num = m.replace(/[\{\}]/g, '')
      initialVars[num] = ''
    })
    setTemplateVars(initialVars)
  }

  // Generate preview text replacing {{1}}, {{2}} with actual filled inputs
  const getRenderedTemplateText = () => {
    if (!selectedTemplate) return ''
    let text = selectedTemplate.body_text || ''
    Object.keys(templateVars).forEach(num => {
      const val = templateVars[num] || `{{${num}}}`
      text = text.replace(new RegExp(`\\{\\{${num}\\}\\}`, 'g'), val)
    })
    return text
  }

  const handleSend = async (e) => {
    e.preventDefault()

    const numberList = numbers
      .split('\n')
      .map(n => n.trim())
      .filter(n => n.length > 0)

    if (numberList.length === 0) {
      toast.error('Please enter at least one phone number.')
      return
    }

    let payload = {
      name: campaignName.trim() || undefined,
      numbers: numberList,
      messageCategory: msgType,
    }

    if (broadcastMode === 'template') {
      if (!selectedTemplate) {
        toast.error('Please select an approved message template.')
        return
      }

      // Check if all variable inputs are filled
      const varKeys = Object.keys(templateVars)
      const missingVar = varKeys.find(k => !templateVars[k].trim())
      if (missingVar) {
        toast.error(`Please fill in value for variable {{${missingVar}}}`)
        return
      }

      // Construct Meta component parameters
      const parameters = varKeys.map(k => ({
        type: 'text',
        text: templateVars[k].trim()
      }))

      const components = parameters.length > 0 ? [{ type: 'body', parameters }] : []

      payload.useTemplate = true
      payload.type = 'template'
      payload.templateName = selectedTemplate.name
      payload.languageCode = selectedTemplate.language || 'en_US'
      payload.components = components
    } else {
      if (!message.trim()) {
        toast.error('Please enter message text.')
        return
      }
      payload.useTemplate = false
      payload.type = 'text'
      payload.text = { body: message }
    }

    setLoading(true)
    try {
      const res = await api.post('/api/whatsapp/broadcast', payload)
      const sentCount = res.data.sentCount || 0
      const failCount = res.data.failedCount || 0
      toast.success(`Broadcast completed! ✅ ${sentCount} delivered${failCount > 0 ? `, ❌ ${failCount} failed` : ''}`)
      
      setMessage('')
      setNumbers('')
      setCampaignName('')
      fetchBroadcasts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Broadcast failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">Broadcast</h1>
        <p className="text-gray-500 mt-1">Send campaigns using official approved templates or free-text messages.</p>
      </div>

      {/* Broadcast Mode Selector */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBroadcastMode('template')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              broadcastMode === 'template'
                ? 'bg-brand-blue text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <LayoutTemplate size={18} /> Use Approved Template (Recommended)
          </button>
          <button
            type="button"
            onClick={() => setBroadcastMode('text')}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 ${
              broadcastMode === 'text'
                ? 'bg-brand-blue text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Send size={18} /> Free-text Broadcast
          </button>
        </div>

        {broadcastMode === 'template' ? (
          <span className="text-xs font-bold bg-green-100 text-green-700 border border-green-200 px-3 py-1.5 rounded-full flex items-center gap-1.5">
            <Zap size={14} /> Bypasses 24-Hour Customer Window
          </span>
        ) : (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            ⚠️ Requires recipient to have messaged in last 24h
          </span>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Compose Form */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-bold text-brand-dark mb-5 flex items-center gap-2">
            <Send size={18} className="text-brand-orange" />
            {broadcastMode === 'template' ? 'Compose Template Broadcast' : 'Compose Free-text Broadcast'}
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name (Optional)</label>
              <input
                type="text"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. Festival Offer Broadcast"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm"
              />
            </div>

            {/* Mode 1: Template Selection */}
            {broadcastMode === 'template' ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-bold text-gray-700">Select Approved Template</label>
                    <Link to="/dashboard/templates" className="text-xs font-bold text-brand-blue hover:underline">
                      Manage Templates →
                    </Link>
                  </div>
                  {loadingTemplates ? (
                    <div className="p-3 text-xs text-gray-400 bg-gray-50 rounded-xl border">Loading templates...</div>
                  ) : approvedTemplates.length === 0 ? (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs text-amber-800">
                      No approved templates found on your account. Please navigate to <strong>Templates</strong> to create or sync approved templates from Meta.
                    </div>
                  ) : (
                    <select
                      value={selectedTemplate?.name || ''}
                      onChange={e => {
                        const found = approvedTemplates.find(t => t.name === e.target.value)
                        if (found) handleSelectTemplate(found)
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm font-mono font-bold"
                    >
                      {approvedTemplates.map(t => (
                        <option key={t.id || t.name} value={t.name}>
                          {t.name} ({t.category})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Header Media Attachment if template has media header */}
                {selectedTemplate && ['image', 'video', 'document'].includes(selectedTemplate.header_type) && (
                  <div className="p-4 bg-orange-50/60 border border-orange-200/80 rounded-xl space-y-2">
                    <label className="block text-xs font-bold text-brand-dark uppercase tracking-wide">
                      Attach Header {selectedTemplate.header_type} (File Upload or Media URL)
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="file"
                        accept={
                          selectedTemplate.header_type === 'image'
                            ? 'image/*'
                            : selectedTemplate.header_type === 'video'
                            ? 'video/*'
                            : '.pdf,.doc,.docx,.txt'
                        }
                        onChange={e => {
                          const file = e.target.files[0]
                          if (file) {
                            const reader = new FileReader()
                            reader.onload = (event) => setHeaderMediaUrl(event.target.result)
                            reader.readAsDataURL(file)
                          }
                        }}
                        className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-orange file:text-white hover:file:bg-orange-600"
                      />
                      <span className="text-gray-400 self-center text-xs">OR</span>
                      <input
                        type="url"
                        value={headerMediaUrl.startsWith('data:') ? '' : headerMediaUrl}
                        onChange={e => setHeaderMediaUrl(e.target.value)}
                        placeholder={`Paste ${selectedTemplate.header_type} URL (https://...)`}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                {/* Template Dynamic Variable Inputs */}
                {selectedTemplate && Object.keys(templateVars).length > 0 && (
                  <div className="p-4 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-3">
                    <h3 className="text-xs font-bold text-brand-blue uppercase tracking-wide">
                      Fill Template Variables
                    </h3>
                    {Object.keys(templateVars).map(num => (
                      <div key={num}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Variable &#123;&#123;{num}&#125;&#125;
                        </label>
                        <input
                          type="text"
                          required
                          value={templateVars[num]}
                          onChange={e => setTemplateVars({ ...templateVars, [num]: e.target.value })}
                          placeholder={`Value for {{${num}}} (e.g. Customer Name)`}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Mode 2: Free-text Input */
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Type</label>
                  <div className="flex gap-3">
                    {['utility', 'marketing'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMsgType(t)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors capitalize ${
                          msgType === t
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white text-gray-600 border-gray-300 hover:border-brand-blue'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Text</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    placeholder="Hello! Special update for our customers..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none resize-none text-sm"
                  />
                  <p className="text-xs text-gray-400 mt-1">{message.length} characters</p>
                </div>
              </>
            )}

            {/* Recipients Section */}
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="block text-sm font-bold text-gray-700">
                  <Users size={15} className="inline mr-1 text-brand-orange" />
                  Recipients (Manual Typing or Select From Contacts)
                </label>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSelectAllContacts}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                    title="Populate all saved contacts into recipients list"
                  >
                    <UserCheck size={13} />
                    <span>Select All Contacts ({contacts.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowContactPicker(true)}
                    className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-brand-blue border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <span>Pick Contacts...</span>
                  </button>

                  {numbers && (
                    <button
                      type="button"
                      onClick={() => setNumbers('')}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-red-600 transition-colors"
                      title="Clear list"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <textarea
                value={numbers}
                onChange={e => setNumbers(e.target.value)}
                rows={5}
                placeholder={`Type numbers manually or click "Select All Contacts" above:\n919876543210\n918765432109`}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none resize-none font-mono text-xs sm:text-sm"
              />

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>
                  <b>{numbers.split('\n').filter(n => n.trim()).length}</b> recipient(s) selected.
                </span>
                <span className="text-[11px] text-gray-400">
                  Include country code (e.g. 919876543210)
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-orange text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-orange-200"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending Broadcast...</>
              ) : (
                <><Send size={18} /> Send Broadcast</>
              )}
            </button>
          </form>
        </div>

        {/* Live Preview & Cost Panel */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="font-bold text-brand-dark mb-5 flex items-center gap-2">
              <FileText size={18} className="text-brand-blue" />
              WhatsApp Message Preview
            </h2>
            <div className="bg-[#ECE5DD] rounded-2xl p-4 min-h-[220px] flex items-end">
              {broadcastMode === 'template' && selectedTemplate ? (
                <div className="bg-white rounded-2xl rounded-tl-none p-4 shadow-md max-w-[90%] space-y-2 text-sm text-gray-800">
                  {selectedTemplate.header_type && selectedTemplate.header_type !== 'none' && (
                    <div className="font-bold text-brand-dark pb-1 border-b border-gray-100 overflow-hidden">
                      {selectedTemplate.header_type === 'text' ? (
                        <span>{selectedTemplate.header_content || '[Header Text]'}</span>
                      ) : selectedTemplate.header_type === 'image' && (headerMediaUrl || selectedTemplate.header_content) ? (
                        <img
                          src={headerMediaUrl || selectedTemplate.header_content}
                          alt="Header Media"
                          className="w-full h-36 object-cover rounded-lg shadow-sm"
                        />
                      ) : selectedTemplate.header_type === 'video' && (headerMediaUrl || selectedTemplate.header_content) ? (
                        <video
                          src={headerMediaUrl || selectedTemplate.header_content}
                          controls
                          className="w-full h-36 object-cover rounded-lg shadow-sm bg-black"
                        />
                      ) : (
                        <div className="bg-gray-100 border border-gray-200 h-20 rounded-lg flex items-center justify-center text-xs text-gray-500 font-bold uppercase">
                          📷 [{selectedTemplate.header_type.toUpperCase()} HEADER]
                        </div>
                      )}
                    </div>
                  )}
                  <p className="whitespace-pre-wrap">{getRenderedTemplateText()}</p>
                  {selectedTemplate.footer_text && (
                    <p className="text-xs text-gray-400 italic pt-1">{selectedTemplate.footer_text}</p>
                  )}
                  {selectedTemplate.buttons && selectedTemplate.buttons.length > 0 && (
                    <div className="pt-2 border-t border-gray-100 space-y-1">
                      {selectedTemplate.buttons.map((b, i) => (
                        <div key={i} className="text-center py-1.5 bg-gray-50 border border-gray-200 text-brand-blue rounded-xl text-xs font-bold">
                          {b.text || b.type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : broadcastMode === 'text' && message ? (
                <div className="bg-white rounded-2xl rounded-tl-none p-3.5 shadow-md max-w-[85%]">
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">{message}</p>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className="text-[10px] text-gray-400">Now</span>
                    <CheckCircle2 size={12} className="text-blue-400" />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full min-h-[200px] text-gray-400 text-sm w-full">
                  Select a template or type message to see live WhatsApp preview
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-brand-light rounded-xl border border-blue-100">
            <h3 className="text-sm font-semibold text-brand-dark mb-2">Broadcast Summary</h3>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Category</span>
                <span className="font-bold uppercase text-brand-blue">{msgType}</span>
              </div>
              <div className="flex justify-between">
                <span>Recipients</span>
                <span className="font-medium">{numbers.split('\n').filter(n => n.trim()).length}</span>
              </div>
              <div className="flex justify-between border-t border-blue-100 pt-1 font-bold text-brand-dark">
                <span>Max Overage Cost</span>
                <span>₹{(numbers.split('\n').filter(n => n.trim()).length * (msgType === 'utility' ? 0.25 : 1.75)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-bold text-brand-dark flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            Broadcast History
          </h2>
        </div>
        {loadingHistory ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading campaign history...</div>
        ) : broadcastHistory.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">No broadcasts yet. Send your first campaign above!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Campaign', 'Type', 'Recipients', 'Sent', 'Failed', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left font-semibold text-gray-500 uppercase text-xs tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {broadcastHistory.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-brand-dark">{b.name || 'Broadcast'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${b.message_type === 'marketing' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                        {b.message_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{b.recipient_count}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">{b.sent_count}</td>
                    <td className="px-6 py-4 text-red-500">{b.failed_count}</td>
                    <td className="px-6 py-4 text-gray-500">{new Date(b.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold capitalize">{b.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Contact Picker Modal */}
      {showContactPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl p-6 space-y-4 animate-in fade-in duration-150 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-black text-gray-900 text-base">Select Contacts for Broadcast</h3>
                <p className="text-xs text-gray-500">Pick individual contacts or filter by tag.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search contact by name or number..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand-blue"
              />
            </div>

            {/* Tag Pills */}
            {(() => {
              const allTags = ['ALL', ...new Set(contacts.flatMap(c => Array.isArray(c.tags) ? c.tags : []))]
              if (allTags.length <= 1) return null
              return (
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pt-1">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTagFilter(tag)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                        selectedTagFilter === tag
                          ? 'bg-brand-blue text-white shadow-2xs'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              )
            })()}

            {/* Contacts Checkbox List */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-2xl p-2 min-h-[200px]">
              {(() => {
                const currentNumbersSet = new Set(
                  numbers.split('\n').map(n => n.trim().replace(/[\s\-\(\)\+]/g, '')).filter(Boolean)
                )

                const visibleContacts = contacts.filter(c => {
                  const matchSearch =
                    c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
                    c.phone?.includes(contactSearch)
                  const matchTag =
                    selectedTagFilter === 'ALL' ||
                    (Array.isArray(c.tags) && c.tags.includes(selectedTagFilter))
                  return matchSearch && matchTag
                })

                if (visibleContacts.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-400 text-xs">
                      No matching contacts found.
                    </div>
                  )
                }

                return visibleContacts.map(c => {
                  let cleanPhone = String(c.phone).trim().replace(/[\s\-\(\)\+]/g, '')
                  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone
                  const isChecked = currentNumbersSet.has(cleanPhone)

                  return (
                    <div
                      key={c.id || cleanPhone}
                      onClick={() => handleToggleSingleContact(cleanPhone)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isChecked ? 'bg-blue-50/70' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by parent div onClick
                          className="w-4 h-4 text-brand-blue rounded accent-brand-blue cursor-pointer"
                        />
                        <div>
                          <div className="font-bold text-gray-900 text-xs">{c.name}</div>
                          <div className="font-mono text-[11px] text-gray-500">{c.phone}</div>
                        </div>
                      </div>

                      {Array.isArray(c.tags) && c.tags.length > 0 && (
                        <div className="flex gap-1">
                          {c.tags.slice(0, 2).map((t, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <span className="text-xs font-semibold text-gray-600">
                Total in Broadcast: <b>{numbers.split('\n').filter(n => n.trim()).length}</b> recipients
              </span>
              <button
                type="button"
                onClick={() => setShowContactPicker(false)}
                className="px-5 py-2 bg-brand-blue hover:bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
