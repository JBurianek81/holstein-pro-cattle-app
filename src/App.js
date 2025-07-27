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
import { calculateReproductiveStatus, calculateHerdHealthScore, getHealthScoreBadge } from './utils/cowDataModel';

function App() {
  // Helper function to display cow name gracefully
  const getCowDisplayName = (cow) => {
    return cow.name?.trim() || `#${cow.tagNumber}`;
  };

  // Helper function to display cow name with tag number
  const getCowDisplayNameWithTag = (cow) => {
    if (cow.name?.trim()) {
      return `${cow.name} #${cow.tagNumber}`;
    }
    return `#${cow.tagNumber}`;
  };

  const [currentView, setCurrentView] = useState('dashboard');

  // Cow management state
  const [cows, setCows] = useState([]);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [isAddCowModalOpen, setIsAddCowModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState(null);
  const [profileCow, setProfileCow] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Bull inventory state
  const [bullInventory, setBullInventory] = useState([
    {
      id: 'bull-1',
      name: "Champion's Pride",
      naabCode: 'CHAMP001',
      breed: 'Holstein',
      straws: 25,
      cost: 25.00,
      description: 'High milk production, excellent udder conformation'
    },
    {
      id: 'bull-2',
      name: 'Milk Master',
      naabCode: 'MILK002',
      breed: 'Holstein',
      straws: 18,
      cost: 30.00,
      description: 'Superior milk yield, strong legs and feet'
    }
  ]);

  // Profile data state for farm name display
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

  // Load cows from localStorage on app start
  useEffect(() => {
    try {
      const savedCows = localStorage.getItem('cattleAppCows');
      console.log('📂 LOADING from localStorage:', savedCows ? 'Found data' : 'No data');
      
      if (savedCows) {
        const parsedCows = JSON.parse(savedCows);
        console.log('📂 LOADED:', parsedCows.length, 'animals');
        
        // Validate the loaded data
        if (Array.isArray(parsedCows)) {
          // Clean up any debug test cows that might have been added during testing
          const cleanedCows = parsedCows.filter(cow => 
            !cow.id?.includes('debug-test-') && 
            !cow.tagNumber?.includes('DEBUG') &&
            !cow.name?.includes('Debug Test Cow')
          );
          
          if (cleanedCows.length !== parsedCows.length) {
            console.log('🧹 Cleaned up', parsedCows.length - cleanedCows.length, 'debug test cows');
            setCows(cleanedCows);
          } else {
            setCows(parsedCows);
          }
          
          console.log('✅ Successfully loaded cows from localStorage:', cleanedCows.length);
        } else {
          console.error('❌ Invalid data format in localStorage - expected array, got:', typeof parsedCows);
          // Backup corrupted data and start fresh
          localStorage.setItem('cattleAppCows_backup_' + Date.now(), savedCows);
          localStorage.removeItem('cattleAppCows');
          setCows([]);
        }
      } else {
        console.log('📂 No existing data found in localStorage, starting with empty herd');
        setCows([]);
      }
      
      // Mark initial load as complete
      setIsInitialLoadComplete(true);
      console.log('✅ Initial load complete');
    } catch (error) {
      console.error('❌ Error loading cows from localStorage:', error);
      // Backup corrupted data and start fresh
      try {
        const corruptedData = localStorage.getItem('cattleAppCows');
        if (corruptedData) {
          localStorage.setItem('cattleAppCows_backup_' + Date.now(), corruptedData);
        }
      } catch (backupError) {
        console.error('❌ Failed to backup corrupted data:', backupError);
      }
      localStorage.removeItem('cattleAppCows');
      setCows([]);
    }

    // Load profile data from localStorage
    try {
      const savedSettings = localStorage.getItem('holsteinProSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        if (settings.profile) {
          setProfileData(settings.profile);
          console.log('✅ Loaded profile data from localStorage:', settings.profile.farmName);
        }
      }
    } catch (error) {
      console.error('❌ Error loading profile data from localStorage:', error);
    }
  }, []);

  // Save cows to localStorage whenever cows state changes
  useEffect(() => {
    // Only save after initial load is complete to prevent race conditions
    if (!isInitialLoadComplete) {
      console.log('🔄 Skipping save - initial load not complete yet');
      return;
    }
    
    // Skip saving if cows is still the initial empty array (prevents overwriting on first load)
    if (cows.length === 0) {
      const existingData = localStorage.getItem('cattleAppCows');
      if (existingData) {
        console.log('🔄 Skipping save - cows array is empty but localStorage has data (likely initial load)');
        return;
      }
    }
    
    try {
      console.log('💾 SAVING to localStorage:', cows.length, 'animals');
      
      // Validate data before saving
      if (!Array.isArray(cows)) {
        console.error('❌ Invalid cows data - expected array, got:', typeof cows);
        return;
      }
      
      // Create a backup before overwriting
      const existingData = localStorage.getItem('cattleAppCows');
      if (existingData && cows.length === 0) {
        console.warn('⚠️ WARNING: Attempting to save empty cows array when existing data exists');
        console.warn('⚠️ This could indicate data loss - creating backup');
        localStorage.setItem('cattleAppCows_backup_' + Date.now(), existingData);
      }
      
      const cowsData = JSON.stringify(cows);
      localStorage.setItem('cattleAppCows', cowsData);
      console.log('💾 SAVED successfully - Data size:', cowsData.length, 'characters');
      
      // Verify the save was successful
      const verifyData = localStorage.getItem('cattleAppCows');
      if (verifyData === cowsData) {
        console.log('✅ Save verification successful');
      } else {
        console.error('❌ Save verification failed - data mismatch');
      }
    } catch (error) {
      console.error('❌ Error saving cows to localStorage:', error);
      // Try to save a backup
      try {
        localStorage.setItem('cattleAppCows_backup_' + Date.now(), JSON.stringify(cows));
        console.log('💾 Created backup due to save error');
      } catch (backupError) {
        console.error('❌ Failed to create backup:', backupError);
      }
    }
  }, [cows, isInitialLoadComplete]);

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
              cow: getCowDisplayNameWithTag(cow),
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
              cow: getCowDisplayNameWithTag(cow),
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
              cow: getCowDisplayNameWithTag(cow),
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
              cow: getCowDisplayNameWithTag(cow),
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
                cow: getCowDisplayNameWithTag(cow),
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
          record.type === 'Deworming'
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
              cow: getCowDisplayNameWithTag(cow),
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
          record.type === 'Hoof Trimming'
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
              cow: getCowDisplayNameWithTag(cow),
              message: 'Hoof trimming overdue',
              priority: 'medium',
              type: 'health',
              time: timeText,
              cowId: cow.id
            });
          }
        });
        
        // Mastitis monitoring (serious udder infection)
        const mastitisRecords = cow.healthRecords.filter(record => 
          record.type === 'Mastitis'
        );
        
        mastitisRecords.forEach(mastitisRecord => {
          const mastitisDate = new Date(mastitisRecord.date);
          const daysSinceMastitis = Math.round((today - mastitisDate) / (1000 * 60 * 60 * 24));
          
          // Check if follow-up is needed (within 7 days of mastitis diagnosis)
          if (daysSinceMastitis <= 7 && !mastitisRecord.followUpCompleted) {
            alerts.push({
              id: `mastitis-followup-${cow.id}-${mastitisRecord.id}`,
              cow: getCowDisplayNameWithTag(cow),
              message: `Mastitis follow-up needed: ${mastitisRecord.description || 'udder infection'}`,
              priority: 'high',
              type: 'health',
              time: `${daysSinceMastitis} days ago`,
              cowId: cow.id
            });
          }
        });
        
        // D.A. (Displaced Abomasum) monitoring (serious digestive issue)
        const daRecords = cow.healthRecords.filter(record => 
          record.type === 'D.A.'
        );
        
        daRecords.forEach(daRecord => {
          const daDate = new Date(daRecord.date);
          const daysSinceDA = Math.round((today - daDate) / (1000 * 60 * 60 * 24));
          
          // Check if follow-up is needed (within 14 days of D.A. diagnosis)
          if (daysSinceDA <= 14 && !daRecord.followUpCompleted) {
            alerts.push({
              id: `da-followup-${cow.id}-${daRecord.id}`,
              cow: getCowDisplayNameWithTag(cow),
              message: `D.A. follow-up needed: ${daRecord.description || 'displaced abomasum'}`,
              priority: 'high',
              type: 'health',
              time: `${daysSinceDA} days ago`,
              cowId: cow.id
            });
          }
        });
        
        // Cystic ovaries monitoring (reproductive issue)
        const cysticRecords = cow.healthRecords.filter(record => 
          record.type === 'Cystic'
        );
        
        cysticRecords.forEach(cysticRecord => {
          const cysticDate = new Date(cysticRecord.date);
          const daysSinceCystic = Math.round((today - cysticDate) / (1000 * 60 * 60 * 24));
          
          // Check if follow-up is needed (within 30 days of cystic diagnosis)
          if (daysSinceCystic <= 30 && !cysticRecord.followUpCompleted) {
            alerts.push({
              id: `cystic-followup-${cow.id}-${cysticRecord.id}`,
              cow: getCowDisplayNameWithTag(cow),
              message: `Cystic ovaries follow-up needed: ${cysticRecord.description || 'reproductive issue'}`,
              priority: 'medium',
              type: 'health',
              time: `${daysSinceCystic} days ago`,
              cowId: cow.id
            });
          }
        });
        
        // Surgery recovery monitoring
        const surgeryRecords = cow.healthRecords.filter(record => 
          record.type === 'Surgery'
        );
        
        surgeryRecords.forEach(surgeryRecord => {
          const surgeryDate = new Date(surgeryRecord.date);
          const daysSinceSurgery = Math.round((today - surgeryDate) / (1000 * 60 * 60 * 24));
          
          // Check if recovery monitoring is needed (within 30 days of surgery)
          if (daysSinceSurgery <= 30 && !surgeryRecord.recoveryCompleted) {
            alerts.push({
              id: `surgery-recovery-${cow.id}-${surgeryRecord.id}`,
              cow: getCowDisplayNameWithTag(cow),
              message: `Surgery recovery monitoring: ${surgeryRecord.description || 'post-operative care'}`,
              priority: 'high',
              type: 'health',
              time: `${daysSinceSurgery} days ago`,
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
              cow: getCowDisplayNameWithTag(cow),
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
              cow: getCowDisplayNameWithTag(cow),
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
            cow: getCowDisplayNameWithTag(cow),
            message: 'Pregnancy check due',
            priority: priority,
            type: 'health',
            time: timeText,
            cowId: cow.id
          });
        }
      }
    });
    
    // 5. Bull Inventory Reorder Alerts
    bullInventory.forEach(bull => {
      if (bull.straws <= 5) {
        const priority = bull.straws === 0 ? 'critical' : 
                        bull.straws <= 2 ? 'high' : 'medium';
        
        const message = bull.straws === 0 
          ? `Re-order ${bull.name} - Out of stock`
          : `Re-order ${bull.name} - Only ${bull.straws} straws remaining`;
        
        alerts.push({
          id: `reorder-${bull.naabCode}`,
          cow: bull.name,
          message: message,
          priority: priority,
          type: 'inventory',
          time: 'Now',
          bullId: bull.naabCode
        });
      }
    });
    
    // Sort alerts by priority (critical > high > medium) and then by urgency
    const priorityOrder = { critical: 3, high: 2, medium: 1 };
    return alerts.sort((a, b) => {
      // First sort by priority
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then sort by type (calving > breeding > health > inventory)
      const typeOrder = { calving: 4, breeding: 3, health: 2, inventory: 1 };
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
    console.log('✅ Bull inventory updated:', updatedBullInventory.length, 'bulls');
  };

  // Update profile data when settings are saved
  const handleProfileUpdate = (updatedProfileData) => {
    setProfileData(updatedProfileData);
    console.log('✅ Profile data updated:', updatedProfileData.farmName);
  };

  const handleBreedingRecordSaved = (cow, breedingRecord, selectedBullId, isEditing = false, oldBreedingRecord = null) => {
    console.log('🐄 handleBreedingRecordSaved called with:', { 
      cow: cow.name, 
      breedingRecord, 
      selectedBullId, 
      isEditing, 
      oldBreedingRecord 
    });

    // Note: Breeding record is already added to cow via onUpdateCow in CowProfileModal
    // This function handles bull inventory updates

    setBullInventory(prevInventory => {
      let updatedInventory = [...prevInventory];

      if (isEditing && oldBreedingRecord) {
        // Handle editing: restore old bull's straw count and reduce new bull's count
        const oldBull = updatedInventory.find(bull => bull.naabCode === oldBreedingRecord.semenId);
        if (oldBull) {
          oldBull.straws = Math.max(0, oldBull.straws + 1);
          console.log(`🔄 Restored 1 straw to ${oldBull.name} (${oldBull.naabCode}) - now has ${oldBull.straws} straws`);
        }

        const newBull = updatedInventory.find(bull => bull.naabCode === selectedBullId);
        if (newBull) {
          if (newBull.straws <= 0) {
            console.warn(`⚠️ Warning: ${newBull.name} (${newBull.naabCode}) has no straws available!`);
          }
          newBull.straws = Math.max(0, newBull.straws - 1);
          console.log(`🔄 Reduced 1 straw from ${newBull.name} (${newBull.naabCode}) - now has ${newBull.straws} straws`);
        }
      } else {
        // Handle new breeding record: reduce bull straw count by 1
        const selectedBull = updatedInventory.find(bull => bull.naabCode === selectedBullId);
        if (selectedBull) {
          if (selectedBull.straws <= 0) {
            console.warn(`⚠️ Warning: ${selectedBull.name} (${selectedBull.naabCode}) has no straws available!`);
          }
          selectedBull.straws = Math.max(0, selectedBull.straws - 1);
          console.log(`🔄 Reduced 1 straw from ${selectedBull.name} (${selectedBull.naabCode}) - now has ${selectedBull.straws} straws`);
        } else {
          console.warn(`⚠️ Warning: Bull with NAAB code ${selectedBullId} not found in inventory!`);
        }
      }

      console.log('🐄 Updated bull inventory:', updatedInventory.length, 'bulls');
      return updatedInventory;
    });

    console.log('✅ Bull inventory updated for breeding record');
  };

  const handleBreedingRecordDeleted = (cow, deletedBreedingRecord) => {
    console.log('🐄 handleBreedingRecordDeleted called with:', { 
      cow: cow.name, 
      deletedBreedingRecord 
    });

    // Restore bull straw count by 1 when breeding record is deleted
    setBullInventory(prevInventory => {
      const updatedInventory = prevInventory.map(bull => {
        if (bull.naabCode === deletedBreedingRecord.semenId) {
          const newStrawCount = bull.straws + 1;
          console.log(`🔄 Restored 1 straw to ${bull.name} (${bull.naabCode}) - now has ${newStrawCount} straws`);
          return { ...bull, straws: newStrawCount };
        }
        return bull;
      });
      
      console.log('🐄 Updated bull inventory after deletion:', updatedInventory.length, 'bulls');
      return updatedInventory;
    });

    console.log('✅ Bull inventory restored after breeding record deletion');
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




  
  // Update metrics based on current cows data
  const updatedMetrics = {
    total: { value: cows.length },
    pregnant: { value: cows.filter(cow => cow.status === 'Pregnant' || cow.category === 'Cow').length },
    breeding: { value: getCowsInHeatToday().length },
    health: { value: calculateHerdHealthScore(cows) }
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
              {profileData.farmName && (
                <p className="text-lg font-bold text-blue-600 mt-1">
                  {profileData.farmName}
                </p>
              )}
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
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Health Score</p>
                      <p className={`text-3xl font-bold ${getHealthScoreBadge(updatedMetrics.health.value).className.replace('px-3 py-1 text-sm font-bold rounded-full', '')}`}>
                        {updatedMetrics.health.value}%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
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
                              <div className="flex items-center space-x-2">
                                <p className="font-medium text-slate-900">{alert.cow}</p>
                                {alert.type === 'inventory' && (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                                    Inventory
                                  </span>
                                )}
                              </div>
                              <span className="text-sm text-slate-500">{alert.time}</span>
                            </div>
                            <p className="text-sm text-slate-600 mt-1">{alert.message}</p>
                          </div>
                          <button 
                            onClick={() => {
                              if (alert.type === 'inventory') {
                                // For inventory alerts, navigate to Breeding Center
                                setCurrentView('breeding');
                              } else {
                                // For other alerts, open cow profile
                                const cow = cows.find(c => c.id === alert.cowId);
                                if (cow) {
                                  handleViewProfile(cow);
                                }
                              }
                            }}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            {alert.type === 'inventory' ? 'Manage Inventory' : 'View'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
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
              bullInventory={bullInventory}
            />
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <SettingsView 
              profileData={profileData} 
              onProfileUpdate={handleProfileUpdate}
              cows={cows}
              onUpdateCows={setCows}
            />
          )}
        </main>
      </div>
      
      {/* Mobile-only floating Add Cow button */}
      <button
        onClick={handleAddCow}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center md:hidden z-50"
      >
        <Plus className="w-6 h-6" />
      </button>
      
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
        onBreedingRecordDeleted={handleBreedingRecordDeleted}
        onAddCow={handleAddCow}
        cows={cows}
        onUpdateBullInventory={handleUpdateBullInventory}
      />
    </div>
  );
}

export default App;
