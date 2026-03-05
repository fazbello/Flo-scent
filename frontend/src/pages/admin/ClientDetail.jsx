import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Sparkles, FileText, FileCheck, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import Badge from '../../components/UI/Badge'
import { format } from 'date-fns'

function fetchClient(id) {
  return api.get(`/clients/${id}/`).then(r => r.data)
}

export default function ClientDetail() {
  const { id } = useParams()
  const qc = useQueryClient()
  const [note, setNote] = useState('')
  const [generating, setGenerating] = useState(false)

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: () => fetchClient(id),
  })

  const { data: notesData } = useQuery({
    queryKey: ['client-notes', id],
    queryFn: () => api.get(`/clients/${id}/notes/`).then(r => r.data),
  })

  const addNote = useMutation({
    mutationFn: (content) => api.post(`/clients/${id}/notes/`, { content }),
    onSuccess: () => {
      qc.invalidateQueries(['client-notes', id])
      setNote('')
      toast.success('Note added')
    },
  })

  const updateStatus = useMutation({
    mutationFn: (status) => api.patch(`/clients/${id}/status/`, { status }),
    onSuccess: () => {
      qc.invalidateQueries(['client', id])
      toast.success('Status updated')
    },
  })

  const generateProposal = async () => {
    setGenerating(true)
    try {
      await api.post('/ai/generate-proposal/', { client_id: id, title: `Scent Marketing Proposal – ${client.company_name}` })
      toast.success('AI proposal generated! Check Proposals.')
    } catch (e) {
      toast.error('Generation failed. Check AI settings.')
    } finally {
      setGenerating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const ob = client?.onboarding

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/admin/clients" className="text-brand-gray hover:text-brand-black">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-black">{client.company_name}</h1>
            <Badge status={client.status} label={client.status_display} />
          </div>
          <p className="text-brand-gray text-sm">{client.industry} · {client.city}{client.state ? `, ${client.state}` : ''}</p>
        </div>
        <button
          onClick={generateProposal}
          disabled={generating}
          className="btn-gold flex items-center gap-2"
        >
          <Sparkles size={15} />
          {generating ? 'Generating...' : 'AI Proposal'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="xl:col-span-2 space-y-5">
          {/* Contact info */}
          <div className="card p-6">
            <h3 className="font-semibold text-brand-black mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {[
                ['Contact', client.primary_contact_name],
                ['Email', client.primary_contact_email],
                ['Phone', client.primary_contact_phone || '—'],
                ['Website', client.website || '—'],
                ['Company Size', client.company_size],
                ['Country', client.country],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-brand-gray text-xs uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-brand-black font-medium">{value}</p>
                </div>
              ))}
            </div>
            {/* Status update */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <p className="text-xs text-brand-gray uppercase tracking-wide mb-2">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {['lead', 'onboarding', 'active', 'inactive'].map(s => (
                  <button
                    key={s}
                    onClick={() => updateStatus.mutate(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors
                      ${client.status === s
                        ? 'bg-brand-black text-white'
                        : 'bg-brand-gray-light text-brand-gray hover:bg-brand-gold hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Onboarding form */}
          {ob && (
            <div className="card p-6">
              <h3 className="font-semibold text-brand-black mb-4">Onboarding Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {[
                  ['Business Type', ob.business_type],
                  ['Locations', ob.number_of_locations],
                  ['Square Footage', ob.total_square_footage ? `${ob.total_square_footage} sq ft` : '—'],
                  ['Budget', ob.budget_range],
                  ['Timeline', ob.timeline],
                  ['Has Existing System', ob.existing_scent_system ? 'Yes' : 'No'],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-brand-gray text-xs uppercase tracking-wide mb-1">{label}</p>
                    <p className="text-brand-black font-medium">{value}</p>
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <p className="text-brand-gray text-xs uppercase tracking-wide mb-1">Goals</p>
                  <p className="text-brand-black">{ob.goals}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-brand-gray text-xs uppercase tracking-wide mb-1">Scent Preferences</p>
                  <p className="text-brand-black">{ob.scent_preferences}</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="grid grid-cols-3 gap-3">
            <Link to={`/admin/quotes?client=${id}`} className="card p-4 flex flex-col items-center gap-2 hover:border-brand-gold transition-colors text-center">
              <FileText size={20} className="text-brand-gold" />
              <span className="text-sm font-medium text-brand-black">Quotes</span>
            </Link>
            <Link to={`/admin/proposals?client=${id}`} className="card p-4 flex flex-col items-center gap-2 hover:border-brand-gold transition-colors text-center">
              <FileCheck size={20} className="text-brand-gold" />
              <span className="text-sm font-medium text-brand-black">Proposals</span>
            </Link>
            <Link to={`/admin/assets?client=${id}`} className="card p-4 flex flex-col items-center gap-2 hover:border-brand-gold transition-colors text-center">
              <Package size={20} className="text-brand-gold" />
              <span className="text-sm font-medium text-brand-black">Assets</span>
            </Link>
          </div>
        </div>

        {/* Notes sidebar */}
        <div className="card p-5 flex flex-col h-fit max-h-[600px]">
          <h3 className="font-semibold text-brand-black mb-4">Notes</h3>
          <div className="flex-1 overflow-y-auto space-y-3 mb-4">
            {(notesData?.results || []).map(n => (
              <div key={n.id} className="bg-brand-cream rounded-lg p-3">
                <p className="text-sm text-brand-black">{n.content}</p>
                <p className="text-xs text-brand-gray mt-2">
                  {n.author_name} · {format(new Date(n.created_at), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
            {!notesData?.results?.length && (
              <p className="text-sm text-brand-gray text-center py-4">No notes yet</p>
            )}
          </div>
          <div className="space-y-2">
            <textarea
              className="input resize-none h-20"
              placeholder="Add a note…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button
              onClick={() => note.trim() && addNote.mutate(note)}
              disabled={!note.trim() || addNote.isPending}
              className="btn-primary w-full text-sm"
            >
              Add Note
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
