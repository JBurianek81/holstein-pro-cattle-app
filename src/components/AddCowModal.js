import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Calendar, Tag, User, Dna, Users, Activity, FileText } from 'lucide-react';
import { 
  createCowRecord, 
  validateCowData, 
  COW_BREEDS, 
  COW_GENDERS, 
  COW_CATEGORIES, 
  COW_STATUSES,
  PRODUCTION_STATUSES,
  getCategoryByAge
} from '../utils/cowDataModel';

const AddCowModal = ({ isOpen, onClose, onSave, editingCow = null }) => {
  const [formData, setFormData] = useState({
    tagNumber: '',
    name: '',
    dateOfBirth: '',
    breed: '',
    gender: '',
    category: '',
    status: 'Active', // Legacy field, kept for compatibility
    productionStatus: 'Non-Milking',
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when editing or reset when adding new
  useEffect(() => {
    if (editingCow) {
      setFormData({
        tagNumber: editingCow.tagNumber || '',
        name: editingCow.name || '',
        dateOfBirth: editingCow.dateOfBirth || '',
        breed: editingCow.breed || '',
        gender: editingCow.gender || '',
        category: editingCow.category || '',
        status: editingCow.status || 'Active',
        productionStatus: editingCow.productionStatus || 'Non-Milking',
        notes: editingCow.notes || ''
      });
    } else {
      setFormData({
        tagNumber: '',
        name: '',
        dateOfBirth: '',
        breed: '',
        gender: '',
        category: '',
        status: 'Active',
        productionStatus: 'Non-Milking',
        notes: ''
      });
    }
    setErrors({});
  }, [editingCow, isOpen]);

  // Auto-suggest category based on age and gender
  useEffect(() => {
    if (formData.dateOfBirth && formData.gender && !editingCow) {
      const suggestedCategory = getCategoryByAge(formData.dateOfBirth, formData.gender);
      setFormData(prev => ({ ...prev, category: suggestedCategory }));
    }
  }, [formData.dateOfBirth, formData.gender, editingCow]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validation = validateCowData(formData);
    
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      return;
    }

    try {
      const cowRecord = editingCow 
        ? { 
            ...editingCow, 
            ...formData, 
            updatedAt: new Date().toISOString(),
            // Ensure arrays exist for edited cows too
            healthRecords: editingCow.healthRecords || [],
            breedingRecords: editingCow.breedingRecords || [],
            calvingRecords: editingCow.calvingRecords || []
          }
        : createCowRecord(formData);
      
      console.log('Saved cow:', cowRecord.name, editingCow ? '(updated)' : '(new)');
      await onSave(cowRecord);
      onClose();
    } catch (error) {
      console.error('Error saving cow:', error);
      setErrors({ general: 'Failed to save cow record. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {editingCow ? 'Edit Cow Record' : 'Add New Cow'}
              </h2>
              <p className="text-slate-600">
                {editingCow ? 'Update cow information' : 'Enter basic information for the new cow'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <span className="text-red-700">{errors.general}</span>
            </div>
          )}

          {/* Basic Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tag Number */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Tag className="w-4 h-4" />
                <span>Tag Number *</span>
              </label>
              <input
                type="text"
                value={formData.tagNumber}
                onChange={(e) => handleChange('tagNumber', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.tagNumber ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="e.g., H-001, 12345"
              />
              {errors.tagNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.tagNumber}</p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <User className="w-4 h-4" />
                <span>Name *</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.name ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
                placeholder="e.g., Bella, Luna, Daisy"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4" />
                <span>Date of Birth *</span>
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.dateOfBirth ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Breed */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Dna className="w-4 h-4" />
                <span>Breed *</span>
              </label>
              <select
                value={formData.breed}
                onChange={(e) => handleChange('breed', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.breed ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
              >
                <option value="">Select breed</option>
                {COW_BREEDS.map(breed => (
                  <option key={breed} value={breed}>{breed}</option>
                ))}
              </select>
              {errors.breed && (
                <p className="mt-1 text-sm text-red-600">{errors.breed}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Users className="w-4 h-4" />
                <span>Gender *</span>
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.gender ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
              >
                <option value="">Select gender</option>
                {COW_GENDERS.map(gender => (
                  <option key={gender} value={gender}>{gender}</option>
                ))}
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Users className="w-4 h-4" />
                <span>Category *</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.category ? 'border-red-300 bg-red-50' : 'border-slate-300'
                }`}
              >
                <option value="">Select category</option>
                {COW_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Production Status */}
            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
                <Activity className="w-4 h-4" />
                <span>Production Status</span>
              </label>
              <select
                value={formData.productionStatus}
                onChange={(e) => handleChange('productionStatus', e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {PRODUCTION_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-slate-700 mb-2">
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              placeholder="Additional notes about the cow (medical history, temperament, etc.)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>{isSubmitting ? 'Saving...' : (editingCow ? 'Update Cow' : 'Add Cow')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCowModal; 