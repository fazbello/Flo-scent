import { clsx } from 'clsx'

const variants = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-600',
  onboarding: 'bg-blue-100 text-blue-800',
  lead: 'bg-purple-100 text-purple-800',
  draft: 'bg-gray-100 text-gray-700',
  sent: 'bg-blue-100 text-blue-800',
  viewed: 'bg-indigo-100 text-indigo-800',
  accepted: 'bg-green-100 text-green-800',
  declined: 'bg-red-100 text-red-800',
  expired: 'bg-orange-100 text-orange-800',
  succeeded: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-orange-100 text-orange-800',
  retired: 'bg-gray-200 text-gray-500',
  default: 'bg-gray-100 text-gray-700',
}

export default function Badge({ status, label }) {
  const key = status?.toLowerCase()
  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variants[key] || variants.default
    )}>
      {label || status}
    </span>
  )
}
