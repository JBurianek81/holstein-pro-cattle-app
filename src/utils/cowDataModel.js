// Cow Data Model for Holstein Pro Cattle Management System

// Reproductive status constants (simplified to 3 options)
export const REPRODUCTIVE_STATUS = {
  OPEN: 'OPEN',
  BRED: 'BRED',
  PREGNANT: 'PREGNANT'
};

export const REPRODUCTIVE_STATUS_COLORS = {
  OPEN: 'bg-gray-100 text-gray-800',
  BRED: 'bg-yellow-100 text-yellow-800', 
  PREGNANT: 'bg-green-100 text-green-800'
};

// Production/Milk status constants
export const PRODUCTION_STATUS = {
  MILKING: 'Milking',
  DRY: 'Dry',
  NON_MILKING: 'Non-Milking',
  SOLD: 'Sold',
  DIED: 'Died'
};

export const PRODUCTION_STATUS_COLORS = {
  Milking: 'bg-blue-100 text-blue-800',
  Dry: 'bg-orange-100 text-orange-800',
  'Non-Milking': 'bg-slate-100 text-slate-800',
  Sold: 'bg-purple-100 text-purple-800',
  Died: 'bg-red-100 text-red-800'
};

// Core cow data structure
export const createCowRecord = (data = {}) => {
  const cowRecord = {
    // Basic Information
    id: data.id || generateCowId(),
    tagNumber: data.tagNumber || '',
    name: data.name || '',
    dateOfBirth: data.dateOfBirth || '',
        breed: data.breed || '',
    gender: data.gender || '',
    category: data.category || 'Calf',
    status: data.status || 'Active', // Legacy field, kept for compatibility
    productionStatus: data.productionStatus || 'Non-Milking',
    dam: data.dam || '', // Mother
    sire: data.sire || '', // Father
    location: data.location || '', // Location
    notes: data.notes || '',
    
    // Reproductive status fields
    isInHeat: data.isInHeat || false,
    reproductiveStatus: data.reproductiveStatus || null,

    // System fields
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    
    // Archive fields
    archived: data.archived || false,
    archivedDate: data.archivedDate || null,
    archiveReason: data.archiveReason || '',

    // Record arrays for profile modal
    healthRecords: data.healthRecords || [],
    breedingRecords: data.breedingRecords || [],
    calvingRecords: data.calvingRecords || [],

    // Future extensibility - these will be populated as we add features
    breeding: data.breeding || {
      sire: null,
      dam: null,
      pregnancyRecords: []
    },

    health: data.health || {
      vaccinations: [],
      treatments: [],
      healthChecks: [],
      vetNotes: []
    },

    production: data.production || {
      milkRecords: [],
      weightRecords: [],
      conditionScores: []
    },

    financial: data.financial || {
      purchasePrice: null,
      purchaseDate: null,
      expenses: [],
      salePrice: null,
      saleDate: null
    }
  };
  return cowRecord;
};

// Generate unique cow ID
const generateCowId = () => {
  return 'COW-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
};

// Dropdown options for form fields
export const COW_BREEDS = [
  'Holstein',
  'Jersey',
  'Guernsey',
  'Ayrshire',
  'Brown Swiss',
  'Milking Shorthorn',
  'Angus',
  'Hereford',
  'Charolais',
  'Simmental',
  'Mixed/Other'
];

export const COW_GENDERS = [
  'Female',
  'Male'
];

export const COW_CATEGORIES = [
  'Calf',
  'Heifer',
  'Cow',
  'Bull',
  'Steer'
];

// Legacy COW_STATUSES for backward compatibility
export const COW_STATUSES = [
  'Active',
  'Sold',
  'Died',
  'Quarantine',
  'Dry',
  'Fresh'
];

// New production status options for dairy management
export const PRODUCTION_STATUSES = [
  'Milking',
  'Dry',
  'Non-Milking',
  'Sold',
  'Died'
];

