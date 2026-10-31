import { useState, useEffect, useRef } from 'react'
import {
  Send,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Check,
  CheckCheck,
  Clock,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  Download,
  Trash2,
  CheckSquare,
  Square,
  ArrowLeft
} from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

// WhatsApp-style status ticks component
function StatusTick({ status }) {
  const s = (status || '').toLowerCase()
  if (s === 'read') {
    return <CheckCheck className="w-4 h-4 text-sky-500 inline shrink-0" title="Read" />
  }
  if (s === 'delivered') {
    return <CheckCheck className="w-4 h-4 text-gray-400 inline shrink-0" title="Delivered" />
  }
  if (s === 'sent') {
    return <Check className="w-4 h-4 text-gray-400 inline shrink-0" title="Sent" />
  }
  if (s === 'failed') {
    return <AlertCircle className="w-3.5 h-3.5 text-red-500 inline shrink-0" title="Failed to deliver" />
  }
  return <Clock className="w-3.5 h-3.5 text-gray-400 inline shrink-0 animate-pulse" title="Sending..." />
}

function groupMessagesToConversations(msgList) {
  const grouped = {}
  msgList.forEach((m) => {
    const phone = m.direction === 'outbound' ? m.to_number : m.from_number
    if (!phone) return
    const getSnippet = () => {
      let c = m.content
      if (typeof c === 'string') {
        try { c = JSON.parse(c) } catch {}
      }
      if (typeof c === 'string') return c
      if (c?.text?.body) return c.text.body
      if (c?.body) return c.body
      if (c?.image) return '📷 Photo'
      if (c?.document) return '📄 Document'
      if (c?.audio) return '🎵 Audio'
      if (c?.video) return '🎥 Video'
      if (c?.template?.name) return `📋 ${c.template.name}`
      return typeof m.content === 'string' ? m.content : 'Message'
    }

    if (!grouped[phone]) {
      grouped[phone] = {
        id: phone,
        name: phone,
        phone,
        lastMessage: getSnippet(),
        time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sent_at: m.sent_at,
        needsHuman: false,
        messages: [],
      }
    }
    if (m.needs_human) {
      grouped[phone].needsHuman = true
    }
    grouped[phone].messages.push(m)
  })
  return Object.values(grouped).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
}

