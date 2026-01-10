'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/auth-context'
import { FilterBar } from '@/components/dashboard/filter-bar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  User, 
  Mail, 
  Bell, 
  Shield, 
  Download, 
  CreditCard, 
  Trash2, 
  Save,
  Camera,
  Check,
  X,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const { user, profile, supabase, refreshProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)

  // Preferences state
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smartifyAuto, setSmartifyAuto] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setEmail(profile.email || user?.email || '')
      setAvatarUrl(profile.avatar_url)
    }
  }, [profile, user])

  const handleSaveProfile = async () => {
    if (!user) return

    setIsLoading(true)
    setSaveStatus('saving')

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setSaveStatus('saved')
      setNotification({ type: 'success', message: 'Profile updated successfully' })
      setTimeout(() => {
        setSaveStatus('idle')
        setNotification(null)
      }, 3000)
    } catch (error: any) {
      console.error('[Settings] Error saving profile:', error)
      setSaveStatus('error')
      setNotification({ type: 'error', message: 'Failed to update profile. Please try again.' })
      setTimeout(() => {
        setSaveStatus('idle')
        setNotification(null)
      }, 4000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setNotification({ type: 'error', message: 'Please upload an image file' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setNotification({ type: 'error', message: 'Image size must be less than 5MB' })
      setTimeout(() => setNotification(null), 3000)
      return
    }

    setIsLoading(true)

    try {
      // Convert file to base64 for storage in database (simpler than storage bucket)
      const reader = new FileReader()
      reader.onloadend = async () => {
        try {
          const base64String = reader.result as string
          
          // Update profile with base64 image
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ avatar_url: base64String })
            .eq('id', user.id)

          if (updateError) throw updateError

          setAvatarUrl(base64String)
          await refreshProfile()
          setNotification({ type: 'success', message: 'Avatar updated successfully' })
          setTimeout(() => setNotification(null), 3000)
        } catch (error: any) {
          console.error('[Settings] Error updating avatar:', error)
          setNotification({ type: 'error', message: 'Failed to update avatar. Please try again.' })
          setTimeout(() => setNotification(null), 4000)
        } finally {
          setIsLoading(false)
        }
      }
      reader.onerror = () => {
        setNotification({ type: 'error', message: 'Failed to read image file.' })
        setTimeout(() => setNotification(null), 4000)
        setIsLoading(false)
      }
      reader.readAsDataURL(file)
    } catch (error: any) {
      console.error('[Settings] Error uploading avatar:', error)
      setNotification({ type: 'error', message: 'Failed to upload avatar. Please try again.' })
      setTimeout(() => setNotification(null), 4000)
      setIsLoading(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Fetch all user data
      const [notesData, recordingsData] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', user.id),
        supabase.from('recordings').select('*').eq('user_id', user.id)
      ])

      const exportData = {
        profile: profile,
        notes: notesData.data || [],
        recordings: recordingsData.data || [],
        exportedAt: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `foundernote-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setNotification({ type: 'success', message: 'Data exported successfully' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      console.error('[Settings] Error exporting data:', error)
      setNotification({ type: 'error', message: 'Failed to export data. Please try again.' })
      setTimeout(() => setNotification(null), 4000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id)

      if (error) throw error

      setAvatarUrl(null)
      await refreshProfile()
      setNotification({ type: 'success', message: 'Profile picture removed successfully' })
      setTimeout(() => setNotification(null), 3000)
    } catch (error: any) {
      console.error('[Settings] Error removing avatar:', error)
      setNotification({ type: 'error', message: 'Failed to remove profile picture. Please try again.' })
      setTimeout(() => setNotification(null), 4000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!user) return

    const confirmed = window.confirm(
      'Are you sure you want to permanently delete your account? This will immediately and irreversibly delete:\n\n' +
      '• All your notes and recordings\n' +
      '• All your action items, investor updates, and progress logs\n' +
      '• Your profile and account data\n\n' +
      'This action cannot be undone. Please confirm to proceed.'
    )

    if (!confirmed) return

    setIsLoading(true)
    try {
      // Get all recording IDs first
      const { data: recordings } = await supabase
        .from('recordings')
        .select('id')
        .eq('user_id', user.id)

      const recordingIds = recordings?.map(r => r.id) || []

      // Delete all user data in the correct order to respect foreign key constraints
      // Note: Due to CASCADE constraints, deleting recordings will auto-delete related items,
      // but we'll be explicit to ensure complete deletion

      // 1. Delete action items (references recordings via CASCADE, but being explicit)
      if (recordingIds.length > 0) {
        await supabase
          .from('action_items')
          .delete()
          .in('recording_id', recordingIds)
      }

      // 2. Delete investor updates
      if (recordingIds.length > 0) {
        await supabase
          .from('investor_updates')
          .delete()
          .in('recording_id', recordingIds)
      }

      // 3. Delete progress logs
      if (recordingIds.length > 0) {
        await supabase
          .from('progress_logs')
          .delete()
          .in('recording_id', recordingIds)
      }

      // 4. Delete product ideas
      if (recordingIds.length > 0) {
        await supabase
          .from('product_ideas')
          .delete()
          .in('recording_id', recordingIds)
      }

      // 5. Delete brain dump items (if table exists)
      if (recordingIds.length > 0) {
        try {
          await supabase
            .from('brain_dump')
            .delete()
            .in('recording_id', recordingIds)
        } catch (e) {
          // Table might not exist, continue
          console.log('[Settings] brain_dump table may not exist, continuing...')
        }
      }

      // 6. Delete recordings (CASCADE will handle related items, but we've been explicit above)
      await supabase
        .from('recordings')
        .delete()
        .eq('user_id', user.id)

      // 7. Delete notes (has CASCADE from user_id, but being explicit)
      await supabase
        .from('notes')
        .delete()
        .eq('user_id', user.id)

      // 8. Delete profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) throw profileError

      // 9. Sign out (this will clear the session)
      await supabase.auth.signOut()
      
      // 10. Redirect to home
      window.location.href = '/'
    } catch (error: any) {
      console.error('[Settings] Error deleting account:', error)
      setNotification({ type: 'error', message: 'Failed to delete account. Please contact support if this issue persists.' })
      setTimeout(() => setNotification(null), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const SettingSection = ({ 
    title, 
    description, 
    icon: Icon, 
    children 
  }: { 
    title: string
    description?: string
    icon: typeof User
    children: React.ReactNode
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 p-6 md:p-8 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-start gap-4 mb-6">
        <div className="p-2.5 rounded-lg bg-gray-100">
          <Icon className="h-5 w-5 text-black" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-black mb-1">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      </div>
      {children}
    </motion.div>
  )

  const SettingItem = ({ 
    label, 
    description, 
    children 
  }: { 
    label: string
    description?: string
    children: React.ReactNode
  }) => (
    <div className="mb-6 last:mb-0">
      <Label className="text-sm font-semibold text-black mb-1.5 block">{label}</Label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}
      {children}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* Filter Bar */}
      <FilterBar
        avatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        email={profile?.email}
        recordingsCount={profile?.recordings_count || 0}
      />

      <div className="max-w-4xl mx-auto space-y-6 pb-24">
        {/* Notification Banner */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={cn(
                "rounded-lg p-4 flex items-center justify-between shadow-md",
                notification.type === 'success' 
                  ? "bg-green-50 border border-green-200 text-green-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              )}
            >
              <div className="flex items-center gap-2">
                {notification.type === 'success' ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
                <span className="font-medium">{notification.message}</span>
              </div>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 hover:opacity-70 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Profile Section */}
        <SettingSection
          title="Profile"
          description="Update your personal information"
          icon={User}
        >
          <div className="space-y-6">
            {/* Avatar */}
            <SettingItem label="Profile Picture">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                      <User className="h-10 w-10 text-gray-400" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 flex gap-1">
                    <label
                      htmlFor="avatar-upload"
                      className="p-1.5 bg-[#BD6750] rounded-full cursor-pointer hover:bg-[#a55a45] transition-colors shadow-md"
                      title="Upload new picture"
                    >
                      <Camera className="h-4 w-4 text-white" />
                      <input
                        id="avatar-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                    {avatarUrl && (
                      <button
                        onClick={handleRemoveAvatar}
                        className="p-1.5 bg-red-500 rounded-full cursor-pointer hover:bg-red-600 transition-colors shadow-md"
                        title="Remove picture"
                        disabled={isLoading}
                      >
                        <XCircle className="h-4 w-4 text-white" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    {avatarUrl ? 'Update your profile picture' : 'Upload a new profile picture'}
                  </p>
                  <p className="text-xs text-gray-500">JPG, PNG or GIF. Max size 5MB</p>
                </div>
              </div>
            </SettingItem>

            {/* Display Name */}
            <SettingItem 
              label="Display Name"
              description="This is how your name appears in the app"
            >
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                className="max-w-md"
                disabled={isLoading}
              />
            </SettingItem>

            {/* Email */}
            <SettingItem 
              label="Email"
              description="Your email address (read-only)"
            >
              <Input
                value={email}
                disabled
                className="max-w-md bg-gray-50"
              />
            </SettingItem>

            {/* Save Button */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={handleSaveProfile}
                disabled={isLoading || saveStatus === 'saving'}
                className="bg-black hover:bg-gray-900 text-white"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Saved
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              {saveStatus === 'error' && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  <span>Failed to save</span>
                </div>
              )}
            </div>
          </div>
        </SettingSection>

        {/* Preferences Section */}
        <SettingSection
          title="Preferences"
          description="Customize your app experience"
          icon={Bell}
        >
          <div className="space-y-6">
            <SettingItem 
              label="Email Notifications"
              description="Receive email updates about your notes and recordings"
            >
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "relative w-11 h-6 rounded-full transition-colors duration-200",
                  emailNotifications ? "bg-[#BD6750]" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-md",
                    emailNotifications && "translate-x-5"
                  )} />
                </div>
                <span className="text-sm text-gray-700">
                  {emailNotifications ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </SettingItem>

            <SettingItem 
              label="Auto-Smartify"
              description="Automatically smartify notes after recording"
            >
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={smartifyAuto}
                  onChange={(e) => setSmartifyAuto(e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "relative w-11 h-6 rounded-full transition-colors duration-200",
                  smartifyAuto ? "bg-[#BD6750]" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-md",
                    smartifyAuto && "translate-x-5"
                  )} />
                </div>
                <span className="text-sm text-gray-700">
                  {smartifyAuto ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </SettingItem>

            <SettingItem 
              label="Auto-Save"
              description="Automatically save changes to your notes"
            >
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                  className="sr-only"
                />
                <div className={cn(
                  "relative w-11 h-6 rounded-full transition-colors duration-200",
                  autoSave ? "bg-[#BD6750]" : "bg-gray-300"
                )}>
                  <div className={cn(
                    "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 shadow-md",
                    autoSave && "translate-x-5"
                  )} />
                </div>
                <span className="text-sm text-gray-700">
                  {autoSave ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </SettingItem>
          </div>
        </SettingSection>

        {/* Privacy & Security Section */}
        <SettingSection
          title="Privacy & Security"
          description="Manage your account security and privacy settings"
          icon={Shield}
        >
          <div className="space-y-6">
            <SettingItem 
              label="Account Security"
              description="Your account is secured with Supabase Auth"
            >
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 text-green-600" />
                <span>Two-factor authentication available</span>
              </div>
            </SettingItem>

            <SettingItem 
              label="Data Privacy"
              description="We respect your privacy and never share your data"
            >
              <p className="text-sm text-gray-600">
                Your notes and recordings are encrypted and stored securely. 
                Only you have access to your data.
              </p>
            </SettingItem>
          </div>
        </SettingSection>

        {/* Data & Export Section */}
        <SettingSection
          title="Data & Export"
          description="Export or manage your data"
          icon={Download}
        >
          <div className="space-y-6">
            <SettingItem 
              label="Export Your Data"
              description="Download all your notes, recordings, and account data as JSON"
            >
              <Button
                onClick={handleExportData}
                disabled={isLoading}
                variant="outline"
                className="hover:bg-gray-50 hover:border-gray-300"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </SettingItem>
          </div>
        </SettingSection>

        {/* Billing Section */}
        <SettingSection
          title="Subscription"
          description="Manage your subscription and billing"
          icon={CreditCard}
        >
          <div className="space-y-6">
            <SettingItem 
              label="Current Plan"
              description="Your current subscription tier"
            >
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-semibold text-black">
                  {(profile as any)?.subscription_tier === 'pro' ? 'Pro' : 'Free'}
                </div>
                {(profile as any)?.subscription_tier !== 'pro' && (
                  <Button
                    className="bg-[#BD6750] hover:bg-[#a55a45] text-white"
                    onClick={() => window.location.href = '/pricing'}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            </SettingItem>
          </div>
        </SettingSection>

        {/* Account Deletion */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-red-50/80 backdrop-blur-xl rounded-2xl border-2 border-red-200/50 p-6 md:p-8"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className="p-2.5 rounded-lg bg-red-100">
              <Shield className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-red-900 mb-1">Account Management</h2>
              <p className="text-sm text-red-700">Permanent account deletion and data removal</p>
            </div>
          </div>

          <SettingItem 
            label="Permanent Account Deletion"
            description="This will permanently remove your account and all associated data including notes, recordings, action items, and profile information. This action is irreversible and cannot be undone."
          >
            <Button
              onClick={handleDeleteAccount}
              disabled={isLoading}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Account Permanently
            </Button>
          </SettingItem>
        </motion.div>
      </div>
    </motion.div>
  )
}