// Validation functions
export const validateCowData = (cowData) => {
  const errors = {};

  if (!cowData.tagNumber?.trim()) {
    errors.tagNumber = 'Tag number is required';
  }

  // Name is now optional - removed validation

  if (!cowData.dateOfBirth) {
    errors.dateOfBirth = 'Date of birth is required';
  }

  if (!cowData.breed) {
    errors.breed = 'Breed is required';
  }

  if (!cowData.gender) {
    errors.gender = 'Gender is required';
  }

  if (!cowData.category) {
    errors.category = 'Category is required';
  }

  // Business logic validations
  if (cowData.dateOfBirth) {
    const birthDate = new Date(cowData.dateOfBirth);
    const today = new Date();
    if (birthDate > today) {
      errors.dateOfBirth = 'Date of birth cannot be in the future';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Helper functions for cow management
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return '';

  const birth = new Date(dateOfBirth);
  const today = new Date();
  const ageInMonths = (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());

  if (ageInMonths < 12) {
    return `${ageInMonths} months`;
  } else {
    const years = Math.floor(ageInMonths / 12);
    const months = ageInMonths % 12;
    return months > 0 ? `${years} years, ${months} months` : `${years} years`;
  }
};

export const getCategoryByAge = (dateOfBirth, gender) => {
  if (!dateOfBirth) return 'Calf';

  const ageInMonths = (new Date() - new Date(dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44);

  if (gender === 'Male') {
    return 'Bull'; // Male cattle are always "Bull" regardless of age
  } else {
    if (ageInMonths < 12) return 'Calf';
    if (ageInMonths < 24) return 'Heifer';
    return 'Cow';
  }
};

// Enhanced function that properly categorizes animals by gender and age
export const determineCategoryByGenderAndAge = (gender, dateOfBirth, hasCalved = false) => {
  if (gender === 'Male') {
    return 'Bull'; // Male cattle are always "Bull" at any age
  }
  
  if (gender === 'Female') {
    if (!dateOfBirth) return 'Calf';
    
    const birthDate = new Date(dateOfBirth);
    const now = new Date();
    const ageInMonths = (now - birthDate) / (1000 * 60 * 60 * 24 * 30.44);
    
    if (ageInMonths < 12) {
      return 'Calf';
    } else if (ageInMonths < 24 && !hasCalved) {
      return 'Heifer';
    } else {
      return 'Cow';
    }
  }
  
  return 'Cow'; // Default fallback
};

// Helper to check and update category based on age and gender
export function updateCategoryByAge(cow) {
  if (!cow || !cow.dateOfBirth) return cow;
  
  // For male animals, always ensure they are categorized as "Bull"
  if (cow.gender === 'Male' && cow.category !== 'Bull') {
    return { ...cow, category: 'Bull' };
  }
  
  // For female animals, handle age-based transitions
  if (cow.gender === 'Female') {
    const ageInMonths = (new Date() - new Date(cow.dateOfBirth)) / (1000 * 60 * 60 * 24 * 30.44);
    const hasCalved = cow.calvingRecords && cow.calvingRecords.length > 0;
    
    if (cow.category === 'Calf' && ageInMonths >= 12) {
      return { ...cow, category: 'Heifer' };
    } else if (cow.category === 'Heifer' && (ageInMonths >= 24 || hasCalved)) {
      return { ...cow, category: 'Cow' };
    }
  }
  
  return cow;
}

// Record creation helpers
export const createHealthRecord = (data = {}) => {
  // Use consistent date method to avoid timezone issues
  const today = new Date();
  const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  
  return {
    id: 'HEALTH-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    date: data.date || todayStr,
    type: data.type || 'Routine Checkup',
    description: data.description || '',
    medicine: data.medicine || '',
    dosage: data.dosage || '',
    duration: data.duration || '',
    veterinarian: data.veterinarian || '',
    status: data.status || 'Completed',
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };
};

export const createBreedingRecord = (data = {}) => {
  return {
    id: 'BREEDING-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    cowId: data.cowId || '', // Add cowId to link breeding record to specific cow
    date: data.date || new Date().toISOString().split('T')[0],
    bullName: data.bullName || '',
    semenId: data.semenId || '',
    method: data.method || 'AI', // AI (Artificial Insemination), Natural
    result: data.result || 'Unknown', // Success, Failed, Unknown
    expectedDueDate: data.expectedDueDate || null,
    notes: data.notes || '',
    cost: data.cost || null,
    technician: data.technician || '',
    createdAt: new Date().toISOString()
  };
};

// Helper function to calculate expected due date for Holstein cattle
export const calculateDueDate = (breedingDate) => {
  if (!breedingDate) return '';
  const breeding = new Date(breedingDate);
  const dueDate = new Date(breeding);
  dueDate.setDate(dueDate.getDate() + 280); // Holstein gestation period: 280 days
  return dueDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
};

export const createCalvingRecord = (data = {}) => {
  return {
    id: 'CALVING-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase(),
    date: data.date || new Date().toISOString().split('T')[0],
    calfTag: data.calfTag || '',
    calfGender: data.calfGender || 'Female',
    birthWeight: data.birthWeight || null,
    complications: data.complications || 'None',
    assistanceRequired: data.assistanceRequired || false,
    veterinarianAssisted: data.veterinarianAssisted || false,
    calfHealth: data.calfHealth || 'Healthy',
    notes: data.notes || '',
    createdAt: new Date().toISOString()
  };
};

// Create a new calf record from calving data
export const createCalfFromCalving = (calvingData, motherCow) => {
  // Get the sire from mother's most recent breeding record
  let sire = '';
  if (motherCow.breedingRecords && motherCow.breedingRecords.length > 0) {
    const mostRecentBreeding = motherCow.breedingRecords[motherCow.breedingRecords.length - 1];
    sire = mostRecentBreeding.bullName || mostRecentBreeding.semenId || '';
  }

  // Determine proper category based on gender and age
  const properCategory = determineCategoryByGenderAndAge(calvingData.calfGender, calvingData.date);
  
  return createCowRecord({
    tagNumber: calvingData.calfTag,
    name: `Calf ${calvingData.calfTag}`,
    dateOfBirth: calvingData.date,
    gender: calvingData.calfGender,
    category: properCategory, // Use properly determined category
    status: 'Active',
    productionStatus: 'Non-Milking',
    breed: motherCow.breed || 'Holstein', // Inherit breed from mother
    dam: motherCow.name || motherCow.tagNumber || '', // Mother becomes the dam
    sire: sire, // Sire from most recent breeding record
    notes: `Born to ${motherCow.name} (${motherCow.tagNumber}) on ${calvingData.date}`,
    // Initialize empty record arrays
    healthRecords: [],
    breedingRecords: [],
    calvingRecords: []
  });
};

// Dropdown options for records
export const HEALTH_RECORD_TYPES = [
  'Vaccination',
  'Mastitis',
  'D.A.',
  'Cystic',
  'Surgery',
  'Injury',
  'Illness',
  'Routine Checkup',
  'Pregnancy Check',
  'Heat Detection',
  'Hoof Trimming',
  'Deworming',
  'Other'
];

export const BREEDING_METHODS = [
  'AI',
  'Natural'
];

export const BREEDING_RESULTS = [
  'Success',
  'Failed',
  'Unknown'
];

export const CALF_HEALTH_STATUS = [
  'Healthy',
  'Weak',
  'Sick',
  'Deceased'
];

export const COMPLICATIONS = [
  'None',
  'Difficult Birth',
  'Breach',
  'Retained Placenta',
  'C-Section',
  'Other'
];

// Helper function to calculate reproductive status
export const calculateReproductiveStatus = (cow) => {
  // Skip calves and bulls
  if (cow.category === 'Calf' || cow.gender === 'Male') {
    return null;
  }

  // PRIORITY 1: Check for recent calving records (cow is OPEN after calving)
  const hasCalvingRecords = cow.calvingRecords && cow.calvingRecords.length > 0;
  if (hasCalvingRecords) {
    // Get the most recent calving record
    const mostRecentCalving = cow.calvingRecords[cow.calvingRecords.length - 1];
    const calvingDate = new Date(mostRecentCalving.date);
    const now = new Date();
    const daysSinceCalving = Math.floor((now - calvingDate) / (1000 * 60 * 60 * 24));
    
    // If cow has calved within the last 365 days, she is OPEN (ready for breeding)
    if (daysSinceCalving <= 365) {
      console.log('🐄 Cow', cow.name, 'status: OPEN (recent calving on', mostRecentCalving.date, 'days ago:', daysSinceCalving, ')');
      return REPRODUCTIVE_STATUS.OPEN;
    }
  }

  // PRIORITY 2: Check for ANY positive pregnancy check in health records (regardless of date)
  const positivePregnancyCheck = cow.healthRecords?.find(record => {
    return record.type === 'Pregnancy Check' && 
           record.description && 
           record.description.toLowerCase().includes('positive');
  });

  // If pregnancy confirmed (any positive check), return PREGNANT
  if (positivePregnancyCheck) {
    console.log('🐄 Cow', cow.name, 'status: PREGNANT (pregnancy confirmed)');
    return REPRODUCTIVE_STATUS.PREGNANT;
  }

  // PRIORITY 3: Check for negative pregnancy check in health records (within last 90 days)
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(now.getDate() - 90);
  
  const negativePregnancyCheck = cow.healthRecords?.find(record => {
    const recordDate = new Date(record.date);
    return record.type === 'Pregnancy Check' && 
           record.description && 
           record.description.toLowerCase().includes('negative') &&
           recordDate >= ninetyDaysAgo;
  });

  // If negative pregnancy check found, return OPEN
  if (negativePregnancyCheck) {
    console.log('🐄 Cow', cow.name, 'status: OPEN (negative pregnancy check)');
    return REPRODUCTIVE_STATUS.OPEN;
  }

  // PRIORITY 4: Check for any breeding records (cow is BRED if she has been bred and not confirmed pregnant)
  const hasBreedingRecords = cow.breedingRecords && cow.breedingRecords.length > 0;
  
  if (hasBreedingRecords) {
    // Get the most recent breeding record
    const mostRecentBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
    
    console.log('🐄 Cow', cow.name, 'has breeding records:', cow.breedingRecords.length, 'most recent result:', mostRecentBreeding.result);
    
    // If the most recent breeding was not marked as failed, return BRED
    if (mostRecentBreeding.result !== 'Failed') {
      console.log('🐄 Cow', cow.name, 'status: BRED (has breeding records)');
      return REPRODUCTIVE_STATUS.BRED;
    }
  }

  // Default status for mature females with no recent breeding activity
  console.log('🐄 Cow', cow.name, 'status: OPEN (no breeding records or failed breeding)');
  return REPRODUCTIVE_STATUS.OPEN;
};

// Helper function to get reproductive status badge styling
export const getReproductiveStatusBadge = (status) => {
  if (!status) return null;
  
  return {
    text: status,
    className: `px-3 py-1 text-sm font-bold rounded-full ${REPRODUCTIVE_STATUS_COLORS[status]}`
  };
};

// Helper function to get production status badge styling
export const getProductionStatusBadge = (status) => {
  if (!status) return null;
  
  return {
    text: status,
    className: `px-3 py-1 text-sm font-bold rounded-full ${PRODUCTION_STATUS_COLORS[status]}`
  };
};

// Helper function to create a heat detection health record
export const createHeatRecord = () => {
  return createHealthRecord({
    type: 'Heat Detection',
    description: 'Heat detected - cow ready for breeding',
    date: new Date().toISOString().split('T')[0]
  });
};

// Health Scoring System
export const HEALTH_SCORE_DEDUCTIONS = {
  // Small Points (2-3 points)
  'Illness': -2,
  'Hoof Trimming': -2,
  'Deworming': -2,
  
  // Medium Points (5-6 points)
  'Cystic': -5,
  'Mastitis': -6,
  
  // High Points (10-15 points)
  'D.A.': -12,
  'Surgery': -15,
  'Injury': -10,
  
  // Other types (no deduction)
  'Vaccination': 0,
  'Routine Checkup': 0,
  'Pregnancy Check': 0,
  'Heat Detection': 0,
  'Other': 0
};

// Calculate time-based recovery multiplier
export const calculateTimeDecayMultiplier = (daysSinceIssue) => {
  if (daysSinceIssue <= 30) {
    return 1.0; // 100% deduction for recent issues (last 30 days)
  } else if (daysSinceIssue <= 45) {
    return 0.75; // 75% deduction for 30-45 days old
  } else if (daysSinceIssue <= 60) {
    return 0.5; // 50% deduction for 46-60 days old
  } else if (daysSinceIssue <= 90) {
    return 0.25; // 25% deduction for 61-90 days old
  } else {
    return 0.0; // No deduction for 91+ days old
  }
};

// Calculate individual animal health score
export const calculateHealthScore = (cow) => {
  if (!cow.healthRecords || cow.healthRecords.length === 0) {
    return 100; // Perfect health if no health records
  }

  let totalDeduction = 0;
  const today = new Date();

  cow.healthRecords.forEach(record => {
    const deduction = HEALTH_SCORE_DEDUCTIONS[record.type];
    
    if (deduction && deduction < 0) {
      const recordDate = new Date(record.date);
      const daysSinceIssue = Math.floor((today - recordDate) / (1000 * 60 * 60 * 24));
      const timeDecayMultiplier = calculateTimeDecayMultiplier(daysSinceIssue);
      
      const adjustedDeduction = Math.abs(deduction) * timeDecayMultiplier;
      totalDeduction += adjustedDeduction;
      
      console.log(`🏥 Health Score: ${cow.name} - ${record.type} (${daysSinceIssue} days ago): -${Math.abs(deduction)} × ${timeDecayMultiplier} = -${adjustedDeduction.toFixed(1)}`);
    }
  });

  const healthScore = Math.max(0, 100 - totalDeduction);
  console.log(`🏥 ${cow.name} Final Health Score: ${healthScore.toFixed(1)}% (deduction: ${totalDeduction.toFixed(1)})`);
  
  return Math.round(healthScore * 10) / 10; // Round to 1 decimal place
};

// Calculate herd average health score
export const calculateHerdHealthScore = (cows) => {
  if (!cows || cows.length === 0) {
    return 100;
  }

  const totalScore = cows.reduce((sum, cow) => {
    return sum + calculateHealthScore(cow);
  }, 0);

  const averageScore = totalScore / cows.length;
  console.log(`🏥 Herd Average Health Score: ${averageScore.toFixed(1)}%`);
  
  return Math.round(averageScore * 10) / 10; // Round to 1 decimal place
};

// Get health score color based on score value
export const getHealthScoreColor = (score) => {
  if (score >= 95) {
    return 'text-green-600 bg-green-100'; // Excellent health
  } else if (score >= 85) {
    return 'text-blue-600 bg-blue-100'; // Good health
  } else if (score >= 70) {
    return 'text-yellow-600 bg-yellow-100'; // Fair health
  } else if (score >= 50) {
    return 'text-orange-600 bg-orange-100'; // Poor health
  } else {
    return 'text-red-600 bg-red-100'; // Critical health
  }
};

// Get health score badge styling
export const getHealthScoreBadge = (score) => {
  const colorClasses = getHealthScoreColor(score);
  return {
    text: `${score}%`,
    className: `px-3 py-1 text-sm font-bold rounded-full ${colorClasses}`
  };
}; 