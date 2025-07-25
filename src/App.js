import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Bell,
  Plus,
  Activity,
  TrendingUp,
  Heart,
  Zap,
  Search,
  Camera,
  Award,
  Target,
  CheckCircle,
  Archive
} from 'lucide-react';
import AddCowModal from './components/AddCowModal';
import HerdManagement from './components/HerdManagement';
import CowProfileModal from './components/CowProfileModal';
import BreedingCenter from './components/BreedingCenter';
import CalendarView from './components/CalendarView';
import AnalyticsView from './components/AnalyticsView';
import TodaysTasks from './components/TodaysTasks';
import SettingsView from './components/SettingsView';
import ArchivedAnimals from './components/ArchivedAnimals';
import { calculateReproductiveStatus } from './utils/cowDataModel';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [notifications] = useState(3);

  // Cow management state
  const [cows, setCows] = useState([]);
  const [isAddCowModalOpen, setIsAddCowModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState(null);
  const [profileCow, setProfileCow] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Bull inventory state
  const [bullInventory, setBullInventory] = useState([
    { name: "Champion's Pride", naabCode: "BULL-001", straws: 150, cost: 100, tank: "Tank A", canister: "C-001", purchaseDate: "2024-01-10", supplier: "Genetics Inc." },
    { name: "Golden Genes", naabCode: "BULL-002", straws: 75, cost: 120, tank: "Tank B", canister: "B-002", purchaseDate: "2024-02-15", supplier: "AgriSires" }
  ]);

  // Load cows from localStorage on app start
  useEffect(() => {
    const savedCows = localStorage.getItem('cattleAppCows');
    if (savedCows) {
      try {
        const parsedCows = JSON.parse(savedCows);
        setCows(parsedCows);
        console.log('✅ Loaded cows from localStorage:', parsedCows.length);
      } catch (error) {
        console.error('❌ Error loading cows from localStorage:', error);
      }
    }
  }, []);

  // Save cows to localStorage whenever cows state changes
  useEffect(() => {
    localStorage.setItem('cattleAppCows', JSON.stringify(cows));
    console.log('💾 Saved cows to localStorage:', cows.length);
  }, [cows]);

  // Generate comprehensive dynamic priority alerts from cow records
  const generatePriorityAlerts = () => {
    const alerts = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    cows.forEach(cow => {
      // 1. Optimal Breeding Window Alerts (Critical Priority)
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => 
          record.type === 'Heat Detection' && record.date
        );
        
        heatRecords.forEach(heatRecord => {
          const heatDate = new Date(heatRecord.date);
          const hoursSinceHeat = (now - heatDate) / (1000 * 60 * 60);
          
          // Optimal breeding window is 12-18 hours after heat detection
          if (hoursSinceHeat >= 12 && hoursSinceHeat <= 18) {
            const hoursRemaining = Math.max(0, 18 - hoursSinceHeat);
            alerts.push({
              id: `breeding-${cow.id}-${heatRecord.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Optimal breeding window - ${Math.round(hoursRemaining)} hours remaining`,
              priority: 'critical',
              type: 'breeding',
              time: `${Math.round(hoursSinceHeat)} hours ago`,
              cowId: cow.id
            });
          }
        });
      }
      
      // 2. Calving Alerts
      if (cow.breedingRecords && cow.breedingRecords.length > 0) {
        const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
        if (lastBreeding.expectedDueDate) {
          const dueDate = new Date(lastBreeding.expectedDueDate);
          const daysUntilDue = Math.round((dueDate - today) / (1000 * 60 * 60 * 24));
          
          // Overdue calving (past due date) - Critical Priority
          if (daysUntilDue < 0) {
            const daysOverdue = Math.abs(daysUntilDue);
            alerts.push({
              id: `calving-overdue-${cow.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Calving overdue by ${daysOverdue} days`,
              priority: 'critical',
              type: 'calving',
              time: `${daysOverdue} days overdue`,
              cowId: cow.id
            });
          }
          // Due this week (within 7 days) - High Priority
          else if (daysUntilDue <= 7) {
            alerts.push({
              id: `calving-due-${cow.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Due to calve in ${daysUntilDue} days`,
              priority: 'high',
              type: 'calving',
              time: daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days`,
              cowId: cow.id
            });
          }
          // Close monitoring needed (within 5 days) - High Priority
          else if (daysUntilDue <= 5) {
            alerts.push({
              id: `calving-monitoring-${cow.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Close monitoring needed - calving in ${daysUntilDue} days`,
              priority: 'high',
              type: 'calving',
              time: `${daysUntilDue} days`,
              cowId: cow.id
            });
          }
        }
      }
      
      // 3. Comprehensive Medical/Health Alerts
      if (cow.healthRecords) {
        // Vaccination schedules
        const vaccinationRecords = cow.healthRecords.filter(record => 
          record.type === 'Vaccination' && record.date
        );
        
        vaccinationRecords.forEach(vaccRecord => {
          const vaccDate = new Date(vaccRecord.date);
          const daysSinceVacc = Math.round((today - vaccDate) / (1000 * 60 * 60 * 24));
          const vaccInterval = parseInt(vaccRecord.duration) || 365; // Default 1 year
          
          if (daysSinceVacc >= vaccInterval) {
            const daysOverdue = daysSinceVacc - vaccInterval;
            const priority = daysOverdue > 30 ? 'high' : 'medium';
            const timeText = daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due today';
            
            alerts.push({
              id: `vaccination-${cow.id}-${vaccRecord.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Vaccination due: ${vaccRecord.description || vaccRecord.medicine || 'vaccination'}`,
              priority: priority,
              type: 'health',
              time: timeText,
              cowId: cow.id
            });
          }
        });
        
        // Deworming treatments
        const dewormingRecords = cow.healthRecords.filter(record => 
          record.type === 'Treatment' && record.description && 
          record.description.toLowerCase().includes('deworm')
        );
        
        dewormingRecords.forEach(dewormRecord => {
          const dewormDate = new Date(dewormRecord.date);
          const daysSinceDeworm = Math.round((today - dewormDate) / (1000 * 60 * 60 * 24));
          const dewormInterval = parseInt(dewormRecord.duration) || 90; // Default 3 months
          
          if (daysSinceDeworm >= dewormInterval) {
            const daysOverdue = daysSinceDeworm - dewormInterval;
            const timeText = daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due today';
            
            alerts.push({
              id: `deworming-${cow.id}-${dewormRecord.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: 'Deworming treatment due',
              priority: 'medium',
              type: 'health',
              time: timeText,
              cowId: cow.id
            });
          }
        });
        
        // Hoof trimming
        const hoofRecords = cow.healthRecords.filter(record => 
          record.type === 'Treatment' && record.description && 
          record.description.toLowerCase().includes('hoof')
        );
        
        hoofRecords.forEach(hoofRecord => {
          const hoofDate = new Date(hoofRecord.date);
          const daysSinceHoof = Math.round((today - hoofDate) / (1000 * 60 * 60 * 24));
          const hoofInterval = parseInt(hoofRecord.duration) || 180; // Default 6 months
          
          if (daysSinceHoof >= hoofInterval) {
            const daysOverdue = daysSinceHoof - hoofInterval;
            const timeText = daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due today';
            
            alerts.push({
              id: `hoof-${cow.id}-${hoofRecord.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: 'Hoof trimming overdue',
              priority: 'medium',
              type: 'health',
              time: timeText,
              cowId: cow.id
            });
          }
        });
        
        // Injury follow-ups
        const injuryRecords = cow.healthRecords.filter(record => 
          record.type === 'Injury' && record.date
        );
        
        injuryRecords.forEach(injuryRecord => {
          const injuryDate = new Date(injuryRecord.date);
          const daysSinceInjury = Math.round((today - injuryDate) / (1000 * 60 * 60 * 24));
          
          // Check if follow-up is needed (within 30 days of injury)
          if (daysSinceInjury <= 30 && !injuryRecord.followUpCompleted) {
            alerts.push({
              id: `injury-followup-${cow.id}-${injuryRecord.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Injury follow-up needed: ${injuryRecord.description || 'injury'}`,
              priority: 'high',
              type: 'health',
              time: `${daysSinceInjury} days ago`,
              cowId: cow.id
            });
          }
        });
        
        // Illness treatments in progress
        const illnessRecords = cow.healthRecords.filter(record => 
          record.type === 'Illness' && record.date
        );
        
        illnessRecords.forEach(illnessRecord => {
          const illnessDate = new Date(illnessRecord.date);
          const daysSinceIllness = Math.round((today - illnessDate) / (1000 * 60 * 60 * 24));
          
          // Check if treatment is still in progress (within 14 days)
          if (daysSinceIllness <= 14 && !illnessRecord.treatmentCompleted) {
            alerts.push({
              id: `illness-treatment-${cow.id}-${illnessRecord.id}`,
              cow: `${cow.name} #${cow.tagNumber}`,
              message: `Illness treatment in progress: ${illnessRecord.description || 'illness'}`,
              priority: 'high',
              type: 'health',
              time: `${daysSinceIllness} days ago`,
              cowId: cow.id
            });
          }
        });
        
        
      }
      
      // 4. Pregnancy checks due (if cow is BRED status)
      const reproductiveStatus = calculateReproductiveStatus(cow);
      if (reproductiveStatus === 'BRED' && cow.breedingRecords && cow.breedingRecords.length > 0) {
        const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
        const breedingDate = new Date(lastBreeding.date);
        const daysSinceBreeding = Math.round((today - breedingDate) / (1000 * 60 * 60 * 24));
        
        // Pregnancy check typically due around 40 days after breeding
        if (daysSinceBreeding >= 40) {
          const daysOverdue = daysSinceBreeding - 40;
          const priority = daysOverdue > 7 ? 'high' : 'medium';
          const timeText = daysOverdue > 0 ? `${daysOverdue} days overdue` : 'Due today';
          
          alerts.push({
            id: `pregnancy-${cow.id}`,
            cow: `${cow.name} #${cow.tagNumber}`,
            message: 'Pregnancy check due',
            priority: priority,
            type: 'health',
            time: timeText,
            cowId: cow.id
          });
        }
      }
    });
    
    // Sort alerts by priority (critical > high > medium) and then by urgency
    const priorityOrder = { critical: 3, high: 2, medium: 1 };
    return alerts.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by type (calving > breeding > health)
      const typeOrder = { calving: 3, breeding: 2, health: 1 };
      return typeOrder[b.type] - typeOrder[a.type];
    });
  };

  const alerts = generatePriorityAlerts();

  // Cow management functions
  const handleAddCow = () => {
    setEditingCow(null);
    setIsAddCowModalOpen(true);
  };

  // Cow editing function (will be used in Herd Management page)
  const handleEditCow = (cow) => {
    setEditingCow(cow);
    setIsAddCowModalOpen(true);
  };

  const handleSaveCow = async (cowData) => {
    try {
      // Calculate and set reproductive status
      const reproductiveStatus = calculateReproductiveStatus(cowData);
      const cowWithStatus = { 
        ...cowData, 
        reproductiveStatus: reproductiveStatus
      };
      
      if (editingCow) {
        // Update existing cow
        setCows(prevCows => 
          prevCows.map(cow => 
            cow.id === editingCow.id ? cowWithStatus : cow
          )
        );
        console.log('✅ Updated cow:', cowWithStatus.name);
      } else {
        // Add new cow
        setCows(prevCows => [...prevCows, cowWithStatus]);
        console.log('✅ Added new cow:', cowWithStatus.name);
      }
      
      // Update metrics based on new cow data
      console.log('Cow saved successfully:', cowWithStatus);
    } catch (error) {
      console.error('Error saving cow:', error);
      throw error;
    }
  };

  // Cow deletion function (will be used in Herd Management page)
  const handleDeleteCow = (cowId) => {
      setCows(prevCows => prevCows.filter(cow => cow.id !== cowId));
    console.log('🗑️ Deleted cow with ID:', cowId);
  };

  // Archive management functions
  const handleRestoreCow = (cowId) => {
    setCows(prevCows => prevCows.map(cow => 
      cow.id === cowId 
        ? { ...cow, archived: false, archivedDate: null, archiveReason: '' }
        : cow
    ));
    console.log('🔄 Restored cow with ID:', cowId);
  };

  const handlePermanentlyDeleteCow = (cowId) => {
    setCows(prevCows => prevCows.filter(cow => cow.id !== cowId));
    console.log('🗑️ Permanently deleted cow with ID:', cowId);
  };

  const handleArchiveCow = (cowId, archiveReason) => {
    setCows(prevCows => prevCows.map(cow => 
      cow.id === cowId 
        ? { ...cow, archived: true, archivedDate: new Date().toISOString(), archiveReason }
        : cow
    ));
    console.log('📦 Archived cow with ID:', cowId, 'Reason:', archiveReason);
  };

  const handleCloseModal = () => {
    setIsAddCowModalOpen(false);
    setEditingCow(null);
  };

  // Profile modal handlers
  const handleViewProfile = (cow) => {
    setProfileCow(cow);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfile = () => {
    setIsProfileModalOpen(false);
    setProfileCow(null);
  };

  const handleUpdateCowFromProfile = (updatedCow) => {
    // Calculate and set reproductive status
    const reproductiveStatus = calculateReproductiveStatus(updatedCow);
    const cowWithStatus = {
      ...updatedCow,
      reproductiveStatus: reproductiveStatus
    };

      setCows(prevCows => 
        prevCows.map(cow => 
        cow.id === updatedCow.id ? cowWithStatus : cow
      )
    );
    
    // Also update the profileCow state to reflect changes immediately
    setProfileCow(cowWithStatus);
    console.log('✅ Updated cow profile for:', cowWithStatus.name);
        };

  // Bull inventory management functions
  const handleUpdateBullInventory = (updatedBullInventory) => {
    setBullInventory(updatedBullInventory);
    console.log('✅ Updated bull inventory:', updatedBullInventory.length, 'bulls');
  };

  const handleBreedingRecordSaved = (cow, breedingRecord, selectedBullId) => {
    console.log('🐄 handleBreedingRecordSaved called with:', { cow: cow.name, breedingRecord, selectedBullId });

    // Note: Breeding record is already added to cow via onUpdateCow in CowProfileModal
    // This function only handles bull inventory updates

    // Reduce bull straw count by 1
    setBullInventory(prevInventory => {
      const updatedInventory = prevInventory.map(bull => 
        bull.naabCode === selectedBullId ? { ...bull, straws: Math.max(0, bull.straws - 1) } : bull
      );
      console.log('🐄 Updated bull inventory:', updatedInventory.length, 'bulls');
      return updatedInventory;
    });

    console.log('✅ Bull inventory updated for breeding record');
  };

  // Get cows in heat today
  const getCowsInHeatToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      return cow.healthRecords.some(record => 
        record.type === 'Heat Detection' && record.date === today
      );
    });
  };

  // Handle heat filter button click
  const handleHeatFilter = () => {
    setCurrentView('herd');
    // Note: In a real implementation, you would pass a filter state to HerdManagement
    // For now, we'll just navigate to the herd management view
  };
  
  // Update metrics based on current cows data
  const updatedMetrics = {
    total: { value: cows.length, change: '+12', trend: 'up' },
    pregnant: { value: cows.filter(cow => cow.status === 'Pregnant' || cow.category === 'Cow').length, change: '+5', trend: 'up' },
    breeding: { value: getCowsInHeatToday().length, change: '-2', trend: 'down' },
    health: { value: Math.round((cows.filter(cow => cow.status === 'Active').length / Math.max(cows.length, 1)) * 100), change: '+1', trend: 'up' }
  };

  // Navigation items with better organization
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, active: true },
    { id: 'herd', label: 'Herd Management', icon: Users, badge: updatedMetrics.total.value.toString() },
    { id: 'breeding', label: 'Breeding Center', icon: Heart, badge: updatedMetrics.breeding.value.toString() },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'archived', label: 'Archived Animals', icon: Archive, badge: cows.filter(cow => cow.archived === true).length.toString() }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Premium Sidebar */}
      <div className="w-72 bg-white shadow-xl border-r border-slate-200">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Holstein Pro</h1>
              <p className="text-sm text-slate-500">Breeding Excellence</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => (
                <button
                  key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                currentView === item.id
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="mt-auto p-4 border-t border-slate-100">
          <button
            onClick={() => setCurrentView('settings')}
            className="w-full flex items-center space-x-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">JB</span>
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 truncate">Jason Burianek</p>
              <p className="text-xs text-slate-500">Farm Manager</p>
              </div>
            <Bell className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {currentView === 'dashboard' && 'Dashboard'}
                {currentView === 'herd' && 'Herd Management'}
                {currentView === 'archived' && 'Archived Animals'}
                {currentView === 'breeding' && 'Breeding Center'}
                {currentView === 'calendar' && 'Calendar'}
                {currentView === 'analytics' && 'Analytics'}
                {currentView === 'settings' && 'Settings'}
              </h2>
              {currentView === 'dashboard' && (
                <div className="flex items-center space-x-2 text-sm text-slate-500">
                  <Activity className="w-4 h-4" />
                  <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
                )}
              </div>
              
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search cattle, records..."
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                          </div>
              
              {/* Notifications */}
              <button className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notifications}
                  </span>
                )}
                          </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Cattle</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.total.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">{updatedMetrics.total.change}</span>
                    <span className="text-sm text-slate-500">from last month</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pregnant Cows</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.pregnant.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                    </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">{updatedMetrics.pregnant.change}</span>
                    <span className="text-sm text-slate-500">from last month</span>
                  </div>
                    </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">In Heat</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.breeding.value}</p>
                  </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-orange-600" />
                </div>
                  </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
                    <span className="text-sm text-red-600">{updatedMetrics.breeding.change}</span>
                    <span className="text-sm text-slate-500">from last month</span>
                </div>
              </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Health Score</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.health.value}%</p>
                  </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-emerald-600" />
                </div>
                        </div>
                  <div className="mt-4 flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">{updatedMetrics.health.change}</span>
                    <span className="text-sm text-slate-500">from last month</span>
                        </div>
                      </div>
                        </div>

              {/* Today's Tasks */}
              <TodaysTasks cows={cows} />

              {/* Alerts Section */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100">
                  <h3 className="text-lg font-semibold text-slate-900">Priority Alerts</h3>
                        </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {alerts.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                        <p className="text-slate-500">No priority alerts at this time</p>
                        <p className="text-sm text-slate-400 mt-1">All animals are up to date</p>
                      </div>
                    ) : (
                      alerts.map((alert) => (
                        <div key={alert.id} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                          <div className={`w-3 h-3 rounded-full mt-2 ${
                            alert.priority === 'critical' ? 'bg-red-500' :
                            alert.priority === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-slate-900">{alert.cow}</p>
                              <span className="text-sm text-slate-500">{alert.time}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                          </div>
                          <button 
                            onClick={() => {
                              const cow = cows.find(c => c.id === alert.cowId);
                              if (cow) {
                                handleViewProfile(cow);
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            View
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-4">
                  <button 
                    onClick={handleAddCow}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center"
                  >
                    <Plus className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Add Cow</span>
                  </button>
                  <button 
                    onClick={handleHeatFilter}
                    className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center"
                  >
                    <Heart className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Heat Filter ({getCowsInHeatToday().length})</span>
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center">
                    <Camera className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Take Photo</span>
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center">
                    <Target className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">AI Match</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Herd Management View */}
          {currentView === 'herd' && (
            <HerdManagement
              cows={cows}
              onAddCow={handleAddCow}
              onEditCow={handleEditCow}
              onDeleteCow={handleDeleteCow}
              onViewProfile={handleViewProfile}
              onArchiveCow={handleArchiveCow}
            />
          )}

          {/* Archived Animals View */}
          {currentView === 'archived' && (
            <ArchivedAnimals
              cows={cows}
              onRestoreCow={handleRestoreCow}
              onPermanentlyDeleteCow={handlePermanentlyDeleteCow}
              onViewProfile={handleViewProfile}
            />
          )}

          {/* Breeding Center View */}
          {currentView === 'breeding' && (
            <BreedingCenter
              cows={cows}
              onViewProfile={handleViewProfile}
              onUpdateCow={handleUpdateCowFromProfile}
              bullInventory={bullInventory}
              onUpdateBullInventory={handleUpdateBullInventory}
            />
          )}

          {/* Calendar View */}
          {currentView === 'calendar' && (
            <CalendarView
              cows={cows}
            />
          )}

          {/* Analytics View */}
          {currentView === 'analytics' && (
            <AnalyticsView
              cows={cows}
            />
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <SettingsView />
          )}
        </main>
      </div>
      
      {/* Modals */}
      <AddCowModal
        isOpen={isAddCowModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveCow}
        editingCow={editingCow}
      />
      
      <CowProfileModal
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfile}
        cow={profileCow}
        onUpdateCow={handleUpdateCowFromProfile}
        bullInventory={bullInventory}
        onBreedingRecordSaved={handleBreedingRecordSaved}
        onAddCow={handleSaveCow}
        cows={cows}
        onUpdateBullInventory={handleUpdateBullInventory}
      />
    </div>
  );
}

export default App;
