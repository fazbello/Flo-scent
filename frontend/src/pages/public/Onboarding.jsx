import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import axios from 'axios'
import { CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react'

const schema = z.object({
  company_name: z.string().min(2, 'Required'),
  industry: z.string().min(2, 'Required'),
  company_size: z.string().min(1, 'Required'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  primary_contact_name: z.string().min(2, 'Required'),
  primary_contact_email: z.string().email('Invalid email'),
  primary_contact_phone: z.string().optional(),
  business_type: z.string().min(1, 'Required'),
  number_of_locations: z.coerce.number().min(1),
  total_square_footage: z.coerce.number().optional(),
  scent_preferences: z.string().min(5, 'Please describe your preferences'),
  existing_scent_system: z.boolean().default(false),
  goals: z.string().min(10, 'Please describe your goals'),
  budget_range: z.string().min(1, 'Required'),
  timeline: z.string().min(2, 'Required'),
  additional_notes: z.string().optional(),
})

const STEPS = [
  { title: 'Your Business', fields: ['company_name', 'industry', 'company_size', 'website', 'city', 'state'] },
  { title: 'Contact Info', fields: ['primary_contact_name', 'primary_contact_email', 'primary_contact_phone'] },
  { title: 'Scent Goals', fields: ['business_type', 'number_of_locations', 'total_square_footage', 'scent_preferences', 'existing_scent_system', 'goals'] },
  { title: 'Budget & Timeline', fields: ['budget_range', 'timeline', 'additional_notes'] },
]

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, trigger, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { number_of_locations: 1, existing_scent_system: false },
  })

  const nextStep = async () => {
    const fields = STEPS[step].fields
    const valid = await trigger(fields)
    if (valid) setStep(s => s + 1)
  }

  const onSubmit = async (data) => {
    setSubmitting(true)
    try {
      await axios.post('/api/clients/onboard/', data)
      setSubmitted(true)
    } catch (e) {
      toast.error('Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center">
          <CheckCircle size={52} className="text-brand-gold mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-brand-black mb-3">You're all set!</h2>
          <p className="text-brand-gray mb-6">
            Thank you for your interest in Flo-scent. A member of our team will be in touch within 24 hours with a custom proposal.
          </p>
          <p className="text-sm text-brand-gold font-medium">Transform Spaces. Elevate Experiences.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col items-start justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">FLO-SCENT</h1>
          <p className="text-brand-gold text-sm mt-1 tracking-widest uppercase">Scent Marketing</p>
        </div>
        <div className="space-y-6">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Transform your space with scent.
          </h2>
          <p className="text-white/60 leading-relaxed">
            Join leading hotels, retailers, and offices that use Flo-scent's professional fragrance systems to create unforgettable experiences.
          </p>
          <div className="space-y-3">
            {['Custom scent development', 'Professional installation', 'Monthly maintenance & refills', 'Analytics & performance tracking'].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/70 text-sm">
                <span className="text-brand-gold">✦</span> {f}
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/30 text-xs">© 2024 Flo-scent. All rights reserved.</p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 bg-brand-cream flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              {STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${i < step ? 'bg-brand-gold text-white' : i === step ? 'bg-brand-black text-white' : 'bg-gray-200 text-brand-gray'}`}>
                    {i < step ? '✓' : i + 1}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-brand-gold' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
            <p className="text-sm text-brand-gray">Step {step + 1} of {STEPS.length} — <span className="font-medium text-brand-black">{STEPS[step].title}</span></p>
          </div>

          <div className="card p-8">
            <h2 className="text-xl font-bold text-brand-black mb-6">{STEPS[step].title}</h2>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Step 0 — Business */}
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Company Name *</label>
                    <input className="input" {...register('company_name')} placeholder="Acme Hotels" />
                    {errors.company_name && <p className="text-red-500 text-xs mt-1">{errors.company_name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Industry *</label>
                    <input className="input" {...register('industry')} placeholder="Hospitality, Retail, Healthcare…" />
                    {errors.industry && <p className="text-red-500 text-xs mt-1">{errors.industry.message}</p>}
                  </div>
                  <div>
                    <label className="label">Company Size *</label>
                    <select className="input" {...register('company_size')}>
                      <option value="">Select size…</option>
                      <option value="small">Small (1-10 employees)</option>
                      <option value="medium">Medium (11-50 employees)</option>
                      <option value="large">Large (51-200 employees)</option>
                      <option value="enterprise">Enterprise (200+ employees)</option>
                    </select>
                    {errors.company_size && <p className="text-red-500 text-xs mt-1">{errors.company_size.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">City</label>
                      <input className="input" {...register('city')} placeholder="Miami" />
                    </div>
                    <div>
                      <label className="label">State</label>
                      <input className="input" {...register('state')} placeholder="FL" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Website</label>
                    <input className="input" {...register('website')} placeholder="https://yourcompany.com" />
                  </div>
                </div>
              )}

              {/* Step 1 — Contact */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input" {...register('primary_contact_name')} placeholder="Jane Smith" />
                    {errors.primary_contact_name && <p className="text-red-500 text-xs mt-1">{errors.primary_contact_name.message}</p>}
                  </div>
                  <div>
                    <label className="label">Email Address *</label>
                    <input type="email" className="input" {...register('primary_contact_email')} placeholder="jane@company.com" />
                    {errors.primary_contact_email && <p className="text-red-500 text-xs mt-1">{errors.primary_contact_email.message}</p>}
                  </div>
                  <div>
                    <label className="label">Phone Number</label>
                    <input className="input" {...register('primary_contact_phone')} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              )}

              {/* Step 2 — Scent Goals */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Business Type *</label>
                    <select className="input" {...register('business_type')}>
                      <option value="">Select type…</option>
                      {[['hotel', 'Hotel / Hospitality'], ['retail', 'Retail'], ['office', 'Office / Corporate'],
                        ['restaurant', 'Restaurant / F&B'], ['gym', 'Gym / Fitness'], ['spa', 'Spa / Wellness'],
                        ['healthcare', 'Healthcare'], ['other', 'Other']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                    {errors.business_type && <p className="text-red-500 text-xs mt-1">{errors.business_type.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">No. of Locations *</label>
                      <input type="number" className="input" {...register('number_of_locations')} min="1" />
                    </div>
                    <div>
                      <label className="label">Sq. Footage</label>
                      <input type="number" className="input" {...register('total_square_footage')} placeholder="5000" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Scent Preferences *</label>
                    <textarea className="input resize-none h-20" {...register('scent_preferences')}
                      placeholder="Fresh and clean, woody, floral, warm — tell us your vibe!" />
                    {errors.scent_preferences && <p className="text-red-500 text-xs mt-1">{errors.scent_preferences.message}</p>}
                  </div>
                  <div>
                    <label className="label">Your Goals *</label>
                    <textarea className="input resize-none h-20" {...register('goals')}
                      placeholder="What do you hope to achieve? (e.g. increase dwell time, improve brand perception…)" />
                    {errors.goals && <p className="text-red-500 text-xs mt-1">{errors.goals.message}</p>}
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" {...register('existing_scent_system')} className="w-4 h-4 accent-brand-gold" />
                    <span className="text-sm text-brand-black">I already have a scent diffusion system</span>
                  </label>
                </div>
              )}

              {/* Step 3 — Budget */}
              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="label">Monthly Budget Range *</label>
                    <select className="input" {...register('budget_range')}>
                      <option value="">Select budget…</option>
                      <option value="under_500">Under $500/month</option>
                      <option value="500_1500">$500 – $1,500/month</option>
                      <option value="1500_5000">$1,500 – $5,000/month</option>
                      <option value="over_5000">$5,000+/month</option>
                    </select>
                    {errors.budget_range && <p className="text-red-500 text-xs mt-1">{errors.budget_range.message}</p>}
                  </div>
                  <div>
                    <label className="label">Timeline *</label>
                    <input className="input" {...register('timeline')} placeholder="ASAP, within 3 months, Q3 2025…" />
                    {errors.timeline && <p className="text-red-500 text-xs mt-1">{errors.timeline.message}</p>}
                  </div>
                  <div>
                    <label className="label">Anything else we should know?</label>
                    <textarea className="input resize-none h-24" {...register('additional_notes')}
                      placeholder="Any specific requirements, existing contracts, or questions…" />
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between mt-8">
                {step > 0 ? (
                  <button type="button" onClick={() => setStep(s => s - 1)} className="btn-ghost flex items-center gap-1">
                    <ChevronLeft size={16} /> Back
                  </button>
                ) : <div />}

                {step < STEPS.length - 1 ? (
                  <button type="button" onClick={nextStep} className="btn-primary flex items-center gap-1">
                    Continue <ChevronRight size={16} />
                  </button>
                ) : (
                  <button type="submit" disabled={submitting} className="btn-gold px-8 flex items-center gap-2">
                    {submitting ? 'Submitting…' : 'Submit Inquiry'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
