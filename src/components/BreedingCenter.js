import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Thermometer,
  Baby,
  Activity,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react';
import { calculateReproductiveStatus, createHealthRecord, createHeatRecord } from '../utils/cowDataModel';
import BreedingRecordModal from './BreedingRecordModal';

const BreedingCenter = ({ cows, onViewProfile, onUpdateCow, bullInventory, onUpdateBullInventory }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [activeFilter, setActiveFilter] = useState(null);
  
  // Force calendar to update when cows data changes
  const [calendarKey, setCalendarKey] = useState(0);
  
  useEffect(() => {
    setCalendarKey(prev => prev + 1);
  }, [cows]);

  const [showBullModal, setShowBullModal] = useState(false);
  // Add state for editing bulls
  const [editingBull, setEditingBull] = useState(null);
  
  // Pregnancy check confirmation dialog state
  const [showPregnancyCheckDialog, setShowPregnancyCheckDialog] = useState(false);
  const [pregnancyCheckCow, setPregnancyCheckCow] = useState(null);
  const [pregnancyCheckAction, setPregnancyCheckAction] = useState(null); // 'pregnant' or 'open'

  // Breeding record modal state
  const [showBreedingModal, setShowBreedingModal] = useState(false);
  const [selectedCowForBreeding, setSelectedCowForBreeding] = useState(null);

  // Get today's date string
  const today = new Date().toISOString().split('T')[0];

  // Calculate age in months
  const calculateAgeInMonths = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const birth = new Date(dateOfBirth);
    const today = new Date();
    return (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  };

  // Filter cows based on search and breeding status
  const filteredCows = cows.filter(cow => {
    const matchesSearch = cow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const reproductiveStatus = calculateReproductiveStatus(cow);
    const matchesStatus = statusFilter === 'all' || reproductiveStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group cows by breeding status
  const cowsByStatus = {
    'OPEN': filteredCows.filter(cow => calculateReproductiveStatus(cow) === 'OPEN'),
    'BRED': filteredCows.filter(cow => calculateReproductiveStatus(cow) === 'BRED'),
    'PREGNANT': filteredCows.filter(cow => calculateReproductiveStatus(cow) === 'PREGNANT')
  };

  // Get cows in heat today (all ages)
  const getCowsInHeatToday = () => {
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      return cow.healthRecords.some(record => 
        record.type === 'Heat Detection' && record.date === today
      );
    });
  };

  // Get cows in heat today that are 15+ months old (for breeding priorities)
  const getBreedingReadyCowsInHeatToday = () => {
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      const isInHeat = cow.healthRecords.some(record => 
        record.type === 'Heat Detection' && record.date === today
      );
      const ageInMonths = calculateAgeInMonths(cow.dateOfBirth);
      return isInHeat && ageInMonths >= 15;
    });
  };

  // Get cows with predicted heat today (all ages)
  const getCowsWithPredictedHeatToday = () => {
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      
      // Find the most recent heat detection
      const heatRecords = cow.healthRecords.filter(record => record.type === 'Heat Detection');
      if (heatRecords.length === 0) return false;
      
      const lastHeat = new Date(heatRecords[heatRecords.length - 1].date);
      const predictedHeat = new Date(lastHeat);
      predictedHeat.setDate(predictedHeat.getDate() + 21); // 21-day cycle
      
      return predictedHeat.toISOString().split('T')[0] === today;
    });
  };

  // Get cows with predicted heat today that are 15+ months old (for breeding priorities)
  const getBreedingReadyCowsWithPredictedHeatToday = () => {
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      
      // Find the most recent heat detection
      const heatRecords = cow.healthRecords.filter(record => record.type === 'Heat Detection');
      if (heatRecords.length === 0) return false;
      
      const lastHeat = new Date(heatRecords[heatRecords.length - 1].date);
      const predictedHeat = new Date(lastHeat);
      predictedHeat.setDate(predictedHeat.getDate() + 21); // 21-day cycle
      
      const ageInMonths = calculateAgeInMonths(cow.dateOfBirth);
      return predictedHeat.toISOString().split('T')[0] === today && ageInMonths >= 15;
    });
  };

  // Get pregnancy checks due today (40 days after breeding)
  const getPregnancyChecksDueToday = () => {
    return cows.filter(cow => {
      if (!cow.breedingRecords) return false;
      
      const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
      if (!lastBreeding) return false;
      
      const breedingDate = new Date(lastBreeding.date);
      const checkDate = new Date(breedingDate);
      checkDate.setDate(checkDate.getDate() + 40); // 40 days after breeding
      
      return checkDate.toISOString().split('T')[0] === today;
    });
  };

  // Get all animals that need pregnancy checks (40+ days after breeding)
  const getAnimalsNeedingPregnancyChecks = () => {
    return cows.filter(cow => {
      if (!cow.breedingRecords) return false;
      
      const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
      if (!lastBreeding) return false;
      
      const breedingDate = new Date(lastBreeding.date);
      const daysSinceBreeding = Math.floor((new Date() - breedingDate) / (1000 * 60 * 60 * 24));
      
      // Only include animals that are 40+ days after breeding AND still have BRED status
      const reproductiveStatus = calculateReproductiveStatus(cow);
      const needsPregnancyCheck = daysSinceBreeding >= 40 && reproductiveStatus === 'BRED';
      
      console.log('🐄 Cow', cow.name, 'days since breeding:', daysSinceBreeding, 'status:', reproductiveStatus, 'needs check:', needsPregnancyCheck);
      
      return needsPregnancyCheck;
    }).map(cow => {
      const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
      const breedingDate = new Date(lastBreeding.date);
      const daysSinceBreeding = Math.floor((new Date() - breedingDate) / (1000 * 60 * 60 * 24));
      
      return {
        ...cow,
        daysSinceBreeding,
        breedingDate: lastBreeding.date,
        isOverdue: daysSinceBreeding > 40
      };
    }).sort((a, b) => b.daysSinceBreeding - a.daysSinceBreeding); // Sort by most overdue first
  };

  // Get cows due to calve this month
  const getCowsDueThisMonth = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    return cows.filter(cow => {
      // Check if cow is pregnant
      const reproductiveStatus = calculateReproductiveStatus(cow);
      if (reproductiveStatus !== 'PREGNANT') return false;
      
      // Check if cow has breeding records with expected due date
      if (!cow.breedingRecords || cow.breedingRecords.length === 0) return false;
      
      const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
      if (!lastBreeding.expectedDueDate) return false;
      
      // Check if due date is in current month
      const dueDate = new Date(lastBreeding.expectedDueDate);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    });
  };

  // Get filtered animals based on active filter
  const getFilteredAnimals = () => {
    switch (activeFilter) {
      case 'cowsDueThisMonth':
        return getCowsDueThisMonth();
      case 'inHeatToday':
        return getCowsInHeatToday();
      case 'predictedHeat':
        return getCowsWithPredictedHeatToday();
      case 'pregnancyChecks':
        return getAnimalsNeedingPregnancyChecks();
      default:
        return [];
    }
  };

  // Calculate breeding metrics
  const breedingMetrics = {
    total: cows.length,
    open: cowsByStatus.OPEN.length,
    bred: cowsByStatus.BRED.length,
    pregnant: cowsByStatus.PREGNANT.length,
    successRate: cows.length > 0 ? Math.round((cowsByStatus.PREGNANT.length / cows.length) * 100) : 0,
    inHeatToday: getCowsInHeatToday().length,
    predictedHeatToday: getCowsWithPredictedHeatToday().length,
    pregnancyChecksDue: getPregnancyChecksDueToday().length,
    pregnancyChecksNeeded: getAnimalsNeedingPregnancyChecks().length,
    cowsDueThisMonth: getCowsDueThisMonth().length,
    // Age-filtered metrics for breeding priorities
    breedingReadyInHeatToday: getBreedingReadyCowsInHeatToday().length,
    breedingReadyPredictedHeatToday: getBreedingReadyCowsWithPredictedHeatToday().length
  };



  // Record heat detection for a cow
  const recordHeatDetection = (cow) => {
    const heatRecord = createHeatRecord();

    const updatedCow = {
      ...cow,
      healthRecords: [...(cow.healthRecords || []), heatRecord],
      isInHeat: true
    };

    if (onUpdateCow) {
      onUpdateCow(updatedCow);
    }
  };

  // Get time until due date
  const getTimeUntilDue = (cow) => {
    if (!cow.breedingRecords || cow.breedingRecords.length === 0) return null;
    
    const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
    if (!lastBreeding.expectedDueDate) return null;
    
    const dueDate = new Date(lastBreeding.expectedDueDate);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days until due`;
  };

  // Generate calendar data for heat detection
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || calendar.length < 42) {
      calendar.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return calendar;
  };

  // Get heat events for a specific date (Heat Calendar only)
  const getHeatEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];

    // Ensure we have valid cows data
    if (!cows || cows.length === 0) {
      return events;
    }

    cows.forEach(cow => {
      // Check for confirmed heat detections
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => 
          record.type === 'Heat Detection' && record.date === dateStr
        );
        
        if (heatRecords.length > 0) {
          events.push({
            type: 'heat',
            cow: cow,
            record: heatRecords[0]
          });
        }
      }

      // Check for predicted heat dates
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => record.type === 'Heat Detection');
        if (heatRecords.length > 0) {
          const lastHeat = new Date(heatRecords[heatRecords.length - 1].date);
          const predictedHeat = new Date(lastHeat);
          predictedHeat.setDate(predictedHeat.getDate() + 21);
          
          if (predictedHeat.toISOString().split('T')[0] === dateStr) {
            events.push({
              type: 'predicted_heat',
              cow: cow,
              predictedDate: predictedHeat
            });
          }
        }
      }
    });

    return events;
  };

  // Helper function to get heat event type labels
  const getHeatEventTypeLabel = (eventType) => {
    switch (eventType) {
      case 'heat':
        return 'Confirmed Heat';
      case 'predicted_heat':
        return 'Predicted Heat';
      default:
        return 'Heat Event';
    }
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const calendarData = getCalendarData();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Add handler to open modal
  const handleAddBull = () => setShowBullModal(true);
  // Update handleCloseBullModal to reset editing state
  const handleCloseBullModal = () => {
    setShowBullModal(false);
    setEditingBull(null);
  };

  // Add handler to add bull
  const handleSaveBull = (bull) => {
    if (editingBull !== null) {
      // Editing existing bull
      const updatedInventory = bullInventory.map((b, i) => i === editingBull.index ? bull : b);
      onUpdateBullInventory(updatedInventory);
      setEditingBull(null);
    } else {
      // Adding new bull
      const updatedInventory = [...bullInventory, bull];
      onUpdateBullInventory(updatedInventory);
    }
    setShowBullModal(false);
  };

  // Add handlers for edit and delete
  const handleEditBull = (bull, index) => {
    setEditingBull({ ...bull, index });
    setShowBullModal(true);
  };

  const handleDeleteBull = (index) => {
    if (window.confirm('Are you sure you want to delete this bull from inventory?')) {
      const updatedInventory = bullInventory.filter((_, i) => i !== index);
      onUpdateBullInventory(updatedInventory);
    }
  };

  // Pregnancy check handlers
  const handlePregnancyCheck = (cow, action) => {
    setPregnancyCheckCow(cow);
    setPregnancyCheckAction(action);
    setShowPregnancyCheckDialog(true);
  };

  const handleConfirmPregnancyCheck = () => {
    if (!pregnancyCheckCow || !pregnancyCheckAction) return;

    console.log('🐄 Confirming pregnancy check:', pregnancyCheckAction, 'for cow:', pregnancyCheckCow.name);

    // Create a pregnancy check health record
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    const pregnancyRecord = createHealthRecord({
      type: 'Pregnancy Check',
      description: pregnancyCheckAction === 'pregnant' 
        ? 'Pregnancy confirmed positive' 
        : 'Pregnancy check negative',
      date: todayStr
    });

    console.log('🐄 Created pregnancy record:', pregnancyRecord);

    // Update the cow's health records
    const updatedCow = {
      ...pregnancyCheckCow,
      healthRecords: [...(pregnancyCheckCow.healthRecords || []), pregnancyRecord]
    };

    console.log('🐄 Updated cow health records count:', updatedCow.healthRecords.length);

    // Update the cow in the main herd
    onUpdateCow(updatedCow);

    // Close the dialog
    setShowPregnancyCheckDialog(false);
    setPregnancyCheckCow(null);
    setPregnancyCheckAction(null);

    console.log('🐄 Pregnancy check completed for:', pregnancyCheckCow.name);
  };

  const handleCancelPregnancyCheck = () => {
    setShowPregnancyCheckDialog(false);
    setPregnancyCheckCow(null);
    setPregnancyCheckAction(null);
  };

  // Handle Record Breeding button click
  const handleRecordBreeding = () => {
    setShowBreedingModal(true);
  };

  // Handle breeding modal close
  const handleCloseBreedingModal = () => {
    setShowBreedingModal(false);
    setSelectedCowForBreeding(null);
  };

  // Handle breeding record save - integrates with existing system
  const handleBreedingRecordSave = (selectedCow, breedingRecord, selectedBullId, isEditing = false, oldBreedingRecord = null) => {
    console.log('🐄 BreedingCenter: handleBreedingRecordSave called with:', {
      cow: selectedCow.name,
      breedingRecord,
      selectedBullId,
      isEditing,
      oldBreedingRecord
    });

    // Update the cow's breeding records
    const updatedCow = {
      ...selectedCow,
      breedingRecords: isEditing
        ? selectedCow.breedingRecords.map(record => 
            record.id === breedingRecord.id ? breedingRecord : record
          )
        : [...(selectedCow.breedingRecords || []), breedingRecord]
    };

    // Update the cow in the parent component
    onUpdateCow(updatedCow);

    // Update bull inventory (straw count reduction)
    const updatedBullInventory = bullInventory.map(bull => {
      if (bull.naabCode === selectedBullId) {
        if (isEditing && oldBreedingRecord) {
          // Handle editing: restore old bull's straw count and reduce new bull's count
          if (oldBreedingRecord.semenId !== selectedBullId) {
            // Different bull selected - restore old bull and reduce new bull
            const oldBull = bullInventory.find(b => b.naabCode === oldBreedingRecord.semenId);
            if (oldBull) {
              oldBull.straws = Math.max(0, oldBull.straws + 1);
            }
            return { ...bull, straws: Math.max(0, bull.straws - 1) };
          }
          // Same bull - no change needed
          return bull;
        } else {
          // New breeding record - reduce straw count by 1
          return { ...bull, straws: Math.max(0, bull.straws - 1) };
        }
      }
      return bull;
    });

    // Update bull inventory in parent component
    onUpdateBullInventory(updatedBullInventory);

    console.log('✅ Breeding record saved and inventory updated');
  };

  // Helper function to display cow name gracefully
  const getDisplayName = (cow) => {
    return cow.name?.trim() || `#${cow.tagNumber}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Breeding Center</h1>
          <p className="text-slate-600 mt-1">
            Manage breeding programs and track reproductive status
          </p>
        </div>
        <button className="bg-gradient-to-r from-pink-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-red-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl" onClick={handleRecordBreeding}>
          <Plus className="w-5 h-5" />
          <span>Record Breeding</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'calendar'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Heat Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('bullInventory')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'bullInventory'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Baby className="w-4 h-4" />
            <span>Bull Inventory</span>
          </button>

        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button 
                  onClick={() => setActiveFilter(activeFilter === 'cowsDueThisMonth' ? null : 'cowsDueThisMonth')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    activeFilter === 'cowsDueThisMonth' ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Cows Due This Month</p>
                      <p className="text-3xl font-bold text-green-600">{breedingMetrics.cowsDueThisMonth}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Baby className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveFilter(activeFilter === 'inHeatToday' ? null : 'inHeatToday')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    activeFilter === 'inHeatToday' ? 'ring-2 ring-red-500 bg-red-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">In Heat Today</p>
                      <p className="text-3xl font-bold text-red-600">{breedingMetrics.inHeatToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Thermometer className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveFilter(activeFilter === 'predictedHeat' ? null : 'predictedHeat')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    activeFilter === 'predictedHeat' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Predicted Heat</p>
                      <p className="text-3xl font-bold text-orange-600">{breedingMetrics.predictedHeatToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setActiveFilter(activeFilter === 'pregnancyChecks' ? null : 'pregnancyChecks')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    activeFilter === 'pregnancyChecks' ? 'ring-2 ring-purple-500 bg-purple-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pregnancy Checks</p>
                      <p className="text-3xl font-bold text-purple-600">{breedingMetrics.pregnancyChecksNeeded}</p>
                      <p className="text-xs text-slate-500">40+ days after breeding</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Baby className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </button>
              </div>

              {/* Filtered Animals View */}
              {activeFilter && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {activeFilter === 'cowsDueThisMonth' && 'Cows Due This Month'}
                        {activeFilter === 'inHeatToday' && 'Animals in Heat Today'}
                        {activeFilter === 'predictedHeat' && 'Animals with Predicted Heat Today'}
                        {activeFilter === 'pregnancyChecks' && 'Animals Needing Pregnancy Checks'}
                      </h3>
                      <button 
                        onClick={() => setActiveFilter(null)}
                        className="text-slate-500 hover:text-slate-700 text-sm font-medium"
                      >
                        Clear Filter
                      </button>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Animal</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tag Number</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                          {activeFilter === 'cowsDueThisMonth' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Due Date</th>
                          )}
                          {activeFilter === 'pregnancyChecks' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Days Since Breeding</th>
                          )}
                          {activeFilter === 'pregnancyChecks' && (
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {getFilteredAnimals().map((cow) => (
                          <tr key={cow.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button
                                onClick={() => onViewProfile(cow)}
                                className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors text-left"
                              >
                                {getDisplayName(cow)}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-slate-500">{cow.tagNumber}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {activeFilter === 'cowsDueThisMonth' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Pregnant
                                </span>
                              )}
                              {activeFilter === 'inHeatToday' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  In Heat
                                </span>
                              )}
                              {activeFilter === 'predictedHeat' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                  Predicted Heat
                                </span>
                              )}
                              {activeFilter === 'pregnancyChecks' && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  cow.daysSinceBreeding > 50 ? 'bg-red-100 text-red-800' : 
                                  cow.daysSinceBreeding > 45 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {cow.daysSinceBreeding > 50 ? 'Critical' : 
                                   cow.daysSinceBreeding > 45 ? 'Overdue' : 'Due'}
                                </span>
                              )}
                            </td>
                            {activeFilter === 'cowsDueThisMonth' && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-green-600">
                                  {cow.breedingRecords && cow.breedingRecords.length > 0 && cow.breedingRecords[cow.breedingRecords.length - 1].expectedDueDate
                                    ? (() => {
                                        const dateString = cow.breedingRecords[cow.breedingRecords.length - 1].expectedDueDate;
                                        const [year, month, day] = dateString.split('-').map(Number);
                                        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                        return monthNames[month - 1] + ' ' + day + ', ' + year;
                                      })()
                                    : 'Unknown'
                                  }
                                </div>
                              </td>
                            )}
                            {activeFilter === 'pregnancyChecks' && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className={`text-sm font-medium ${
                                  cow.daysSinceBreeding > 50 ? 'text-red-600' : 
                                  cow.daysSinceBreeding > 45 ? 'text-orange-600' : 'text-yellow-600'
                                }`}>
                                  {cow.daysSinceBreeding} days
                                </div>
                              </td>
                            )}
                            {activeFilter === 'pregnancyChecks' && (
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => handlePregnancyCheck(cow, 'pregnant')}
                                    className="p-2 bg-green-100 hover:bg-green-200 text-green-600 hover:text-green-700 rounded-lg transition-colors"
                                    title="Mark as Pregnant"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handlePregnancyCheck(cow, 'open')}
                                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 hover:text-red-700 rounded-lg transition-colors"
                                    title="Mark as Open"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {getFilteredAnimals().length === 0 && (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">No animals found</h3>
                      <p className="text-slate-600">No animals match the selected filter criteria.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Today's Breeding Priorities */}
              <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-6 border border-pink-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Breeding Priorities</h3>
                
                {/* Breeding Ready Cows in Heat Today (15+ months old) */}
                {breedingMetrics.breedingReadyInHeatToday > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-red-700 mb-3 flex items-center space-x-2">
                      <Thermometer className="w-4 h-4" />
                      <span>Breeding Ready Cows in Heat Today ({breedingMetrics.breedingReadyInHeatToday})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getBreedingReadyCowsInHeatToday().map(cow => (
                        <div key={cow.id} className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{getDisplayName(cow)}</p>
                              {cow.name?.trim() && <p className="text-sm text-slate-600">{cow.tagNumber}</p>}
                              <p className="text-xs text-slate-500">{calculateAgeInMonths(cow.dateOfBirth)} months old</p>
                            </div>
                            <button
                              onClick={() => onViewProfile(cow)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Breeding Ready Predicted Heat Today (15+ months old) */}
                {breedingMetrics.breedingReadyPredictedHeatToday > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-orange-700 mb-3 flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Breeding Ready Predicted Heat Today ({breedingMetrics.breedingReadyPredictedHeatToday})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getBreedingReadyCowsWithPredictedHeatToday().map(cow => (
                        <div key={cow.id} className="bg-white rounded-lg p-3 border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{getDisplayName(cow)}</p>
                              {cow.name?.trim() && <p className="text-sm text-slate-600">{cow.tagNumber}</p>}
                              <p className="text-xs text-slate-500">{calculateAgeInMonths(cow.dateOfBirth)} months old</p>
                            </div>
                            <button
                              onClick={() => recordHeatDetection(cow)}
                              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                            >
                              Record Heat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {breedingMetrics.breedingReadyInHeatToday === 0 && breedingMetrics.breedingReadyPredictedHeatToday === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-600">No breeding priorities for today!</p>
                  </div>
                )}
              </div>

              {/* Success Rate Metrics */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Breeding Success Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{breedingMetrics.open}</p>
                    <p className="text-sm text-slate-600">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{breedingMetrics.bred}</p>
                    <p className="text-sm text-slate-600">Bred</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{breedingMetrics.pregnant}</p>
                    <p className="text-sm text-slate-600">Pregnant</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{breedingMetrics.successRate}%</p>
                    <p className="text-sm text-slate-600">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Heat Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Calendar Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="ml-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-4 text-center">
                      <span className="text-sm font-medium text-slate-600">{day}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div key={calendarKey} className="grid grid-cols-7">
                  {calendarData.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const events = getHeatEventsForDate(date);
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`min-h-32 border-r border-b border-slate-200 p-2 cursor-pointer transition-colors ${
                          !isCurrentMonth ? 'bg-slate-50' : 'bg-white'
                        } ${
                          isToday ? 'bg-blue-50' : ''
                        } ${
                          isSelected ? 'ring-2 ring-pink-500' : ''
                        } hover:bg-slate-50`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            !isCurrentMonth ? 'text-slate-400' : 'text-slate-900'
                          } ${
                            isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                          }`}>
                            {date.getDate()}
                          </span>
                          {events.length > 0 && (
                            <span className="bg-slate-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {events.length}
                            </span>
                          )}
                        </div>
                        
                        {/* Heat Events */}
                        <div className="space-y-1">
                          {events.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                event.type === 'heat' 
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : event.type === 'predicted_heat'
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                              title={`${getDisplayName(event.cow)} - ${getHeatEventTypeLabel(event.type)}`}
                            >
                              {getDisplayName(event.cow)}
                            </div>
                          ))}
                          {events.length > 3 && (
                            <div className="text-xs text-slate-500">
                              +{events.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Events */}
              {selectedDate && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Heat Events for {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>
                  <div className="p-6">
                    {(() => {
                      const events = getHeatEventsForDate(selectedDate);
                      
                      if (events.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600">No heat events for this date.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4">
                          {events.map((event, index) => (
                            <div key={index} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                              <div className={`w-3 h-3 rounded-full mt-2 ${
                                event.type === 'heat' ? 'bg-red-500' 
                                : event.type === 'predicted_heat' ? 'bg-orange-500'
                                : 'bg-slate-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-slate-900">{getDisplayName(event.cow)}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    event.type === 'heat' ? 'bg-red-100 text-red-700'
                                    : event.type === 'predicted_heat' ? 'bg-orange-100 text-orange-700'
                                    : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {getHeatEventTypeLabel(event.type)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{event.cow.tagNumber} • {event.cow.breed}</p>
                              </div>
                              <button
                                onClick={() => onViewProfile(event.cow)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bull Inventory Tab */}
          {activeTab === 'bullInventory' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Bull Inventory</h3>
                <button onClick={handleAddBull} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Bull
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Bull Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">NAAB Code</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Straws Available</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cost/Straw</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Value</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tank Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Canister #</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      {bullInventory.map((bull, index) => (
                        <tr key={index} className="hover:bg-slate-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-slate-900">{bull.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-500">{bull.naabCode}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium ${
                              bull.straws === 0 
                                ? 'text-red-600' 
                                : bull.straws <= 5 
                                  ? 'text-orange-600' 
                                  : 'text-slate-900'
                            }`}>
                              {bull.straws}
                              {bull.straws === 0 && ' (Out of Stock)'}
                              {bull.straws > 0 && bull.straws <= 5 && ' (Low Stock)'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">${bull.cost}/Straw</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">${bull.straws * bull.cost}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{bull.tank}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-slate-900">{bull.canister}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button onClick={() => handleEditBull(bull, index)} className="text-blue-600 hover:text-blue-900 mr-2">Edit</button>
                            <button onClick={() => handleDeleteBull(index)} className="text-red-600 hover:text-red-900">Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}


        </div>
      </div>

      {/* Breeding Record Modal */}
      <BreedingRecordModal
        isOpen={showBreedingModal}
        onClose={handleCloseBreedingModal}
        cows={cows}
        bullInventory={bullInventory}
        onSave={handleBreedingRecordSave}
        selectedCow={selectedCowForBreeding}
        editingRecord={null}
      />

      {/* Bull Inventory Modal */}
      <BullInventoryModal
        isOpen={showBullModal}
        onClose={handleCloseBullModal}
        onSave={handleSaveBull}
        editingBull={editingBull}
      />

      {/* Pregnancy Check Confirmation Dialog */}
      {showPregnancyCheckDialog && pregnancyCheckCow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100">
                {pregnancyCheckAction === 'pregnant' ? (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                ) : (
                  <X className="w-8 h-8 text-red-600" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Confirm Pregnancy Check
              </h3>
              <p className="text-slate-600 mb-6">
                Mark <span className="font-medium">{getDisplayName(pregnancyCheckCow)}</span> as{' '}
                <span className={`font-medium ${pregnancyCheckAction === 'pregnant' ? 'text-green-600' : 'text-red-600'}`}>
                  {pregnancyCheckAction === 'pregnant' ? 'Pregnant' : 'Open'}
                </span>?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancelPregnancyCheck}
                  className="flex-1 px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPregnancyCheck}
                  className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
                    pregnancyCheckAction === 'pregnant' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function BullInventoryModal({ isOpen, onClose, onSave, editingBull }) {
  const [form, setForm] = useState({
    name: '',
    naabCode: '',
    straws: '',
    cost: '',
    tank: '',
    canister: '',
    purchaseDate: '',
    supplier: ''
  });
  const [errors, setErrors] = useState({});

  // Pre-populate form when editing
  useEffect(() => {
    if (editingBull) {
      setForm({
        name: editingBull.name || '',
        naabCode: editingBull.naabCode || '',
        straws: editingBull.straws || '',
        cost: editingBull.cost || '',
        tank: editingBull.tank || '',
        canister: editingBull.canister || '',
        purchaseDate: editingBull.purchaseDate || '',
        supplier: editingBull.supplier || ''
      });
    } else {
      setForm({
        name: '',
        naabCode: '',
        straws: '',
        cost: '',
        tank: '',
        canister: '',
        purchaseDate: '',
        supplier: ''
      });
    }
  }, [editingBull]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.naabCode.trim() || !/^\w{3,}-?\w{2,}$/.test(form.naabCode)) errs.naabCode = 'Valid NAAB code required';
    if (!form.straws || isNaN(form.straws) || Number(form.straws) < 0) errs.straws = 'Required, must be a number';
    if (!form.cost || isNaN(form.cost) || Number(form.cost) < 0) errs.cost = 'Required, must be a number';
    return errs;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSave({ ...form, straws: Number(form.straws), cost: Number(form.cost) });
      setForm({ name: '', naabCode: '', straws: '', cost: '', tank: '', canister: '', purchaseDate: '', supplier: '' });
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
        <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">{editingBull ? 'Edit Bull' : 'Add Bull to Inventory'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Bull Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
          </div>
          <div>
            <label className="block font-medium">NAAB Code *</label>
            <input name="naabCode" value={form.naabCode} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            {errors.naabCode && <div className="text-red-500 text-xs">{errors.naabCode}</div>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Initial Straw Count *</label>
              <input name="straws" type="number" value={form.straws} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              {errors.straws && <div className="text-red-500 text-xs">{errors.straws}</div>}
            </div>
            <div>
              <label className="block font-medium">Cost per Straw ($) *</label>
              <input name="cost" type="number" value={form.cost} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              {errors.cost && <div className="text-red-500 text-xs">{errors.cost}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Tank Location</label>
              <input name="tank" value={form.tank} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-medium">Canister Number</label>
              <input name="canister" value={form.canister} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Purchase Date</label>
              <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-medium">Supplier/Company</label>
              <input name="supplier" value={form.supplier} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">
              {editingBull ? 'Update Bull' : 'Add Bull'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BreedingCenter; 