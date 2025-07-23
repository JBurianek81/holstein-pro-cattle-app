import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Bell, 
  Download, 
  Upload, 
  Trash2, 
  Save, 
  Camera,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Ruler,
  Clock,
  Heart,
  Activity,
  Baby,
  Eye,
  EyeOff,
  Shield,
  Users,
  Key,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react';

const SettingsView = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);

  // User Profile State
  const [profileData, setProfileData] = useState({
    farmName: 'Holstein Pro Farm',
    ownerName: 'Jason Burianek',
    farmAddress: '123 Dairy Lane, Farmville, CA 90210',
    phone: '+1 (555) 123-4567',
    email: 'jason@holsteinpro.com',
    operationType: 'Dairy',
    herdSize: '100-500',
    yearsInOperation: '15',
    farmLogo: null
  });

  // Farm Settings State
  const [farmSettings, setFarmSettings] = useState({
    defaultMilkPrice: '3.50',
    currency: 'USD',
    measurementUnits: 'Imperial',
    timezone: 'America/Los_Angeles',
    breedingSeasonStart: '01-01',
    breedingSeasonEnd: '12-31'
  });

  // Notification Preferences State
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    alertFrequency: 'daily',
    breedingAlerts: true,
    healthAlerts: true,
    calvingAlerts: true,
    pregnancyAlerts: true
  });

  // App Preferences State
  const [appPreferences, setAppPreferences] = useState({
    defaultDashboard: 'overview',
    cowListSorting: 'name',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    language: 'en'
  });

  // Worker Management State
  const [workers, setWorkers] = useState([
    {
      id: 1,
      name: 'Sarah Johnson',
      email: 'sarah@holsteinpro.com',
      role: 'Farm Hand',
      permissions: 'view-only',
      active: true
    },
    {
      id: 2,
      name: 'Mike Wilson',
      email: 'mike@holsteinpro.com',
      role: 'Veterinarian',
      permissions: 'full-access',
      active: true
    }
  ]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('holsteinProSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setProfileData(settings.profile || profileData);
      setFarmSettings(settings.farm || farmSettings);
      setNotifications(settings.notifications || notifications);
      setAppPreferences(settings.app || appPreferences);
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      profile: profileData,
      farm: farmSettings,
      notifications: notifications,
      app: appPreferences
    };
    localStorage.setItem('holsteinProSettings', JSON.stringify(settings));
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileData(prev => ({
          ...prev,
          farmLogo: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Export data
  const exportData = () => {
    const cows = JSON.parse(localStorage.getItem('cattleAppCows') || '[]');
    const settings = {
      profile: profileData,
      farm: farmSettings,
      notifications: notifications,
      app: appPreferences,
      cows: cows
    };
    
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `holstein-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    setShowExportSuccess(true);
    setTimeout(() => setShowExportSuccess(false), 3000);
  };

  // Import data
  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (data.cows) {
            localStorage.setItem('cattleAppCows', JSON.stringify(data.cows));
          }
          if (data.profile) setProfileData(data.profile);
          if (data.farm) setFarmSettings(data.farm);
          if (data.notifications) setNotifications(data.notifications);
          if (data.app) setAppPreferences(data.app);
          
          setShowImportSuccess(true);
          setTimeout(() => setShowImportSuccess(false), 3000);
        } catch (error) {
          alert('Invalid backup file format');
        }
      };
      reader.readAsText(file);
    }
  };

  // Clear all data
  const clearAllData = () => {
    localStorage.removeItem('cattleAppCows');
    localStorage.removeItem('holsteinProSettings');
    setShowDeleteConfirm(false);
    window.location.reload();
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'farm', label: 'Farm Settings', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'App Preferences', icon: Globe },
    { id: 'data', label: 'Data Management', icon: Download },
    { id: 'account', label: 'Account', icon: Shield },
    { id: 'workers', label: 'Workers', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 mt-1">
            Manage your farm profile, preferences, and account settings
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl disabled:opacity-50"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Success Messages */}
      {showExportSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Data exported successfully!</span>
          <button onClick={() => setShowExportSuccess(false)} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {showImportSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-medium">Data imported successfully!</span>
          <button onClick={() => setShowImportSuccess(false)} className="ml-auto">
            <X className="w-4 h-4 text-green-600" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex border-b border-slate-200">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Farm Logo */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Farm Logo
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
                      {profileData.farmLogo ? (
                        <img src={profileData.farmLogo} alt="Farm Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                      >
                        Upload Logo
                      </label>
                    </div>
                  </div>
                </div>

                {/* Farm Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Farm/Operation Name
                  </label>
                  <input
                    type="text"
                    value={profileData.farmName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, farmName: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Owner Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Owner/Manager Name
                  </label>
                  <input
                    type="text"
                    value={profileData.ownerName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, ownerName: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Farm Address */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Farm Address
                  </label>
                  <input
                    type="text"
                    value={profileData.farmAddress}
                    onChange={(e) => setProfileData(prev => ({ ...prev, farmAddress: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Operation Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Operation Type
                  </label>
                  <select
                    value={profileData.operationType}
                    onChange={(e) => setProfileData(prev => ({ ...prev, operationType: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Beef">Beef</option>
                    <option value="Mixed">Mixed</option>
                  </select>
                </div>

                {/* Herd Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Herd Size Range
                  </label>
                  <select
                    value={profileData.herdSize}
                    onChange={(e) => setProfileData(prev => ({ ...prev, herdSize: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1-50">1-50</option>
                    <option value="50-100">50-100</option>
                    <option value="100-500">100-500</option>
                    <option value="500-1000">500-1000</option>
                    <option value="1000+">1000+</option>
                  </select>
                </div>

                {/* Years in Operation */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Years in Operation
                  </label>
                  <input
                    type="number"
                    value={profileData.yearsInOperation}
                    onChange={(e) => setProfileData(prev => ({ ...prev, yearsInOperation: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Farm Settings Tab */}
          {activeTab === 'farm' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Default Milk Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Default Milk Price (per gallon)
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      step="0.01"
                      value={farmSettings.defaultMilkPrice}
                      onChange={(e) => setFarmSettings(prev => ({ ...prev, defaultMilkPrice: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Preferred Currency
                  </label>
                  <select
                    value={farmSettings.currency}
                    onChange={(e) => setFarmSettings(prev => ({ ...prev, currency: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CAD">CAD (C$)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                {/* Measurement Units */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Measurement Units
                  </label>
                  <select
                    value={farmSettings.measurementUnits}
                    onChange={(e) => setFarmSettings(prev => ({ ...prev, measurementUnits: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="Imperial">Imperial (lbs, gallons)</option>
                    <option value="Metric">Metric (kg, liters)</option>
                  </select>
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={farmSettings.timezone}
                    onChange={(e) => setFarmSettings(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/New_York">Eastern Time</option>
                  </select>
                </div>

                {/* Breeding Season Start */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Breeding Season Start
                  </label>
                  <input
                    type="date"
                    value={`2024-${farmSettings.breedingSeasonStart}`}
                    onChange={(e) => {
                      const date = e.target.value.split('-').slice(1).join('-');
                      setFarmSettings(prev => ({ ...prev, breedingSeasonStart: date }));
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Breeding Season End */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Breeding Season End
                  </label>
                  <input
                    type="date"
                    value={`2024-${farmSettings.breedingSeasonEnd}`}
                    onChange={(e) => {
                      const date = e.target.value.split('-').slice(1).join('-');
                      setFarmSettings(prev => ({ ...prev, breedingSeasonEnd: date }));
                    }}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Email Notifications */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-slate-900">Email Notifications</h3>
                      <p className="text-sm text-slate-600">Receive alerts via email</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.emailNotifications}
                        onChange={(e) => setNotifications(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Push Notifications */}
                <div className="lg:col-span-2">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div>
                      <h3 className="font-medium text-slate-900">Push Notifications</h3>
                      <p className="text-sm text-slate-600">Receive alerts in the app</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.pushNotifications}
                        onChange={(e) => setNotifications(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Alert Frequency */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Alert Frequency
                  </label>
                  <select
                    value={notifications.alertFrequency}
                    onChange={(e) => setNotifications(prev => ({ ...prev, alertFrequency: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="immediate">Immediate</option>
                    <option value="daily">Daily Summary</option>
                    <option value="weekly">Weekly Summary</option>
                  </select>
                </div>

                {/* Alert Types */}
                <div className="space-y-4">
                  <h3 className="font-medium text-slate-900">Alert Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Heart className="w-5 h-5 text-pink-500" />
                      <span className="text-sm">Breeding Alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.breedingAlerts}
                        onChange={(e) => setNotifications(prev => ({ ...prev, breedingAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Activity className="w-5 h-5 text-blue-500" />
                      <span className="text-sm">Health Alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.healthAlerts}
                        onChange={(e) => setNotifications(prev => ({ ...prev, healthAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Baby className="w-5 h-5 text-green-500" />
                      <span className="text-sm">Calving Alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.calvingAlerts}
                        onChange={(e) => setNotifications(prev => ({ ...prev, calvingAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Heart className="w-5 h-5 text-purple-500" />
                      <span className="text-sm">Pregnancy Alerts</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notifications.pregnancyAlerts}
                        onChange={(e) => setNotifications(prev => ({ ...prev, pregnancyAlerts: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* App Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Default Dashboard */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Default Dashboard View
                  </label>
                  <select
                    value={appPreferences.defaultDashboard}
                    onChange={(e) => setAppPreferences(prev => ({ ...prev, defaultDashboard: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="overview">Overview</option>
                    <option value="herd">Herd Management</option>
                    <option value="breeding">Breeding Center</option>
                    <option value="calendar">Calendar</option>
                    <option value="analytics">Analytics</option>
                  </select>
                </div>

                {/* Cow List Sorting */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Cow List Sorting
                  </label>
                  <select
                    value={appPreferences.cowListSorting}
                    onChange={(e) => setAppPreferences(prev => ({ ...prev, cowListSorting: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="name">Name</option>
                    <option value="tagNumber">Tag Number</option>
                    <option value="breed">Breed</option>
                    <option value="age">Age</option>
                    <option value="status">Status</option>
                  </select>
                </div>

                {/* Date Format */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date Format
                  </label>
                  <select
                    value={appPreferences.dateFormat}
                    onChange={(e) => setAppPreferences(prev => ({ ...prev, dateFormat: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                {/* Theme */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Theme
                  </label>
                  <select
                    value={appPreferences.theme}
                    onChange={(e) => setAppPreferences(prev => ({ ...prev, theme: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="auto">Auto (System)</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Language
                  </label>
                  <select
                    value={appPreferences.language}
                    onChange={(e) => setAppPreferences(prev => ({ ...prev, language: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Data Management Tab */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Export Data */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Download className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-blue-900">Export Data</h3>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Download all your farm data including cattle records, settings, and analytics.
                  </p>
                  <button
                    onClick={exportData}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Export All Data
                  </button>
                </div>

                {/* Import Data */}
                <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Upload className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-900">Import Data</h3>
                  </div>
                  <p className="text-green-700 mb-4">
                    Import data from a previous backup or another system.
                  </p>
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                    id="import-file"
                  />
                  <label
                    htmlFor="import-file"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                  >
                    Import Data
                  </label>
                </div>

                {/* Backup Settings */}
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Shield className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-purple-900">Backup Settings</h3>
                  </div>
                  <p className="text-purple-700 mb-4">
                    Configure automatic backup frequency and retention settings.
                  </p>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    Configure Backup
                  </button>
                </div>

                {/* Clear All Data */}
                <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <Trash2 className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-900">Clear All Data</h3>
                  </div>
                  <p className="text-red-700 mb-4">
                    Permanently delete all farm data. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Clear All Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Account Information */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Information</h3>
                  <div className="bg-slate-50 rounded-xl p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Email Address</span>
                      <span className="font-medium">{profileData.email}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Account Type</span>
                      <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                        Premium
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Member Since</span>
                      <span className="font-medium">January 2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">App Version</span>
                      <span className="font-medium">v1.0.0</span>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Security</h3>
                  <div className="space-y-4">
                    <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors text-left">
                      Change Password
                    </button>
                    <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors text-left">
                      Two-Factor Authentication
                    </button>
                  </div>
                </div>

                {/* Support & Legal */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Support & Legal</h3>
                  <div className="space-y-4">
                    <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors text-left flex items-center justify-between">
                      <span>Contact Support</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors text-left flex items-center justify-between">
                      <span>Privacy Policy</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-200 transition-colors text-left flex items-center justify-between">
                      <span>Terms of Service</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Workers Tab */}
          {activeTab === 'workers' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Farm Workers</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Worker
                </button>
              </div>

              <div className="space-y-4">
                {workers.map((worker) => (
                  <div key={worker.id} className="bg-slate-50 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                          <span className="text-slate-600 font-medium">
                            {worker.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900">{worker.name}</h4>
                          <p className="text-sm text-slate-600">{worker.email}</p>
                          <p className="text-sm text-slate-500">{worker.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          worker.permissions === 'full-access' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {worker.permissions === 'full-access' ? 'Full Access' : 'View Only'}
                        </span>
                        <button className="text-slate-400 hover:text-slate-600">
                          <Settings className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900">Clear All Data</h3>
            </div>
            <p className="text-slate-600 mb-6">
              This action will permanently delete all your farm data including cattle records, settings, and analytics. This cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={clearAllData}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView; 