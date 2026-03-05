import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Download, Send, FileCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import { format } from 'date-fns'

function fetchProposals(search, status) {
  return api.get('/proposals/', { params: { search, status } }).then(r => r.data)
}

export default function Proposals() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['proposals', search, statusFilter],
    queryFn: () => fetchProposals(search, statusFilter),
  })

  const generatePDF = useMutation({
    mutationFn: (id) => api.post(`/proposals/${id}/generate-pdf/`),
    onSuccess: () => { qc.invalidateQueries(['proposals']); toast.success('PDF generated!') },
    onError: () => toast.error('PDF generation failed'),
  })

  const sendProposal = useMutation({
    mutationFn: (id) => api.post(`/proposals/${id}/send/`),
    onSuccess: () => { qc.invalidateQueries(['proposals']); toast.success('Proposal sent!') },
  })

  const handleDownload = async (id, number) => {
    try {
      const res = await api.get(`/proposals/${id}/download-pdf/`, { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `proposal_${number}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed')
    }
  }

  const proposals = data?.results || []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Proposals"
        subtitle={`${data?.count || 0} total proposals`}
      />

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input className="input pl-9" placeholder="Search proposals…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['draft', 'sent', 'viewed', 'accepted', 'declined'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : proposals.length === 0 ? (
          <div className="text-center py-16">
            <FileCheck size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-brand-gray">No proposals yet. Use AI Tools or generate from a Quote.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Proposal #</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {proposals.map(p => (
                <tr key={p.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-brand-gold">{p.proposal_number}</td>
                  <td className="px-5 py-4 text-brand-gray hidden md:table-cell">{p.client_name}</td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-brand-black">{p.title}</p>
                    {p.ai_generated && <span className="text-xs text-purple-600">✦ AI generated</span>}
                  </td>
                  <td className="px-5 py-4"><Badge status={p.status} label={p.status_display} /></td>
                  <td className="px-5 py-4 text-brand-gray hidden lg:table-cell">
                    {format(new Date(p.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => p.has_pdf
                          ? handleDownload(p.id, p.proposal_number)
                          : generatePDF.mutate(p.id)}
                        className="text-brand-gray hover:text-brand-gold"
                        title={p.has_pdf ? 'Download PDF' : 'Generate PDF'}
                      >
                        <Download size={14} />
                      </button>
                      {p.status === 'draft' && (
                        <button onClick={() => sendProposal.mutate(p.id)}
                          className="text-brand-gray hover:text-brand-gold" title="Send">
                          <Send size={14} />
                        </button>
                      )}
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
