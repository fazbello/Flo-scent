import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, DollarSign } from 'lucide-react'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import { format } from 'date-fns'

function fetchPayments(search, status) {
  return api.get('/payments/', { params: { search, status } }).then(r => r.data)
}

export default function Payments() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['payments', search, statusFilter],
    queryFn: () => fetchPayments(search, statusFilter),
  })

  const payments = data?.results || []
  const totalRevenue = payments
    .filter(p => p.status === 'succeeded')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0)

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payments"
        subtitle="Revenue and payment tracking"
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Shown', value: `$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, color: 'bg-brand-black text-white' },
          { label: 'Succeeded', value: payments.filter(p => p.status === 'succeeded').length, color: 'bg-white' },
          { label: 'Pending', value: payments.filter(p => p.status === 'pending').length, color: 'bg-white' },
        ].map(c => (
          <div key={c.label} className={`rounded-xl p-5 border border-gray-100 shadow-sm ${c.color}`}>
            <p className="text-sm opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input className="input pl-9" placeholder="Search payments…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'processing', 'succeeded', 'failed', 'refunded'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16">
            <DollarSign size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-brand-gray">No payments recorded</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Amount</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {payments.map(p => (
                <tr key={p.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-brand-black">{p.client_name}</p>
                    {p.description && <p className="text-xs text-brand-gray">{p.description}</p>}
                  </td>
                  <td className="px-5 py-4 text-brand-gray hidden md:table-cell">{p.payment_type_display}</td>
                  <td className="px-5 py-4"><Badge status={p.status} label={p.status_display} /></td>
                  <td className="px-5 py-4 text-right font-semibold text-brand-black">
                    ${parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {p.currency}
                  </td>
                  <td className="px-5 py-4 text-brand-gray hidden lg:table-cell">
                    {p.paid_at ? format(new Date(p.paid_at), 'MMM d, yyyy') : '—'}
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
