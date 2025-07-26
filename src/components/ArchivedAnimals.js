import React from 'react';
import { Users, Search, RotateCcw, Trash2, MoreVertical, Tag, Calendar, Download, X } from 'lucide-react';
import { calculateReproductiveStatus, getReproductiveStatusBadge, getProductionStatusBadge } from '../utils/cowDataModel';
import { useState } from 'react';

const ArchivedAnimals = ({ archivedCows, onRestoreCow, onPermanentlyDeleteCow, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCows, setSelectedCows] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [cowToDelete, setCowToDelete] = useState(null);

  // Helper function to display cow name gracefully
  const getDisplayName = (cow) => {
    return cow.name?.trim() || `#${cow.tagNumber}`;
  };

  // Helper function to display cow name with tag number
  const getDisplayNameWithTag = (cow) => {
    if (cow.name?.trim()) {
      return `${cow.name} (#{cow.tagNumber})`;
    }
    return `#${cow.tagNumber}`;
  };

  // Filter archived cows based on search and active filter
  const filteredCows = archivedCows.filter(cow => {
    const matchesSearch = cow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cow.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesFilter = true;
    switch (activeFilter) {
      case 'cows': matchesFilter = cow.category === 'Cow'; break;
      case 'heifers': matchesFilter = cow.category === 'Heifer'; break;
      case 'calves': matchesFilter = cow.category === 'Calf'; break;
      case 'bulls': matchesFilter = cow.category === 'Bull'; break;
      case 'all': default: matchesFilter = true; break;
    }
    
    return matchesSearch && matchesFilter;
  });

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'Unknown';
    const birth = new Date(dateOfBirth);
    const now = new Date();
    const diffTime = Math.abs(now - birth);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
    return `${Math.floor(diffDays / 365)} years`;
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const styles = {
      'Active': 'bg-green-100 text-green-700 border-green-200',
      'Pregnant': 'bg-blue-100 text-blue-700 border-blue-200',
      'Sold': 'bg-gray-100 text-gray-700 border-gray-200',
      'Died': 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  // Format archive date
  const formatArchiveDate = (archiveDate) => {
    if (!archiveDate) return 'Unknown';
    return new Date(archiveDate).toLocaleDateString();
  };

  // Bulk selection functions
  const handleSelectAll = () => {
    if (selectedCows.size === filteredCows.length) {
      setSelectedCows(new Set());
    } else {
      setSelectedCows(new Set(filteredCows.map(cow => cow.id)));
    }
  };

  const handleSelectCow = (cowId) => {
    const newSelected = new Set(selectedCows);
    if (newSelected.has(cowId)) {
      newSelected.delete(cowId);
    } else {
      newSelected.add(cowId);
    }
    setSelectedCows(newSelected);
  };

  const handleBulkRestore = () => {
    selectedCows.forEach(cowId => {
      onRestoreCow(cowId);
    });
    setSelectedCows(new Set());
  };

  const handleBulkPermanentDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkPermanentDelete = () => {
    selectedCows.forEach(cowId => {
      onPermanentlyDeleteCow(cowId);
    });
    setSelectedCows(new Set());
    setShowDeleteConfirm(false);
  };

  const handleBulkExport = () => {
    const selectedCowsData = archivedCows.filter(cow => selectedCows.has(cow.id));
    
    // Convert to CSV format
    const headers = ['Name', 'Tag Number', 'Breed', 'Category', 'Gender', 'Status', 'Production Status', 'Date of Birth', 'Age', 'Archive Date', 'Archive Reason', 'Notes'];
    const csvData = selectedCowsData.map(cow => [
      cow.name,
      cow.tagNumber,
      cow.breed,
      cow.category,
      cow.gender,
      cow.status,
      cow.productionStatus,
      cow.dateOfBirth,
      calculateAge(cow.dateOfBirth),
      formatArchiveDate(cow.archivedDate),
      cow.archiveReason,
      cow.notes || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archived_animals_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setSelectedCows(new Set());
  };

  const clearSelection = () => {
    setSelectedCows(new Set());
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Archived Animals</h1>
          <p className="text-slate-600 mt-1">
            Archived Animals ({filteredCows.length} of {archivedCows.length} total archived)
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, tag, breed, or archive reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedCows.size > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-orange-900 font-medium">
                {selectedCows.size} animal{selectedCows.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Clear Selection</span>
              </button>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleBulkExport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Selected</span>
              </button>
              <button
                onClick={handleBulkRestore}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Selected</span>
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Permanently Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setActiveFilter(activeFilter === 'all' ? null : 'all')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            (activeFilter === 'all' || activeFilter === null)
              ? 'bg-blue-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Archived
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'cows' ? null : 'cows')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'cows' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Cows
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'heifers' ? null : 'heifers')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'heifers' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Heifers
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'calves' ? null : 'calves')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'calves' 
              ? 'bg-orange-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Calves
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'bulls' ? null : 'bulls')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'bulls' 
              ? 'bg-red-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Bulls
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'sold' ? null : 'sold')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'sold' 
              ? 'bg-purple-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Sold
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'deceased' ? null : 'deceased')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'deceased' 
              ? 'bg-red-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Deceased
        </button>
        <button
          onClick={() => setActiveFilter(activeFilter === 'transferred' ? null : 'transferred')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'transferred' 
              ? 'bg-yellow-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Transferred
        </button>
      </div>

      {/* Archived Animals Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredCows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {archivedCows.length === 0 ? 'No Archived Animals' : 'No Archived Animals Match Your Filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {archivedCows.length === 0 
                ? 'Archived animals will appear here when you archive animals from the main herd.'
                : 'Try adjusting your search terms or filters to see more results.'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedCows.size === filteredCows.length && filteredCows.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                      <span>Select All</span>
                    </div>
                  </th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Animal Details</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Breed & Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Age</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Archive Info</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Notes</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCows.map((cow) => (
                  <tr key={cow.id} className={`hover:bg-slate-50 transition-colors ${selectedCows.has(cow.id) ? 'bg-orange-50' : ''}`}>
                    <td className="py-4 px-6">
                      <input
                        type="checkbox"
                        checked={selectedCows.has(cow.id)}
                        onChange={() => handleSelectCow(cow.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-red-100 rounded-xl flex items-center justify-center">
                          <Tag className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <button
                            onClick={() => onViewProfile(cow)}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                          >
                            {getDisplayName(cow)}
                          </button>
                          {cow.name?.trim() && <div className="text-sm text-slate-500">#{cow.tagNumber}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-slate-900">{cow.breed}</div>
                        <div className="text-sm text-slate-500">{cow.category} • {cow.gender}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col space-y-1">
                        {(() => {
                          const reproductiveStatus = calculateReproductiveStatus(cow);
                          const reproductiveBadge = getReproductiveStatusBadge(reproductiveStatus);
                          return reproductiveBadge ? (
                            <span className={reproductiveBadge.className}>
                              {reproductiveBadge.text}
                            </span>
                          ) : (
                            cow.gender === 'Female' && cow.category !== 'Calf' ? (
                              <span className="text-slate-400 text-sm">N/A</span>
                            ) : null
                          );
                        })()}
                        {(() => {
                          const productionBadge = getProductionStatusBadge(cow.productionStatus);
                          return productionBadge ? (
                            <span className={productionBadge.className}>
                              {productionBadge.text}
                            </span>
                          ) : null;
                        })()}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900">{calculateAge(cow.dateOfBirth)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="text-sm text-slate-900 font-medium">
                          {formatArchiveDate(cow.archivedDate)}
                        </div>
                        <div className="text-xs text-slate-500 max-w-32 truncate">
                          {cow.archiveReason || 'No reason provided'}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-600 max-w-32 truncate">
                        {cow.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onRestoreCow(cow.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Restore to herd"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onPermanentlyDeleteCow(cow.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Permanently delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Permanent Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Permanent Deletion</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              Are you sure you want to permanently delete {selectedCows.size} selected animal{selectedCows.size !== 1 ? 's' : ''}? This action cannot be undone and all data will be lost forever.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium mb-2">Animals to be permanently deleted:</p>
              <div className="max-h-20 overflow-y-auto">
                {archivedCows.filter(cow => selectedCows.has(cow.id)).map(cow => (
                  <p key={cow.id} className="text-sm text-red-600">
                    {getDisplayNameWithTag(cow)}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkPermanentDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Permanently Delete {selectedCows.size} Animal{selectedCows.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ArchivedAnimals; 