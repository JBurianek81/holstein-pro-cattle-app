// Date formatting utility based on app preferences
export const formatDate = (date, format = 'MM/DD/YYYY') => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'DD/MM/YYYY':
      return `${day}/${month}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    default:
      return `${month}/${day}/${year}`;
  }
};

// Format date with time
export const formatDateTime = (date, format = 'MM/DD/YYYY') => {
  if (!date) return '';
  
  const dateStr = formatDate(date, format);
  const d = new Date(date);
  
  if (isNaN(d.getTime())) return dateStr;
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
};

// Calculate age from date of birth
export const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return 'Unknown';
  
  const birth = new Date(dateOfBirth);
  const now = new Date();
  
  if (isNaN(birth.getTime())) return 'Unknown';
  
  const diffTime = Math.abs(now - birth);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
};

// Parse date string based on format
export const parseDate = (dateString, format = 'MM/DD/YYYY') => {
  if (!dateString) return null;
  
  let year, month, day;
  
  switch (format) {
    case 'MM/DD/YYYY':
      const mmddParts = dateString.split('/');
      if (mmddParts.length === 3) {
        month = parseInt(mmddParts[0]) - 1;
        day = parseInt(mmddParts[1]);
        year = parseInt(mmddParts[2]);
      }
      break;
    case 'DD/MM/YYYY':
      const ddmmParts = dateString.split('/');
      if (ddmmParts.length === 3) {
        day = parseInt(ddmmParts[0]);
        month = parseInt(ddmmParts[1]) - 1;
        year = parseInt(ddmmParts[2]);
      }
      break;
    case 'YYYY-MM-DD':
      const yyyyParts = dateString.split('-');
      if (yyyyParts.length === 3) {
        year = parseInt(yyyyParts[0]);
        month = parseInt(yyyyParts[1]) - 1;
        day = parseInt(yyyyParts[2]);
      }
      break;
    default:
      return null;
  }
  
  if (year && month !== undefined && day) {
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  return null;
};

// Get relative time (e.g., "2 days ago", "1 week ago")
export const getRelativeTime = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffTime = Math.abs(now - d);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}; 