// Cow Data Model for Holstein Pro Cattle Management System

// Core cow data structure
export const createCowRecord = (data = {}) => {
  return {
    // Basic Information
    id: data.id || generateCowId(),
    tagNumber: data.tagNumber || '',
    name: data.name || '',
    dateOfBirth: data.dateOfBirth || '',
    breed: data.breed || '',
    gender: data.gender || '',
    category: data.category || 'Calf',
    status: data.status || 'Active',
    notes: data.notes || '',
    
    // System fields
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    
    // Future extensibility - these will be populated as we add features
    breeding: data.breeding || {
      sire: null,
      dam: null,
      breedingRecords: [],
      pregnancyRecords: [],
      calvingRecords: []
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

export const COW_STATUSES = [
  'Active',
  'Sold',
  'Died',
  'Quarantine',
  'Dry',
  'Fresh'
];

// Validation functions
export const validateCowData = (cowData) => {
  const errors = {};
  
  if (!cowData.tagNumber?.trim()) {
    errors.tagNumber = 'Tag number is required';
  }
  
  if (!cowData.name?.trim()) {
    errors.name = 'Name is required';
  }
  
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
    return ageInMonths >= 24 ? 'Bull' : 'Calf';
  } else {
    if (ageInMonths < 15) return 'Calf';
    if (ageInMonths < 24) return 'Heifer';
    return 'Cow';
  }
}; 