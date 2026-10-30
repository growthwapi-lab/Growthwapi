import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  Trash2,
  UserCheck,
  Upload,
  FileSpreadsheet,
  ClipboardPaste,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users
} from 'lucide-react'
import * as XLSX from 'xlsx'
import api from '../../lib/api'
import toast from 'react-hot-toast'

export default function Contacts() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Modal 1: Single Contact
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', tags: '' })

  // Modal 2: Bulk Import (Excel / CSV or Paste)
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState('excel') // 'excel' or 'paste'
  const [bulkText, setBulkText] = useState('')
  const [bulkTags, setBulkTags] = useState('')
  const [parsedContacts, setParsedContacts] = useState([])
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef(null)

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

  // Handle Excel / CSV File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

        if (!data || data.length < 2) {
          toast.error('The selected file is empty or has no data rows.')
          return
        }

        const headers = data[0].map(h => String(h || '').trim().toLowerCase())
        
        // Find column indices
        let phoneIdx = headers.findIndex(h =>
          h.includes('phone') || h.includes('mobile') || h.includes('whatsapp') || h.includes('number') || h.includes('contact')
        )
        let nameIdx = headers.findIndex(h =>
          h.includes('name') || h.includes('customer') || h.includes('client') || h.includes('user')
        )
        let tagIdx = headers.findIndex(h => h.includes('tag') || h.includes('group') || h.includes('category'))

        // Fallback: If no header found, assume col 0 is Name and col 1 is Phone
        if (phoneIdx === -1 && data[0].length >= 2) {
          nameIdx = 0
          phoneIdx = 1
        } else if (phoneIdx === -1 && data[0].length === 1) {
          phoneIdx = 0
        }

        const rows = []
        for (let i = 1; i < data.length; i++) {
          const row = data[i]
          if (!row || row.length === 0) continue

          const rawPhone = row[phoneIdx] !== undefined ? String(row[phoneIdx]).trim() : ''
          if (!rawPhone) continue

          const rawName = nameIdx !== -1 && row[nameIdx] ? String(row[nameIdx]).trim() : `Contact ${rawPhone.slice(-4)}`
          const rawTags = tagIdx !== -1 && row[tagIdx] ? String(row[tagIdx]).trim() : ''

          rows.push({
            name: rawName,
            phone: rawPhone,
            tags: rawTags ? rawTags.split(',').map(t => t.trim()) : []
          })
        }

        if (rows.length === 0) {
          toast.error('Could not find any phone numbers in the file. Please check column format.')
          return
        }

        setParsedContacts(rows)
        toast.success(`Found ${rows.length} contacts from file!`)
      } catch (err) {
        console.error('File parse error:', err)
        toast.error('Failed to parse file. Please upload a valid .xlsx or .csv file.')
      }
    }
    reader.readAsBinaryString(file)
  }

  // Handle Bulk Paste Text Parse
  const handleParseText = () => {
    if (!bulkText.trim()) {
      setParsedContacts([])
      return
    }

    const lines = bulkText.split('\n')
    const parsed = []

    lines.forEach(line => {
      const trimmed = line.trim()
      if (!trimmed) return

      if (trimmed.includes(',')) {
        const parts = trimmed.split(',').map(p => p.trim())
        if (parts.length >= 2) {
          const name = parts[0]
          const phone = parts[1]
          const tags = parts[2] ? [parts[2]] : []
          if (phone) parsed.push({ name, phone, tags })
        }
      } else {
        parsed.push({
          name: `Contact ${trimmed.slice(-4)}`,
          phone: trimmed,
          tags: []
        })
      }
    })

    setParsedContacts(parsed)
  }

  // Submit Bulk Import to Server
  const handleImportSubmit = async () => {
    if (parsedContacts.length === 0) {
      toast.error('No contacts ready to import.')
      return
    }

    setImporting(true)
    try {
      const extraTags = bulkTags.trim() ? bulkTags.split(',').map(t => t.trim()) : []
      const payload = parsedContacts.map(c => ({
        ...c,
        tags: [...new Set([...(c.tags || []), ...extraTags])]
      }))

      const res = await api.post('/api/contacts/bulk', { contacts: payload })
      toast.success(res.data.message || `Imported ${payload.length} contacts!`)
      setIsBulkModalOpen(false)
      setParsedContacts([])
      setBulkText('')
      setBulkTags('')
      fetchContacts()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to import contacts')
    } finally {
      setImporting(false)
    }
  }

  // Download Sample CSV
  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,Phone,Tags\nRahul Sharma,919876543210,VIP,Customer\nPriya Patel,919876543211,Lead\n"
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", "growthwapi_contacts_sample.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredContacts = contacts.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) ||
    (Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes(search.toLowerCase())))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark flex items-center gap-2">
            <Users className="w-7 h-7 text-brand-orange" />
            Contacts & Audience
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-0.5">
            Total {contacts.length} verified WhatsApp contacts in your audience book
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setBulkMode('excel')
              setParsedContacts([])
              setIsBulkModalOpen(true)
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <FileSpreadsheet size={16} />
            <span>Import Excel / CSV</span>
          </button>

          <button
            onClick={() => {
              setBulkMode('paste')
              setParsedContacts([])
              setIsBulkModalOpen(true)
            }}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <ClipboardPaste size={16} />
            <span>Bulk Paste Numbers</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-brand-orange hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={16} />
            <span>Add Single</span>
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, tag..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-blue outline-none text-xs sm:text-sm"
            />
          </div>

          <div className="text-xs text-gray-500 font-medium">
            Showing <b>{filteredContacts.length}</b> of <b>{contacts.length}</b> contacts
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading contacts...
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 text-[11px] uppercase tracking-wider font-bold">
                  <th className="p-4">Name</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Tags</th>
                  <th className="p-4">Added On</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="p-4 text-brand-dark font-bold">{contact.name}</td>
                    <td className="p-4 text-gray-700 font-mono text-xs">{contact.phone}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(contact.tags) && contact.tags.length > 0 ? (
                          contact.tags.map((tag, idx) => (
                            <span key={idx} className="bg-blue-50 text-brand-blue px-2 py-0.5 rounded-full text-[10px] font-bold border border-blue-100">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(contact.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="text-gray-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete contact"
                      >
                        <Trash2 size={16} />
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
              <p className="font-semibold text-gray-700">No contacts found.</p>
              <p className="text-xs text-gray-400 mt-1">Import an Excel/CSV sheet or click Add Contact above!</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD SINGLE CONTACT */}
      {/* ============================================================== */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in duration-150">
            <h2 className="text-lg font-bold text-brand-dark">Add Single Contact</h2>
            <form onSubmit={handleAddContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 919876543210 (with country code)"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue font-mono text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. VIP, Customer, Lead"
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-brand-blue text-sm"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-brand-orange text-white rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: BULK IMPORT (EXCEL / CSV OR BULK PASTE) */}
      {/* ============================================================== */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-6 sm:p-7 space-y-5 animate-in fade-in duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-gray-900">Bulk Contact Import</h2>
                <p className="text-xs text-gray-500">Upload spreadsheet or paste hundreds of phone numbers at once.</p>
              </div>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>

            {/* Mode Selector Tabs */}
            <div className="flex rounded-xl bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setBulkMode('excel')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  bulkMode === 'excel' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <FileSpreadsheet size={15} />
                <span>Upload Excel / CSV (.xlsx, .csv)</span>
              </button>
              <button
                type="button"
                onClick={() => setBulkMode('paste')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                  bulkMode === 'paste' ? 'bg-white text-blue-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ClipboardPaste size={15} />
                <span>Paste Numbers Text</span>
              </button>
            </div>

            {bulkMode === 'excel' ? (
              /* TAB 1: FILE UPLOAD */
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-emerald-50/20"
                >
                  <Upload size={36} className="mx-auto text-emerald-600 mb-2" />
                  <p className="text-sm font-bold text-gray-800">
                    Click to browse and upload Excel or CSV file
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports .xlsx, .xls, .csv format</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                <div className="flex items-center justify-between text-xs bg-gray-50 p-3 rounded-xl border border-gray-200">
                  <span className="text-gray-600">Need a format template?</span>
                  <button
                    type="button"
                    onClick={handleDownloadSample}
                    className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                  >
                    <Download size={13} />
                    <span>Download Sample Template (.csv)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* TAB 2: BULK PASTE TEXT */
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  Paste Phone Numbers (one per line or "Name, Phone")
                </label>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => {
                    setBulkText(e.target.value)
                  }}
                  onBlur={handleParseText}
                  placeholder={`919876543210\n918765432109\nRahul Sharma, 919876543212, VIP`}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl font-mono text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={handleParseText}
                  className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-all"
                >
                  Verify & Preview Contacts
                </button>
              </div>
            )}

            {/* Optional Common Tag Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Apply Common Tag to All Imported Contacts (Optional)
              </label>
              <input
                type="text"
                value={bulkTags}
                onChange={(e) => setBulkTags(e.target.value)}
                placeholder="e.g. October Campaign, Website Leads"
                className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-xs outline-none focus:border-brand-orange"
              />
            </div>

            {/* Preview Box */}
            {parsedContacts.length > 0 && (
              <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    Ready to Import: {parsedContacts.length} Contacts
                  </span>
                  <span className="text-[11px] text-emerald-700 font-mono">
                    First: {parsedContacts[0].name} ({parsedContacts[0].phone})
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsBulkModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={importing || parsedContacts.length === 0}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {importing ? (
                  <span>Importing Contacts...</span>
                ) : (
                  <>
                    <Upload size={14} />
                    <span>Import {parsedContacts.length > 0 ? `${parsedContacts.length} Contacts` : 'Now'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
