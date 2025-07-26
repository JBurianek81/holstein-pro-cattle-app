import React, { useState, useEffect, memo } from 'react';
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
  Trash2,
  CheckCircle,
  AlertTriangle,
  Users
} from 'lucide-react';
import AddCowModal from './AddCowModal';
import { 
  calculateAge,
  createHealthRecord,
  createHeatRecord,
  createBreedingRecord,
  createCalvingRecord,
  createCalfFromCalving,
  calculateDueDate,
  calculateReproductiveStatus,
  getReproductiveStatusBadge,
  getProductionStatusBadge,
  calculateHealthScore,
  getHealthScoreBadge,
  HEALTH_RECORD_TYPES,
  BREEDING_METHODS,
  CALF_HEALTH_STATUS,
  COMPLICATIONS,
  updateCategoryByAge // <-- import the new helper
} from '../utils/cowDataModel';


// Helper function for consistent date formatting
const formatDueDate = (dateString) => {
  if (!dateString) return null;
  // Parse date string to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return monthNames[month - 1] + ' ' + day;
};

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
              <h3 className="text-2xl font-bold text-slate-900">
                {cow.name?.trim() || `#${cow.tagNumber}`}
              </h3>
              {cow.name?.trim() && (
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  #{cow.tagNumber}
                </span>
              )}
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
              {cow.dam && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Dam: <strong>{cow.dam}</strong></span>
                </div>
              )}
              {cow.sire && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Sire: <strong>{cow.sire}</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-6">
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
            {calculateReproductiveStatus(cow) === 'PREGNANT' && lastBreeding?.expectedDueDate 
              ? formatDueDate(lastBreeding.expectedDueDate)
              : 'Not Applicable'
            }
          </div>
          <div className="text-sm text-slate-600">Due Date</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className={`text-2xl font-bold ${
            calculateReproductiveStatus(cow) === 'PREGNANT' ? 'text-green-600' :
            calculateReproductiveStatus(cow) === 'BRED' ? 'text-yellow-600' :
            'text-slate-600'
          }`}>
            {calculateReproductiveStatus(cow)}
          </div>
          <div className="text-sm text-slate-600">Last Breeding Status</div>
        </div>
        <div className="bg-white rounded-xl p-4 border border-slate-200">
          <div className={`text-2xl font-bold ${getHealthScoreBadge(calculateHealthScore(cow)).className.replace('px-3 py-1 text-sm font-bold rounded-full', '')}`}>
            {calculateHealthScore(cow)}%
          </div>
          <div className="text-sm text-slate-600">Health Score</div>
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
                    <td className="py-3 px-4 text-sm text-slate-600">
                      {record.expectedDueDate ? formatDueDate(record.expectedDueDate) : 'TBD'}
                    </td>
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

const CowProfileModal = ({ isOpen, onClose, cow, onUpdateCow, bullInventory = [], onBreedingRecordSaved, onBreedingRecordDeleted, onAddCow, cows = [], onUpdateBullInventory }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddRecordModal, setShowAddRecordModal] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [editingRecordType, setEditingRecordType] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showBullModal, setShowBullModal] = useState(false);
  const [editingBull, setEditingBull] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Automatic Calf → Heifer transition on load/display
  useEffect(() => {
    if (isOpen && cow) {
      const updatedCow = updateCategoryByAge(cow);
      if (updatedCow.category !== cow.category) {
        onUpdateCow(updatedCow);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, cow]);

  if (!isOpen || !cow) return null;

  // Ensure cow has all required arrays initialized (for backward compatibility)
  const normalizedCow = {
    ...cow,
    healthRecords: cow.healthRecords || [],
    breedingRecords: cow.breedingRecords || [],
    calvingRecords: cow.calvingRecords || []
  };

  // Debug: Log cow data to see if it's being updated
  console.log('🐄 CowProfileModal received cow data:', normalizedCow.name, 'breeding records:', normalizedCow.breedingRecords?.length || 0);

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
          // Find the breeding record before deleting it
          const deletedBreedingRecord = normalizedCow.breedingRecords.find(record => record.id === recordId);
          updatedCow.breedingRecords = normalizedCow.breedingRecords.filter(record => record.id !== recordId);
          console.log('Deleted breeding record from cow:', normalizedCow.name);
          
          // Call the deletion callback with the deleted record
          if (onBreedingRecordDeleted && deletedBreedingRecord) {
            onBreedingRecordDeleted(updatedCow, deletedBreedingRecord);
          }
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
          
          // Handle bull inventory updates for edited breeding records
          if (onBreedingRecordSaved && recordData.semenId) {
            // Find the updated record to pass to the callback
            const updatedRecord = updatedCow.breedingRecords.find(record => record.id === editingRecord.id);
            if (updatedRecord) {
              // Check if the bull changed during editing
              const bullChanged = editingRecord.semenId !== recordData.semenId;
              if (bullChanged) {
                // Pass the old breeding record for proper straw restoration
                onBreedingRecordSaved(updatedCow, updatedRecord, recordData.semenId, true, editingRecord);
              } else {
                // Same bull, just update the record
                onBreedingRecordSaved(updatedCow, updatedRecord, recordData.semenId, false, null);
              }
            }
          }
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
          
          // Handle bull inventory updates for new breeding records
          if (onBreedingRecordSaved && recordData.semenId) {
            onBreedingRecordSaved(updatedCow, newRecord, recordData.semenId, false, null);
          }
          
          // Auto-create calf if tag number is provided and not editing existing record
          if (!editingRecord && recordData.calfTag && recordData.calfTag.trim() !== '' && onAddCow) {
            try {
              // Check if calf tag already exists in herd
              const existingCalf = cows?.find(c => c.tagNumber === recordData.calfTag.trim());
              if (existingCalf) {
                console.warn('Calf with tag number', recordData.calfTag, 'already exists in herd');
                // Show warning toast or alert
                alert(`Warning: A calf with tag number ${recordData.calfTag} already exists in the herd.`);
                break;
              }
              
              // Create new calf record
              const newCalf = createCalfFromCalving(recordData, normalizedCow);
              console.log('Auto-creating new calf:', newCalf.name, 'Tag:', newCalf.tagNumber);
              
              // Add calf to herd
              onAddCow(newCalf);
              
              // Show success message
              setToastMessage(`Calf ${recordData.calfTag} successfully added to herd!`);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 3000);
            } catch (error) {
              console.error('Error creating calf:', error);
              alert('Error creating calf record. Please try again.');
            }
          }
          break;
        case 'calving':
          newRecord = createCalvingRecord(recordData);
          updatedCow.calvingRecords = [...normalizedCow.calvingRecords, newRecord];
          console.log('Added calving record to cow:', normalizedCow.name);
          
          // Automatic Heifer → Cow transition
          if (normalizedCow.category === 'Heifer') {
            updatedCow.category = 'Cow';
            console.log('Automatic category update: Heifer → Cow for', normalizedCow.name);
          }
          
          // Automatic calf addition to herd (if calf is alive)
          if (!editingRecord && recordData.calfTag && recordData.calfTag.trim() !== '' && 
              recordData.calfHealth !== 'Deceased' && onAddCow) {
            try {
              // Check if calf tag already exists in herd
              const existingCalf = cows?.find(c => c.tagNumber === recordData.calfTag.trim());
              if (existingCalf) {
                console.warn('Calf with tag number', recordData.calfTag, 'already exists in herd');
                alert(`Warning: A calf with tag number ${recordData.calfTag} already exists in the herd.`);
              } else {
                // Create new calf record
                const newCalf = createCalfFromCalving(recordData, normalizedCow);
                console.log('Auto-creating new calf:', newCalf.name, 'Tag:', newCalf.tagNumber);
                
                // Add calf to herd
                onAddCow(newCalf);
                
                // Show success message
                setToastMessage(`Calf ${recordData.calfTag} successfully added to herd!`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }
            } catch (error) {
              console.error('Error creating calf:', error);
              alert('Error creating calf record. Please try again.');
            }
          }
          
          // Note: Reproductive status will be automatically calculated based on calving records
          // The calculateReproductiveStatus function now prioritizes recent calving records
          // and will return OPEN status for cows that have recently calved
          console.log('Calving record saved for:', normalizedCow.name, '- reproductive status will be recalculated automatically');
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
    onUpdateCow(updatedCow);
    setToastMessage('Heat recorded successfully');
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Handle pregnancy confirmation
  const handleConfirmPregnancy = () => {
    const today = new Date();
    const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    
    const pregnancyRecord = createHealthRecord({
      type: 'Pregnancy Check',
      description: 'Pregnancy confirmed positive',
      date: todayStr
    });

    let updatedCow = { ...normalizedCow };
    updatedCow.healthRecords = [...normalizedCow.healthRecords, pregnancyRecord];
    
    console.log('Added pregnancy confirmation record for cow:', normalizedCow.name);
    onUpdateCow(updatedCow);
  };

  // Bull inventory handlers
  const handleAddBull = () => {
    console.log('🐄 handleAddBull called - opening bull modal');
    setEditingBull(null);
    setShowBullModal(true);
    console.log('🐄 showBullModal set to true');
  };

  const handleCloseBullModal = () => {
    console.log('🐄 handleCloseBullModal called - closing bull modal');
    setShowBullModal(false);
    setEditingBull(null);
  };

  const handleSaveBull = (bull) => {
    if (editingBull !== null) {
      // Editing existing bull
      const updatedInventory = bullInventory.map((b, i) => i === editingBull.index ? bull : b);
      onUpdateBullInventory(updatedInventory);
      setEditingBull(null);
    } else {
      // Adding new bull
      const updatedInventory = [...bullInventory, bull];
      onUpdateBullInventory(updatedInventory);
    }
    setShowBullModal(false);
  };

  return (
    <>
      {/* Toast Notification - always above modal, centered, with fade animation */}
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 transition-opacity duration-300 opacity-100 animate-fade-in-out pointer-events-auto" style={{ minWidth: 280 }}>
            <Baby className="w-5 h-5 text-white" />
            <span>{toastMessage || 'Heat recorded successfully'}</span>
          </div>
        </div>
      )}
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
                  <h2 className="text-2xl font-bold text-slate-900">
                    {normalizedCow.name?.trim() || `#${normalizedCow.tagNumber}`}
                  </h2>
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
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors rounded-lg text-sm font-medium"
                title="Edit animal information"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
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
        bullInventory={bullInventory}
        onClose={() => {
          console.log('🐄 AddRecordModal onClose called');
          setShowAddRecordModal(null);
          setEditingRecord(null);
          setEditingRecordType(null);
          console.log('🐄 AddRecordModal state reset');
        }}
        onSave={handleSaveRecord}
        onBreedingRecordSaved={onBreedingRecordSaved}
        onBreedingRecordDeleted={onBreedingRecordDeleted}
        onUpdateCow={onUpdateCow}
        selectedCow={normalizedCow}
        onAddBull={handleAddBull}
      />

      {/* Bull Inventory Modal */}
      {console.log('🐄 Checking showBullModal state:', showBullModal)}
      {showBullModal && (
        <>
          {console.log('🐄 Rendering BullInventoryModal, showBullModal:', showBullModal)}
          <BullInventoryModal
            isOpen={showBullModal}
            onClose={handleCloseBullModal}
            onSave={handleSaveBull}
            editingBull={editingBull}
          />
        </>
      )}

      {/* Edit Animal Modal */}
      <AddCowModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={(updatedCow) => {
          onUpdateCow(updatedCow);
          setShowEditModal(false);
        }}
        editingCow={normalizedCow}
      />
    </>
  );
};

