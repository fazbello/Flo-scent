import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, MessageSquare, FileText, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../api/axios'
import PageHeader from '../../components/UI/PageHeader'

function fetchClients() {
  return api.get('/clients/', { params: { status: 'onboarding' } }).then(r => r.data)
}

export default function AITools() {
  const [activeTab, setActiveTab] = useState('proposal')
  const [clientId, setClientId] = useState('')
  const [quoteId, setQuoteId] = useState('')
  const [proposalTitle, setProposalTitle] = useState('')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState(null)

  // Chat state
  const [chatHistory, setChatHistory] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // SEO state
  const [seoPageType, setSeoPageType] = useState('service page')
  const [seoContext, setSeoContext] = useState('')
  const [seoResult, setSeoResult] = useState(null)

  const { data: clientsData } = useQuery({ queryKey: ['clients-ai'], queryFn: fetchClients })
  const clients = clientsData?.results || []

  const generateProposal = async () => {
    if (!clientId) return toast.error('Select a client')
    setGenerating(true)
    setResult(null)
    try {
      const res = await api.post('/ai/generate-proposal/', {
        client_id: parseInt(clientId),
        quote_id: quoteId ? parseInt(quoteId) : undefined,
        title: proposalTitle || 'Scent Marketing Proposal',
      })
      setResult(res.data)
      toast.success('Proposal generated and saved!')
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const generateQuote = async () => {
    if (!clientId) return toast.error('Select a client')
    setGenerating(true)
    setResult(null)
    try {
      const res = await api.post('/ai/generate-quote/', { client_id: parseInt(clientId) })
      setResult(res.data)
      toast.success('Quote suggestions generated!')
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const userMsg = { role: 'user', content: chatInput }
    setChatHistory(h => [...h, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await api.post('/ai/chat/', {
        message: chatInput,
        history: chatHistory,
      })
      setChatHistory(h => [...h, { role: 'assistant', content: res.data.reply }])
    } catch {
      toast.error('Chat failed')
    } finally {
      setChatLoading(false)
    }
  }

  const generateSEO = async () => {
    setGenerating(true)
    setSeoResult(null)
    try {
      const contextObj = { description: seoContext }
      const res = await api.post('/ai/generate-seo/', { page_type: seoPageType, context: contextObj })
      setSeoResult(res.data)
      toast.success('SEO content generated!')
    } catch (e) {
      toast.error('SEO generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const TABS = [
    { id: 'proposal', label: 'AI Proposal', icon: Sparkles },
    { id: 'quote', label: 'AI Quote', icon: FileText },
    { id: 'seo', label: 'AI SEO', icon: Search },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="AI Tools" subtitle="Powered by Claude — Anthropic's most capable AI" />

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 w-fit shadow-sm">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.id ? 'bg-brand-black text-white' : 'text-brand-gray hover:text-brand-black'}`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Proposal Generator */}
      {activeTab === 'proposal' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-brand-black">Generate AI Proposal</h3>
            <p className="text-sm text-brand-gray">Claude will write a full, personalized proposal based on the client's onboarding data.</p>
            <div>
              <label className="label">Client</label>
              <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">Select a client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Proposal Title (optional)</label>
              <input className="input" placeholder="Scent Marketing Proposal" value={proposalTitle}
                onChange={e => setProposalTitle(e.target.value)} />
            </div>
            <div>
              <label className="label">Link to Quote ID (optional)</label>
              <input className="input" placeholder="Quote ID" value={quoteId}
                onChange={e => setQuoteId(e.target.value)} />
            </div>
            <button onClick={generateProposal} disabled={generating || !clientId} className="btn-gold w-full flex items-center justify-center gap-2">
              <Sparkles size={15} />
              {generating ? 'Generating with Claude…' : 'Generate Proposal'}
            </button>
          </div>
          {result && (
            <div className="card p-6 space-y-3 overflow-y-auto max-h-[600px]">
              <h3 className="font-semibold text-brand-black">Generated: {result.title}</h3>
              <p className="text-xs text-brand-gold font-mono">{result.proposal_number}</p>
              {['executive_summary', 'problem_statement', 'our_solution', 'implementation_timeline'].map(k => (
                result[k] && (
                  <div key={k} className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-brand-gray uppercase tracking-wide mb-1">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-brand-black whitespace-pre-line line-clamp-4">{result[k]}</p>
                  </div>
                )
              ))}
              <a href="/admin/proposals" className="text-sm text-brand-gold hover:underline block">View in Proposals →</a>
            </div>
          )}
        </div>
      )}

      {/* Quote Generator */}
      {activeTab === 'quote' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-brand-black">AI Quote Suggestions</h3>
            <p className="text-sm text-brand-gray">Claude will suggest appropriate line items and pricing based on the client's onboarding form.</p>
            <div>
              <label className="label">Client</label>
              <select className="input" value={clientId} onChange={e => setClientId(e.target.value)}>
                <option value="">Select a client…</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <button onClick={generateQuote} disabled={generating || !clientId} className="btn-gold w-full flex items-center justify-center gap-2">
              <Sparkles size={15} />
              {generating ? 'Generating…' : 'Generate Quote Suggestions'}
            </button>
          </div>
          {result?.items && (
            <div className="card p-6 space-y-3">
              <h3 className="font-semibold text-brand-black">Suggested Line Items</h3>
              <p className="text-xs text-brand-gray mb-3">Review and use these in a new Quote.</p>
              {result.items.map((item, i) => (
                <div key={i} className="flex justify-between items-start border-b border-gray-50 py-2 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-brand-black">{item.description}</p>
                    {item.notes && <p className="text-xs text-brand-gray">{item.notes}</p>}
                    <p className="text-xs text-brand-gray">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-semibold text-brand-black ml-4">
                    ${parseFloat(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-brand-black">
                <span>Est. Total</span>
                <span>${result.items.reduce((s, i) => s + i.unit_price * i.quantity, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEO Generator */}
      {activeTab === 'seo' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h3 className="font-semibold text-brand-black">AI SEO Content</h3>
            <p className="text-sm text-brand-gray">Generate SEO-optimized page content for your Flo-scent website.</p>
            <div>
              <label className="label">Page Type</label>
              <select className="input" value={seoPageType} onChange={e => setSeoPageType(e.target.value)}>
                {['service page', 'blog post', 'landing page', 'location page', 'homepage'].map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Context / Topic</label>
              <textarea className="input resize-none h-24" placeholder="E.g. Scent marketing for hotels in Miami, FL…"
                value={seoContext} onChange={e => setSeoContext(e.target.value)} />
            </div>
            <button onClick={generateSEO} disabled={generating} className="btn-gold w-full flex items-center justify-center gap-2">
              <Search size={15} />
              {generating ? 'Generating…' : 'Generate SEO Content'}
            </button>
          </div>
          {seoResult && (
            <div className="card p-6 space-y-4">
              <h3 className="font-semibold text-brand-black">Generated SEO Content</h3>
              {[
                ['Title Tag', seoResult.title],
                ['Meta Description', seoResult.meta_description],
                ['H1 Heading', seoResult.h1],
                ['Intro Paragraph', seoResult.intro_paragraph],
              ].map(([label, value]) => (
                <div key={label} className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
                  <p className="text-xs text-brand-gray uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-brand-black">{value}</p>
                </div>
              ))}
              {seoResult.keywords?.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-brand-gray uppercase tracking-wide mb-2">Target Keywords</p>
                  <div className="flex flex-wrap gap-2">
                    {seoResult.keywords.map(k => (
                      <span key={k} className="bg-brand-cream text-brand-black text-xs px-2 py-1 rounded-lg">{k}</span>
                    ))}
                  </div>
                </div>
              )}
              <a href="/admin/seo" className="text-sm text-brand-gold hover:underline block">Save to SEO Pages →</a>
            </div>
          )}
        </div>
      )}

      {/* Chat */}
      {activeTab === 'chat' && (
        <div className="card p-6 max-w-2xl">
          <h3 className="font-semibold text-brand-black mb-4">AI Client Chat Simulator</h3>
          <p className="text-sm text-brand-gray mb-4">Test how the AI chat assistant will respond to client questions on your website.</p>
          <div className="bg-brand-cream rounded-xl p-4 h-72 overflow-y-auto space-y-3 mb-4">
            {chatHistory.length === 0 && (
              <p className="text-sm text-brand-gray text-center py-8">Start a conversation…</p>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs rounded-xl px-4 py-2.5 text-sm
                  ${msg.role === 'user' ? 'bg-brand-black text-white' : 'bg-white text-brand-black border border-gray-100'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-sm text-brand-gray">
                  Thinking…
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="input flex-1"
              placeholder="Ask about scent marketing services…"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
            />
            <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} className="btn-primary">
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
