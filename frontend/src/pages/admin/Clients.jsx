import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Search, Plus, Building2, ExternalLink } from 'lucide-react'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import { format } from 'date-fns'

function fetchClients(search, status) {
  const params = {}
  if (search) params.search = search
  if (status) params.status = status
  return api.get('/clients/', { params }).then(r => r.data)
}

export default function Clients() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['clients', search, statusFilter],
    queryFn: () => fetchClients(search, statusFilter),
  })

  const clients = data?.results || []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clients"
        subtitle={`${data?.count || 0} total clients`}
        action={
          <Link to="/onboard" target="_blank" className="btn-gold flex items-center gap-2">
            <Plus size={16} /> New Onboarding Link
          </Link>
        }
      />

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input
            className="input pl-9"
            placeholder="Search clients…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input sm:w-44"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="lead">Lead</option>
          <option value="onboarding">Onboarding</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : clients.length === 0 ? (
          <div className="text-center py-16">
            <Building2 size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-brand-gray">No clients found</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden md:table-cell">Industry</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Contact</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(client => (
                <tr key={client.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="font-medium text-brand-black">{client.company_name}</div>
                    {client.has_onboarding && (
                      <span className="text-xs text-brand-gold">✦ Onboarding complete</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-brand-gray hidden md:table-cell">{client.industry}</td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    <div className="text-brand-black">{client.primary_contact_name}</div>
                    <div className="text-xs text-brand-gray">{client.primary_contact_email}</div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge status={client.status} label={client.status_display} />
                  </td>
                  <td className="px-5 py-4 text-brand-gray hidden lg:table-cell">
                    {format(new Date(client.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      to={`/admin/clients/${client.id}`}
                      className="text-brand-gold hover:text-brand-black transition-colors"
                    >
                      <ExternalLink size={15} />
                    </Link>
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