export default function Inbox() {
  const cachedMsgs = (() => {
    try { return JSON.parse(localStorage.getItem('gw_cached_messages') || '[]') } catch { return [] }
  })()
  const initialConvs = groupMessagesToConversations(cachedMsgs)

  const [messages, setMessages] = useState(cachedMsgs)
  const [conversations, setConversations] = useState(initialConvs)
  const [activeConv, setActiveConv] = useState(initialConvs.length > 0 && typeof window !== 'undefined' && window.innerWidth >= 768 ? initialConvs[0] : null)
  const [newMessage, setNewMessage] = useState('')
  const [selectedFile, setSelectedFile] = useState(null) // { file, base64, previewUrl, name, type }
  const [loading, setLoading] = useState(initialConvs.length === 0)
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)

  // Multi-message select mode
  const [isSelectMode, setIsSelectMode] = useState(false)
  const [selectedMsgIds, setSelectedMsgIds] = useState(new Set())
  const [deletingBatch, setDeletingBatch] = useState(false)

  const activeConvIdRef = useRef(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    activeConvIdRef.current = activeConv?.id || null
  }, [activeConv])

  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  useEffect(() => {
    fetchMessages(false)
    const interval = setInterval(() => {
      fetchMessages(true)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeConv) {
      scrollToBottom(false)
      setSelectedMsgIds(new Set())
      setIsSelectMode(false)
    }
  }, [activeConv?.id])

  const fetchMessages = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    try {
      const res = await api.get('/api/whatsapp/messages')
      const msgList = res.data || []
      setMessages(msgList)

      // Group by contact phone number
      const grouped = {}
      msgList.forEach((m) => {
        const phone = m.direction === 'outbound' ? m.to_number : m.from_number
        const getSnippet = () => {
          let c = m.content
          if (typeof c === 'string') {
            try { c = JSON.parse(c) } catch (e) {}
          }
          if (c?.image || m.message_type === 'image') return '📷 Photo'
          if (c?.document || m.message_type === 'document') return '📄 Document'
          if (c?.audio || m.message_type === 'audio' || m.message_type === 'voice') return '🎵 Voice / Audio'
          if (c?.video || m.message_type === 'video') return '🎥 Video'
          if (c?.text?.body) return c.text.body
          if (c?.body) return c.body
          if (c?.template?.name) return `📋 ${c.template.name}`
          if (typeof c === 'string') return c
          return 'Message'
        }

        if (!grouped[phone]) {
          grouped[phone] = {
            id: phone,
            phone: phone,
            name: phone,
            lastMessage: getSnippet(),
            time: new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sent_at: m.sent_at,
            needsHuman: false,
            messages: [],
          }
        }
        if (m.needs_human) {
          grouped[phone].needsHuman = true
        }
        grouped[phone].messages.push(m)
      })

      const convList = Object.values(grouped).sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at))
      setConversations(convList)
      try { localStorage.setItem('gw_cached_messages', JSON.stringify(msgList.slice(0, 100))) } catch {}

      const currentActiveId = activeConvIdRef.current
      if (currentActiveId) {
        const updatedActive = convList.find((c) => c.id === currentActiveId)
        if (updatedActive) {
          setActiveConv(updatedActive)
        }
      } else if (convList.length > 0 && !isSilent) {
        // Auto-select on desktop screens (>= 768px), keep null on mobile so user sees chat list like WhatsApp
        if (typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveConv(convList[0])
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  // Handle file selection from local device
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error('File size must be under 15MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedFile({
        file,
        base64: reader.result,
        previewUrl: file.type.startsWith('image/') ? reader.result : null,
        name: file.name,
        type: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  // Instant smooth send (text and/or media)
  const handleSend = async (e) => {
    e.preventDefault()
    if ((!newMessage.trim() && !selectedFile) || !activeConv || sending) return

    const textToSend = newMessage.trim()
    const fileToSend = selectedFile

    // Clear inputs immediately
    setNewMessage('')
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''

    // 1. Optimistic local message
    const tempId = 'temp_' + Date.now()
    const optimisticMsg = {
      id: tempId,
      user_id: activeConv.messages?.[0]?.user_id,
      from_number: 'me',
      to_number: activeConv.phone,
      message_type: fileToSend ? (fileToSend.type.startsWith('image/') ? 'image' : 'document') : 'text',
      direction: 'outbound',
      content: fileToSend
        ? {
            [fileToSend.type.startsWith('image/') ? 'image' : 'document']: {
              caption: textToSend,
              filename: fileToSend.name,
              previewUrl: fileToSend.previewUrl,
            }
          }
        : { text: { body: textToSend } },
      status: 'pending',
      sent_at: new Date().toISOString()
    }

    setActiveConv((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        lastMessage: fileToSend ? (fileToSend.type.startsWith('image/') ? '📷 Photo' : '📄 File') : textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [optimisticMsg, ...(prev.messages || [])]
      }
    })

    setTimeout(() => scrollToBottom(true), 50)
    setSending(true)

    try {
      let res
      if (fileToSend) {
        // Send Media via API
        res = await api.post('/api/whatsapp/send-media', {
          to: activeConv.phone,
          base64: fileToSend.base64,
          filename: fileToSend.name,
          mimeType: fileToSend.type,
          caption: textToSend || '',
        })
      } else {
        // Send pure text
        res = await api.post('/api/whatsapp/send', {
          to: activeConv.phone,
          type: 'text',
          text: { body: textToSend },
          messageCategory: 'utility',
        })
      }

      const realMsg = res.data?.message
      setActiveConv((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId ? (realMsg || { ...m, status: 'sent' }) : m
          )
        }
      })
    } catch (err) {
      setActiveConv((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId ? { ...m, status: 'failed' } : m
          )
        }
      })
      toast.error(err.response?.data?.error || 'Failed to send')
    } finally {
      setSending(false)
      fetchMessages(true)
    }
  }

  const handleResolveHumanHandOff = async () => {
    if (!activeConv) return
    setResolving(true)
    try {
      await api.patch('/api/whatsapp/messages/resolve-number', {
        number: activeConv.phone,
      })
      toast.success('Conversation marked as resolved!')
      fetchMessages(true)
    } catch (err) {
      toast.error('Failed to resolve conversation.')
    } finally {
      setResolving(false)
    }
  }

  // Delete a single message (text, photo, audio, video, document)
  const handleDeleteMessage = async (msgId) => {
    if (!msgId || String(msgId).startsWith('temp_')) return
    if (!window.confirm('Are you sure you want to delete this message?')) return

    setActiveConv((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        messages: prev.messages.filter((m) => m.id !== msgId),
      }
    })

    try {
      await api.delete(`/api/whatsapp/messages/${msgId}`)
      toast.success('Message deleted')
    } catch (err) {
      toast.error('Failed to delete message')
    } finally {
      fetchMessages(true)
    }
  }

  // Delete entire conversation
  const handleDeleteConversation = async (phone) => {
    if (!phone) return
    if (!window.confirm(`Are you sure you want to delete all messages with ${phone}? This cannot be undone.`)) return

    setConversations((prev) => prev.filter((c) => c.phone !== phone))
    setActiveConv(null)

    try {
      await api.delete(`/api/whatsapp/conversations/${phone}`)
      toast.success('Conversation deleted')
    } catch (err) {
      toast.error('Failed to delete conversation')
    } finally {
      fetchMessages(true)
    }
  }

  // Toggle single message selection
  const toggleSelectMessage = (msgId) => {
    if (!msgId) return
    setSelectedMsgIds((prev) => {
      const next = new Set(prev)
      if (next.has(msgId)) {
        next.delete(msgId)
      } else {
        next.add(msgId)
      }
      return next
    })
  }

  // Select/Deselect all messages in active conversation
  const handleSelectAll = () => {
    if (!activeConv?.messages) return
    if (selectedMsgIds.size === activeConv.messages.length) {
      setSelectedMsgIds(new Set())
    } else {
      setSelectedMsgIds(new Set(activeConv.messages.map((m) => m.id)))
    }
  }

  // Batch delete selected messages
  const handleBatchDelete = async () => {
    if (selectedMsgIds.size === 0 || deletingBatch) return
    const count = selectedMsgIds.size
    if (!window.confirm(`Are you sure you want to delete ${count} selected message${count > 1 ? 's' : ''}?`)) return

    const idsToDelete = Array.from(selectedMsgIds)
    setDeletingBatch(true)

    // Optimistic removal from active conversation
    setActiveConv((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        messages: prev.messages.filter((m) => !selectedMsgIds.has(m.id)),
      }
    })
    setIsSelectMode(false)
    setSelectedMsgIds(new Set())

    try {
      await api.post('/api/whatsapp/messages/batch-delete', { messageIds: idsToDelete })
      toast.success(`${count} message${count > 1 ? 's' : ''} deleted successfully!`)
    } catch (err) {
      toast.error('Failed to delete messages')
    } finally {
      setDeletingBatch(false)
      fetchMessages(true)
    }
  }

  // Render message body (handles Image, Document, Audio, Video, Template, Text)
  const renderMessageContent = (m) => {
    let content = m.content || {}
    if (typeof content === 'string') {
      try {
        content = JSON.parse(content)
      } catch (e) {}
    }
    const baseURL = api.defaults.baseURL || ''

    // 1. Image
    const imgObj = content?.image || (m.message_type === 'image' ? content : null)
    if (imgObj && (imgObj.id || imgObj.previewUrl || imgObj.url || imgObj.link)) {
      const mediaId = imgObj.id
      const imgSrc = imgObj.previewUrl || (mediaId ? `${baseURL}/api/whatsapp/media-proxy/${mediaId}` : imgObj.url || imgObj.link)
      const caption = imgObj.caption || (typeof content.caption === 'string' ? content.caption : '')
      return (
        <div className="space-y-1.5">
          {imgSrc && (
            <img
              src={imgSrc}
              alt="WhatsApp Photo"
              className="rounded-xl max-h-72 w-auto object-cover border border-black/5 hover:opacity-95 cursor-pointer shadow-xs"
              onClick={() => window.open(imgSrc, '_blank')}
              loading="lazy"
            />
          )}
          {caption && <p className="text-sm leading-relaxed">{caption}</p>}
        </div>
      )
    }

    // 2. Document / PDF
    const docObj = content?.document || (m.message_type === 'document' ? content : null)
    if (docObj && (docObj.id || docObj.url || docObj.link)) {
      const docId = docObj.id
      const docSrc = docId ? `${baseURL}/api/whatsapp/media-proxy/${docId}` : docObj.url || docObj.link
      const filename = docObj.filename || 'Document.pdf'
      const caption = docObj.caption || ''
      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-3 p-2.5 bg-black/5 rounded-xl border border-black/5 max-w-xs">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 truncate">
              <p className="text-xs font-semibold text-gray-800 truncate">{filename}</p>
              <p className="text-[10px] text-gray-500">Document</p>
            </div>
            {docSrc && (
              <a
                href={docSrc}
                target="_blank"
                rel="noreferrer"
                download={filename}
                className="p-1.5 text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-colors"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
          </div>
          {caption && <p className="text-sm leading-relaxed">{caption}</p>}
        </div>
      )
    }

    // 3. Audio / Voice Note
    const audioObj = content?.audio || content?.voice || (m.message_type === 'audio' || m.message_type === 'voice' ? content : null)
    if (audioObj && (audioObj.id || audioObj.url)) {
      const audioId = audioObj.id
      const audioSrc = audioId ? `${baseURL}/api/whatsapp/media-proxy/${audioId}` : audioObj.url
      return (
        <div className="p-1">
          <audio controls src={audioSrc} className="w-64 h-9" />
        </div>
      )
    }

    // 4. Video
    const videoObj = content?.video || (m.message_type === 'video' ? content : null)
    if (videoObj && (videoObj.id || videoObj.url)) {
      const videoId = videoObj.id
      const videoSrc = videoId ? `${baseURL}/api/whatsapp/media-proxy/${videoId}` : videoObj.url
      return (
        <div className="space-y-1.5">
          <video controls src={videoSrc} className="rounded-xl max-h-72 w-auto shadow-xs" />
          {videoObj.caption && <p className="text-sm">{videoObj.caption}</p>}
        </div>
      )
    }

    // 5. Template Message
    if (content?.template?.name) {
      return (
        <div className="p-1 font-mono text-xs text-blue-900 bg-blue-50/60 rounded-lg border border-blue-100">
          📋 <strong>Template Sent:</strong> {content.template.name}
        </div>
      )
    }

    // 6. Interactive Button Reply
    if (content?.type === 'interactive' && content?.interactive?.button_reply?.title) {
      return <p className="font-semibold text-brand-blue">🔘 {content.interactive.button_reply.title}</p>
    }

    // 7. Regular Text or fallback
    let bodyText = ''
    if (typeof content === 'string') {
      bodyText = content
    } else if (content?.text?.body) {
      bodyText = content.text.body
    } else if (content?.body) {
      bodyText = content.body
    } else {
      bodyText = content?.text?.body || ''
    }

    return <p className="whitespace-pre-wrap leading-relaxed">{bodyText}</p>
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex h-[calc(100vh-7.5rem)] sm:h-[calc(100vh-8rem)]">
      {/* Conversations List (On mobile: full-width when activeConv is null, hidden when chat is open; On desktop: always visible as sidebar) */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-200 flex-col bg-gray-50/50 shrink-0 ${
        activeConv ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-3.5 sm:p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-brand-dark text-base sm:text-lg">Inbox</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
            {conversations.length} Chats
          </span>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`p-3.5 sm:p-4 cursor-pointer transition-colors relative ${
                  activeConv?.id === conv.id ? 'bg-blue-50/70 border-l-4 border-l-brand-blue' : 'hover:bg-gray-100/70'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-brand-dark truncate flex items-center gap-1.5 text-sm">
                    {conv.name}
                  </h3>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap ml-2">{conv.time}</span>
                </div>
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage}</p>

                {conv.needsHuman && (
                  <span className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                    <AlertCircle className="w-3 h-3" />
                    Needs Human
                  </span>
                )}
              </div>
            ))
          ) : loading ? (
            <div className="p-3 space-y-2.5 animate-pulse">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="p-3.5 bg-white rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-100 rounded w-10" />
                  </div>
                  <div className="h-3 bg-gray-100 rounded w-48" />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
              <MessageSquare size={32} className="text-gray-300 mb-2" />
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Area (On mobile: full-width when activeConv is open, hidden when null; On desktop: always visible) */}
      <div className={`flex-1 flex-col bg-[#efeae2]/40 relative ${
        activeConv ? 'flex' : 'hidden md:flex'
      }`}>
        {activeConv ? (
          <>
            {/* Active Chat Header */}
            {isSelectMode ? (
              <div className="p-2.5 sm:p-3.5 border-b border-blue-200 flex items-center justify-between bg-blue-50/95 shadow-xs z-10 animate-in fade-in duration-150 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    onClick={() => {
                      setIsSelectMode(false)
                      setSelectedMsgIds(new Set())
                    }}
                    className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-colors"
                    title="Cancel Selection"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <span className="font-bold text-xs sm:text-sm text-gray-800 whitespace-nowrap">
                    {selectedMsgIds.size} Selected
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    onClick={handleSelectAll}
                    className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-2xs whitespace-nowrap"
                  >
                    {selectedMsgIds.size === activeConv.messages.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    disabled={selectedMsgIds.size === 0 || deletingBatch}
                    className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-red-600 text-white font-semibold text-xs rounded-lg hover:bg-red-700 transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{deletingBatch ? 'Deleting...' : `Delete (${selectedMsgIds.size})`}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 sm:p-3.5 border-b border-gray-200 flex items-center justify-between bg-white shadow-xs z-10 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* WhatsApp-style Back button on mobile */}
                  <button
                    onClick={() => setActiveConv(null)}
                    className="md:hidden p-1.5 -ml-1 text-gray-600 hover:text-brand-dark hover:bg-gray-100 rounded-lg transition-colors shrink-0"
                    title="Back to Chats"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="w-9 h-9 sm:w-10 sm:h-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold shrink-0">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-brand-dark text-sm truncate">{activeConv.name}</h3>
                      {activeConv.needsHuman && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 shrink-0">
                          <AlertCircle className="w-3 h-3" />
                          <span className="hidden sm:inline">Needs Human</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 font-mono truncate">{activeConv.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                  <button
                    onClick={() => setIsSelectMode(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:text-brand-blue hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                    title="Select messages to delete"
                  >
                    <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Select</span>
                  </button>

                  {activeConv.needsHuman && (
                    <button
                      onClick={handleResolveHumanHandOff}
                      disabled={resolving}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                      title="Mark as Resolved"
                    >
                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">Resolve</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteConversation(activeConv.phone)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Chat Thread */}
            <div className="flex-1 p-3 sm:p-6 overflow-y-auto flex flex-col gap-3">
              {activeConv.messages
                .slice()
                .reverse()
                .map((m, idx) => {
                  const isOutbound = m.direction === 'outbound'
                  const isSelected = selectedMsgIds.has(m.id)

                  return (
                    <div
                      key={m.id || idx}
                      onClick={() => {
                        if (isSelectMode && m.id && !String(m.id).startsWith('temp_')) {
                          toggleSelectMessage(m.id)
                        }
                      }}
                      className={`group max-w-[85%] sm:max-w-[75%] p-3 rounded-2xl text-sm relative shadow-xs transition-all ${
                        isSelectMode ? 'cursor-pointer select-none' : ''
                      } ${
                        isSelected
                          ? 'ring-2 ring-brand-blue ring-offset-2 scale-[1.01]'
                          : ''
                      } ${
                        isOutbound
                          ? 'self-end bg-[#d9fdd3] text-gray-900 rounded-tr-none border border-emerald-100'
                          : 'self-start bg-white text-gray-900 rounded-tl-none border border-gray-200'
                      }`}
                    >
                      {/* Checkbox row in select mode */}
                      {isSelectMode && (
                        <div className="mb-2 flex items-center gap-2 pb-1.5 border-b border-black/5 text-xs">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-brand-blue shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-[11px] font-medium text-gray-600">
                            {isSelected ? 'Selected' : 'Click to select'}
                          </span>
                        </div>
                      )}

                      {/* Rich Content: Image / Document / Text */}
                      {renderMessageContent(m)}

                      <div className="flex items-center justify-end gap-1.5 mt-1.5">
                        {/* Hover Delete Button for this single message (when not in select mode) */}
                        {!isSelectMode && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMessage(m.id)
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-600 rounded transition-opacity"
                            title="Delete message"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {m.needs_human && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 mr-1">
                            Needs Attention
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500 font-mono">
                          {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOutbound && <StatusTick status={m.status} />}
                      </div>
                    </div>
                  )
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected File Preview Bar (If attached) */}
            {selectedFile && (
              <div className="px-4 py-2 bg-gray-100 border-t border-gray-200 flex items-center justify-between text-xs animate-in fade-in duration-150">
                <div className="flex items-center gap-2 truncate">
                  {selectedFile.previewUrl ? (
                    <img src={selectedFile.previewUrl} alt="preview" className="w-8 h-8 rounded object-cover border" />
                  ) : (
                    <FileText className="w-5 h-5 text-brand-blue shrink-0" />
                  )}
                  <span className="font-semibold text-gray-800 truncate">{selectedFile.name}</span>
                  <span className="text-gray-400">({(selectedFile.file.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  className="p-1 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Send Reply Form (WhatsApp Web Bar with Attachment) */}
            <div className="p-3.5 border-t border-gray-200 bg-white">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain"
                  className="hidden"
                />

                {/* Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-brand-blue hover:bg-gray-100 rounded-xl transition-all shrink-0"
                  title="Attach Photo or Document"
                >
                  <Paperclip size={20} />
                </button>

                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={selectedFile ? 'Add a caption...' : 'Type a message...'}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm transition-all"
                  autoFocus
                />

                <button
                  type="submit"
                  disabled={!newMessage.trim() && !selectedFile}
                  className="bg-brand-blue hover:bg-blue-900 text-white p-2.5 rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                  title="Send"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : loading && conversations.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
            <div className="w-10 h-10 border-3 border-brand-orange border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-gray-500">Connecting to WhatsApp Inbox...</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="text-gray-300 mb-3" />
            <p className="text-sm">No conversation selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
