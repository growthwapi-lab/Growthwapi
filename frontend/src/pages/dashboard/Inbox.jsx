import { useState, useEffect } from 'react'
import { Send, User, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Inbox() {
  const [messages, setMessages] = useState([])
  const [conversations, setConversations] = useState([])
  const [activeConv, setActiveConv] = useState(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [resolving, setResolving] = useState(false)

  useEffect(() => {
    fetchMessages(false)
    const interval = setInterval(() => {
      fetchMessages(true)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

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

      if (activeConv) {
        const updatedActive = convList.find((c) => c.id === activeConv.id)
        if (updatedActive) setActiveConv(updatedActive)
      } else if (convList.length > 0) {
        setActiveConv(convList[0])
      } else {
        setActiveConv(null)
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
    } finally {
      if (!isSilent) setLoading(false)
    }
  }

  const handleSend = async (e) => {
    e.preventDefault()
    if (!newMessage.trim() || !activeConv) return

    setSending(true)
    try {
      await api.post('/api/whatsapp/send', {
        to: activeConv.phone,
        type: 'text',
        text: { body: newMessage },
        messageCategory: 'utility',
      })
      toast.success('Message sent!')
      setNewMessage('')
      fetchMessages()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
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
      fetchMessages()
    } catch (err) {
      toast.error('Failed to resolve conversation.')
    } finally {
      setResolving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-8rem)] bg-white rounded-xl border border-gray-200 shadow-sm flex overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="font-bold text-brand-dark text-lg">Inbox</h2>
          <span className="text-xs font-semibold px-2 py-1 bg-gray-100 rounded-md text-gray-600">
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
                  activeConv?.id === conv.id ? 'bg-brand-light' : 'hover:bg-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-brand-dark truncate flex items-center gap-1.5">
                    {conv.name}
                  </h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{conv.time}</span>
                </div>
                <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>

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
      <div className="flex-1 flex flex-col bg-white">
        {activeConv ? (
          <>
            {/* Active Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-blue rounded-full flex items-center justify-center text-white font-bold">
                  <User size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-brand-dark">{activeConv.name}</h3>
                    {activeConv.needsHuman && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Needs Human
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{activeConv.phone}</p>
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
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col gap-4">
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
                      className={`max-w-md p-3 rounded-lg text-sm relative ${
                        isOutbound
                          ? 'self-end bg-brand-light border border-blue-100 rounded-tr-none text-brand-dark'
                          : 'self-start bg-white border border-gray-200 rounded-tl-none text-brand-dark'
                      }`}
                    >
                      <p>{bodyText}</p>

                      <div className="flex items-center justify-end gap-2 mt-1">
                        {m.needs_human && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-100">
                            Human Attention Needed
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {new Date(m.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>

            {/* Send Reply Form */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none text-sm"
                />
                <button
                  type="submit"
                  disabled={sending}
                  className="bg-brand-blue text-white p-2.5 rounded-lg hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <MessageSquare size={48} className="text-gray-300 mb-3" />
            <p>No conversation selected</p>
          </div>
        )}
      </div>
    </div>
  )
}
