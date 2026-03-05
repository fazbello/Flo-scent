import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Send, Download, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import { format } from 'date-fns'

export default function QuoteDetail() {
  const { id } = useParams()
  const qc = useQueryClient()

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => api.get(`/quotes/${id}/`).then(r => r.data),
  })

  const send = useMutation({
    mutationFn: () => api.post(`/quotes/${id}/send/`),
    onSuccess: () => { qc.invalidateQueries(['quote', id]); toast.success('Quote sent!') },
  })

  const generateProposal = useMutation({
    mutationFn: () => api.post('/ai/generate-proposal/', {
      client_id: quote?.client,
      quote_id: id,
      title: `Proposal for ${quote?.title}`,
    }),
    onSuccess: () => toast.success('AI Proposal generated! Check Proposals.'),
    onError: () => toast.error('Generation failed'),
  })

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const q = quote

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/admin/quotes" className="text-brand-gray hover:text-brand-black">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-black">{q.title}</h1>
            <Badge status={q.status} label={q.status_display} />
          </div>
          <p className="text-brand-gray text-sm font-mono">{q.quote_number} · {q.client_name}</p>
        </div>
        <div className="flex gap-2">
          {q.status === 'draft' && (
            <button onClick={() => send.mutate()} className="btn-primary flex items-center gap-2">
              <Send size={14} /> Send Quote
            </button>
          )}
          <button
            onClick={() => generateProposal.mutate()}
            disabled={generateProposal.isPending}
            className="btn-gold flex items-center gap-2"
          >
            <Sparkles size={14} />
            {generateProposal.isPending ? 'Generating...' : 'AI Proposal'}
          </button>
        </div>
      </div>

      {/* Quote card */}
      <div className="card overflow-hidden">
        {/* Header */}
        <div className="bg-brand-black px-8 py-6 text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-brand-gold font-semibold text-lg tracking-wide">FLO-SCENT</p>
              <p className="text-white/60 text-sm">Transform Spaces. Elevate Experiences.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{q.quote_number}</p>
              {q.valid_until && (
                <p className="text-white/60 text-sm">Valid until {format(new Date(q.valid_until), 'MMM d, yyyy')}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="px-8 py-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 text-brand-gray font-medium">Description</th>
                <th className="text-right py-3 text-brand-gray font-medium">Qty</th>
                <th className="text-right py-3 text-brand-gray font-medium">Unit Price</th>
                <th className="text-right py-3 text-brand-gray font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {q.items?.map(item => (
                <tr key={item.id} className="border-b border-gray-50">
                  <td className="py-3 text-brand-black">
                    {item.description}
                    {item.notes && <p className="text-xs text-brand-gray mt-0.5">{item.notes}</p>}
                  </td>
                  <td className="py-3 text-right text-brand-gray">{item.quantity}</td>
                  <td className="py-3 text-right text-brand-gray">${parseFloat(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                  <td className="py-3 text-right font-medium text-brand-black">${parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-brand-gray">Subtotal</span>
                <span>${parseFloat(q.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              {q.discount_percent > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount ({q.discount_percent}%)</span>
                  <span>-${(parseFloat(q.subtotal) * parseFloat(q.discount_percent) / 100).toFixed(2)}</span>
                </div>
              )}
              {q.tax_percent > 0 && (
                <div className="flex justify-between text-brand-gray">
                  <span>Tax ({q.tax_percent}%)</span>
                  <span></span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-bold text-brand-black">
                <span>Total</span>
                <span>${parseFloat(q.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
              <p className="text-xs text-brand-gray text-right capitalize">Billed {q.billing_cycle_display}</p>
            </div>
          </div>

          {q.notes && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-brand-gray uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-brand-black">{q.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
