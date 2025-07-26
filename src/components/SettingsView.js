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
import { generateFarmCode } from '../utils/farmCodeUtils';

const SettingsView = ({ profileData: initialProfileData, onProfileUpdate }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportSuccess, setShowExportSuccess] = useState(false);
  const [showImportSuccess, setShowImportSuccess] = useState(false);

  // User Profile State
  const [profileData, setProfileData] = useState(initialProfileData || {
    farmName: 'Holstein Pro Farm',
    ownerName: 'Jason Burianek',
    farmAddress: '123 Dairy Lane, Farmville, CA 90210',
    phone: '+1 (555) 123-4567',
    email: 'jason@holsteinpro.com',
    operationType: 'Dairy',
    herdSize: '100-500',
    yearsInOperation: '15',
    farmLogo: null,
    farmCode: null,
    farmCodeCreated: null,
    farmCodeLastRegenerated: null
  });

  // Farm Code State
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  // Bulk Import State
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [bulkImportData, setBulkImportData] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importSuccess, setImportSuccess] = useState(false);



  // Generate initial farm code if none exists
  const initializeFarmCode = () => {
    if (!profileData.farmCode) {
      const newCode = generateFarmCode();
      const now = new Date().toISOString();
      setProfileData(prev => ({
        ...prev,
        farmCode: newCode,
        farmCodeCreated: now,
        farmCodeLastRegenerated: now
      }));
    }
  };

  // Regenerate farm code
  const regenerateFarmCode = () => {
    const newCode = generateFarmCode();
    const now = new Date().toISOString();
    setProfileData(prev => ({
      ...prev,
      farmCode: newCode,
      farmCodeLastRegenerated: now
    }));
    setShowRegenerateConfirm(false);
  };

  // Copy farm code to clipboard
  const copyFarmCode = async () => {
    try {
      await navigator.clipboard.writeText(profileData.farmCode);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = profileData.farmCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    }
  };

  // Download CSV Template
  const downloadHerdTemplate = () => {
    const headers = ['tagNumber', 'name', 'dateOfBirth', 'category', 'breed', 'sire', 'dam', 'location', 'notes', 'status'];
    const sampleData = [
      ['1234', 'Bella', '2020-03-15', 'Cow', 'Holstein', 'SIRE123', 'DAM456', 'North Pasture', 'Excellent producer', 'Active'],
      ['5678', '', '2022-06-20', 'Heifer', 'Jersey', '', '', 'South Pasture', '', 'Active'],
      ['9012', 'Daisy', '2023-09-10', 'Calf', 'Holstein', 'SIRE789', 'DAM123', 'Calf Barn', 'Healthy calf', 'Active']
    ];
    
    let csvContent = headers.join(',') + '\n';
    sampleData.forEach(row => {
      csvContent += row.join(',') + '\n';
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'herd-import-template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV file
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      data.push(row);
    }
    
    return data;
  };

  // Validate import data
  const validateImportData = (data) => {
    const errors = [];
    const existingCows = JSON.parse(localStorage.getItem('cattleAppCows') || '[]');
    const existingTags = new Set(existingCows.map(cow => cow.tagNumber));
    const validCategories = ['Cow', 'Heifer', 'Calf', 'Bull'];
    
    data.forEach((row, index) => {
      const rowErrors = [];
      
      // Required field validation
      if (!row.tagNumber?.trim()) {
        rowErrors.push('Tag number is required');
      }
      
      if (!row.dateOfBirth?.trim()) {
        rowErrors.push('Date of birth is required');
      } else {
        // Date format validation
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(row.dateOfBirth)) {
          rowErrors.push('Date must be in YYYY-MM-DD format');
        } else {
          const date = new Date(row.dateOfBirth);
          if (isNaN(date.getTime())) {
            rowErrors.push('Invalid date');
          }
        }
      }
      
      if (!row.category?.trim()) {
        rowErrors.push('Category is required');
      } else if (!validCategories.includes(row.category)) {
        rowErrors.push(`Category must be one of: ${validCategories.join(', ')}`);
      }
      
      // Duplicate tag number check
      if (row.tagNumber?.trim() && existingTags.has(row.tagNumber.trim())) {
        rowErrors.push('Tag number already exists');
      }
      
      if (rowErrors.length > 0) {
        errors.push({
          row: index + 2, // +2 because of 0-based index and header row
          errors: rowErrors
        });
      }
    });
    
    return errors;
  };

  // Handle bulk import file upload
  const handleBulkImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target.result;
      const parsedData = parseCSV(csvText);
      const errors = validateImportData(parsedData);
      
      setBulkImportData(parsedData);
      setImportErrors(errors);
      setShowImportPreview(true);
    };
    reader.readAsText(file);
  };

  // Confirm bulk import
  const confirmBulkImport = () => {
    const validData = bulkImportData.filter((_, index) => {
      return !importErrors.some(error => error.row === index + 2);
    });
    
    if (validData.length === 0) {
      alert('No valid records to import');
      return;
    }
    
    // Import valid records
    const existingCows = JSON.parse(localStorage.getItem('cattleAppCows') || '[]');
    const newCows = validData.map(row => ({
      id: Date.now() + Math.random(),
      tagNumber: row.tagNumber.trim(),
      name: row.name?.trim() || '',
      dateOfBirth: row.dateOfBirth.trim(),
      category: row.category.trim(),
      breed: row.breed?.trim() || '',
      sire: row.sire?.trim() || '',
      dam: row.dam?.trim() || '',
      location: row.location?.trim() || '',
      notes: row.notes?.trim() || '',
      status: row.status?.trim() || 'Active',
      archived: false,
      breedingRecords: [],
      healthRecords: [],
      calvingRecords: []
    }));
    
    const updatedCows = [...existingCows, ...newCows];
    localStorage.setItem('cattleAppCows', JSON.stringify(updatedCows));
    
    setImportSuccess(true);
    setShowImportPreview(false);
    setBulkImportData([]);
    setImportErrors([]);
    
    setTimeout(() => setImportSuccess(false), 3000);
  };

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
    
    // Initialize farm code if none exists
    setTimeout(() => {
      initializeFarmCode();
    }, 100);
  }, []);

  // Update local profileData when prop changes
  useEffect(() => {
    if (initialProfileData) {
      setProfileData(initialProfileData);
    }
  }, [initialProfileData]);

  // Save settings to localStorage
  const saveSettings = () => {
    const settings = {
      profile: profileData,
      farm: farmSettings,
      notifications: notifications,
      app: appPreferences
    };
    localStorage.setItem('holsteinProSettings', JSON.stringify(settings));
    
    // Update parent component's profile data
    if (onProfileUpdate) {
      onProfileUpdate(profileData);
    }
    
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

              {/* Farm Access Code Section */}
              <div className="border-t border-slate-200 pt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Farm Access Code</h3>
                  <p className="text-sm text-slate-600 mb-4">
                    Share this code with farm members to give them access to your farm data. Keep this code secure - anyone with this code can access your farm data.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Your Farm Code
                      </label>
                      <div className="flex items-center space-x-3">
                        <div className="bg-white px-4 py-3 rounded-lg border border-slate-300 font-mono text-lg font-bold text-slate-900 min-w-[200px]">
                          {profileData.farmCode || 'Generating...'}
                        </div>
                        <button
                          onClick={copyFarmCode}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => setShowRegenerateConfirm(true)}
                          className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
                        >
                          <Key className="w-4 h-4" />
                          <span>Regenerate</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Copy Success Message */}
                  {showCopySuccess && (
                    <div className="flex items-center space-x-2 text-green-600 text-sm mb-4">
                      <CheckCircle className="w-4 h-4" />
                      <span>Farm code copied to clipboard!</span>
                    </div>
                  )}

                  {/* Code Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Created:</span>{' '}
                      {profileData.farmCodeCreated ? new Date(profileData.farmCodeCreated).toLocaleDateString() : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Last Updated:</span>{' '}
                      {profileData.farmCodeLastRegenerated ? new Date(profileData.farmCodeLastRegenerated).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>

                  {/* Security Note */}
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-yellow-800">
                        <p className="font-medium">Security Note:</p>
                        <p>Keep this code secure. Anyone with this code can access your farm data. Only share with trusted farm members.</p>
                      </div>
                    </div>
                  </div>
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

              {/* Bulk Herd Import Section */}
              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Bulk Herd Import</h3>
                <p className="text-slate-600 mb-6">
                  Import multiple cattle records at once using a CSV file. Download the template below to get started.
                </p>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Download Template */}
                  <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Download className="w-6 h-6 text-orange-600" />
                      <h4 className="text-lg font-semibold text-orange-900">Download Template</h4>
                    </div>
                    <p className="text-orange-700 mb-4">
                      Download a CSV template with sample data and proper column headers.
                    </p>
                    <button
                      onClick={downloadHerdTemplate}
                      className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Download Herd Template
                    </button>
                  </div>

                  {/* Upload Herd Data */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
                    <div className="flex items-center space-x-3 mb-4">
                      <Upload className="w-6 h-6 text-indigo-600" />
                      <h4 className="text-lg font-semibold text-indigo-900">Upload Herd Data</h4>
                    </div>
                    <p className="text-indigo-700 mb-4">
                      Upload your filled CSV file to import multiple cattle records.
                    </p>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleBulkImport}
                      className="hidden"
                      id="bulk-import-file"
                    />
                    <label
                      htmlFor="bulk-import-file"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                      Upload Herd Data
                    </label>
                  </div>
                </div>

                {/* Template Instructions */}
                <div className="bg-slate-50 rounded-xl p-6 mt-6">
                  <h4 className="font-semibold text-slate-900 mb-3">Template Instructions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                    <div>
                      <p className="font-medium mb-2">Required Fields:</p>
                      <ul className="space-y-1">
                        <li>• <span className="font-medium">tagNumber</span> - Unique identifier (required)</li>
                        <li>• <span className="font-medium">dateOfBirth</span> - Format: YYYY-MM-DD (required)</li>
                        <li>• <span className="font-medium">category</span> - Cow, Heifer, Calf, or Bull (required)</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-medium mb-2">Optional Fields:</p>
                      <ul className="space-y-1">
                        <li>• <span className="font-medium">name</span> - Animal name</li>
                        <li>• <span className="font-medium">breed</span> - Animal breed</li>
                        <li>• <span className="font-medium">sire</span> - Father's ID</li>
                        <li>• <span className="font-medium">dam</span> - Mother's ID</li>
                        <li>• <span className="font-medium">location</span> - Current location</li>
                        <li>• <span className="font-medium">notes</span> - Additional notes</li>
                        <li>• <span className="font-medium">status</span> - Defaults to "Active"</li>
                      </ul>
                    </div>
                  </div>
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

      {/* Regenerate Farm Code Confirmation Modal */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Key className="w-6 h-6 text-orange-600" />
              <h3 className="text-lg font-semibold text-slate-900">Regenerate Farm Code</h3>
            </div>
            <p className="text-slate-600 mb-6">
              This will generate a new farm access code. The old code will no longer work. Make sure to share the new code with your farm members.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={regenerateFarmCode}
                className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
              >
                Regenerate Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Preview Modal */}
      {showImportPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Import Preview</h3>
                  <p className="text-slate-600 mt-1">
                    Review your data before importing. {importErrors.length > 0 && (
                      <span className="text-red-600 font-medium">
                        {importErrors.length} row(s) have errors and will be skipped.
                      </span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setShowImportPreview(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto max-h-[60vh]">
              {/* Import Summary */}
              <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{bulkImportData.length}</div>
                  <div className="text-sm text-blue-700">Total Records</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {bulkImportData.length - importErrors.length}
                  </div>
                  <div className="text-sm text-green-700">Valid Records</div>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-red-600">{importErrors.length}</div>
                  <div className="text-sm text-red-700">Error Records</div>
                </div>
              </div>

              {/* Data Preview Table */}
              <div className="overflow-x-auto">
                <table className="w-full border border-slate-200 rounded-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Row</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Tag #</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">DOB</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Breed</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-700 border-b">Errors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bulkImportData.map((row, index) => {
                      const rowErrors = importErrors.find(error => error.row === index + 2);
                      const isValid = !rowErrors;
                      
                      return (
                        <tr key={index} className={!isValid ? 'bg-red-50' : ''}>
                          <td className="px-4 py-3 text-sm border-b">
                            <span className={`font-medium ${!isValid ? 'text-red-600' : 'text-slate-900'}`}>
                              {index + 2}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm border-b">{row.tagNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm border-b">{row.name || '-'}</td>
                          <td className="px-4 py-3 text-sm border-b">{row.dateOfBirth || '-'}</td>
                          <td className="px-4 py-3 text-sm border-b">{row.category || '-'}</td>
                          <td className="px-4 py-3 text-sm border-b">{row.breed || '-'}</td>
                          <td className="px-4 py-3 text-sm border-b">{row.status || 'Active'}</td>
                          <td className="px-4 py-3 text-sm border-b">
                            {rowErrors ? (
                              <div className="text-red-600 text-xs">
                                {rowErrors.errors.map((error, i) => (
                                  <div key={i}>• {error}</div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-green-600 text-xs">✓ Valid</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-600">
                  {importErrors.length > 0 ? (
                    <span className="text-red-600">
                      {importErrors.length} row(s) will be skipped due to errors
                    </span>
                  ) : (
                    <span className="text-green-600">All records are valid and ready to import</span>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowImportPreview(false)}
                    className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmBulkImport}
                    disabled={bulkImportData.length - importErrors.length === 0}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                  >
                    Import {bulkImportData.length - importErrors.length} Records
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Success Message */}
      {importSuccess && (
        <div className="fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-medium">Herd data imported successfully!</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView; 