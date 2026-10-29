import { useState, useEffect, useRef } from 'react'
import {
  Send,
  User,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  Check,
  CheckCheck,
  Clock
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
  // Pending / sending
  return <Clock className="w-3.5 h-3.5 text-gray-400 inline shrink-0 animate-pulse" title="Sending..." />
}

export default function Inbox() {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)

  const activeConvIdRef = useRef(null)
  const messagesEndRef = useRef(null)

  // Keep activeConvIdRef in sync
  useEffect(() => {
    activeConvIdRef.current = activeConv?.id || null
  }, [activeConv])

  // Scroll to bottom on new message
  const scrollToBottom = (smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' })
    }
  }

  useEffect(() => {
    fetchMessages(false)
    const interval = setInterval(() => {
      fetchMessages(true) // silent refresh without any screen reload
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (activeConv) {
      scrollToBottom(false)
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
          if (typeof m.content === 'string') return m.content
          if (m.content?.text?.body) return m.content.text.body
          if (m.content?.body) return m.content.body
          if (m.content?.template?.name) return `📋 ${m.content.template.name}`
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

      const currentActiveId = activeConvIdRef.current
      if (currentActiveId) {
        const updatedActive = convList.find((c) => c.id === currentActiveId)
        if (updatedActive) {
          setActiveConv(updatedActive)
        }
      } else if (convList.length > 0 && !isSilent) {
        setActiveConv(convList[0])
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  // Instant smooth send (WhatsApp style: zero screen flicker, immediate optimistic bubble)
  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv || sending) return

    const textToSend = newMessage.trim()
    setNewMessage('') // Clear input instantly like WhatsApp

    // 1. Optimistic local message
    const tempId = 'temp_' + Date.now()
    const optimisticMsg = {
      id: tempId,
      user_id: activeConv.messages?.[0]?.user_id,
      from_number: 'me',
      to_number: activeConv.phone,
      message_type: 'text',
      direction: 'outbound',
      content: { text: { body: textToSend } },
      status: 'pending',
      sent_at: new Date().toISOString()
    }

    // Update active conversation immediately
    setActiveConv((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        lastMessage: textToSend,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        messages: [optimisticMsg, ...(prev.messages || [])]
      }
    })

    // Scroll to bottom immediately
    setTimeout(() => scrollToBottom(true), 50)

    setSending(true)
    try {
      const res = await api.post('/api/whatsapp/send', {
        to: activeConv.phone,
        type: 'text',
        text: { body: textToSend },
        messageCategory: 'utility',
      })

      // Update optimistic message status to 'sent'
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
      // Mark as failed
      setActiveConv((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          messages: prev.messages.map((m) =>
            m.id === tempId ? { ...m, status: 'failed' } : m
          )
        }
      })
      toast.error(err.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
      // Background silent sync
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

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex h-[calc(100vh-8rem)]">
      {/* Conversations List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-brand-dark">Inbox</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
            {conversations.length} Chats
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConv(conv)}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors relative ${
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
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center">
              <MessageSquare size={32} className="text-gray-300 mb-2" />
              No conversations yet
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-[#efeae2]/40 relative">
        {activeConv ? (
          <>
            {/* Active Chat Header */}
            <div className="p-3.5 border-b border-gray-200 flex items-center justify-between bg-white shadow-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
                  <User size={18} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-brand-dark text-sm">{activeConv.name}</h3>
                    {activeConv.needsHuman && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3 h-3" />
                        Needs Human
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 font-mono">{activeConv.phone}</p>
                </div>
              </div>

              {activeConv.needsHuman && (
                <button
                  onClick={handleResolveHumanHandOff}
                  disabled={resolving}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-semibold text-xs rounded-lg hover:bg-emerald-700 transition-colors shadow-xs disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Resolved
                </button>
              )}
            </div>

            {/* Chat Thread */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-3">
              {activeConv.messages
                .slice()
                .reverse()
                .map((m, idx) => {
                  const isOutbound = m.direction === 'outbound'
                  let bodyText = ''
                  if (typeof m.content === 'string') {
                    bodyText = m.content
                  } else if (m.content?.text?.body) {
                    bodyText = m.content.text.body
                  } else if (m.content?.body) {
                    bodyText = m.content.body
                  } else if (m.content?.template?.name) {
                    bodyText = `📋 Template: ${m.content.template.name}`
                  } else if (m.content?.type === 'interactive' && m.content?.interactive?.button_reply?.title) {
                    bodyText = m.content.interactive.button_reply.title
                  } else {
                    bodyText = typeof m.content === 'object' ? (m.content?.text?.body || JSON.stringify(m.content)) : String(m.content)
                  }

                  return (
                    <div
                      key={m.id || idx}
                      className={`max-w-[75%] p-3 rounded-2xl text-sm relative shadow-xs ${
                        isOutbound
                          ? 'self-end bg-[#d9fdd3] text-gray-900 rounded-tr-none border border-emerald-100'
                          : 'self-start bg-white text-gray-900 rounded-tl-none border border-gray-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap leading-relaxed">{bodyText}</p>

                      <div className="flex items-center justify-end gap-1.5 mt-1">
                        {m.needs_human && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 mr-1">
                            Needs Attention
                          </span>
                        )}
                        <span className="text-[11px] text-gray-500 font-mono">
                          {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Status Ticks for Outbound Messages */}
                        {isOutbound && <StatusTick status={m.status} />}
                      </div>
                    </div>
                  )
                })}
              <div ref={messagesEndRef} />
            </div>

            {/* Send Reply Form (WhatsApp Web Bar) */}
            <div className="p-3.5 border-t border-gray-200 bg-white">
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-sm transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-brand-blue hover:bg-blue-900 text-white p-2.5 rounded-xl transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
                >
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
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
