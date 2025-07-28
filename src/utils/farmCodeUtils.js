/**
 * Farm Code Utilities
 * Functions for generating, validating, and managing farm access codes
 */

// Farm code format: XXXXXX (where X is alphanumeric) - Firestore document ID
const FARM_CODE_LENGTH = 6;
const FARM_CODE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Generate a new farm access code
 * @returns {string} Farm code in format XXXXXX (Firestore document ID)
 */
export const generateFarmCode = () => {
  let code = '';
  for (let i = 0; i < FARM_CODE_LENGTH; i++) {
    code += FARM_CODE_CHARS.charAt(Math.floor(Math.random() * FARM_CODE_CHARS.length));
  }
  return code;
};

/**
 * Validate a farm code format
 * @param {string} code - The farm code to validate
 * @returns {boolean} True if valid format, false otherwise
 */
export const validateFarmCode = (code) => {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Check length (6 characters)
  if (code.length !== FARM_CODE_LENGTH) {
    return false;
  }
  
  // Check that all characters are valid
  const validChars = new Set(FARM_CODE_CHARS.split(''));
  
  for (let char of code) {
    if (!validChars.has(char)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Format farm code for display (adds spacing for readability)
 * @param {string} code - The farm code to format
 * @returns {string} Formatted farm code
 */
export const formatFarmCode = (code) => {
  if (!validateFarmCode(code)) {
    return code; // Return original if invalid
  }
  
  // Add spacing for readability: XXXXXX -> XXX XXX
  return code.replace(/(.{3})/g, '$1 ').trim();
};

/**
 * Get farm code metadata
 * @param {string} code - The farm code
 * @returns {object} Metadata about the farm code
 */
export const getFarmCodeMetadata = (code) => {
  return {
    isValid: validateFarmCode(code),
    length: code ? code.length : 0,
    expectedLength: FARM_CODE_LENGTH,
    format: 'XXXXXX'
  };
};

/**
 * Check if two farm codes are the same (case-insensitive)
 * @param {string} code1 - First farm code
 * @param {string} code2 - Second farm code
 * @returns {boolean} True if codes match
 */
export const compareFarmCodes = (code1, code2) => {
  if (!code1 || !code2) {
    return false;
  }
  return code1.toUpperCase() === code2.toUpperCase();
}; 