import { useState, useEffect } from 'react'
import { Plus, Search, Trash2, UserCheck } from 'lucide-react'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', tags: '' })

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/contacts')
      setContacts(res.data || [])
    } catch (err) {
      console.error('Error fetching contacts:', err)
      toast.error('Failed to load contacts')
    } finally {
      setLoading(false)
    }
  }

  const handleAddContact = async (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error('Name and Phone number are required')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/api/contacts', {
        name: formData.name,
        phone: formData.phone,
        tags: formData.tags
      })
      toast.success('Contact added successfully!')
      setFormData({ name: '', phone: '', tags: '' })
      setIsModalOpen(false)
      fetchContacts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add contact')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) return

    try {
      await api.delete(`/api/contacts/${id}`)
      toast.success('Contact deleted')
      fetchContacts()
    } catch (err) {
      toast.error('Failed to delete contact')
    }
  }

  const filteredContacts = contacts.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) ||
    (Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark">Contacts</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage your audience and WhatsApp phonebook</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 flex items-center gap-2"
        >
          <Plus size={20} />
          Add Contact
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, tag..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-blue outline-none text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading contacts...
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="p-4 font-semibold text-gray-600 text-sm">Name</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Phone Number</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Tags</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm">Added On</th>
                  <th className="p-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-brand-dark font-medium">{contact.name}</td>
                    <td className="p-4 text-gray-600 font-mono text-sm">{contact.phone}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                          contact.tags.map((tag, idx) => (
                            <span key={idx} className="bg-brand-light text-brand-blue px-2 py-0.5 rounded text-xs font-medium border border-blue-100">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm">{new Date(contact.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-gray-400 hover:text-red-600 p-1 transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredContacts.length === 0 && (
            <div className="p-12 text-center text-gray-500 flex flex-col items-center">
              <UserCheck size={48} className="text-gray-300 mb-3" />
              <p>No contacts found. Add your first contact above!</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Contact Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold text-brand-dark mb-4">Add New Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-blue" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number (with country code)</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="919876543210"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-blue font-mono text-sm" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="VIP, Lead, Customer"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-blue" 
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-4 py-2 bg-brand-blue text-white rounded-lg font-medium hover:bg-blue-900 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
