import React, { useState, memo } from 'react';
import { 
  X, 
  User, 
  Activity, 
  Heart, 
  Baby, 
  Plus, 
  Calendar, 
  Tag, 
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2
} from 'lucide-react';
import { 
  calculateAge,
  createHealthRecord,
  createBreedingRecord,
  createCalvingRecord,
  calculateDueDate,
  calculateReproductiveStatus,
  getReproductiveStatusBadge,
  getProductionStatusBadge,
  createHeatRecord,
  HEALTH_RECORD_TYPES,
  BREEDING_METHODS,
  BREEDING_RESULTS,
  CALF_HEALTH_STATUS,
  COMPLICATIONS,
  PRODUCTION_STATUS
} from '../utils/cowDataModel';

// Tab components
const OverviewTab = memo(({ cow, onEditRecord, onDeleteRecord }) => {
  const age = calculateAge(cow.dateOfBirth);
  const daysSinceLastCalving = cow.calvingRecords?.length > 0 
    ? Math.floor((new Date() - new Date(cow.calvingRecords[cow.calvingRecords.length - 1].date)) / (1000 * 60 * 60 * 24))
    : null;

  const lastBreeding = cow.breedingRecords?.length > 0 
    ? cow.breedingRecords[cow.breedingRecords.length - 1]
    : null;

  const recentActivity = [
    ...cow.healthRecords?.slice(-3).map(record => ({
      type: 'health',
      recordId: record.id,
      recordType: 'health',
      date: record.date,
      description: `${record.type}: ${record.description}`,
      icon: Activity,
      fullRecord: record
    })) || [],
    ...cow.breedingRecords?.slice(-2).map(record => ({
      type: 'breeding',
      recordId: record.id,
      recordType: 'breeding',
      date: record.date,
      description: `Breeding with ${record.bullName || record.semenId || 'Unknown'}`,
      icon: Heart,
      fullRecord: record
    })) || [],
    ...cow.calvingRecords?.slice(-2).map(record => ({
      type: 'calving',
      recordId: record.id,
      recordType: 'calving',
      date: record.date,
      description: `Calved ${record.calfTag} (${record.calfGender})`,
      icon: Baby,
      fullRecord: record
    })) || []
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  // Handle editing activity record
  const handleEditActivityRecord = (activity) => {
    if (onEditRecord) {
      onEditRecord(activity.recordType, activity.fullRecord);
    }
  };

  // Handle deleting activity record
  const handleDeleteActivityRecord = (activity) => {
    if (onDeleteRecord) {
      onDeleteRecord(activity.recordType, activity.recordId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cow Profile Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-2xl flex items-center justify-center">
            <User className="w-12 h-12 text-blue-700" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-2xl font-bold text-slate-900">{cow.name}</h3>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                #{cow.tagNumber}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Age: <strong>{age}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Tag className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Breed: <strong>{cow.breed}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Category: <strong>{cow.category}</strong></span>
              </div>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-slate-400" />
                <span className="text-slate-600">Status: <strong>{cow.status}</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">{age}</div>
          <div className="text-sm text-slate-600">Current Age</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">
            {daysSinceLastCalving !== null ? `${daysSinceLastCalving} days` : 'Never'}
          </div>
          <div className="text-sm text-slate-600">Since Last Calving</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className="text-2xl font-bold text-slate-900">
            {lastBreeding ? lastBreeding.result : 'No Records'}
          </div>
          <div className="text-sm text-slate-600">Last Breeding Status</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h4 className="text-lg font-semibold text-slate-900">Recent Activity</h4>
        </div>
        <div className="p-6">
          {recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No recent activity recorded</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const IconComponent = activity.icon;
                return (
                  <div 
                    key={`${activity.recordType}-${activity.recordId}-${index}`} 
                    className="group flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                      <IconComponent className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-900">{activity.description}</div>
                      <div className="text-xs text-slate-500">{activity.date}</div>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEditActivityRecord(activity)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                        title="Edit record"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteActivityRecord(activity)}
                        className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Notes */}
      {cow.notes && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h4 className="text-lg font-semibold text-slate-900 mb-3">Notes</h4>
          <p className="text-slate-600">{cow.notes}</p>
        </div>
      )}
    </div>
  );
});

const HealthRecordsTab = memo(({ cow, onAddRecord, onUpdateCow, onEditRecord, onDeleteRecord }) => {
  const [expandedRecord, setExpandedRecord] = useState(null);

  // Debug: Ensure health records are accessible
  if (!cow?.healthRecords) console.log('HealthRecordsTab: No healthRecords found for cow:', cow?.name);

  const getStatusBadge = (status) => {
    const styles = {
      'Completed': 'bg-green-100 text-green-700 border-green-200',
      'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Overdue': 'bg-red-100 text-red-700 border-red-200'
    };
    return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-slate-900">Health Records</h4>
        <button
          onClick={() => onAddRecord('health')}
          className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Health Record</span>
        </button>
      </div>

      {(!cow.healthRecords || cow.healthRecords.length === 0) ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Activity className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h5 className="text-xl font-semibold text-slate-900 mb-2">No Health Records</h5>
          <p className="text-slate-600 mb-6">Start tracking this cow's health by adding the first record.</p>
          <button
            onClick={() => onAddRecord('health')}
            className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors font-medium"
          >
            Add First Record
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Medicine</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Dosage</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Veterinarian</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cow.healthRecords.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-900">{record.date}</td>
                      <td className="py-3 px-4">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                          {record.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-900">{record.medicine || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{record.dosage || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-900">{record.duration || '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{record.veterinarian || 'Not specified'}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onEditRecord('health', record)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                            title="Edit record"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteRecord('health', record.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                            title="Delete record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {expandedRecord === record.id ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRecord === record.id && (
                      <tr>
                        <td colSpan="7" className="bg-slate-50 px-4 py-3">
                          <div className="space-y-3 text-sm">
                            <div>
                              <span className="font-medium text-slate-900">Description: </span>
                              <span className="text-slate-600">{record.description || 'No description provided'}</span>
                            </div>
                            {record.notes && (
                              <div>
                                <span className="font-medium text-slate-900">Notes: </span>
                                <span className="text-slate-600">{record.notes}</span>
                              </div>
                            )}
                            {record.status && (
                              <div>
                                <span className="font-medium text-slate-900">Status: </span>
                                <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusBadge(record.status)}`}>
                                  {record.status}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

const BreedingRecordsTab = memo(({ cow, onAddRecord, onEditRecord, onDeleteRecord }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-slate-900">Breeding Records</h4>
        <button
          onClick={() => onAddRecord('breeding')}
          className="bg-pink-600 text-white px-4 py-2 rounded-xl hover:bg-pink-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Breeding Record</span>
        </button>
      </div>

      {cow.breedingRecords?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h5 className="text-xl font-semibold text-slate-900 mb-2">No Breeding Records</h5>
          <p className="text-slate-600 mb-6">Start tracking breeding history for this cow.</p>
          <button
            onClick={() => onAddRecord('breeding')}
            className="bg-pink-600 text-white px-6 py-3 rounded-xl hover:bg-pink-700 transition-colors font-medium"
          >
            Add First Record
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Bull Name/Semen ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Method</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Result</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Expected Due</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Technician</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cow.breedingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-900">{record.date}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{record.bullName || record.semenId || '-'}</td>
                    <td className="py-3 px-4">
                      <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-medium">
                        {record.method}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.result === 'Success' ? 'bg-green-100 text-green-700' :
                        record.result === 'Failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {record.result}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-slate-600">{record.expectedDueDate || 'TBD'}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{record.technician || 'Not specified'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEditRecord('breeding', record)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                          title="Edit record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord('breeding', record.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

const CalvingRecordsTab = memo(({ cow, onAddRecord, onEditRecord, onDeleteRecord }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-slate-900">Calving Records</h4>
        <button
          onClick={() => onAddRecord('calving')}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl hover:bg-orange-700 transition-colors font-medium flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Calving Record</span>
        </button>
      </div>

      {cow.calvingRecords?.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Baby className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h5 className="text-xl font-semibold text-slate-900 mb-2">No Calving Records</h5>
          <p className="text-slate-600 mb-6">Start tracking calving history for this cow.</p>
          <button
            onClick={() => onAddRecord('calving')}
            className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-orange-700 transition-colors font-medium"
          >
            Add First Record
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Calf Tag</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Gender</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Weight</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Complications</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Health</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cow.calvingRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 text-sm text-slate-900">{record.date}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">#{record.calfTag}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{record.calfGender}</td>
                    <td className="py-3 px-4 text-sm text-slate-900">{record.birthWeight ? `${record.birthWeight} lbs` : 'Not recorded'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.complications === 'None' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.complications}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        record.calfHealth === 'Healthy' ? 'bg-green-100 text-green-700' :
                        record.calfHealth === 'Sick' ? 'bg-red-100 text-red-700' :
                        record.calfHealth === 'Deceased' ? 'bg-gray-100 text-gray-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.calfHealth}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onEditRecord('calving', record)}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-200"
                          title="Edit record"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteRecord('calving', record.id)}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-200"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

const CowProfileModal = ({ isOpen, onClose, cow, onUpdateCow }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddRecordModal, setShowAddRecordModal] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [editingRecordType, setEditingRecordType] = useState(null);

  if (!isOpen || !cow) return null;

  // Ensure cow has all required arrays initialized (for backward compatibility)
  const normalizedCow = {
    ...cow,
    healthRecords: cow.healthRecords || [],
    breedingRecords: cow.breedingRecords || [],
    calvingRecords: cow.calvingRecords || []
  };

  // Debug: Check if cow has required arrays
  if (!cow.healthRecords) console.log('Cow missing healthRecords array, adding empty array');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'health', label: 'Health Records', icon: Activity },
    { id: 'breeding', label: 'Breeding Records', icon: Heart },
    { id: 'calving', label: 'Calving Records', icon: Baby }
  ];

  const handleAddRecord = (recordType) => {
    setEditingRecord(null);
    setEditingRecordType(null);
    setShowAddRecordModal(recordType);
  };

  const handleEditRecord = (recordType, record) => {
    setEditingRecord(record);
    setEditingRecordType(recordType);
    setShowAddRecordModal(recordType);
  };

  const handleDeleteRecord = (recordType, recordId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this record? This action cannot be undone.');
    
    if (confirmDelete) {
      let updatedCow = { ...normalizedCow };
      
      switch (recordType) {
        case 'health':
          updatedCow.healthRecords = normalizedCow.healthRecords.filter(record => record.id !== recordId);
          console.log('Deleted health record from cow:', normalizedCow.name);
          break;
        case 'breeding':
          updatedCow.breedingRecords = normalizedCow.breedingRecords.filter(record => record.id !== recordId);
          console.log('Deleted breeding record from cow:', normalizedCow.name);
          break;
        case 'calving':
          updatedCow.calvingRecords = normalizedCow.calvingRecords.filter(record => record.id !== recordId);
          console.log('Deleted calving record from cow:', normalizedCow.name);
          break;
        default:
          console.error('Unknown record type for deletion:', recordType);
          return;
      }
      
      onUpdateCow(updatedCow);
    }
  };

  const handleSaveRecord = (recordType, recordData) => {
    let updatedCow = { ...normalizedCow };
    
    if (editingRecord) {
      // Update existing record
      switch (recordType) {
        case 'health':
          updatedCow.healthRecords = normalizedCow.healthRecords.map(record => 
            record.id === editingRecord.id ? { ...editingRecord, ...recordData, updatedAt: new Date().toISOString() } : record
          );
          console.log('Updated health record for cow:', normalizedCow.name);
          break;
        case 'breeding':
          updatedCow.breedingRecords = normalizedCow.breedingRecords.map(record => 
            record.id === editingRecord.id ? { ...editingRecord, ...recordData, updatedAt: new Date().toISOString() } : record
          );
          console.log('Updated breeding record for cow:', normalizedCow.name);
          break;
        case 'calving':
          updatedCow.calvingRecords = normalizedCow.calvingRecords.map(record => 
            record.id === editingRecord.id ? { ...editingRecord, ...recordData, updatedAt: new Date().toISOString() } : record
          );
          console.log('Updated calving record for cow:', normalizedCow.name);
          break;
        default:
          console.error('Unknown record type:', recordType);
          return;
      }
    } else {
      // Add new record
      let newRecord;
      switch (recordType) {
        case 'health':
          newRecord = createHealthRecord(recordData);
          updatedCow.healthRecords = [...normalizedCow.healthRecords, newRecord];
          console.log('Added health record to cow:', normalizedCow.name, 'Total records:', updatedCow.healthRecords.length);
          break;
        case 'breeding':
          newRecord = createBreedingRecord(recordData);
          updatedCow.breedingRecords = [...normalizedCow.breedingRecords, newRecord];
          console.log('Added breeding record to cow:', normalizedCow.name);
          break;
        case 'calving':
          newRecord = createCalvingRecord(recordData);
          updatedCow.calvingRecords = [...normalizedCow.calvingRecords, newRecord];
          console.log('Added calving record to cow:', normalizedCow.name);
          break;
        default:
          console.error('Unknown record type:', recordType);
          return;
      }
    }

    onUpdateCow(updatedCow);
    setShowAddRecordModal(null);
    setEditingRecord(null);
    setEditingRecordType(null);
  };

  // Handle recording heat detection
  const handleRecordHeat = () => {
    const heatRecord = createHeatRecord();
    let updatedCow = { ...normalizedCow };
    updatedCow.healthRecords = [...normalizedCow.healthRecords, heatRecord];
    
    console.log('Added heat detection record for cow:', normalizedCow.name);
    onUpdateCow(updatedCow);
  };

  // Handle pregnancy confirmation
  const handleConfirmPregnancy = () => {
    const pregnancyRecord = createHealthRecord({
      type: 'Pregnancy Check',
      description: 'Pregnancy confirmed positive',
      date: new Date().toISOString().split('T')[0]
    });

    let updatedCow = { ...normalizedCow };
    updatedCow.healthRecords = [...normalizedCow.healthRecords, pregnancyRecord];
    
    console.log('Added pregnancy confirmation record for cow:', normalizedCow.name);
    onUpdateCow(updatedCow);
  };

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-2xl font-bold text-slate-900">{normalizedCow.name}</h2>
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const reproductiveStatus = calculateReproductiveStatus(normalizedCow);
                      const reproductiveBadge = getReproductiveStatusBadge(reproductiveStatus);
                      return reproductiveBadge ? (
                        <span className={reproductiveBadge.className}>
                          {reproductiveBadge.text}
                        </span>
                      ) : null;
                    })()}
                    {(() => {
                      const productionBadge = getProductionStatusBadge(normalizedCow.productionStatus);
                      return productionBadge ? (
                        <span className={productionBadge.className}>
                          {productionBadge.text}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
                <p className="text-slate-600">Tag #{normalizedCow.tagNumber} • {normalizedCow.breed} • {normalizedCow.category}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {normalizedCow.gender === 'Female' && normalizedCow.category !== 'Calf' && (
                <>
                  <button
                    onClick={handleRecordHeat}
                    className="flex items-center space-x-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-lg text-sm font-medium"
                    title="Record heat detection"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Record Heat</span>
                  </button>
                  {calculateReproductiveStatus(normalizedCow) === 'BRED' && (
                    <button
                      onClick={handleConfirmPregnancy}
                      className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 transition-colors rounded-lg text-sm font-medium"
                      title="Confirm pregnancy"
                    >
                      <Baby className="w-4 h-4" />
                      <span>Confirm Pregnancy</span>
                    </button>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 px-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && <OverviewTab cow={normalizedCow} onEditRecord={handleEditRecord} onDeleteRecord={handleDeleteRecord} />}
                    {activeTab === 'health' && <HealthRecordsTab cow={normalizedCow} onAddRecord={handleAddRecord} onUpdateCow={onUpdateCow} onEditRecord={handleEditRecord} onDeleteRecord={handleDeleteRecord} />}
        {activeTab === 'breeding' && <BreedingRecordsTab cow={normalizedCow} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} onDeleteRecord={handleDeleteRecord} />}
        {activeTab === 'calving' && <CalvingRecordsTab cow={normalizedCow} onAddRecord={handleAddRecord} onEditRecord={handleEditRecord} onDeleteRecord={handleDeleteRecord} />}
          </div>
        </div>
      </div>

      {/* Add Record Modals */}
      <AddRecordModal
        isOpen={showAddRecordModal !== null}
        recordType={showAddRecordModal}
        editingRecord={editingRecord}
        onClose={() => {
          setShowAddRecordModal(null);
          setEditingRecord(null);
          setEditingRecordType(null);
        }}
        onSave={handleSaveRecord}
      />
    </>
  );
};

// Add Record Modal Component
const AddRecordModal = ({ isOpen, recordType, editingRecord, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  const resetForm = () => {
    setFormData({});
  };

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (!isOpen) {
      resetForm();
    } else if (editingRecord) {
      // Pre-fill form with existing record data when editing
      setFormData({
        ...editingRecord,
        // Ensure dates are in correct format
        date: editingRecord.date || '',
        expectedDueDate: editingRecord.expectedDueDate || ''
      });
    } else if (recordType === 'breeding') {
      // Set default breeding date to today if opening new breeding modal
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        date: today,
        expectedDueDate: calculateDueDate(today)
      }));
    }
  }, [isOpen, recordType, editingRecord]);

  // Handle field value changes with auto-calculation
  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => {
      const updated = { ...prev, [fieldName]: value };
      
      // Auto-calculate due date for breeding records
      if (recordType === 'breeding' && fieldName === 'date') {
        updated.expectedDueDate = calculateDueDate(value);
      }
      
      return updated;
    });
  };

  const handleSave = () => {
    onSave(recordType, formData);
    resetForm();
  };

  if (!isOpen || !recordType) return null;

  const getModalConfig = () => {
    const isEditing = !!editingRecord;
    switch (recordType) {
      case 'health':
        return {
          title: isEditing ? 'Edit Health Record' : 'Add Health Record',
          color: 'green',
          fields: [
            { name: 'date', label: 'Date', type: 'date', required: true, width: 'half' },
            { name: 'type', label: 'Type', type: 'select', options: HEALTH_RECORD_TYPES, required: true, width: 'half' },
            { name: 'medicine', label: 'Medicine', type: 'text', width: 'half' },
            { name: 'dosage', label: 'Dosage', type: 'text', placeholder: 'e.g., 10ml twice daily', width: 'half' },
            { name: 'duration', label: 'Duration', type: 'text', placeholder: 'e.g., 7 days, 2 weeks', width: 'half' },
            { name: 'veterinarian', label: 'Veterinarian (Optional)', type: 'text', width: 'half' },
            { name: 'description', label: 'Description', type: 'textarea', required: true, width: 'full' }
          ]
        };
      case 'breeding':
        return {
          title: isEditing ? 'Edit Breeding Record' : 'Add Breeding Record',
          color: 'pink',
          fields: [
            { name: 'date', label: 'Breeding Date', type: 'date', required: true, width: 'half', autoCalculateDue: true },
            { name: 'method', label: 'Method', type: 'select', options: BREEDING_METHODS, required: true, width: 'half' },
            { name: 'bullName', label: 'Bull Name', type: 'text', width: 'half' },
            { name: 'semenId', label: 'Semen ID', type: 'text', width: 'half' },
            { name: 'technician', label: 'Technician', type: 'text', width: 'half' },
            { name: 'cost', label: 'Cost ($)', type: 'number', width: 'half' },
            { name: 'result', label: 'Result', type: 'select', options: BREEDING_RESULTS, width: 'half' },
            { name: 'expectedDueDate', label: 'Expected Due Date', type: 'date', width: 'half', readOnly: true, helpText: '(Auto-calculated: 280 days from breeding)' },
            { name: 'notes', label: 'Notes', type: 'textarea', width: 'full' }
          ]
        };
      case 'calving':
        return {
          title: isEditing ? 'Edit Calving Record' : 'Add Calving Record',
          color: 'orange',
          fields: [
            { name: 'date', label: 'Calving Date', type: 'date', required: true, width: 'half' },
            { name: 'calfTag', label: 'Calf Tag Number', type: 'text', required: true, width: 'half' },
            { name: 'calfGender', label: 'Calf Gender', type: 'select', options: ['Female', 'Male'], required: true, width: 'half' },
            { name: 'birthWeight', label: 'Birth Weight (lbs)', type: 'number', width: 'half' },
            { name: 'complications', label: 'Complications', type: 'select', options: COMPLICATIONS, width: 'half' },
            { name: 'calfHealth', label: 'Calf Health', type: 'select', options: CALF_HEALTH_STATUS, width: 'half' },
            { name: 'assistanceRequired', label: 'Assistance Required', type: 'checkbox', width: 'half' },
            { name: 'veterinarianAssisted', label: 'Veterinarian Assisted', type: 'checkbox', width: 'half' },
            { name: 'notes', label: 'Notes', type: 'textarea', width: 'full' }
          ]
        };
      default:
        return { title: '', color: 'blue', fields: [] };
    }
  };

  const config = getModalConfig();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-xl font-bold text-slate-900">{config.title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.name} className={field.width === 'full' ? 'col-span-2' : 'col-span-1'}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={field.required}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                  />
                ) : field.type === 'checkbox' ? (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData[field.name] || false}
                      onChange={(e) => handleFieldChange(field.name, e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Yes</span>
                  </label>
                ) : (
                  <input
                    type={field.type}
                    value={formData[field.name] || ''}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      field.readOnly 
                        ? 'bg-slate-50 border-slate-200 text-slate-600 cursor-not-allowed' 
                        : 'border-slate-300'
                    }`}
                    placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                    required={field.required}
                    readOnly={field.readOnly}
                  />
                )}
                
                {/* Help text for read-only or special fields */}
                {field.helpText && (
                  <p className="text-xs text-slate-500 mt-1">{field.helpText}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`px-6 py-2 bg-${config.color}-600 text-white rounded-lg hover:bg-${config.color}-700 transition-colors font-medium`}
          >
            {editingRecord ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CowProfileModal; 