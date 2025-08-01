import React, { useEffect } from 'react';
import { Users, Search, Plus, Edit3, Trash2, MoreVertical, Tag, Calendar, Activity, Filter, ChevronDown, ChevronUp, SortAsc, SortDesc, Download, X, Archive } from 'lucide-react';
import { calculateReproductiveStatus, getReproductiveStatusBadge, getProductionStatusBadge, calculateHealthScore, getHealthScoreBadge } from '../utils/cowDataModel';

const HerdManagement = ({ cows, sortBy = 'name', onAddCow, onEditCow, onDeleteCow, onViewProfile, onArchiveCow }) => {
  // 🐄 HERD MANAGEMENT DEBUG: Component received cows from props
  console.log('🐄 HERD MANAGEMENT DEBUG: Component received', cows.length, 'total cows');
  console.log('🐄 HERD MANAGEMENT DEBUG: All cow data:', cows.map(cow => ({
    name: cow.name,
    tagNumber: cow.tagNumber,
    category: cow.category,
    archived: cow.archived,
    status: cow.status
  })));
  
  // Check specifically for calf 8140A
  const targetCalf = cows.find(cow => cow.tagNumber === '8140A');
  if (targetCalf) {
    console.log('✅ HERD DEBUG: Found calf 8140A:', targetCalf);
  } else {
    console.log('❌ HERD DEBUG: Calf 8140A NOT FOUND in cows array');
    console.log('❌ HERD DEBUG: Available tag numbers:', cows.map(cow => cow.tagNumber));
  }
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');
  const [selectedCows, setSelectedCows] = React.useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = React.useState(false);
  const [archiveReason, setArchiveReason] = React.useState('');
  
  // Advanced filter states
  const [showFilterPanel, setShowFilterPanel] = React.useState(false);
  const [sortDirection, setSortDirection] = React.useState('asc');
  const [selectedBreeds, setSelectedBreeds] = React.useState([]);
  const [selectedStatuses, setSelectedStatuses] = React.useState([]);
  const [selectedLocations, setSelectedLocations] = React.useState([]);
  const [healthScoreRange, setHealthScoreRange] = React.useState([0, 100]);
  const [healthStatusFilters, setHealthStatusFilters] = React.useState({
    atRisk: false,
    needsAttention: false,
    healthy: false
  });
  const [recentActivityOnly, setRecentActivityOnly] = React.useState(false);

  // Get unique values for filter options
  const getUniqueBreeds = () => {
    const breeds = cows.filter(cow => !cow.archived).map(cow => cow.breed);
    return [...new Set(breeds)].filter(Boolean).sort();
  };

  const getUniqueLocations = () => {
    const locations = cows.filter(cow => !cow.archived).map(cow => cow.location);
    return [...new Set(locations)].filter(Boolean).sort();
  };

  const getUniqueStatuses = () => {
    const statuses = cows.filter(cow => !cow.archived).map(cow => cow.status);
    return [...new Set(statuses)].filter(Boolean).sort();
  };

  // Count active filters
  const getActiveFilterCount = () => {
    let count = 0;
    if (selectedBreeds.length > 0) count++;
    if (selectedStatuses.length > 0) count++;
    if (selectedLocations.length > 0) count++;
    if (healthScoreRange[0] > 0 || healthScoreRange[1] < 100) count++;
    if (Object.values(healthStatusFilters).some(Boolean)) count++;
    if (recentActivityOnly) count++;
    return count;
  };

  // Get health status for filtering
  const getHealthStatus = (cow) => {
    const healthScore = calculateHealthScore(cow);
    if (healthScore < 60) return 'atRisk';
    if (healthScore < 80) return 'needsAttention';
    return 'healthy';
  };

  // Check if cow has recent activity (within last 30 days)
  const hasRecentActivity = (cow) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const allRecords = [
      ...(cow.healthRecords || []),
      ...(cow.breedingRecords || []),
      ...(cow.calvingRecords || [])
    ];
    
    return allRecords.some(record => new Date(record.date) > thirtyDaysAgo);
  };

  // Apply advanced filters
  const applyAdvancedFilters = (cow) => {
    // Breed filter
    if (selectedBreeds.length > 0 && !selectedBreeds.includes(cow.breed)) {
      return false;
    }
    
    // Status filter
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(cow.status)) {
      return false;
    }
    
    // Location filter
    if (selectedLocations.length > 0 && !selectedLocations.includes(cow.location)) {
      return false;
    }
    
    // Health score range filter
    const healthScore = calculateHealthScore(cow);
    if (healthScore < healthScoreRange[0] || healthScore > healthScoreRange[1]) {
      return false;
    }
    
    // Health status filter
    const cowHealthStatus = getHealthStatus(cow);
    if (Object.values(healthStatusFilters).some(Boolean) && !healthStatusFilters[cowHealthStatus]) {
      return false;
    }
    
    // Recent activity filter
    if (recentActivityOnly && !hasRecentActivity(cow)) {
      return false;
    }
    
    return true;
  };

  // Sort cows
  const sortCows = (cowsToSort) => {
    return cowsToSort.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
          break;
        case 'tagNumber':
          // Try numerical sorting first, fallback to alphabetical
          const aNum = parseInt(a.tagNumber);
          const bNum = parseInt(b.tagNumber);
          if (!isNaN(aNum) && !isNaN(bNum)) {
            aValue = aNum;
            bValue = bNum;
          } else {
            aValue = (a.tagNumber || '').toLowerCase();
            bValue = (b.tagNumber || '').toLowerCase();
          }
          break;
        case 'breed':
          aValue = (a.breed || '').toLowerCase();
          bValue = (b.breed || '').toLowerCase();
          break;
        case 'age':
          // Calculate age from dateOfBirth
          const aAge = a.dateOfBirth ? new Date(a.dateOfBirth) : new Date(0);
          const bAge = b.dateOfBirth ? new Date(b.dateOfBirth) : new Date(0);
          aValue = aAge;
          bValue = bAge;
          break;
        case 'status':
          // Sort by reproductive status
          const aStatus = calculateReproductiveStatus(a) || '';
          const bStatus = calculateReproductiveStatus(b) || '';
          aValue = aStatus.toLowerCase();
          bValue = bStatus.toLowerCase();
          break;
        case 'healthScore':
          aValue = calculateHealthScore(a);
          bValue = calculateHealthScore(b);
          break;
        case 'lastUpdated':
          const aRecords = [...(a.healthRecords || []), ...(a.breedingRecords || []), ...(a.calvingRecords || [])];
          const bRecords = [...(b.healthRecords || []), ...(b.breedingRecords || []), ...(b.calvingRecords || [])];
          aValue = aRecords.length > 0 ? Math.max(...aRecords.map(r => new Date(r.date))) : new Date(0);
          bValue = bRecords.length > 0 ? Math.max(...bRecords.map(r => new Date(r.date))) : new Date(0);
          break;
        default:
          aValue = (a.name || '').toLowerCase();
          bValue = (b.name || '').toLowerCase();
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  // Filter cows based on search and active filter (exclude archived cows)
  const filteredCows = React.useMemo(() => {
    console.log('🔍 FILTER DEBUG: Starting with', cows.length, 'cows from props');
    
    let filtered = cows.filter(cow => {
      // Debug the specific calf
      if (cow.tagNumber === '8140A' || cow.category === 'Calf') {
        console.log('🐄 CALF FILTER CHECK:', {
          name: cow.name,
          tagNumber: cow.tagNumber,
          category: cow.category,
          archived: cow.archived,
          status: cow.status
        });
      }

      // Check archived status
      const isArchived = cow.archived === true;
      if (isArchived) {
        if (cow.category === 'Calf') console.log('❌ CALF filtered out: archived');
        return false;
      }

      // Check search match
      const matchesSearch = (cow.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (cow.tagNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (cow.breed || '').toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) {
        if (cow.category === 'Calf') console.log('❌ CALF filtered out: search mismatch');
        return false;
      }

      // Check category filter
      let matchesFilter = true;
      switch (activeFilter) {
        case 'cows':
          matchesFilter = cow.category === 'Cow';
          break;
        case 'heifers':
          matchesFilter = cow.category === 'Heifer';
          break;
        case 'calves':
          matchesFilter = cow.category === 'Calf';
          console.log('🔍 CALF FILTER: Checking calf filter for', cow.name || cow.tagNumber, 'category:', cow.category, 'matches:', matchesFilter);
          break;
        case 'bulls':
          matchesFilter = cow.category === 'Bull';
          break;
        case 'dry':
          matchesFilter = cow.productionStatus === 'Dry';
          break;
        case 'all':
        case null:
        default:
          matchesFilter = true;
          break;
      }

      if (!matchesFilter) {
        if (cow.category === 'Calf') console.log('❌ CALF filtered out: category filter', activeFilter);
        return false;
      }

      if (cow.category === 'Calf') console.log('✅ CALF passed all basic filters');
      return true;
    });

    // FIXED: Apply advanced filters properly
    filtered = filtered.filter(applyAdvancedFilters);
    
    console.log('🔍 FILTER DEBUG: Final filtered results:', filtered.length, 'animals');
    console.log('🔍 FILTER DEBUG: Calves in final results:', filtered.filter(c => c.category === 'Calf').map(c => c.tagNumber));
    
    return sortCows(filtered);
  }, [cows, searchTerm, activeFilter, selectedBreeds, selectedStatuses, selectedLocations, healthScoreRange, healthStatusFilters, recentActivityOnly, sortBy, sortDirection]);

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

  const handleBulkDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmBulkDelete = () => {
    selectedCows.forEach(cowId => {
      onDeleteCow(cowId);
    });
    setSelectedCows(new Set());
    setShowDeleteConfirm(false);
  };

  const handleBulkExport = () => {
    const selectedCowsData = cows.filter(cow => selectedCows.has(cow.id));
    
    // Convert to CSV format
    const headers = ['Name', 'Tag Number', 'Breed', 'Category', 'Gender', 'Status', 'Production Status', 'Date of Birth', 'Age', 'Location', 'Notes'];
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
      cow.location || '',
      cow.notes || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `herd_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setSelectedCows(new Set());
  };

  const clearSelection = () => {
    setSelectedCows(new Set());
  };

  const handleBulkArchive = () => {
    setShowArchiveConfirm(true);
  };

  const confirmBulkArchive = () => {
    if (!archiveReason.trim()) {
      alert('Please provide a reason for archiving.');
      return;
    }
    
    selectedCows.forEach(cowId => {
      onArchiveCow(cowId, archiveReason.trim());
    });
    
    setSelectedCows(new Set());
    setShowArchiveConfirm(false);
    setArchiveReason('');
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedBreeds([]);
    setSelectedStatuses([]);
    setSelectedLocations([]);
    setHealthScoreRange([0, 100]);
    setHealthStatusFilters({
      atRisk: false,
      needsAttention: false,
      healthy: false
    });
    setRecentActivityOnly(false);
  };

  // Helper function to display cow name gracefully
  const getDisplayName = (cow) => {
    return cow.name?.trim() || `#${cow.tagNumber}`;
  };

  // Helper function to display cow name with tag number
  const getDisplayNameWithTag = (cow) => {
    if (cow.name?.trim()) {
      return `${cow.name} (#${cow.tagNumber})`;
    }
    return `#${cow.tagNumber}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Herd Management</h1>
          <p className="text-slate-600 mt-1">
            Current Herd ({filteredCows.length} animals)
          </p>
        </div>
        <button
          onClick={onAddCow}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Cow</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by name, tag, or breed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
          />
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Filter Panel Header */}
        <div 
          className="p-6 cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setShowFilterPanel(!showFilterPanel)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Filter className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Filters & Sorting</h3>
              {getActiveFilterCount() > 0 && (
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-sm font-medium">
                  {getActiveFilterCount()} filter{getActiveFilterCount() !== 1 ? 's' : ''} active
                </span>
              )}
            </div>
            {showFilterPanel ? (
              <ChevronUp className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            )}
          </div>
        </div>

        {/* Filter Panel Content */}
        {showFilterPanel && (
          <div className="border-t border-slate-100 p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Column 1: Search & Sort */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Search & Sort</h4>
                


                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Sort Direction</label>
                  <button
                    onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                    className="flex items-center space-x-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    {sortDirection === 'asc' ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )}
                    <span className="text-sm font-medium">
                      {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Column 2: Category Filters */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Category Filters</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Breed</label>
                  <select
                    multiple
                    value={selectedBreeds}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedBreeds(values);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                  >
                    {getUniqueBreeds().map(breed => (
                      <option key={breed} value={breed}>{breed}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    multiple
                    value={selectedStatuses}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedStatuses(values);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                  >
                    {getUniqueStatuses().map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Location</label>
                  <select
                    multiple
                    value={selectedLocations}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => option.value);
                      setSelectedLocations(values);
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px]"
                  >
                    {getUniqueLocations().map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column 3: Health & Performance */}
              <div className="space-y-4">
                <h4 className="font-medium text-slate-900">Health & Performance</h4>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Health Score Range: {healthScoreRange[0]}% - {healthScoreRange[1]}%
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={healthScoreRange[0]}
                      onChange={(e) => setHealthScoreRange([parseInt(e.target.value), healthScoreRange[1]])}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={healthScoreRange[1]}
                      onChange={(e) => setHealthScoreRange([healthScoreRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Health Status</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={healthStatusFilters.atRisk}
                        onChange={(e) => setHealthStatusFilters(prev => ({ ...prev, atRisk: e.target.checked }))}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <span className="text-sm text-red-700">At Risk (&lt;60%)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={healthStatusFilters.needsAttention}
                        onChange={(e) => setHealthStatusFilters(prev => ({ ...prev, needsAttention: e.target.checked }))}
                        className="rounded border-slate-300 text-yellow-600 focus:ring-yellow-500"
                      />
                      <span className="text-sm text-yellow-700">Needs Attention (60-80%)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={healthStatusFilters.healthy}
                        onChange={(e) => setHealthStatusFilters(prev => ({ ...prev, healthy: e.target.checked }))}
                        className="rounded border-slate-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm text-green-700">Healthy (&gt;80%)</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={recentActivityOnly}
                      onChange={(e) => setRecentActivityOnly(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-slate-700">Recent Activity Only (last 30 days)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center space-x-3">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Clear All
                </button>
                <button
                  className="px-4 py-2 text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  Save Filter Set
                </button>
              </div>
              <button
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {selectedBreeds.map(breed => (
            <span key={breed} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
              {breed}
              <button
                onClick={() => setSelectedBreeds(prev => prev.filter(b => b !== breed))}
                className="ml-2 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedStatuses.map(status => (
            <span key={status} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              {status}
              <button
                onClick={() => setSelectedStatuses(prev => prev.filter(s => s !== status))}
                className="ml-2 hover:text-green-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {selectedLocations.map(location => (
            <span key={location} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
              {location}
              <button
                onClick={() => setSelectedLocations(prev => prev.filter(l => l !== location))}
                className="ml-2 hover:text-purple-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {(healthScoreRange[0] > 0 || healthScoreRange[1] < 100) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-700">
              Health Score: {healthScoreRange[0]}-{healthScoreRange[1]}%
              <button
                onClick={() => setHealthScoreRange([0, 100])}
                className="ml-2 hover:text-orange-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {Object.entries(healthStatusFilters).map(([key, value]) => {
            if (!value) return null;
            const labels = { atRisk: 'At Risk', needsAttention: 'Needs Attention', healthy: 'Healthy' };
            const colors = { atRisk: 'red', needsAttention: 'yellow', healthy: 'green' };
            return (
              <span key={key} className={`inline-flex items-center px-3 py-1 rounded-full text-sm bg-${colors[key]}-100 text-${colors[key]}-700`}>
                {labels[key]}
                <button
                  onClick={() => setHealthStatusFilters(prev => ({ ...prev, [key]: false }))}
                  className={`ml-2 hover:text-${colors[key]}-900`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {recentActivityOnly && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-700">
              Recent Activity Only
              <button
                onClick={() => setRecentActivityOnly(false)}
                className="ml-2 hover:text-indigo-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-slate-600">
        Showing {filteredCows.length} of {cows.filter(cow => !cow.archived).length} animals
      </div>

      {/* Bulk Action Toolbar */}
      {selectedCows.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-900 font-medium">
                {selectedCows.size} animal{selectedCows.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={clearSelection}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center space-x-1"
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
                onClick={handleBulkArchive}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Archive className="w-4 h-4" />
                <span>Archive Selected</span>
              </button>
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Selected</span>
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
          All Animals
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
          onClick={() => setActiveFilter(activeFilter === 'dry' ? null : 'dry')}
          className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
            activeFilter === 'dry' 
              ? 'bg-yellow-600 text-white shadow-lg' 
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Dry
        </button>
      </div>

      {/* Cow Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filteredCows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {cows.length === 0 ? 'No Cows Added Yet' : 'No Cows Match Your Filters'}
            </h3>
            <p className="text-slate-600 mb-6">
              {cows.length === 0 
                ? 'Start building your herd by adding your first cow record.'
                : 'Try adjusting your search terms or filters to see more results.'
              }
            </p>
            {cows.length === 0 && (
              <button
                onClick={onAddCow}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium"
              >
                Add Your First Cow
              </button>
            )}
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
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Cow Details</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Breed & Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Health Score</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Age</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Location</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Notes</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCows.map((cow) => (
                  <tr key={cow.id} className={`hover:bg-slate-50 transition-colors ${selectedCows.has(cow.id) ? 'bg-blue-50' : ''}`}>
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
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                          <Tag className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <button
                            onClick={() => onViewProfile(cow)}
                            className="font-semibold text-slate-900 hover:text-blue-600 transition-colors text-left"
                          >
                            {getDisplayNameWithTag(cow)}
                          </button>
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
                        <Activity className="w-4 h-4 text-slate-400" />
                        <span className={`font-medium ${getHealthScoreBadge(calculateHealthScore(cow)).className.replace('px-3 py-1 text-sm font-bold rounded-full', '')}`}>
                          {calculateHealthScore(cow)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-900">{calculateAge(cow.dateOfBirth)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-600 max-w-32 truncate">
                        {cow.location || 'Not specified'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-600 max-w-32 truncate">
                        {cow.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onEditCow(cow)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit cow"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteCow(cow.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete cow"
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

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Archive className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Archive Animals</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              Archive {selectedCows.size} selected animal{selectedCows.size !== 1 ? 's' : ''}? They will be moved to the Archived Animals section.
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Archive Reason *
              </label>
              <textarea
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="e.g., Sold to another farm, Deceased, Transferred..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows="3"
                required
              />
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-orange-700 font-medium mb-2">Animals to be archived:</p>
              <div className="max-h-20 overflow-y-auto">
                {cows.filter(cow => selectedCows.has(cow.id)).map(cow => (
                  <p key={cow.id} className="text-sm text-orange-600">
                    {getDisplayNameWithTag(cow)}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowArchiveConfirm(false);
                  setArchiveReason('');
                }}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkArchive}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
              >
                Archive {selectedCows.size} Animal{selectedCows.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Confirm Deletion</h3>
            </div>
            
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete {selectedCows.size} selected animal{selectedCows.size !== 1 ? 's' : ''}? This action cannot be undone.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-red-700 font-medium mb-2">Selected animals:</p>
              <div className="max-h-20 overflow-y-auto">
                {cows.filter(cow => selectedCows.has(cow.id)).map(cow => (
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
                onClick={confirmBulkDelete}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete {selectedCows.size} Animal{selectedCows.size !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default HerdManagement; 