// Add Record Modal Component
const AddRecordModal = ({ isOpen, recordType, editingRecord, bullInventory = [], onClose, onSave, onBreedingRecordSaved, onBreedingRecordDeleted, onUpdateCow = () => {}, selectedCow, onAddBull }) => {
  const [formData, setFormData] = useState({});
  const [selectedBull, setSelectedBull] = useState(null);

  const resetForm = () => {
    setFormData({});
    setSelectedBull(null);
  };

  const handleBullSelection = (bullId) => {
    const bull = bullInventory.find(b => b.naabCode === bullId);
    setSelectedBull(bull);
    
    if (bull) {
      setFormData(prev => ({
        ...prev,
        bullName: bull.name,
        semenId: bull.naabCode,
        cost: bull.cost
      }));
    }
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
      
      // For breeding records, also set the selected bull
      if (recordType === 'breeding' && editingRecord.bullName) {
        const existingBull = bullInventory.find(b => b.name === editingRecord.bullName || b.naabCode === editingRecord.semenId);
        if (existingBull) {
          setSelectedBull(existingBull);
          // Also set the bullSelection field value for the dropdown
          setFormData(prev => ({
            ...prev,
            bullSelection: existingBull.naabCode
          }));
        }
      }
    } else if (recordType === 'breeding') {
      // Set default breeding date to today if opening new breeding modal
      const today = new Date();
      const todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      setFormData(prev => ({
        ...prev,
        date: todayStr,
        expectedDueDate: calculateDueDate(todayStr)
      }));
    }
  }, [isOpen, recordType, editingRecord, bullInventory]);

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
    // Validate required fields
    const config = getModalConfig();
    const requiredFields = config.fields.filter(field => field.required);
    const missingFields = requiredFields.filter(field => {
      // For breeding records, bullSelection is handled separately
      if (recordType === 'breeding' && field.name === 'bullSelection') {
        return !selectedBull;
      }
      return !formData[field.name];
    });
    
    if (missingFields.length > 0) {
      alert(`Please fill in all required fields: ${missingFields.map(f => f.label).join(', ')}`);
      return;
    }

    if (recordType === 'breeding') {
      if (!selectedBull) {
        alert('Please select a bull from the dropdown');
        return;
      }
      
      // Check if selected bull has available straws
      if (selectedBull.straws <= 0) {
        alert(`Cannot create breeding record: ${selectedBull.name} has no straws available. Please select a different bull or add more straws to inventory.`);
        return;
      }
      
      // For breeding records, map form data to match createBreedingRecord expectations
      const breedingData = {
        ...formData,
        cowId: selectedCow.id, // Add cowId to link breeding record to specific cow
        bullName: selectedBull.name, // Use selected bull's name
        semenId: selectedBull.naabCode, // Use selected bull's NAAB code
        cost: selectedBull.cost // Use selected bull's cost
      };
      console.log('🐄 Form data:', formData);
      console.log('🐄 Selected bull:', selectedBull);
      console.log('🐄 Breeding record data:', breedingData);
      
      // Use the parent's onSave function which handles both creating and editing
      onSave(recordType, breedingData);
      onClose(); // Close the modal after saving
    } else {
      // For other record types, use the normal save flow
      onSave(recordType, formData);
      onClose(); // Close the modal after saving
    }
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
        // Filter bulls with available straws
        const availableBulls = bullInventory.filter(bull => bull.straws > 0);
        const bullOptions = availableBulls.map(bull => ({
          value: bull.naabCode,
          label: `${bull.name} (${bull.straws} straws available - $${bull.cost}/straw)`
        }));

        // If no bulls have straws available, show a warning
        if (availableBulls.length === 0) {
          return {
            title: isEditing ? 'Edit Breeding Record' : 'Add Breeding Record',
            color: 'pink',
            fields: [
              { name: 'noBullsWarning', label: 'No Bulls Available', type: 'warning', message: 'No bulls have straws available. Please add straws to bull inventory before creating breeding records.', width: 'full' }
            ]
          };
        }

        return {
          title: isEditing ? 'Edit Breeding Record' : 'Add Breeding Record',
          color: 'pink',
          fields: [
            { name: 'date', label: 'Breeding Date', type: 'date', required: true, width: 'half', autoCalculateDue: true },
            { name: 'method', label: 'Method', type: 'select', options: BREEDING_METHODS, required: true, width: 'half' },
            { name: 'bullSelection', label: 'Bull Selection', type: 'select', options: bullOptions, required: true, width: 'half', placeholder: 'Select Bull Name...', onChange: handleBullSelection },
            { name: 'semenId', label: 'NAAB Code', type: 'text', width: 'half', readOnly: true, placeholder: 'Auto-filled from bull selection' },
            { name: 'cost', label: 'Breeding Cost ($)', type: 'number', width: 'half', readOnly: true, placeholder: 'Auto-filled from bull selection' },
            { name: 'technician', label: 'Technician', type: 'text', width: 'half' },
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
          {/* Bull selection confirmation */}
          {recordType === 'breeding' && selectedBull && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-800 font-medium">✓ Bull details loaded: {selectedBull.name}</span>
            </div>
          )}
          
          {/* No bulls available message */}
          {recordType === 'breeding' && bullInventory.filter(bull => bull.straws > 0).length === 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-800">No bulls available - add bulls to inventory first</span>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {config.fields.map((field) => (
              <div key={field.name} className={field.width === 'full' ? 'col-span-2' : 'col-span-1'}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                
                {field.type === 'select' ? (
                  <>
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => {
                        handleFieldChange(field.name, e.target.value);
                        if (field.onChange) {
                          field.onChange(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={field.required}
                    >
                      <option value="">{field.placeholder || `Select ${field.label}`}</option>
                      {field.options.map(option => (
                        <option key={option.value || option} value={option.value || option}>
                          {option.label || option}
                        </option>
                      ))}
                    </select>
                    {/* Add Bull link under Bull Selection dropdown */}
                    {recordType === 'breeding' && field.name === 'bullSelection' && (
                      <button
                        type="button"
                        className="mt-1 text-xs text-blue-600 underline hover:text-blue-800 focus:outline-none"
                        style={{ display: 'block' }}
                        onClick={onAddBull}
                      >
                        Add Bull
                      </button>
                    )}
                  </>
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
                ) : field.type === 'warning' ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
                    <p>{field.message}</p>
                  </div>
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
            disabled={recordType === 'breeding' && bullInventory.filter(bull => bull.straws > 0).length === 0}
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              recordType === 'breeding' && bullInventory.filter(bull => bull.straws > 0).length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : `bg-${config.color}-600 text-white hover:bg-${config.color}-700`
            }`}
          >
            {editingRecord ? 'Update Record' : 'Save Record'}
          </button>
        </div>
      </div>

    </div>
  );
};

// Bull Inventory Modal Component (embedded from BreedingCenter.js)
function BullInventoryModal({ isOpen, onClose, onSave, editingBull }) {
  console.log('🐄 BullInventoryModal props - isOpen:', isOpen, 'editingBull:', editingBull);
  const [form, setForm] = useState({
    name: '',
    naabCode: '',
    straws: '',
    cost: '',
    tank: '',
    canister: '',
    purchaseDate: '',
    supplier: ''
  });
  const [errors, setErrors] = useState({});

  // Pre-populate form when editing
  useEffect(() => {
    if (editingBull) {
      setForm({
        name: editingBull.name || '',
        naabCode: editingBull.naabCode || '',
        straws: editingBull.straws || '',
        cost: editingBull.cost || '',
        tank: editingBull.tank || '',
        canister: editingBull.canister || '',
        purchaseDate: editingBull.purchaseDate || '',
        supplier: editingBull.supplier || ''
      });
    } else {
      setForm({
        name: '',
        naabCode: '',
        straws: '',
        cost: '',
        tank: '',
        canister: '',
        purchaseDate: '',
        supplier: ''
      });
    }
  }, [editingBull]);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.naabCode.trim() || !/^\w{3,}-?\w{2,}$/.test(form.naabCode)) errs.naabCode = 'Valid NAAB code required';
    if (!form.straws || isNaN(form.straws) || Number(form.straws) < 0) errs.straws = 'Required, must be a number';
    if (!form.cost || isNaN(form.cost) || Number(form.cost) < 0) errs.cost = 'Required, must be a number';
    return errs;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length === 0) {
      onSave({ ...form, straws: Number(form.straws), cost: Number(form.cost) });
      setForm({ name: '', naabCode: '', straws: '', cost: '', tank: '', canister: '', purchaseDate: '', supplier: '' });
    }
  };

  if (!isOpen) {
    console.log('🐄 BullInventoryModal early return - isOpen is false');
    return null;
  }
  console.log('🐄 BullInventoryModal rendering with isOpen:', isOpen);
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center" style={{ zIndex: 9999 }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8 relative">
        <button className="absolute top-4 right-4 text-slate-400 hover:text-slate-700" onClick={onClose}>&times;</button>
        <h2 className="text-2xl font-bold mb-4">{editingBull ? 'Edit Bull' : 'Add Bull to Inventory'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-medium">Bull Name *</label>
            <input name="name" value={form.name} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            {errors.name && <div className="text-red-500 text-xs">{errors.name}</div>}
          </div>
          <div>
            <label className="block font-medium">NAAB Code *</label>
            <input name="naabCode" value={form.naabCode} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            {errors.naabCode && <div className="text-red-500 text-xs">{errors.naabCode}</div>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Initial Straw Count *</label>
              <input name="straws" type="number" value={form.straws} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              {errors.straws && <div className="text-red-500 text-xs">{errors.straws}</div>}
            </div>
            <div>
              <label className="block font-medium">Cost per Straw ($) *</label>
              <input name="cost" type="number" value={form.cost} onChange={handleChange} className="w-full border rounded px-3 py-2" />
              {errors.cost && <div className="text-red-500 text-xs">{errors.cost}</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Tank Location</label>
              <input name="tank" value={form.tank} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-medium">Canister Number</label>
              <input name="canister" value={form.canister} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium">Purchase Date</label>
              <input name="purchaseDate" type="date" value={form.purchaseDate} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
            <div>
              <label className="block font-medium">Supplier/Company</label>
              <input name="supplier" value={form.supplier} onChange={handleChange} className="w-full border rounded px-3 py-2" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">
              {editingBull ? 'Update Bull' : 'Add Bull'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CowProfileModal; 