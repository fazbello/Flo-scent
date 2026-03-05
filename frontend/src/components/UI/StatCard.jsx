import { clsx } from 'clsx'

export default function StatCard({ title, value, sub, icon: Icon, trend, color = 'black' }) {
  const colors = {
    black: 'bg-brand-black text-white',
    gold: 'bg-brand-gold text-white',
    white: 'bg-white text-brand-black border border-gray-100',
    green: 'bg-emerald-50 text-emerald-900',
  }

  return (
    <div className={clsx('rounded-xl p-6 shadow-sm', colors[color])}>
      <div className="flex items-start justify-between mb-4">
        <p className={clsx('text-sm font-medium opacity-80')}>{title}</p>
        {Icon && (
          <div className={clsx('p-2 rounded-lg', color === 'white' ? 'bg-brand-gray-light' : 'bg-white/15')}>
            <Icon size={18} className={color === 'white' ? 'text-brand-gold' : 'text-white'} />
          </div>
        )}
      </div>
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="text-sm opacity-70 mt-1">{sub}</p>}
      {trend !== undefined && (
        <p className={clsx('text-xs mt-2 font-medium', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
        </p>
      )}
    </div>
  )
}
