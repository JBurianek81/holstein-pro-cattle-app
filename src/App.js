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
  Archive,
  LogOut,
  X
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { requestNotificationPermission, onMessageListener } from './firebase/messaging';
import { utils } from './utils/firestoreService';
import { checkTaskNotifications, initializeNotifications, createTestTask, createTimezoneTestTasks } from './utils/taskNotifications';
import taskService from './utils/taskService';
import { determineCategoryByGenderAndAge, updateCategoryByAge } from './utils/cowDataModel';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
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

function AppContent() {
  const { user, farm, farmData, loading, login, logout, updateCows, updateBullInventory, updateProfileData, refreshFarmData, testFirebaseConnection } = useAuth();
  const { updateTheme } = useTheme();
  
  // ALL HOOKS FIRST - at the very top
  const [currentView, setCurrentView] = useState('dashboard');
  const [authView, setAuthView] = useState('landing'); // 'landing', 'login', 'register'
  const [dashboardFilter, setDashboardFilter] = useState(null);
  const [hasInitializedDashboard, setHasInitializedDashboard] = useState(false);

  // Environment detection
  useEffect(() => {
    console.log('🌍 ENVIRONMENT CHECK:');
    console.log('🌍 Current URL:', window.location.href);
    console.log('🌍 Hostname:', window.location.hostname);
    console.log('🌍 Is localhost:', window.location.hostname === 'localhost');
    console.log('🌍 Is live site:', window.location.hostname.includes('firebaseapp.com') || window.location.hostname.includes('web.app'));
    console.log('🌍 User:', user?.email);
    console.log('🌍 User farm code:', user?.farmCode);
    
    // Show environment indicator in console
    const isLive = window.location.hostname.includes('firebaseapp.com') || window.location.hostname.includes('web.app');
    const envLabel = isLive ? '🌐 LIVE SITE' : '🏠 LOCAL DEV';
    console.log(`${envLabel} - Connected to Firebase project: cattle-management-app-ae01b`);
    
    // Clear local storage if switching to live site
    if (isLive) {
      const lastEnv = localStorage.getItem('lastEnvironment');
      if (lastEnv === 'local') {
        console.log('🔄 Switching from local to live - clearing local task cache');
        localStorage.removeItem('tasks');
        localStorage.removeItem('lastTaskSync');
      }
      localStorage.setItem('lastEnvironment', 'live');
    } else {
      localStorage.setItem('lastEnvironment', 'local');
    }
  }, [user]);

  // Cow management state
  const [cows, setCows] = useState(farmData?.cows || []);
  const [hasLoadedInitialData, setHasLoadedInitialData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddCowModalOpen, setIsAddCowModalOpen] = useState(false);
  const [editingCow, setEditingCow] = useState(null);
  const [profileCow, setProfileCow] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Task management state
  const [userTasks, setUserTasks] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Bull inventory state
  const [bullInventory, setBullInventory] = useState(farmData?.bullInventory || [
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
  const [profileData, setProfileData] = useState(farmData?.profileData || {
    farmName: farm?.name || 'Holstein Pro Farm',
    ownerName: farm?.ownerName || 'Jason Burianek',
    farmAddress: '123 Dairy Lane, Farmville, CA 90210',
    phone: '+1 (555) 123-4567',
    email: user?.email || farm?.ownerEmail || 'jason@holsteinpro.com',
    operationType: farm?.settings?.operationType || 'Dairy',
    herdSize: farm?.settings?.herdSize || '100-500',
    yearsInOperation: farm?.settings?.yearsInOperation || '15',
    farmLogo: null
  });

  // App preferences state
  const [appPreferences, setAppPreferences] = useState({
    defaultDashboard: 'overview',
    cowListSorting: 'name',
    dateFormat: 'MM/DD/YYYY',
    theme: 'light',
    language: 'en'
  });

  // ALL useEffect hooks at the top level
  
  // Track Dashboard component lifecycle
  useEffect(() => {
    if (currentView === 'dashboard') {
      console.log('🏠 Dashboard component mounted');
      console.log('🏠 Dashboard component - hasInitializedDashboard:', hasInitializedDashboard);
      console.log('🏠 Dashboard component - appPreferences.defaultDashboard:', appPreferences.defaultDashboard);
    } else {
      console.log('🏠 Dashboard component unmounted - currentView changed to:', currentView);
      console.log('🏠 Dashboard component unmounted - hasInitializedDashboard:', hasInitializedDashboard);
    }
  }, [currentView, hasInitializedDashboard, appPreferences.defaultDashboard]);
  
  // Load saved preferences from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('holsteinProSettings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        if (settings.app) {
          console.log('⚙️ Loading saved app preferences:', settings.app);
          console.log('⚙️ Current view before loading preferences:', currentView);
          
          setAppPreferences(settings.app);
          
          // Apply theme immediately
          if (settings.app.theme) {
            updateTheme(settings.app.theme);
          }
          
          console.log('⚙️ Current view after loading preferences:', currentView);
        }
      } catch (error) {
        console.error('❌ Error loading saved preferences:', error);
      }
    }
  }, [updateTheme]);

  // Handle default dashboard routing - only redirect on initial load
  
  useEffect(() => {
    // Only run this effect once when user and farm are loaded
    if (user && farm && !hasInitializedDashboard) {
      console.log('🏠 Dashboard initialization check - currentView:', currentView);
      console.log('🏠 Dashboard initialization check - defaultDashboard:', appPreferences.defaultDashboard);
      
      const validDashboards = ['overview', 'herd', 'breeding', 'calendar', 'analytics'];
      const defaultDashboard = validDashboards.includes(appPreferences.defaultDashboard) 
        ? appPreferences.defaultDashboard 
        : 'overview';
      
      // Only redirect if the default is not 'overview' (which should show the Dashboard)
      if (defaultDashboard !== 'overview') {
        console.log('🏠 Initial redirect to default dashboard:', defaultDashboard);
        setCurrentView(defaultDashboard);
      } else {
        console.log('🏠 Staying on Dashboard (overview) - no redirect needed');
      }
      
      // Mark as initialized to prevent future redirects
      setHasInitializedDashboard(true);
    }
  }, [user, farm, hasInitializedDashboard]); // Removed appPreferences.defaultDashboard from dependencies to prevent re-triggering

  // Additional safeguard: Prevent dashboard redirects after initial load
  useEffect(() => {
    if (hasInitializedDashboard && currentView === 'dashboard') {
      console.log('🏠 Dashboard safeguard: User is on dashboard, preventing any redirects');
      console.log('🏠 Dashboard safeguard: Current state is stable');
    }
  }, [hasInitializedDashboard, currentView]);

  // Emergency stop: Prevent any navigation changes if user is on dashboard
  useEffect(() => {
    if (currentView === 'dashboard' && hasInitializedDashboard) {
      console.log('🏠 EMERGENCY STOP: User is on dashboard and app is initialized - blocking any navigation changes');
    }
  }, [currentView, hasInitializedDashboard]);

  // Data migration: Fix male animal categorization
  useEffect(() => {
    if (cows.length > 0 && hasLoadedInitialData) {
      const needsMigration = cows.some(cow => 
        cow.gender === 'Male' && cow.category !== 'Bull'
      );
      
      if (needsMigration) {
        console.log('🔧 Running data migration: Fixing male animal categorization...');
        
        const updatedCows = cows.map(cow => {
          // Fix male animals that aren't categorized as "Bull"
          if (cow.gender === 'Male' && cow.category !== 'Bull') {
            console.log(`🔧 Migrating male animal ${cow.name || cow.tagNumber} from ${cow.category} to Bull`);
            return { ...cow, category: 'Bull' };
          }
          
          // Also run the general category update function for all animals
          return updateCategoryByAge(cow);
        });
        
        // Check if any changes were made
        const hasChanges = updatedCows.some((updatedCow, index) => 
          JSON.stringify(updatedCow) !== JSON.stringify(cows[index])
        );
        
        if (hasChanges) {
          console.log('🔧 Data migration completed: Updated animal categories');
          setCows(updatedCows);
        }
      }
    }
  }, [cows.length, hasLoadedInitialData]);

  // Initialize Firebase Cloud Messaging and Task Notifications
  useEffect(() => {
    const initializeFCM = async () => {
      try {
        console.log('🔔 Initializing Firebase Cloud Messaging...');
        
        // Request notification permission and get FCM token
        const token = await requestNotificationPermission();
        
        if (token) {
          console.log('✅ FCM token obtained:', token);
          // Store token in user's profile
          if (user?.uid) {
            const result = await utils.storeFCMToken(user.uid, token);
            if (result.success) {
              console.log('✅ FCM token stored in Firestore');
            } else {
              console.error('❌ Failed to store FCM token:', result.error);
            }
          }
        } else {
          console.log('❌ Failed to get FCM token');
        }
        
        // Set up foreground message listener
        onMessageListener()
          .then((payload) => {
            console.log('📨 Foreground message received:', payload);
            // Handle foreground messages here
            // You can show a custom notification or update UI
          })
          .catch((err) => {
            console.error('❌ Error in foreground message listener:', err);
          });
          
      } catch (error) {
        console.error('❌ Error initializing FCM:', error);
      }
    };

    // Only initialize FCM when user is authenticated
    if (user && !loading) {
      initializeFCM();
    }
  }, [user, loading]);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showNotifications && !event.target.closest('.notification-dropdown')) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Load user tasks for notification bell
  useEffect(() => {
    const loadUserTasks = async () => {
      if (user?.email && user?.farmCode) {
        try {
          const result = await taskService.getUserTasks(user.email, user.farmCode);
          if (result.success) {
            setUserTasks(result.tasks);
          }
        } catch (error) {
          console.error('Error loading user tasks:', error);
        }
      }
    };

    loadUserTasks();
  }, [user?.email, user?.farmCode]);

  // Task notification checking system - DISABLED for now while we debug
  // useEffect(() => {
  //   let notificationInterval;
    
  //   const checkNotifications = async () => {
  //     try {
  //       // Only check if user is authenticated and notifications are enabled
  //       if (!user?.email || !farmData?.profileData?.notifications?.enabled) {
  //         console.log('🔔 Skipping notification check - user not authenticated or notifications disabled');
  //         return;
  //       }

  //       console.log('🔔 Running scheduled notification check...');
        
  //       // Get tasks from Firestore (new task service)
  //       const taskResult = await taskService.getUserTasks(user.email, user.farmCode);
  //       const tasks = taskResult.success ? taskResult.tasks : [];
        
  //       if (tasks.length === 0) {
  //         console.log('🔔 No tasks found for notification check');
  //         return;
  //       }
        
  //       // Get notification preferences
  //       const notificationPreferences = farmData.profileData.notifications;
        
  //       // Get FCM token for user
  //       const userDoc = await utils.getUserById(user.uid);
  //       const userToken = userDoc.success ? userDoc.user.fcmToken : null;
        
  //       // Check for notifications
  //       const result = await checkTaskNotifications(
  //         tasks, 
  //         user.email, 
  //         notificationPreferences, 
  //         userToken
  //       );
        
  //       console.log('🔔 Notification check result:', result);
        
  //     } catch (error) {
  //       console.error('❌ Error in notification check:', error);
  //     }
  //   };

  //   // Run initial check
  //   if (user && farmData && !loading) {
  //     checkNotifications();
  //   }

  //   // Set up interval for periodic checks (every 30 minutes)
  //   if (user && farmData?.profileData?.notifications?.enabled) {
  //     notificationInterval = setInterval(checkNotifications, 30 * 60 * 1000); // 30 minutes
  //     console.log('🔔 Set up notification check interval (30 minutes)');
  //   }

  //   // Cleanup interval on unmount or when dependencies change
  //   return () => {
  //     if (notificationInterval) {
  //       clearInterval(notificationInterval);
  //       console.log('🔔 Cleared notification check interval');
  //       }
  //     };
  // }, [user, farmData, loading]);

  // Manual notification check function (for testing)
  const handleManualNotificationCheck = async () => {
    try {
      console.log('🔔 Manual notification check triggered');
      
      const savedTasks = localStorage.getItem('todaysTasks');
      const tasks = savedTasks ? JSON.parse(savedTasks) : [];
      
      if (tasks.length === 0) {
        console.log('🔔 No tasks found for manual check');
        return;
      }
      
      const notificationPreferences = farmData?.profileData?.notifications;
      const userDoc = await utils.getUserById(user.uid);
      const userToken = userDoc.success ? userDoc.user.fcmToken : null;
      
      const result = await checkTaskNotifications(
        tasks, 
        user.email, 
        notificationPreferences, 
        userToken
      );
      
      console.log('🔔 Manual notification check result:', result);
      
    } catch (error) {
      console.error('❌ Error in manual notification check:', error);
    }
  };

  // Create test task function
  const handleCreateTestTask = () => {
    try {
      if (!user?.email) {
        console.log('❌ No user email for test task creation');
        return;
      }
      
      const testTask = createTestTask(user.email);
      console.log('🔔 Created test task:', testTask);
      
      // Add to localStorage tasks
      const savedTasks = localStorage.getItem('todaysTasks');
      const tasks = savedTasks ? JSON.parse(savedTasks) : [];
      tasks.push(testTask);
      localStorage.setItem('todaysTasks', JSON.stringify(tasks));
      
      console.log('✅ Test task added to localStorage');
      
    } catch (error) {
      console.error('❌ Error creating test task:', error);
    }
  };

  const handleCreateTimezoneTestTasks = () => {
    try {
      if (!user?.email) {
        console.log('❌ No user email for timezone test task creation');
        return;
      }
      
      const timezoneTestTasks = createTimezoneTestTasks(user.email);
      console.log('🔔 Created timezone test tasks:', timezoneTestTasks);
      
      // Add to localStorage tasks
      const savedTasks = localStorage.getItem('todaysTasks');
      const tasks = savedTasks ? JSON.parse(savedTasks) : [];
      tasks.push(...timezoneTestTasks);
      localStorage.setItem('todaysTasks', JSON.stringify(tasks));
      
      console.log('✅ Timezone test tasks added to localStorage');
      
    } catch (error) {
      console.error('❌ Error creating timezone test tasks:', error);
    }
  };

  // Sync local state with auth context
  useEffect(() => {
      console.log('🚨 EMERGENCY DEBUG: Main useEffect triggered');
      console.log('🚨 EMERGENCY DEBUG: farmData received:', farmData);
      console.log('🚨 EMERGENCY DEBUG: farm received:', farm);
      console.log('🚨 EMERGENCY DEBUG: isSaving:', isSaving);
      console.log('🚨 EMERGENCY DEBUG: Current cows count:', cows.length);
      console.log('🔥 EMERGENCY: Connection status:', navigator.onLine);
      console.log('🔥 EMERGENCY: User authenticated:', !!user);
      console.log('🔥 EMERGENCY: Farm code:', user?.farmCode);
      
      // Test Firebase connection on first load
      if (user && !isSaving) {
        testFirebaseConnection().then(isConnected => {
          console.log('🔥 EMERGENCY: Firebase connection test result:', isConnected);
        });
      }
      
      // Prevent data reload during save operations
      if (isSaving) {
        console.log('🚨 EMERGENCY DEBUG: Skipping data reload during save operation');
        return;
      }
      
      // Emergency check: Don't reload if we have local data and no farmData
      if (cows.length > 0 && (!farmData || !farmData.cows)) {
        console.log('🚨 EMERGENCY: Preventing stale data overwrite - keeping local data');
        console.log('🚨 EMERGENCY: Local cows count:', cows.length);
        console.log('🚨 EMERGENCY: FarmData cows count:', farmData?.cows?.length || 0);
        return;
      }
    
    if (farmData) {
      // 🚨 EMERGENCY DATA RECOVERY: Comprehensive data extraction debugging
      console.log('🚨 EMERGENCY: Raw farmData from Firebase:', farmData);
      console.log('🚨 EMERGENCY: farmData.cows:', farmData.cows);
      console.log('🚨 EMERGENCY: farmData.bullInventory:', farmData.bullInventory);
      
      // 🔍 DATA STRUCTURE CHECK: Verify data structure
      console.log('🔍 DATA STRUCTURE CHECK:', {
        farmDataKeys: Object.keys(farmData),
        cowsExists: 'cows' in farmData,
        cowsType: typeof farmData.cows,
        cowsIsArray: Array.isArray(farmData.cows),
        bullInventoryExists: 'bullInventory' in farmData,
        bullInventoryType: typeof farmData.bullInventory,
        bullInventoryIsArray: Array.isArray(farmData.bullInventory)
      });
      
      console.log('🚨 EMERGENCY DEBUG: Setting cows from farmData:', farmData.cows?.length || 0, 'cows');
      
      // 📂 FIREBASE LOAD: What we loaded
      console.log('📂 FIREBASE LOAD: What we loaded:', {
        loadedCows: farmData.cows?.length || 0,
        loadedBullInventory: farmData.bullInventory?.length || 0,
        loadedProfileData: farmData.profileData,
        loadedFarmData: farmData,
        allLoadedData: farmData
      });
      
      // ✅ RECOVERY: Robust data extraction with fallbacks
      if (farmData.cows && Array.isArray(farmData.cows)) {
        setCows(farmData.cows);
        console.log('✅ RECOVERY: Setting cows to:', farmData.cows.length);
      } else {
        console.log('⚠️ RECOVERY: No valid cows array found, setting empty array');
        setCows([]);
      }
      
      if (farmData.bullInventory && Array.isArray(farmData.bullInventory)) {
        setBullInventory(farmData.bullInventory);
        console.log('✅ RECOVERY: Setting bulls to:', farmData.bullInventory.length);
      } else {
        console.log('⚠️ RECOVERY: No valid bullInventory array found, setting empty array');
        setBullInventory([]);
      }
      
      // 🐄 LOADED COW DETAILS: Debug breeding records in loaded data
      console.log('🐄 LOADED COW DETAILS:', (farmData.cows || []).map(cow => ({
        name: cow.name,
        id: cow.id,
        breedingRecords: cow.breedingRecords?.length || 0,
        healthRecords: cow.healthRecords?.length || 0,
        calvingRecords: cow.calvingRecords?.length || 0,
        hasBreedingData: !!cow.breedingRecords,
        breedingRecordsArray: cow.breedingRecords || [],
        fullCow: cow
      })));
      
      // 🐄 SUMMARY: Total breeding records loaded
      const totalBreedingRecords = (farmData.cows || []).reduce((total, cow) => 
        total + (cow.breedingRecords?.length || 0), 0
      );
      console.log('🐄 SUMMARY: Total breeding records loaded from Firebase:', totalBreedingRecords);
      
      // Use farm data to populate profileData, with fallbacks to existing profileData
      const newProfileData = {
        farmName: farm?.name || farmData.profileData?.farmName || '',
        ownerName: farm?.ownerName || farmData.profileData?.ownerName || '',
        farmAddress: farmData.profileData?.farmAddress || '',
        phone: farmData.profileData?.phone || '',
        email: user?.email || farmData.profileData?.email || farm?.ownerEmail || '',
        operationType: farm?.settings?.operationType || farmData.profileData?.operationType || 'Dairy',
        herdSize: farm?.settings?.herdSize || farmData.profileData?.herdSize || '100-500',
        yearsInOperation: farm?.settings?.yearsInOperation || farmData.profileData?.yearsInOperation || '1',
        farmLogo: farmData.profileData?.farmLogo || null,
        farmCode: farmData.profileData?.farmCode || null,
        farmCodeCreated: farmData.profileData?.farmCodeCreated || null,
        farmCodeLastRegenerated: farmData.profileData?.farmCodeLastRegenerated || null
      };
      
      console.log('🚨 EMERGENCY DEBUG: Setting profileData:', newProfileData);
      setProfileData(newProfileData);
    }
  // 🚨 FINAL FIX: Disabled automatic data reload to prevent stale data overwrite
  // Only load data on initial app startup, not after saves
  }, []); // Empty dependency array - only load once on startup
  
    // 🚨 FINAL FIX: Main useEffect that only loads data ONCE
  useEffect(() => {
    console.log('🔄 RELOAD CHECK: useEffect triggered');
    console.log('🔄 RELOAD CHECK: hasLoadedInitialData:', hasLoadedInitialData);
    console.log('🔄 RELOAD CHECK: isSaving:', isSaving);
    
    // Skip if we're saving
    if (isSaving) {
      console.log('💾 SKIP: Currently saving data');
      return;
    }

    // Skip if we've already loaded data once
    if (hasLoadedInitialData) {
      console.log('🚫 SKIP: Data already loaded once, never overwriting user data');
      return;
    }

    // Wait for authentication
    if (!user || !farm) {
      console.log('⏳ SKIP: Waiting for authentication');
      return;
    }

    // Wait for farmData with content
    if (!farmData || !farmData.cows || farmData.cows.length === 0) {
      console.log('⏳ SKIP: Waiting for farmData with cows');
      return;
    }

    console.log('✅ LOADING: Loading data from Firebase (FIRST TIME ONLY)');
    
    // 🐄 LOAD COW DETAILS: Debug breeding records being loaded
    console.log('🐄 LOAD COW DETAILS:', farmData.cows.map(cow => ({
      name: cow.name,
      id: cow.id,
      breedingRecords: cow.breedingRecords?.length || 0,
      healthRecords: cow.healthRecords?.length || 0,
      calvingRecords: cow.calvingRecords?.length || 0,
      hasBreedingData: !!cow.breedingRecords,
      breedingRecordsArray: cow.breedingRecords || [],
      fullCow: cow
    })));
    
    // 🐄 LOAD SUMMARY: Total breeding records being loaded
    const totalBreedingRecordsLoaded = farmData.cows.reduce((total, cow) => 
      total + (cow.breedingRecords?.length || 0), 0
    );
    console.log('🐄 LOAD SUMMARY: Total breeding records being loaded from Firebase:', totalBreedingRecordsLoaded);
    
    // Ensure all cows have proper record arrays initialized
    const cowsWithRecords = farmData.cows.map(cow => ({
      ...cow,
      breedingRecords: cow.breedingRecords || [],
      healthRecords: cow.healthRecords || [],
      calvingRecords: cow.calvingRecords || []
    }));
    
    setCows(cowsWithRecords);
    setBullInventory(farmData.bullInventory || []);
    
    if (farmData.profileData) {
      setProfileData(farmData.profileData);
    }

    // Mark that we've loaded data - NEVER reload again
    setHasLoadedInitialData(true);
    console.log('🔒 LOCKED: Data loaded once, will never auto-reload again');

  }, [farmData, user, farm, isSaving]);

  // EMERGENCY FIX: DISABLED automatic data syncing to stop infinite loop
  // Sync local state changes back to auth context
  // useEffect(() => {
  //   if (isInitialLoadComplete && user?.farmCode) {
  //     updateCows(cows);
  //     updateBullInventory(bullInventory);
  //     updateProfileData(profileData);
  //   }
  // }, [cows, bullInventory, profileData, isInitialLoadComplete, user?.farmCode, updateCows, updateBullInventory, updateProfileData]);

  // Helper functions
  const getCowDisplayName = (cow) => {
    return cow.name?.trim() || `#${cow.tagNumber}`;
  };

  const getCowDisplayNameWithTag = (cow) => {
    if (cow.name?.trim()) {
      return `${cow.name} #${cow.tagNumber}`;
    }
    return `#${cow.tagNumber}`;
  };

  // Authentication handlers
  const handleNavigate = (view) => {
    setAuthView(view);
  };

  const handleLoginSuccess = (authData) => {
    login(authData);
  };

  const handleRegisterSuccess = (authData) => {
    login(authData);
  };

  // Show loading screen while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Holstein Pro</h2>
          <p className="text-slate-600">Loading your farm...</p>
        </div>
      </div>
    );
  }

  // Show authentication pages if not authenticated
  if (!user) {
    switch (authView) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} onLoginSuccess={handleLoginSuccess} />;
      case 'register':
        return <RegisterPage onNavigate={handleNavigate} onRegisterSuccess={handleRegisterSuccess} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  }

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

  // 🚨 EMERGENCY STOP: Disabled automatic priority alerts to stop infinite loop
  // const alerts = generatePriorityAlerts();
  const alerts = []; // Empty array to prevent infinite loop

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
    console.log('🚨 EMERGENCY STOP: handleSaveCow called - checking for infinite loop');
    console.log('🚨 EMERGENCY DEBUG: handleSaveCow called');
    console.log('🚨 EMERGENCY DEBUG: Current cows count:', cows.length);
    console.log('🚨 EMERGENCY DEBUG: Cow data to save:', cowData);
    console.log('🚨 EMERGENCY DEBUG: User authenticated?', user ? 'Yes' : 'No');
    console.log('🚨 EMERGENCY DEBUG: Farm code:', user?.farmCode);
    
    setIsSaving(true);
    console.log('🚨 EMERGENCY DEBUG: Set isSaving to true - preventing data reload');
    
    try {
      // Calculate and set reproductive status
      const reproductiveStatus = calculateReproductiveStatus(cowData);
      const cowWithStatus = { 
        ...cowData, 
        reproductiveStatus: reproductiveStatus
      };
      
      console.log('🚨 EMERGENCY DEBUG: Cow with reproductive status:', cowWithStatus);
      
      if (editingCow) {
        // Update existing cow
        console.log('🚨 EMERGENCY DEBUG: Updating existing cow...');
        setCows(prevCows => {
          const updatedCows = prevCows.map(cow => 
            cow.id === editingCow.id ? cowWithStatus : cow
          );
          console.log('🚨 EMERGENCY DEBUG: Updated cows array length:', updatedCows.length);
          return updatedCows;
        });
        console.log('✅ Updated cow:', cowWithStatus.name);
      } else {
        // Add new cow
        console.log('🚨 EMERGENCY DEBUG: Adding new cow to local state...');
        setCows(prevCows => {
          const updatedCows = [...prevCows, cowWithStatus];
          console.log('🚨 EMERGENCY DEBUG: Updated cows array length:', updatedCows.length);
          return updatedCows;
        });
        console.log('✅ Added new cow:', cowWithStatus.name);
      }
      
      // MANUAL SAVE TO FIREBASE - User explicitly saved
      console.log('🚨 EMERGENCY DEBUG: Manually saving to Firebase...');
      console.log('🔥 EMERGENCY: Connection status:', navigator.onLine);
      console.log('🔥 EMERGENCY: User authenticated:', !!user);
      console.log('🔥 EMERGENCY: Farm code:', user?.farmCode);
      
      if (user?.farmCode) {
        try {
          // Use functional update to get the most current state
          const updatedCows = editingCow 
            ? cows.map(cow => cow.id === editingCow.id ? cowWithStatus : cow)
            : [...cows, cowWithStatus];
          
          console.log('🚨 EMERGENCY DEBUG: Saving cows array to Firebase:', updatedCows.length, 'cows');
          
          // 💾 FIREBASE SAVE: What we are saving
          console.log('💾 FIREBASE SAVE: What we are saving:', {
            cows: updatedCows.length,
            bullInventory: bullInventory.length,
            profileData: profileData,
            allData: { 
              cows: updatedCows, 
              bullInventory, 
              profileData 
            }
          });
          
          // 🐄 SAVE COW DETAILS: Debug breeding records being saved
          console.log('🐄 SAVE COW DETAILS:', updatedCows.map(cow => ({
            name: cow.name,
            id: cow.id,
            breedingRecords: cow.breedingRecords?.length || 0,
            healthRecords: cow.healthRecords?.length || 0,
            calvingRecords: cow.calvingRecords?.length || 0,
            hasBreedingData: !!cow.breedingRecords,
            breedingRecordsArray: cow.breedingRecords || [],
            fullCow: cow
          })));
          
          // 🐄 SAVE SUMMARY: Total breeding records being saved
          const totalBreedingRecordsToSave = updatedCows.reduce((total, cow) => 
            total + (cow.breedingRecords?.length || 0), 0
          );
          console.log('🐄 SAVE SUMMARY: Total breeding records being saved to Firebase:', totalBreedingRecordsToSave);
          
          console.log('🔥 EMERGENCY: Starting Firestore save operation');
          const result = await updateCows(updatedCows);
          console.log('🔥 EMERGENCY: Firestore save result:', result);
          
                                if (result && result.success) {
                        console.log('✅ Successfully saved to Firebase');
                        console.log('🚨 FINAL FIX: Trusting local state after successful save - NO DATA RELOAD');
                      } else {
            console.error('❌ FIRESTORE ERROR: Save operation failed:', result?.error);
            // Don't throw - let the UI save succeed even if Firebase fails
            console.log('🚫 Firebase save failed but keeping local changes');
          }
        } catch (error) {
          console.error('❌ FIRESTORE ERROR: Exception during save:', error);
          console.error('❌ FIRESTORE ERROR: Error details:', {
            code: error.code,
            message: error.message,
            stack: error.stack
          });
          // Don't throw - let the UI save succeed even if Firebase fails
          console.log('🚫 Firebase save exception but keeping local changes');
        }
      }
      
      // Update metrics based on new cow data
      console.log('🚨 EMERGENCY DEBUG: Save successful, returning result');
      return { success: true, cow: cowWithStatus };
    } catch (error) {
      console.error('❌ ADD COW ERROR:', error);
      throw error;
    } finally {
      console.log('🚨 EMERGENCY DEBUG: Set isSaving to false - allowing data reload');
      setIsSaving(false);
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
    console.log('🐄 OPENING PROFILE: Cow data being passed:', {
      cowName: cow.name,
      cowId: cow.id,
      breedingRecords: cow.breedingRecords?.length || 0,
      fullCow: cow
    });
    
    // Get fresh cow data from current cows array to ensure we have latest breeding records
    const freshCow = cows.find(c => c.id === cow.id);
    console.log('🐄 APP.JS: Setting profile cow:', {
      cowName: freshCow?.name,
      cowId: freshCow?.id,
      breedingRecords: freshCow?.breedingRecords?.length || 0,
      fromArray: cows.find(c => c.id === cow.id)?.breedingRecords?.length || 0,
      freshCowData: freshCow
    });
    
    if (freshCow) {
      setProfileCow(freshCow);
      setIsProfileModalOpen(true);
    } else {
      console.error('❌ COW PROFILE ERROR: Fresh cow data not found for ID:', cow.id);
      // Fallback to original cow data
      setProfileCow(cow);
      setIsProfileModalOpen(true);
    }
  };

  const handleCloseProfile = () => {
    console.log('🚪 CLOSING PROFILE: Animal profile closing');
    console.log('🚪 CLOSING PROFILE: Current animal data:', profileCow);
    console.log('🚪 CLOSING PROFILE: Records on this animal:', profileCow?.breedingRecords || []);
    
    setIsProfileModalOpen(false);
    setProfileCow(null);
  };

  const handleUpdateCowFromProfile = async (updatedCow) => {
    console.log('🔴 CRITICAL: onUpdateCow called!');
    console.log('🔴 CRITICAL: Updated cow received:', updatedCow);
    console.log('🔴 CRITICAL: Breeding records in updated cow:', updatedCow?.breedingRecords?.length || 0);
    
    console.log('🔴 SAVING RECORD: About to save animal data');
    console.log('🔴 SAVING RECORD: Animal ID:', updatedCow.id);
    console.log('🔴 SAVING RECORD: New record data:', updatedCow.breedingRecords);
    console.log('🔴 SAVING RECORD: Updated animal:', updatedCow);
    console.log('🔴 SAVING RECORD: Current cows state before save:', cows);
    
    // CRITICAL DEBUG: Check if updatedCow has breeding records
    console.log('🚨 CRITICAL DEBUG: updatedCow breeding records check:', {
      hasBreedingRecords: !!updatedCow.breedingRecords,
      breedingRecordsLength: updatedCow.breedingRecords?.length || 0,
      breedingRecordsArray: updatedCow.breedingRecords || [],
      updatedCowKeys: Object.keys(updatedCow)
    });
    
    // CRITICAL DEBUG: Find the current cow in state to compare
    const currentCowInState = cows.find(c => c.id === updatedCow.id);
    console.log('🚨 CRITICAL DEBUG: Current cow in state:', {
      hasBreedingRecords: !!currentCowInState?.breedingRecords,
      breedingRecordsLength: currentCowInState?.breedingRecords?.length || 0,
      breedingRecordsArray: currentCowInState?.breedingRecords || [],
      currentCowKeys: currentCowInState ? Object.keys(currentCowInState) : 'not found'
    });
    
    console.log('🐄 CLOSING PROFILE: Cow data being saved back:', {
      cowName: updatedCow.name,
      cowId: updatedCow.id,
      breedingRecords: updatedCow.breedingRecords?.length || 0,
      fullUpdatedCow: updatedCow
    });
    
    // Calculate and set reproductive status
    const reproductiveStatus = calculateReproductiveStatus(updatedCow);
    const cowWithStatus = {
      ...updatedCow,
      reproductiveStatus: reproductiveStatus
    };

    console.log('🐄 UPDATING COW IN ARRAY: Before update - cows with breeding records:', 
      cows.filter(c => c.breedingRecords?.length > 0).map(c => ({ name: c.name, records: c.breedingRecords?.length }))
    );

    setCows(prevCows => {
      const updatedCows = prevCows.map(cow => 
        cow.id === updatedCow.id ? cowWithStatus : cow
      );
      
          console.log('🐄 UPDATING COW IN ARRAY: After update - cows with breeding records:', 
      updatedCows.filter(c => c.breedingRecords?.length > 0).map(c => ({ name: c.name, records: c.breedingRecords?.length }))
    );
    
    // 🐄 UPDATE COW DETAILS: Debug breeding records after profile update
    console.log('🐄 UPDATE COW DETAILS:', updatedCows.map(cow => ({
      name: cow.name,
      id: cow.id,
      breedingRecords: cow.breedingRecords?.length || 0,
      healthRecords: cow.healthRecords?.length || 0,
      calvingRecords: cow.calvingRecords?.length || 0,
      hasBreedingData: !!cow.breedingRecords,
      breedingRecordsArray: cow.breedingRecords || [],
      fullCow: cow
    })));
    
    // 🐄 UPDATE SUMMARY: Total breeding records after profile update
    const totalBreedingRecordsAfterUpdate = updatedCows.reduce((total, cow) => 
      total + (cow.breedingRecords?.length || 0), 0
    );
    console.log('🐄 UPDATE SUMMARY: Total breeding records after profile update:', totalBreedingRecordsAfterUpdate);
      
      return updatedCows;
    });

    // CALF PROTECTION: If calving records increased, reload fresh data but still update local state
    const currentCalvingRecords = currentCowInState?.calvingRecords?.length || 0;
    const updatedCalvingRecords = cowWithStatus.calvingRecords?.length || 0;

    if (updatedCalvingRecords > currentCalvingRecords) {
      console.log('🚨 CALF PROTECTION: Calving records increased - reloading fresh farm data');
      console.log('🚨 CALF PROTECTION: Current calving records:', currentCalvingRecords);
      console.log('🚨 CALF PROTECTION: Updated calving records:', updatedCalvingRecords);
      
      // Wait for calf creation to complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force reload fresh farm data from Firebase
      try {
        console.log('🔄 CALF PROTECTION: Reloading fresh farm data with new calf');
        
        // Get fresh farm data that includes the new calf
        if (refreshFarmData) {
          await refreshFarmData();
          console.log('✅ CALF PROTECTION: Fresh farm data reloaded');
        } else {
          // Fallback: reload the page to get fresh data
          console.log('🔄 CALF PROTECTION: Fallback - reloading page to get fresh data');
          window.location.reload();
        }
      } catch (error) {
        console.error('❌ CALF PROTECTION: Error reloading farm data:', error);
      }
    } else {
      // Normal update - proceed with Firebase save
      console.log('💾 CRITICAL FIX: Normal update - saving profile changes to Firebase');
      if (user?.farmCode) {
        try {
          // Get the updated cows array after the state update
          const updatedCowsForFirebase = cows.map(cow => 
            cow.id === updatedCow.id ? cowWithStatus : cow
          );
          
          console.log('💾 CRITICAL FIX: Saving to Firebase with breeding records:', 
            updatedCowsForFirebase.filter(c => c.breedingRecords?.length > 0).map(c => ({ 
              name: c.name, 
              records: c.breedingRecords?.length 
            }))
          );
          
          const result = await updateCows(updatedCowsForFirebase);
          if (result && result.success) {
            console.log('✅ CRITICAL FIX: Profile changes saved to Firebase successfully');
          } else {
            console.error('❌ CRITICAL FIX: Failed to save profile changes to Firebase:', result?.error);
          }
        } catch (error) {
          console.error('❌ CRITICAL FIX: Error saving profile changes to Firebase:', error);
        }
      }
    }
    
    // Also update the profileCow state to reflect changes immediately
    setProfileCow(cowWithStatus);
    console.log('✅ Updated cow profile for:', cowWithStatus.name, 'with', cowWithStatus.breedingRecords?.length || 0, 'breeding records');
  };

  // Bull inventory management functions
  const handleUpdateBullInventory = async (updatedBullInventory) => {
    console.log('💾 FIREBASE SAVE: handleUpdateBullInventory called with', updatedBullInventory.length, 'bulls');
    setBullInventory(updatedBullInventory);
    
    // Save to Firebase
    if (user?.farmCode) {
      try {
        await updateBullInventory(updatedBullInventory);
        console.log('✅ Bull inventory saved to Firebase');
      } catch (error) {
        console.error('❌ Firebase save error for bull inventory:', error);
      }
    }
    
    console.log('✅ Bull inventory updated:', updatedBullInventory.length, 'bulls');
  };

  // Update profile data when settings are saved
  const handleProfileUpdate = async (updatedProfileData) => {
    console.log('💾 FIREBASE SAVE: handleProfileUpdate called');
    setProfileData(updatedProfileData);
    
    // Save to Firebase
    if (user?.farmCode) {
      try {
        await updateProfileData(updatedProfileData);
        console.log('✅ Profile data saved to Firebase');
      } catch (error) {
        console.error('❌ Firebase save error for profile data:', error);
      }
    }
    
    console.log('✅ Profile data updated:', updatedProfileData.farmName);
  };



  // Update app preferences when settings are saved
  const handlePreferencesUpdate = (updatedPreferences) => {
    console.log('⚙️ App preferences updated:', updatedPreferences);
    setAppPreferences(updatedPreferences);
    
    // Apply theme changes immediately
    if (updatedPreferences.theme) {
      updateTheme(updatedPreferences.theme);
    }
  };

  // Sort cows based on app preferences
  const getSortedCows = (cowsToSort = cows) => {
    const sortedCows = [...cowsToSort];
    
    switch (appPreferences.cowListSorting) {
      case 'name':
        return sortedCows.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'tagNumber':
        return sortedCows.sort((a, b) => (a.tagNumber || '').localeCompare(b.tagNumber || ''));
      case 'breed':
        return sortedCows.sort((a, b) => (a.breed || '').localeCompare(b.breed || ''));
      case 'age':
        return sortedCows.sort((a, b) => {
          const ageA = a.dateOfBirth ? new Date(a.dateOfBirth) : new Date(0);
          const ageB = b.dateOfBirth ? new Date(b.dateOfBirth) : new Date(0);
          return ageA - ageB;
        });
      case 'status':
        return sortedCows.sort((a, b) => {
          const statusA = calculateReproductiveStatus(a) || '';
          const statusB = calculateReproductiveStatus(b) || '';
          return statusA.localeCompare(statusB);
        });
      default:
        return sortedCows;
    }
  };

  const handleBreedingRecordSaved = async (cow, breedingRecord, selectedBullId, isEditing = false, oldBreedingRecord = null) => {
    console.log('🔴 SAVING RECORD: About to save animal data');
    console.log('🔴 SAVING RECORD: Animal ID:', cow.id);
    console.log('🔴 SAVING RECORD: New record data:', breedingRecord);
    console.log('🔴 SAVING RECORD: Updated animal:', cow);
    console.log('🔴 SAVING RECORD: Current cows state before save:', cows);
    
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

    // Save bull inventory to Firebase after breeding record changes
    if (user?.farmCode) {
      try {
        // Get the updated inventory from the state setter
        const updatedInventory = bullInventory.map(bull => {
          if (isEditing && oldBreedingRecord && bull.naabCode === oldBreedingRecord.semenId) {
            return { ...bull, straws: Math.max(0, bull.straws + 1) };
          } else if (bull.naabCode === selectedBullId) {
            return { ...bull, straws: Math.max(0, bull.straws - 1) };
          }
          return bull;
        });
        
        await updateBullInventory(updatedInventory);
        console.log('✅ Bull inventory saved to Firebase after breeding record');
      } catch (error) {
        console.error('❌ Firebase save error for bull inventory after breeding record:', error);
      }
    }

    console.log('✅ Bull inventory updated for breeding record');
  };

  const handleBreedingRecordDeleted = async (cow, deletedBreedingRecord) => {
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

    // Save bull inventory to Firebase after breeding record deletion
    if (user?.farmCode) {
      try {
        const currentBullInventory = bullInventory.map(bull => {
          if (bull.naabCode === deletedBreedingRecord.semenId) {
            const newStrawCount = bull.straws + 1;
            return { ...bull, straws: newStrawCount };
          }
          return bull;
        });
        await updateBullInventory(currentBullInventory);
        console.log('✅ Bull inventory saved to Firebase after breeding record deletion');
      } catch (error) {
        console.error('❌ Firebase save error for bull inventory after breeding record deletion:', error);
      }
    }

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




  


  // Get filtered animals for dashboard
  const getFilteredDashboardAnimals = () => {
    let filteredCows = [];
    
    switch (dashboardFilter) {
      case 'total':
        filteredCows = cows.filter(cow => !cow.archived);
        break;
      case 'pregnant':
        filteredCows = cows.filter(cow => {
          const reproductiveStatus = calculateReproductiveStatus(cow);
          return reproductiveStatus === 'PREGNANT' && !cow.archived;
        });
        break;
      case 'inHeat':
        filteredCows = getCowsInHeatToday().filter(cow => !cow.archived);
        break;
      default:
        return [];
    }
    
    // Apply sorting to filtered results
    return getSortedCows(filteredCows);
  };

  // Update metrics based on current cows data
  const updatedMetrics = {
    total: { value: cows.filter(cow => !cow.archived).length },
    pregnant: { value: cows.filter(cow => {
      const reproductiveStatus = calculateReproductiveStatus(cow);
      return reproductiveStatus === 'PREGNANT' && !cow.archived;
    }).length },
    breeding: { value: getCowsInHeatToday().filter(cow => !cow.archived).length },
    health: { value: calculateHerdHealthScore(cows.filter(cow => !cow.archived)) }
  };

  // Navigation items with better organization
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'herd', label: 'Herd Management', icon: Users, badge: updatedMetrics.total.value.toString() },
    { id: 'breeding', label: 'Breeding Center', icon: Heart, badge: updatedMetrics.breeding.value.toString() },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'archived', label: 'Archived Animals', icon: Archive, badge: cows.filter(cow => cow.archived === true).length.toString() }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Premium Sidebar */}
      <div className="w-72 bg-white dark:bg-slate-800 shadow-xl border-r border-slate-200 dark:border-slate-700">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
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
          <div className="space-y-2">
            <button
              onClick={() => setCurrentView('settings')}
              className="w-full flex items-center space-x-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-slate-400 to-slate-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500">{user?.role === 'owner' ? 'Farm Owner' : 'Team Member'}</p>
              </div>
            </button>
            
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          </div>
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
              {/* Environment Indicator */}
              {(() => {
                const isLive = window.location.hostname.includes('firebaseapp.com') || window.location.hostname.includes('web.app');
                return (
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isLive 
                      ? 'bg-green-100 text-green-700 border border-green-200' 
                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                  }`}>
                    {isLive ? '🌐 LIVE' : '🏠 LOCAL'}
                  </div>
                );
              })()}
              
              {/* Notifications - Only show if user has pending tasks */}
              {(() => {
                try {
                  // Only show if we're on a supported device and have tasks
                  const hasTasks = userTasks && userTasks.length > 0;
                  const pendingTasks = userTasks ? userTasks.filter(task => !task.completed).length : 0;
                  
                  if (hasTasks && pendingTasks > 0) {
                    return (
                      <div className="relative notification-dropdown">
                        <button 
                          onClick={() => setShowNotifications(!showNotifications)}
                          className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors"
                          title={`${pendingTasks} pending task${pendingTasks !== 1 ? 's' : ''}`}
                        >
                          <Bell className="w-5 h-5" />
                          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                            {pendingTasks > 9 ? '9+' : pendingTasks}
                          </span>
                        </button>
                        
                        {/* Notification Dropdown */}
                        {showNotifications && (
                          <div className="notification-dropdown absolute top-12 right-0 bg-white shadow-lg rounded-lg border border-slate-200 p-4 w-80 z-50">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-slate-900">Pending Tasks</h3>
                              <button 
                                onClick={() => setShowNotifications(false)}
                                className="text-slate-400 hover:text-slate-600"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {userTasks.filter(task => !task.completed).map((task) => (
                                <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h4 className="text-sm font-medium text-slate-900 mb-1">{task.title}</h4>
                                      <div className="flex items-center space-x-2 text-xs text-slate-600">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          task.priority === 'high' ? 'bg-red-100 text-red-700' :
                                          task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                          'bg-green-100 text-green-700'
                                        }`}>
                                          {task.priority}
                                        </span>
                                        <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <button 
                                onClick={() => {
                                  setShowNotifications(false);
                                  setCurrentView('dashboard');
                                }}
                                className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                View All Tasks
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                } catch (error) {
                  console.error('Error rendering notification bell:', error);
                  return null;
                }
              })()}
              
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
        <main className="flex-1 p-6 overflow-auto bg-slate-50 dark:bg-slate-900">
          {/* Dashboard View */}
          {currentView === 'dashboard' && (
            <>
              {console.log('🏠 Dashboard component rendering - currentView:', currentView)}
              {console.log('🏠 Dashboard component - hasInitializedDashboard:', hasInitializedDashboard)}
              <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <button 
                  onClick={() => setDashboardFilter(dashboardFilter === 'total' ? null : 'total')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    dashboardFilter === 'total' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Cattle</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.total.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setDashboardFilter(dashboardFilter === 'pregnant' ? null : 'pregnant')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    dashboardFilter === 'pregnant' ? 'ring-2 ring-green-500 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pregnant Cows</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.pregnant.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => setDashboardFilter(dashboardFilter === 'inHeat' ? null : 'inHeat')}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-slate-200 transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer ${
                    dashboardFilter === 'inHeat' ? 'ring-2 ring-orange-500 bg-orange-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">In Heat</p>
                      <p className="text-3xl font-bold text-slate-900">{updatedMetrics.breeding.value}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </button>

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

              {/* Filtered Animals View */}
              {dashboardFilter && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {dashboardFilter === 'total' && 'All Cattle'}
                        {dashboardFilter === 'pregnant' && 'Pregnant Cows'}
                        {dashboardFilter === 'inHeat' && 'Animals in Heat Today'}
                      </h3>
                      <button 
                        onClick={() => setDashboardFilter(null)}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Animal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Tag #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Breed
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-200">
                        {getFilteredDashboardAnimals().map((cow) => (
                          <tr key={cow.id} className="hover:bg-slate-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                    <span className="text-sm font-medium text-white">
                                      {cow.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-slate-900">{cow.name}</div>
                                  <div className="text-sm text-slate-500">{cow.category}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {cow.tagNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                              {cow.breed}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {dashboardFilter === 'pregnant' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Pregnant
                                </span>
                              )}
                              {dashboardFilter === 'inHeat' && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  In Heat
                                </span>
                              )}
                              {dashboardFilter === 'total' && (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  calculateReproductiveStatus(cow) === 'PREGNANT' ? 'bg-green-100 text-green-800' :
                                  calculateReproductiveStatus(cow) === 'BRED' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {calculateReproductiveStatus(cow)}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button
                                onClick={() => handleViewProfile(cow)}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                View Profile
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Today's Tasks */}
                              <TodaysTasks cows={cows} farm={farm} user={user} />

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
            </>
          )}

          {/* Herd Management View */}
          {currentView === 'herd' && (
            <HerdManagement
              cows={getSortedCows()}
              sortBy={appPreferences.cowListSorting}
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
              cows={getSortedCows(cows.filter(cow => cow.archived))}
              onRestoreCow={handleRestoreCow}
              onPermanentlyDeleteCow={handlePermanentlyDeleteCow}
              onViewProfile={handleViewProfile}
            />
          )}

          {/* Breeding Center View */}
          {currentView === 'breeding' && (
            <BreedingCenter
              cows={getSortedCows()}
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
              cows={getSortedCows()}
              bullInventory={bullInventory}
            />
          )}

          {/* Settings View */}
          {currentView === 'settings' && (
            <>
              {console.log('📱 App.js - Rendering SettingsView with profileData:', profileData)}
              <SettingsView 
                profileData={profileData} 
                onProfileUpdate={handleProfileUpdate}
                onPreferencesUpdate={handlePreferencesUpdate}
                cows={cows}
                onUpdateCows={setCows}
                            onManualNotificationCheck={handleManualNotificationCheck}
            onCreateTestTask={handleCreateTestTask}
            onCreateTimezoneTestTasks={handleCreateTimezoneTestTasks}
              />
            </>
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

// Main App wrapper with AuthProvider and ThemeProvider
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
