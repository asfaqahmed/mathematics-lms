import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { motion } from 'framer-motion'
import {
  FiSettings, FiSave, FiDollarSign, FiMail,
  FiCreditCard, FiGlobe, FiBell, FiShield,
  FiDatabase, FiKey, FiToggleLeft, FiToggleRight,
  FiInfo, FiAlertCircle, FiCheck
} from 'react-icons/fi'
import { FaWhatsapp, FaPaypal } from 'react-icons/fa'
import { supabase, isAdmin } from '../../lib/supabase'
import AdminLayout from '../../components/admin/AdminLayout'
import toast from 'react-hot-toast'

export default function AdminSettings({ user }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  
  const [settings, setSettings] = useState({
    general: {
      siteName: 'MathPro Academy',
      siteUrl: 'https://mathpro.lk',
      supportEmail: 'support@mathpro.lk',
      adminEmail: 'admin@mathpro.lk',
      timezone: 'Asia/Colombo',
      currency: 'LKR',
      language: 'en'
    },
    payment: {
      payhere: {
        enabled: true,
        merchantId: '',
        merchantSecret: '',
        sandbox: true
      },
      stripe: {
        enabled: true,
        publishableKey: '',
        secretKey: '',
        webhookSecret: ''
      },
      bank: {
        enabled: true,
        bankName: '',
        accountNumber: '',
        accountName: '',
        branch: '',
        swiftCode: ''
      }
    },
    email: {
      provider: 'smtp',
      smtp: {
        host: '',
        port: 465,
        secure: true,
        user: '',
        pass: ''
      },
      fromEmail: '',
      fromName: '',
      replyTo: ''
    },
    notifications: {
      newUserAlert: true,
      newPaymentAlert: true,
      lowStockAlert: false,
      dailyReport: true,
      weeklyReport: false,
      monthlyReport: true
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
      passwordPolicy: 'medium',
      maxLoginAttempts: 5,
      ipWhitelist: false,
      allowedIPs: ''
    },
    maintenance: {
      enabled: false,
      message: 'We are currently performing maintenance. Please check back later.',
      allowAdminAccess: true
    }
  })
  
  const tabs = [
    { id: 'general', label: 'General', icon: FiSettings },
    { id: 'payment', label: 'Payment', icon: FiCreditCard },
    { id: 'email', label: 'Email', icon: FiMail },
    { id: 'notifications', label: 'Notifications', icon: FiBell },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'maintenance', label: 'Maintenance', icon: FiAlertCircle }
  ]
  
  useEffect(() => {
    checkAdminAccess()
  }, [user])
  
  const checkAdminAccess = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    
    const adminStatus = await isAdmin(user.id)
    if (!adminStatus) {
      toast.error('Access denied. Admin only.')
      router.push('/')
      return
    }
    
    loadSettings()
  }
  
  const loadSettings = async () => {
    try {
      // In a real app, you would fetch these from a settings table
      // For now, we'll use the environment variables
      setSettings({
        ...settings,
        general: {
          ...settings.general,
          siteName: process.env.NEXT_PUBLIC_APP_NAME || 'MathPro Academy',
          siteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://mathpro.lk'
        },
        payment: {
          ...settings.payment,
          payhere: {
            enabled: true,
            merchantId: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '',
            merchantSecret: '********', // Hidden for security
            sandbox: process.env.NEXT_PUBLIC_PAYHERE_SANDBOX === 'true'
          },
          stripe: {
            enabled: true,
            publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
            secretKey: '********', // Hidden for security
            webhookSecret: '********'
          },
          bank: {
            enabled: true,
            bankName: process.env.NEXT_PUBLIC_BANK_NAME || '',
            accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT || '',
            accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || '',
            branch: process.env.NEXT_PUBLIC_BANK_BRANCH || '',
            swiftCode: process.env.NEXT_PUBLIC_BANK_SWIFT || ''
          }
        },
        email: {
          ...settings.email,
          smtp: {
            host: process.env.SMTP_HOST || '',
            port: parseInt(process.env.SMTP_PORT) || 465,
            secure: true,
            user: process.env.SMTP_USER || '',
            pass: '********'
          },
          fromEmail: process.env.SMTP_FROM || '',
          fromName: process.env.NEXT_PUBLIC_APP_NAME || ''
        }
      })
    } catch (error) {
      console.error('Error loading settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }
  
  const saveSettings = async () => {
    setSaving(true)
    
    try {
      // In a real app, you would save these to a settings table
      // For demonstration, we'll just show a success message
      
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      toast.success('Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }
  
  const updateSetting = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }))
  }
  
  const updateNestedSetting = (category, subcategory, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [subcategory]: {
          ...prev[category][subcategory],
          [field]: value
        }
      }
    }))
  }
  
  if (!user) return null
  
  return (
    <AdminLayout user={user}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-white mb-2">
              Settings
            </h1>
            <p className="text-gray-400">
              Configure your platform settings and preferences
            </p>
          </div>
          
          <button
            onClick={saveSettings}
            disabled={saving}
            className="btn-primary flex items-center space-x-2"
          >
            {saving ? (
              <div className="spinner w-5 h-5 border-2"></div>
            ) : (
              <>
                <FiSave />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Tabs Sidebar */}
            <div className="lg:col-span-1">
              <div className="card p-2">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                      activeTab === tab.id
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Settings Content */}
            <div className="lg:col-span-3">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="card"
              >
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">General Settings</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={settings.general.siteName}
                          onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Site URL
                        </label>
                        <input
                          type="url"
                          value={settings.general.siteUrl}
                          onChange={(e) => updateSetting('general', 'siteUrl', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Support Email
                        </label>
                        <input
                          type="email"
                          value={settings.general.supportEmail}
                          onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Admin Email
                        </label>
                        <input
                          type="email"
                          value={settings.general.adminEmail}
                          onChange={(e) => updateSetting('general', 'adminEmail', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Timezone
                        </label>
                        <select
                          value={settings.general.timezone}
                          onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                          className="input w-full"
                        >
                          <option value="Asia/Colombo">Asia/Colombo</option>
                          <option value="UTC">UTC</option>
                          <option value="America/New_York">America/New_York</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Currency
                        </label>
                        <select
                          value={settings.general.currency}
                          onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                          className="input w-full"
                        >
                          <option value="LKR">LKR - Sri Lankan Rupee</option>
                          <option value="USD">USD - US Dollar</option>
                          <option value="EUR">EUR - Euro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment Settings */}
                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Payment Settings</h3>
                    
                    {/* PayHere */}
                    <div className="p-4 bg-dark-700 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white">PayHere Configuration</h4>
                        <button
                          onClick={() => updateNestedSetting('payment', 'payhere', 'enabled', !settings.payment.payhere.enabled)}
                          className={`${settings.payment.payhere.enabled ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.payment.payhere.enabled ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </div>
                      
                      {settings.payment.payhere.enabled && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Merchant ID
                            </label>
                            <input
                              type="password"
                              value={settings.payment.stripe.secretKey}
                              onChange={(e) => updateNestedSetting('payment', 'stripe', 'secretKey', e.target.value)}
                              className="input w-full font-mono text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Bank Transfer */}
                    <div className="p-4 bg-dark-700 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-white">Bank Transfer Configuration</h4>
                        <button
                          onClick={() => updateNestedSetting('payment', 'bank', 'enabled', !settings.payment.bank.enabled)}
                          className={`${settings.payment.bank.enabled ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.payment.bank.enabled ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </div>
                      
                      {settings.payment.bank.enabled && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Bank Name
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bank.bankName}
                              onChange={(e) => updateNestedSetting('payment', 'bank', 'bankName', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Account Number
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bank.accountNumber}
                              onChange={(e) => updateNestedSetting('payment', 'bank', 'accountNumber', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Account Name
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bank.accountName}
                              onChange={(e) => updateNestedSetting('payment', 'bank', 'accountName', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              Branch
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bank.branch}
                              onChange={(e) => updateNestedSetting('payment', 'bank', 'branch', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              SWIFT Code
                            </label>
                            <input
                              type="text"
                              value={settings.payment.bank.swiftCode}
                              onChange={(e) => updateNestedSetting('payment', 'bank', 'swiftCode', e.target.value)}
                              className="input w-full"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Email Settings */}
                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Email Settings</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          SMTP Host
                        </label>
                        <input
                          type="text"
                          value={settings.email.smtp.host}
                          onChange={(e) => updateNestedSetting('email', 'smtp', 'host', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          SMTP Port
                        </label>
                        <input
                          type="number"
                          value={settings.email.smtp.port}
                          onChange={(e) => updateNestedSetting('email', 'smtp', 'port', parseInt(e.target.value))}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          SMTP User
                        </label>
                        <input
                          type="text"
                          value={settings.email.smtp.user}
                          onChange={(e) => updateNestedSetting('email', 'smtp', 'user', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          SMTP Password
                        </label>
                        <input
                          type="password"
                          value={settings.email.smtp.pass}
                          onChange={(e) => updateNestedSetting('email', 'smtp', 'pass', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          From Email
                        </label>
                        <input
                          type="email"
                          value={settings.email.fromEmail}
                          onChange={(e) => updateSetting('email', 'fromEmail', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          From Name
                        </label>
                        <input
                          type="text"
                          value={settings.email.fromName}
                          onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                          className="input w-full"
                        />
                      </div>
                    </div>
                    
                    <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <FiInfo className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-400">Test Email Configuration</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Send a test email to verify your settings are correct.
                          </p>
                          <button className="btn-primary mt-3">
                            Send Test Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Notification Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Notification Settings</h3>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">New User Alert</p>
                          <p className="text-sm text-gray-400">Receive notification when new user registers</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'newUserAlert', !settings.notifications.newUserAlert)}
                          className={`${settings.notifications.newUserAlert ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.notifications.newUserAlert ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">New Payment Alert</p>
                          <p className="text-sm text-gray-400">Receive notification for new payments</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'newPaymentAlert', !settings.notifications.newPaymentAlert)}
                          className={`${settings.notifications.newPaymentAlert ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.notifications.newPaymentAlert ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Daily Report</p>
                          <p className="text-sm text-gray-400">Receive daily summary report</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'dailyReport', !settings.notifications.dailyReport)}
                          className={`${settings.notifications.dailyReport ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.notifications.dailyReport ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Weekly Report</p>
                          <p className="text-sm text-gray-400">Receive weekly analytics report</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'weeklyReport', !settings.notifications.weeklyReport)}
                          className={`${settings.notifications.weeklyReport ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.notifications.weeklyReport ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Monthly Report</p>
                          <p className="text-sm text-gray-400">Receive monthly performance report</p>
                        </div>
                        <button
                          onClick={() => updateSetting('notifications', 'monthlyReport', !settings.notifications.monthlyReport)}
                          className={`${settings.notifications.monthlyReport ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.notifications.monthlyReport ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                    </div>
                  </div>
                )}
                
                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Security Settings</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          value={settings.security.sessionTimeout}
                          onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Max Login Attempts
                        </label>
                        <input
                          type="number"
                          value={settings.security.maxLoginAttempts}
                          onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                          className="input w-full"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password Policy
                        </label>
                        <select
                          value={settings.security.passwordPolicy}
                          onChange={(e) => updateSetting('security', 'passwordPolicy', e.target.value)}
                          className="input w-full"
                        >
                          <option value="low">Low - 6+ characters</option>
                          <option value="medium">Medium - 8+ chars, mixed case</option>
                          <option value="high">High - 12+ chars, special chars</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-sm text-gray-400">Require 2FA for admin accounts</p>
                        </div>
                        <button
                          onClick={() => updateSetting('security', 'twoFactorAuth', !settings.security.twoFactorAuth)}
                          className={`${settings.security.twoFactorAuth ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.security.twoFactorAuth ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                      
                      <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                        <div>
                          <p className="text-white font-medium">IP Whitelist</p>
                          <p className="text-sm text-gray-400">Restrict admin access to specific IPs</p>
                        </div>
                        <button
                          onClick={() => updateSetting('security', 'ipWhitelist', !settings.security.ipWhitelist)}
                          className={`${settings.security.ipWhitelist ? 'text-green-400' : 'text-gray-400'}`}
                        >
                          {settings.security.ipWhitelist ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                        </button>
                      </label>
                      
                      {settings.security.ipWhitelist && (
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Allowed IP Addresses (comma-separated)
                          </label>
                          <textarea
                            value={settings.security.allowedIPs}
                            onChange={(e) => updateSetting('security', 'allowedIPs', e.target.value)}
                            className="input w-full h-20 resize-none"
                            placeholder="192.168.1.1, 10.0.0.1"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Maintenance Settings */}
                {activeTab === 'maintenance' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Maintenance Mode</h3>
                    
                    <label className="flex items-center justify-between p-4 bg-dark-700 rounded-lg">
                      <div>
                        <p className="text-white font-medium">Enable Maintenance Mode</p>
                        <p className="text-sm text-gray-400">Temporarily disable access to the site</p>
                      </div>
                      <button
                        onClick={() => updateSetting('maintenance', 'enabled', !settings.maintenance.enabled)}
                        className={`${settings.maintenance.enabled ? 'text-red-400' : 'text-gray-400'}`}
                      >
                        {settings.maintenance.enabled ? <FiToggleRight size={24} /> : <FiToggleLeft size={24} />}
                      </button>
                    </label>
                    
                    {settings.maintenance.enabled && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Maintenance Message
                          </label>
                          <textarea
                            value={settings.maintenance.message}
                            onChange={(e) => updateSetting('maintenance', 'message', e.target.value)}
                            className="input w-full h-32 resize-none"
                          />
                        </div>
                        
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={settings.maintenance.allowAdminAccess}
                            onChange={(e) => updateSetting('maintenance', 'allowAdminAccess', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm text-gray-300">Allow admin access during maintenance</span>
                        </label>
                      </>
                    )}
                    
                    {settings.maintenance.enabled && (
                      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <FiAlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-red-400">Warning: Maintenance Mode Active</p>
                            <p className="text-xs text-gray-400 mt-1">
                              Users will not be able to access the site while maintenance mode is enabled.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
