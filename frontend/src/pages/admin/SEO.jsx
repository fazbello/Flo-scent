import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Globe, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import PageHeader from '../../components/UI/PageHeader'
import { format } from 'date-fns'

function fetchPages(search, type) {
  return api.get('/seo/', { params: { search, page_type: type } }).then(r => r.data)
}

export default function SEO() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editPage, setEditPage] = useState(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['seo-pages', search, typeFilter],
    queryFn: () => fetchPages(search, typeFilter),
  })

  const deletePage = useMutation({
    mutationFn: (id) => api.delete(`/seo/${id}/`),
    onSuccess: () => { qc.invalidateQueries(['seo-pages']); toast.success('Page deleted') },
  })

  const togglePublish = useMutation({
    mutationFn: ({ id, published }) => api.patch(`/seo/${id}/`, { is_published: !published }),
    onSuccess: () => qc.invalidateQueries(['seo-pages']),
  })

  const pages = data?.results || []

  return (
    <div className="space-y-5">
      <PageHeader
        title="SEO Management"
        subtitle="Manage page titles, meta descriptions, and content"
        action={
          <button onClick={() => { setEditPage(null); setShowForm(true) }} className="btn-gold flex items-center gap-2">
            <Plus size={16} /> Add Page
          </button>
        }
      />

      {/* Sitemap link */}
      <div className="card p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-brand-black">XML Sitemap</p>
          <p className="text-xs text-brand-gray">Auto-generated from your sitemap entries</p>
        </div>
        <a href="/api/seo/sitemap.xml" target="_blank"
          className="btn-outline flex items-center gap-2 text-sm py-2">
          <Globe size={14} /> View Sitemap
        </a>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray" />
          <input className="input pl-9" placeholder="Search pages…" value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
          <option value="">All types</option>
          {['service', 'blog', 'landing', 'location'].map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-6 h-6 border-4 border-brand-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-16">
            <Globe size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-brand-gray">No SEO pages yet. Use AI Tools to generate content.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-cream border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Page</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden md:table-cell">Slug</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide hidden lg:table-cell">Type</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-brand-gray uppercase tracking-wide">Published</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pages.map(page => (
                <tr key={page.id} className="hover:bg-brand-cream/50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-medium text-brand-black">{page.title}</p>
                    <p className="text-xs text-brand-gray line-clamp-1">{page.meta_description}</p>
                    {page.ai_generated && <span className="text-xs text-purple-600">✦ AI generated</span>}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-brand-gray hidden md:table-cell">/{page.slug}</td>
                  <td className="px-5 py-4 text-brand-gray hidden lg:table-cell capitalize">{page.page_type}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => togglePublish.mutate({ id: page.id, published: page.is_published })}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                        ${page.is_published ? 'bg-brand-gold' : 'bg-gray-200'}`}
                    >
                      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform
                        ${page.is_published ? 'translate-x-4' : 'translate-x-1'}`} />
                    </button>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button onClick={() => deletePage.mutate(page.id)}
                        className="text-brand-gray hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
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
