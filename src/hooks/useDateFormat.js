import { useAuth } from '../contexts/AuthContext';
import { formatDate, formatDateTime, calculateAge, parseDate, getRelativeTime } from '../utils/dateUtils';

export const useDateFormat = () => {
  const { farmData } = useAuth();
  
  // Get date format from app preferences, fallback to MM/DD/YYYY
  const getDateFormat = () => {
    return farmData?.profileData?.appPreferences?.dateFormat || 'MM/DD/YYYY';
  };
  
  const formatDateWithPreferences = (date) => {
    return formatDate(date, getDateFormat());
  };
  
  const formatDateTimeWithPreferences = (date) => {
    return formatDateTime(date, getDateFormat());
  };
  
  const parseDateWithPreferences = (dateString) => {
    return parseDate(dateString, getDateFormat());
  };
  
  return {
    formatDate: formatDateWithPreferences,
    formatDateTime: formatDateTimeWithPreferences,
    calculateAge,
    parseDate: parseDateWithPreferences,
    getRelativeTime,
    getDateFormat
  };
}; 