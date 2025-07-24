import React from 'react';
import { Users, Search, Plus, Edit3, Trash2, MoreVertical, Tag, Calendar } from 'lucide-react';
import { calculateReproductiveStatus, getReproductiveStatusBadge, getProductionStatusBadge } from '../utils/cowDataModel';

const HerdManagement = ({ cows, onAddCow, onEditCow, onDeleteCow, onViewProfile }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeFilter, setActiveFilter] = React.useState('all');

  // Filter cows based on search and active filter
  const filteredCows = cows.filter(cow => {
    const matchesSearch = cow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cow.breed.toLowerCase().includes(searchTerm.toLowerCase());
    
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
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Cow Details</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Breed & Category</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Age</th>
                  <th className="text-left py-4 px-6 font-semibold text-slate-900">Notes</th>
                  <th className="text-right py-4 px-6 font-semibold text-slate-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCows.map((cow) => (
                  <tr key={cow.id} className="hover:bg-slate-50 transition-colors">
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
                            {cow.name}
                          </button>
                          <div className="text-sm text-slate-500">#{cow.tagNumber}</div>
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
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusBadge(cow.status)}`}>
                        {cow.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm text-slate-600 max-w-32 truncate">
                        {cow.notes || 'No notes'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-end space-x-2">
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


    </div>
  );
};

export default HerdManagement; 