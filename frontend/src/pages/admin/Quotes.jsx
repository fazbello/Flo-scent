import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Send, Copy, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import { format } from 'date-fns'

function fetchQuotes(search, status) {
  return api.get('/quotes/', { params: { search, status } }).then(r => r.data)
}

export default function Quotes() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['quotes', search, statusFilter],
    queryFn: () => fetchQuotes(search, statusFilter),
  })

  const sendQuote = useMutation({
    mutationFn: (id) => api.post(`/quotes/${id}/send/`),
    onSuccess: (_, id) => {
      qc.invalidateQueries(['quotes'])
      toast.success('Quote sent!')
    },
  })

  const duplicateQuote = useMutation({
    mutationFn: (id) => api.post(`/quotes/${id}/duplicate/`),
    onSuccess: () => {
      qc.invalidateQueries(['quotes'])
      toast.success('Quote duplicated')
    },
  })

  const quotes = data?.results || []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Quotes"
        subtitle={`${data?.count || 0} total quotes`}
        action={
          <Link to="/admin/quotes/new" className="btn-gold flex items-center gap-2">
            <Plus size={16} /> New Quote
          </Link>
        }
      />

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input className="input pl-9" placeholder="Search quotes…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'sent', 'viewed', 'accepted', 'declined', 'expired'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-brand-gray">No quotes yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Quote #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Total</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-brand-gold">{q.quote_number}</td>
                  <td className="px-5 py-4 text-brand-gray hidden md:table-cell">{q.client_name}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-brand-black">{q.title}</p>
                    {q.ai_generated && <span className="text-xs text-purple-600">✦ AI generated</span>}
                  </td>
                  <td className="px-5 py-4"><Badge status={q.status} label={q.status_display} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-brand-black">
                    ${parseFloat(q.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      {q.status === 'draft' && (
                        <button onClick={() => sendQuote.mutate(q.id)}
                          className="text-brand-gray hover:text-brand-gold" title="Send quote">
                          <Send size={14} />
                        </button>
                      )}
                      <button onClick={() => duplicateQuote.mutate(q.id)}
                        className="text-brand-gray hover:text-brand-gold" title="Duplicate">
                        <Copy size={14} />
                      </button>
                      <Link to={`/admin/quotes/${q.id}`}
                        className="text-brand-gold hover:text-brand-black text-xs font-medium">
                        View →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
