import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Calendar, 
  Users, 
  TrendingUp, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Thermometer,
  Baby,
  Activity,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { calculateReproductiveStatus, createHealthRecord } from '../utils/cowDataModel';

const BreedingCenter = ({ cows, onViewProfile, onUpdateCow }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Get today's date string
  const today = new Date().toISOString().split('T')[0];

  // Filter cows based on search and breeding status
  const filteredCows = cows.filter(cow => {
    const matchesSearch = cow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cow.tagNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const reproductiveStatus = calculateReproductiveStatus(cow);
    const matchesStatus = statusFilter === 'all' || reproductiveStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Group cows by breeding status
  const cowsByStatus = {
    'OPEN': filteredCows.filter(cow => calculateReproductiveStatus(cow) === 'OPEN'),
    'BRED': filteredCows.filter(cow => calculateReproductiveStatus(cow) === 'BRED'),
    'PREGNANT': filteredCows.filter(cow => calculateReproductiveStatus(cow) === 'PREGNANT')
  };

  // Get cows in heat today
  const getCowsInHeatToday = () => {
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      return cow.healthRecords.some(record => 
        record.type === 'Heat Detection' && record.date === today
      );
    });
  };

  // Get cows with predicted heat today
  const getCowsWithPredictedHeatToday = () => {
    return cows.filter(cow => {
      if (!cow.healthRecords) return false;
      
      // Find the most recent heat detection
      const heatRecords = cow.healthRecords.filter(record => record.type === 'Heat Detection');
      if (heatRecords.length === 0) return false;
      
      const lastHeat = new Date(heatRecords[heatRecords.length - 1].date);
      const predictedHeat = new Date(lastHeat);
      predictedHeat.setDate(predictedHeat.getDate() + 21); // 21-day cycle
      
      return predictedHeat.toISOString().split('T')[0] === today;
    });
  };

  // Get pregnancy checks due today
  const getPregnancyChecksDueToday = () => {
    return cows.filter(cow => {
      if (!cow.breedingRecords) return false;
      
      const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
      if (!lastBreeding) return false;
      
      const breedingDate = new Date(lastBreeding.date);
      const checkDate = new Date(breedingDate);
      checkDate.setDate(checkDate.getDate() + 30); // 30 days after breeding
      
      return checkDate.toISOString().split('T')[0] === today;
    });
  };

  // Calculate breeding metrics
  const breedingMetrics = {
    total: cows.length,
    open: cowsByStatus.OPEN.length,
    bred: cowsByStatus.BRED.length,
    pregnant: cowsByStatus.PREGNANT.length,
    successRate: cows.length > 0 ? Math.round((cowsByStatus.PREGNANT.length / cows.length) * 100) : 0,
    inHeatToday: getCowsInHeatToday().length,
    predictedHeatToday: getCowsWithPredictedHeatToday().length,
    pregnancyChecksDue: getPregnancyChecksDueToday().length
  };



  // Record heat detection for a cow
  const recordHeatDetection = (cow) => {
    const heatRecord = createHealthRecord({
      type: 'Heat Detection',
      description: 'Heat detected - ready for breeding',
      date: today
    });

    const updatedCow = {
      ...cow,
      healthRecords: [...(cow.healthRecords || []), heatRecord],
      isInHeat: true
    };

    if (onUpdateCow) {
      onUpdateCow(updatedCow);
    }
  };

  // Get time until due date
  const getTimeUntilDue = (cow) => {
    if (!cow.breedingRecords || cow.breedingRecords.length === 0) return null;
    
    const lastBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
    if (!lastBreeding.expectedDueDate) return null;
    
    const dueDate = new Date(lastBreeding.expectedDueDate);
    const now = new Date();
    const diffTime = dueDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `${diffDays} days until due`;
  };

  // Generate calendar data for heat detection
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const calendar = [];
    const current = new Date(startDate);
    
    while (current <= lastDay || calendar.length < 42) {
      calendar.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return calendar;
  };

  // Get heat events for a specific date
  const getHeatEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    const events = [];

    cows.forEach(cow => {
      // Check for confirmed heat detections
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => 
          record.type === 'Heat Detection' && record.date === dateStr
        );
        
        if (heatRecords.length > 0) {
          events.push({
            type: 'confirmed',
            cow: cow,
            record: heatRecords[0]
          });
        }
      }

      // Check for predicted heat dates
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => record.type === 'Heat Detection');
        if (heatRecords.length > 0) {
          const lastHeat = new Date(heatRecords[heatRecords.length - 1].date);
          const predictedHeat = new Date(lastHeat);
          predictedHeat.setDate(predictedHeat.getDate() + 21);
          
          if (predictedHeat.toISOString().split('T')[0] === dateStr) {
            events.push({
              type: 'predicted',
              cow: cow,
              predictedDate: predictedHeat
            });
          }
        }
      }
    });

    return events;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const calendarData = getCalendarData();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Breeding Center</h1>
          <p className="text-slate-600 mt-1">
            Manage breeding programs and track reproductive status
          </p>
        </div>
        <button className="bg-gradient-to-r from-pink-600 to-red-600 text-white px-6 py-3 rounded-xl hover:from-pink-700 hover:to-red-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl">
          <Plus className="w-5 h-5" />
          <span>Record Breeding</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'overview'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'calendar'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Heat Calendar</span>
          </button>
          <button
            onClick={() => setActiveTab('bulls')}
            className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'bulls'
                ? 'border-pink-600 text-pink-600 bg-pink-50'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Bull Management</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Total Herd</p>
                      <p className="text-3xl font-bold text-slate-900">{breedingMetrics.total}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">In Heat Today</p>
                      <p className="text-3xl font-bold text-red-600">{breedingMetrics.inHeatToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <Thermometer className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Predicted Heat</p>
                      <p className="text-3xl font-bold text-orange-600">{breedingMetrics.predictedHeatToday}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Pregnancy Checks</p>
                      <p className="text-3xl font-bold text-purple-600">{breedingMetrics.pregnancyChecksDue}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Baby className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's Breeding Priorities */}
              <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-6 border border-pink-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Today's Breeding Priorities</h3>
                
                {/* Cows in Heat Today */}
                {breedingMetrics.inHeatToday > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-red-700 mb-3 flex items-center space-x-2">
                      <Thermometer className="w-4 h-4" />
                      <span>Cows in Heat Today ({breedingMetrics.inHeatToday})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getCowsInHeatToday().map(cow => (
                        <div key={cow.id} className="bg-white rounded-lg p-3 border border-red-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{cow.name}</p>
                              <p className="text-sm text-slate-600">{cow.tagNumber}</p>
                            </div>
                            <button
                              onClick={() => onViewProfile(cow)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predicted Heat Today */}
                {breedingMetrics.predictedHeatToday > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-orange-700 mb-3 flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Predicted Heat Today ({breedingMetrics.predictedHeatToday})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getCowsWithPredictedHeatToday().map(cow => (
                        <div key={cow.id} className="bg-white rounded-lg p-3 border border-orange-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{cow.name}</p>
                              <p className="text-sm text-slate-600">{cow.tagNumber}</p>
                            </div>
                            <button
                              onClick={() => recordHeatDetection(cow)}
                              className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700 transition-colors"
                            >
                              Record Heat
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pregnancy Checks Due */}
                {breedingMetrics.pregnancyChecksDue > 0 && (
                  <div>
                    <h4 className="font-medium text-purple-700 mb-3 flex items-center space-x-2">
                      <Baby className="w-4 h-4" />
                      <span>Pregnancy Checks Due ({breedingMetrics.pregnancyChecksDue})</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {getPregnancyChecksDueToday().map(cow => (
                        <div key={cow.id} className="bg-white rounded-lg p-3 border border-purple-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-slate-900">{cow.name}</p>
                              <p className="text-sm text-slate-600">{cow.tagNumber}</p>
                            </div>
                            <button
                              onClick={() => onViewProfile(cow)}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {breedingMetrics.inHeatToday === 0 && breedingMetrics.predictedHeatToday === 0 && breedingMetrics.pregnancyChecksDue === 0 && (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-slate-600">No breeding priorities for today!</p>
                  </div>
                )}
              </div>

              {/* Success Rate Metrics */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Breeding Success Metrics</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{breedingMetrics.open}</p>
                    <p className="text-sm text-slate-600">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-yellow-600">{breedingMetrics.bred}</p>
                    <p className="text-sm text-slate-600">Bred</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">{breedingMetrics.pregnant}</p>
                    <p className="text-sm text-slate-600">Pregnant</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-purple-600">{breedingMetrics.successRate}%</p>
                    <p className="text-sm text-slate-600">Success Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Heat Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Calendar Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={goToPreviousMonth}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-semibold text-slate-900">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h2>
                  <button
                    onClick={goToNextMonth}
                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={goToToday}
                    className="ml-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-4 text-center">
                      <span className="text-sm font-medium text-slate-600">{day}</span>
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7">
                  {calendarData.map((date, index) => {
                    const isCurrentMonth = date.getMonth() === currentDate.getMonth();
                    const isToday = date.toDateString() === new Date().toDateString();
                    const isSelected = date.toDateString() === selectedDate.toDateString();
                    const heatEvents = getHeatEventsForDate(date);
                    
                    return (
                      <div
                        key={index}
                        onClick={() => setSelectedDate(date)}
                        className={`min-h-32 border-r border-b border-slate-200 p-2 cursor-pointer transition-colors ${
                          !isCurrentMonth ? 'bg-slate-50' : 'bg-white'
                        } ${
                          isToday ? 'bg-blue-50' : ''
                        } ${
                          isSelected ? 'ring-2 ring-pink-500' : ''
                        } hover:bg-slate-50`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            !isCurrentMonth ? 'text-slate-400' : 'text-slate-900'
                          } ${
                            isToday ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''
                          }`}>
                            {date.getDate()}
                          </span>
                          {heatEvents.length > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              {heatEvents.length}
                            </span>
                          )}
                        </div>
                        
                        {/* Heat Events */}
                        <div className="space-y-1">
                          {heatEvents.slice(0, 3).map((event, eventIndex) => (
                            <div
                              key={eventIndex}
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                event.type === 'confirmed' 
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-orange-100 text-orange-700 border border-orange-200'
                              }`}
                              title={`${event.cow.name} - ${event.type === 'confirmed' ? 'Confirmed Heat' : 'Predicted Heat'}`}
                            >
                              {event.cow.name}
                            </div>
                          ))}
                          {heatEvents.length > 3 && (
                            <div className="text-xs text-slate-500">
                              +{heatEvents.length - 3} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Date Events */}
              {selectedDate && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
                  <div className="p-6 border-b border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-900">
                      Heat Events for {selectedDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </h3>
                  </div>
                  <div className="p-6">
                    {(() => {
                      const events = getHeatEventsForDate(selectedDate);
                      
                      if (events.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                            <p className="text-slate-600">No heat events for this date.</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-4">
                          {events.map((event, index) => (
                            <div key={index} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                              <div className={`w-3 h-3 rounded-full mt-2 ${
                                event.type === 'confirmed' ? 'bg-red-500' : 'bg-orange-500'
                              }`}></div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-slate-900">{event.cow.name}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    event.type === 'confirmed' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                  }`}>
                                    {event.type === 'confirmed' ? 'Confirmed Heat' : 'Predicted Heat'}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 mt-1">{event.cow.tagNumber} • {event.cow.breed}</p>
                              </div>
                              <button
                                onClick={() => onViewProfile(event.cow)}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                              >
                                View Profile
                              </button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bull Management Tab */}
          {activeTab === 'bulls' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Bull Catalog</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  Add Bull
                </button>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">GPTA Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Traits</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Available Straws</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">Champion's Pride</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">BULL-001</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">+2.8</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              High Milk
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Good Feet
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">150</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">View Details</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">Golden Genes</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-500">BULL-002</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">+3.2</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              High Protein
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Longevity
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-slate-900">75</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">View Details</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BreedingCenter; 