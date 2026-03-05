import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuthStore } from '../../store/authStore'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import PageHeader from '../../components/UI/PageHeader'

export default function Settings() {
  const { user, updateUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)

  const profileForm = useForm({ defaultValues: { first_name: user?.first_name, last_name: user?.last_name, phone: user?.phone } })
  const pwForm = useForm()

  const saveProfile = async (data) => {
    setLoading(true)
    try {
      const res = await api.patch('/auth/me/', data)
      updateUser(res.data)
      toast.success('Profile updated')
    } catch {
      toast.error('Update failed')
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (data) => {
    if (data.new_password !== data.confirm_password) {
      return toast.error('Passwords do not match')
    }
    setPwLoading(true)
    try {
      await api.post('/auth/change-password/', { old_password: data.old_password, new_password: data.new_password })
      toast.success('Password updated')
      pwForm.reset()
    } catch (e) {
      toast.error(e?.response?.data?.old_password || 'Password change failed')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader title="Settings" subtitle="Manage your account and preferences" />

      {/* Profile */}
      <div className="card p-6">
        <h3 className="font-semibold text-brand-black mb-5">Profile</h3>
        <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input" {...profileForm.register('first_name', { required: true })} />
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input" {...profileForm.register('last_name', { required: true })} />
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-brand-cream" value={user?.email} disabled />
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" {...profileForm.register('phone')} placeholder="+1 (555) 000-0000" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Saving…' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="font-semibold text-brand-black mb-5">Change Password</h3>
        <form onSubmit={pwForm.handleSubmit(changePassword)} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input type="password" className="input" {...pwForm.register('old_password', { required: true })} />
          </div>
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" {...pwForm.register('new_password', { required: true, minLength: 8 })} />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input type="password" className="input" {...pwForm.register('confirm_password', { required: true })} />
          </div>
          <button type="submit" disabled={pwLoading} className="btn-primary">
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Role info */}
      <div className="card p-6">
        <h3 className="font-semibold text-brand-black mb-3">Account Details</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-brand-gray">Role</span>
            <span className="font-medium text-brand-black capitalize">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-brand-gray">Member since</span>
            <span className="font-medium text-brand-black">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
