import React, { useState, useEffect } from 'react';
import { X, Calendar, User, Zap, DollarSign, FileText } from 'lucide-react';
import { createBreedingRecord, calculateDueDate } from '../utils/cowDataModel';

const BreedingRecordModal = ({ 
  isOpen, 
  onClose, 
  cows = [], 
  bullInventory = [], 
  onSave, 
  selectedCow = null, // If provided, pre-select this cow
  editingRecord = null 
}) => {
  const [formData, setFormData] = useState({
    date: '',
    expectedDueDate: '',
    method: 'AI',
    notes: ''
  });
  const [selectedBull, setSelectedBull] = useState(null);
  const [selectedCowId, setSelectedCowId] = useState(selectedCow?.id || '');
  const [errors, setErrors] = useState({});

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      
      if (editingRecord) {
        // Editing existing record
        setFormData({
          date: editingRecord.date,
          expectedDueDate: editingRecord.expectedDueDate || calculateDueDate(editingRecord.date),
          method: editingRecord.method || 'AI',
          notes: editingRecord.notes || ''
        });
        setSelectedCowId(editingRecord.cowId);
        
        // Find and set the bull
        const existingBull = bullInventory.find(bull => bull.naabCode === editingRecord.semenId);
        if (existingBull) {
          setSelectedBull(existingBull);
        }
      } else {
        // New record
        setFormData({
          date: todayStr,
          expectedDueDate: calculateDueDate(todayStr),
          method: 'AI',
          notes: ''
        });
        setSelectedCowId(selectedCow?.id || '');
        setSelectedBull(null);
      }
      setErrors({});
    }
  }, [isOpen, editingRecord, selectedCow, bullInventory]);

  // Get eligible cows (breeding eligible with OPEN status)
  const getEligibleCows = () => {
    return cows.filter(cow => {
      // Must not be archived
      if (cow.archived) return false;
      
      // Must be active status
      if (cow.status !== 'Active') return false;
      
      // Must be Cow or Heifer category
      if (cow.category !== 'Cow' && cow.category !== 'Heifer') return false;
      
      // Calculate age in months for age check
      if (cow.dateOfBirth) {
        const birthDate = new Date(cow.dateOfBirth);
        const now = new Date();
        const ageInMonths = (now.getFullYear() - birthDate.getFullYear()) * 12 + 
                           (now.getMonth() - birthDate.getMonth());
        
        // Must be 15+ months old
        if (ageInMonths < 15) return false;
      }
      
      // Check reproductive status - must be OPEN
      const reproductiveStatus = calculateReproductiveStatus(cow);
      if (reproductiveStatus !== 'OPEN') return false;
      
      return true;
    }).sort((a, b) => {
      // Sort by tag number for easy selection
      return a.tagNumber.localeCompare(b.tagNumber);
    });
  };

  const calculateReproductiveStatus = (cow) => {
    if (!cow.breedingRecords || cow.breedingRecords.length === 0) {
      return 'OPEN';
    }

    // Sort breeding records by date (most recent first)
    const sortedBreedings = [...cow.breedingRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
    const mostRecentBreeding = sortedBreedings[0];

    // Check if there's a calving record after the most recent breeding
    if (cow.calvingRecords && cow.calvingRecords.length > 0) {
      const calvingAfterBreeding = cow.calvingRecords.find(calving => 
        new Date(calving.date) > new Date(mostRecentBreeding.date)
      );
      if (calvingAfterBreeding) {
        return 'OPEN';
      }
    }

    // Check for pregnancy confirmation
    if (cow.healthRecords && cow.healthRecords.length > 0) {
      const pregnancyCheck = cow.healthRecords.find(record => 
        record.type === 'Pregnancy Check' && 
        new Date(record.date) >= new Date(mostRecentBreeding.date) &&
        record.description.toLowerCase().includes('positive')
      );
      if (pregnancyCheck) {
        return 'PREGNANT';
      }
    }

    // If breeding was within last 283 days, consider as BRED
    const daysSinceBreeding = Math.floor((new Date() - new Date(mostRecentBreeding.date)) / (1000 * 60 * 60 * 24));
    if (daysSinceBreeding <= 283) {
      return 'BRED';
    }

    return 'OPEN';
  };

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => {
      const updated = { ...prev, [fieldName]: value };
      
      // Auto-calculate due date when breeding date changes
      if (fieldName === 'date') {
        updated.expectedDueDate = calculateDueDate(value);
      }
      
      return updated;
    });

    // Clear error for this field
    if (errors[fieldName]) {
      setErrors(prev => ({ ...prev, [fieldName]: '' }));
    }
  };

  const handleBullSelection = (bullId) => {
    const bull = bullInventory.find(b => b.id === bullId);
    setSelectedBull(bull);
    if (errors.bullSelection) {
      setErrors(prev => ({ ...prev, bullSelection: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!selectedCowId) {
      newErrors.cowSelection = 'Please select a cow';
    }

    if (!formData.date) {
      newErrors.date = 'Breeding date is required';
    }

    if (!selectedBull) {
      newErrors.bullSelection = 'Please select a bull';
    } else if (selectedBull.straws <= 0) {
      newErrors.bullSelection = `${selectedBull.name} has no straws available`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) {
      return;
    }

    const selectedCow = cows.find(cow => cow.id === selectedCowId);
    if (!selectedCow) {
      alert('Selected cow not found');
      return;
    }

    // Create breeding record data
    const breedingData = {
      id: editingRecord?.id || `breeding-${Date.now()}`,
      cowId: selectedCowId,
      date: formData.date,
      expectedDueDate: formData.expectedDueDate,
      bullName: selectedBull.name,
      semenId: selectedBull.naabCode,
      method: formData.method,
      notes: formData.notes,
      cost: selectedBull.cost
    };

    // Call the parent's save function
    onSave(selectedCow, breedingData, selectedBull.naabCode, !!editingRecord, editingRecord);
    
    // Close modal and reset
    onClose();
  };

  const eligibleCows = getEligibleCows();

  // Helper function to display cow name with tag number
  const getCowDisplayNameWithTag = (cow) => {
    if (cow.name?.trim()) {
      return `${cow.name} #${cow.tagNumber}`;
    }
    return `#${cow.tagNumber}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-900">
            {editingRecord ? 'Edit Breeding Record' : 'Record Breeding'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Cow Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <User className="w-4 h-4" />
              <span>Cow Selection *</span>
            </label>
            <select
              value={selectedCowId}
              onChange={(e) => setSelectedCowId(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.cowSelection ? 'border-red-300' : 'border-slate-300'
              }`}
              disabled={!!selectedCow} // Disable if cow is pre-selected
            >
              <option value="">Select a cow...</option>
              {eligibleCows.map(cow => (
                <option key={cow.id} value={cow.id}>
                  {getCowDisplayNameWithTag(cow)}
                </option>
              ))}
            </select>
            {errors.cowSelection && (
              <p className="text-red-500 text-sm mt-1">{errors.cowSelection}</p>
            )}
          </div>

          {/* Breeding Date */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Breeding Date *</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleFieldChange('date', e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.date ? 'border-red-300' : 'border-slate-300'
              }`}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>

          {/* Expected Due Date (calculated) */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <Calendar className="w-4 h-4" />
              <span>Expected Due Date</span>
            </label>
            <input
              type="date"
              value={formData.expectedDueDate}
              readOnly
              className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-slate-50 text-slate-600"
            />
            <p className="text-sm text-slate-500 mt-1">Calculated automatically (283 days from breeding)</p>
          </div>

          {/* Bull Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <Zap className="w-4 h-4" />
              <span>Bull Selection *</span>
            </label>
            <select
              value={selectedBull?.id || ''}
              onChange={(e) => handleBullSelection(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.bullSelection ? 'border-red-300' : 'border-slate-300'
              }`}
            >
              <option value="">Select a bull...</option>
              {bullInventory
                .filter(bull => bull.straws > 0)
                .map(bull => (
                  <option key={bull.id} value={bull.id}>
                    {bull.name} ({bull.naabCode}) - {bull.straws} straws - ${bull.cost}
                  </option>
                ))}
            </select>
            {errors.bullSelection && (
              <p className="text-red-500 text-sm mt-1">{errors.bullSelection}</p>
            )}
          </div>

          {/* Breeding Method */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <Zap className="w-4 h-4" />
              <span>Breeding Method</span>
            </label>
            <select
              value={formData.method}
              onChange={(e) => handleFieldChange('method', e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="AI">Artificial Insemination (AI)</option>
              <option value="Natural">Natural Service</option>
              <option value="Embryo Transfer">Embryo Transfer</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleFieldChange('notes', e.target.value)}
              placeholder="Additional notes about this breeding..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-4 mt-8 pt-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-gradient-to-r from-pink-600 to-red-600 text-white rounded-xl hover:from-pink-700 hover:to-red-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
          >
            {editingRecord ? 'Update Breeding Record' : 'Record Breeding'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreedingRecordModal; 