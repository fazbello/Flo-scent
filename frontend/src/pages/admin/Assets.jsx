import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, Package, AlertTriangle } from 'lucide-react'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import PageHeader from '../../components/UI/PageHeader'
import { format, isPast, parseISO } from 'date-fns'

function fetchAssets(search, status) {
  return api.get('/assets/', { params: { search, status } }).then(r => r.data)
}

export default function Assets() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['assets', search, statusFilter],
    queryFn: () => fetchAssets(search, statusFilter),
  })

  const assets = data?.results || []

  return (
    <div className="space-y-5">
      <PageHeader
        title="Asset Tracking"
        subtitle="All installed Flo-scent equipment"
      />

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input className="input pl-9" placeholder="Search assets…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {['active', 'inactive', 'maintenance', 'retired'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : assets.length === 0 ? (
          <div className="text-center py-16">
            <Package size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-brand-gray">No assets tracked yet</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Asset</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden md:table-cell">Client</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Status</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Next Maintenance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assets.map(asset => {
                const isOverdue = asset.next_maintenance && isPast(parseISO(asset.next_maintenance))
                return (
                  <tr key={asset.id} className="hover:bg-brand-cream/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-brand-black">{asset.name}</p>
                      <p className="text-xs text-brand-gray">{asset.serial_number || 'No S/N'} · {asset.location_description}</p>
                    </td>
                    <td className="px-5 py-4 text-brand-gray hidden md:table-cell">{asset.client_name}</td>
                    <td className="px-5 py-4 text-brand-gray hidden lg:table-cell">{asset.asset_type_display}</td>
                    <td className="px-5 py-4">
                      <Badge status={asset.status} label={asset.status_display} />
                    </td>
                    <td className="px-5 py-4 hidden lg:table-cell">
                      {asset.next_maintenance ? (
                        <span className={isOverdue ? 'flex items-center gap-1 text-orange-600 font-medium' : 'text-brand-gray'}>
                          {isOverdue && <AlertTriangle size={12} />}
                          {format(parseISO(asset.next_maintenance), 'MMM d, yyyy')}
                          {isOverdue && ' (Overdue)'}
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
