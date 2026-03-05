import { useQuery } from '@tanstack/react-query'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Users, FileText, DollarSign, Package, AlertTriangle, TrendingUp } from 'lucide-react'
import api from '../../api/axios'
import StatCard from '../../components/UI/StatCard'
import Badge from '../../components/UI/Badge'
import { format } from 'date-fns'

function fetchStats() {
  return api.get('/dashboard/stats/').then(r => r.data)
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard-stats'], queryFn: fetchStats })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const d = data || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-black">Dashboard</h1>
        <p className="text-brand-gray text-sm mt-1">Overview of your Flo-scent business</p>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={`$${(d.revenue?.total || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          sub={`$${(d.revenue?.last_30d || 0).toLocaleString()} last 30 days`}
          icon={DollarSign}
          color="black"
        />
        <StatCard
          title="Active Clients"
          value={d.clients?.active || 0}
          sub={`${d.clients?.new_30d || 0} new this month`}
          icon={Users}
          color="gold"
        />
        <StatCard
          title="Quotes Accepted"
          value={d.quotes?.accepted || 0}
          sub={`${d.quotes?.acceptance_rate || 0}% acceptance rate`}
          icon={FileText}
          color="white"
        />
        <StatCard
          title="Assets Deployed"
          value={d.assets?.active || 0}
          sub={d.assets?.overdue_maintenance > 0
            ? `⚠ ${d.assets.overdue_maintenance} overdue maintenance`
            : 'All assets healthy'}
          icon={Package}
          color="white"
        />
      </div>

      {/* Revenue chart + Recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="xl:col-span-2 card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-brand-black">Revenue</h3>
              <p className="text-xs text-brand-gray">Last 6 months</p>
            </div>
            <TrendingUp size={18} className="text-brand-gold" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={d.revenue?.monthly_chart || []}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE8" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6B6B6B' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6B6B6B' }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2}
                fill="url(#revenueGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline summary */}
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-brand-black">Pipeline</h3>
          {[
            { label: 'Leads', value: d.clients?.onboarding || 0, status: 'onboarding' },
            { label: 'Quotes Pending', value: d.quotes?.pending || 0, status: 'sent' },
            { label: 'Proposals Out', value: d.proposals?.total || 0, status: 'sent' },
            { label: 'Accepted Proposals', value: d.proposals?.accepted || 0, status: 'accepted' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-brand-gray">{item.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-black">{item.value}</span>
                <Badge status={item.status} />
              </div>
            </div>
          ))}

          {d.assets?.overdue_maintenance > 0 && (
            <div className="mt-4 flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-2 rounded-lg text-sm">
              <AlertTriangle size={14} />
              {d.assets.overdue_maintenance} asset(s) overdue for maintenance
            </div>
          )}
        </div>
      </div>

      {/* Recent clients + payments */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-brand-black">Recent Clients</h3>
            <a href="/admin/clients" className="text-xs text-brand-gold hover:underline">View all →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {(d.recent_clients || []).map(c => (
              <div key={c.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-black">{c.company_name}</p>
                  <p className="text-xs text-brand-gray">{c.industry}</p>
                </div>
                <Badge status={c.status} />
              </div>
            ))}
            {!d.recent_clients?.length && (
              <p className="px-6 py-6 text-sm text-brand-gray text-center">No clients yet</p>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-brand-black">Recent Payments</h3>
            <a href="/admin/payments" className="text-xs text-brand-gold hover:underline">View all →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {(d.recent_payments || []).map(p => (
              <div key={p.id} className="px-6 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-brand-black">{p['client__company_name']}</p>
                  <p className="text-xs text-brand-gray">
                    {p.paid_at ? format(new Date(p.paid_at), 'MMM d, yyyy') : 'Pending'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-700">
                  ${parseFloat(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ))}
            {!d.recent_payments?.length && (
              <p className="px-6 py-6 text-sm text-brand-gray text-center">No payments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
