import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter
} from 'lucide-react';
import { calculateReproductiveStatus } from '../utils/cowDataModel';

const CalendarView = ({ cows }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');

  // Helper function to display cow name gracefully
  const getDisplayName = (cow) => {
    return cow.name?.trim() || `#${cow.tagNumber}`;
  };

  // Generate calendar data
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

  // Get all events for a specific date
  const getEventsForDate = (date) => {
    const events = [];
    const dateStr = date.toISOString().split('T')[0];
    
    cows.forEach(cow => {
      // Heat detection events
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => 
          record.type === 'Heat Detection' && record.date === dateStr
        );
        
        if (heatRecords.length > 0) {
          events.push({
            id: `heat-${cow.id}-${heatRecords[0].id}`,
            type: 'heat',
            title: `${getDisplayName(cow)} - Heat Detection`,
            description: 'Confirmed heat detection',
            cow: cow,
            date: new Date(heatRecords[0].date),
            priority: 'high'
          });
        }
      }

      // Predicted heat dates
      if (cow.healthRecords) {
        const heatRecords = cow.healthRecords.filter(record => record.type === 'Heat Detection');
        if (heatRecords.length > 0) {
          const lastHeat = new Date(heatRecords[heatRecords.length - 1].date);
          const predictedHeat = new Date(lastHeat);
          predictedHeat.setDate(predictedHeat.getDate() + 21);
          
          if (predictedHeat.toISOString().split('T')[0] === dateStr) {
            events.push({
              id: `predicted-heat-${cow.id}`,
              type: 'predicted_heat',
              title: `${getDisplayName(cow)} - Predicted Heat`,
              description: 'Predicted heat date (21-day cycle)',
              cow: cow,
              date: predictedHeat,
              priority: 'medium'
            });
          }
        }
      }

      // Breeding records
      if (cow.breedingRecords && Array.isArray(cow.breedingRecords) && cow.breedingRecords.length > 0) {
        const breedingRecords = cow.breedingRecords.filter(record => 
          record && record.date && record.date === dateStr
        );
        
        if (breedingRecords.length > 0) {
          events.push({
            id: `breeding-${cow.id}-${breedingRecords[0].id}`,
            type: 'breeding',
                          title: `${getDisplayName(cow)} - Breeding`,
            description: `Bred with ${breedingRecords[0].bullName || 'Unknown Bull'}`,
            cow: cow,
            date: new Date(breedingRecords[0].date),
            priority: 'high'
          });
        }
      }

      // Due dates (only for PREGNANT animals)
      if (cow.breedingRecords && Array.isArray(cow.breedingRecords) && cow.breedingRecords.length > 0) {
        const reproductiveStatus = calculateReproductiveStatus(cow);
        if (reproductiveStatus === 'PREGNANT') {
          const mostRecentBreeding = cow.breedingRecords[cow.breedingRecords.length - 1];
          if (mostRecentBreeding && mostRecentBreeding.expectedDueDate && mostRecentBreeding.expectedDueDate === dateStr) {
            events.push({
              id: `due-date-${cow.id}-${mostRecentBreeding.id}`,
              type: 'due_date',
              title: `${getDisplayName(cow)} - Due Date`,
              description: 'Expected calving date',
              cow: cow,
              date: new Date(mostRecentBreeding.expectedDueDate),
              priority: 'high'
            });
          }
        }
      }
      
      // Calving records
      if (cow.calvingRecords && Array.isArray(cow.calvingRecords) && cow.calvingRecords.length > 0) {
        const calvingRecords = cow.calvingRecords.filter(record => 
          record && record.date && record.date === dateStr
        );
        
        if (calvingRecords.length > 0) {
          events.push({
            id: `calving-${cow.id}-${calvingRecords[0].id}`,
            type: 'calving',
                          title: `${getDisplayName(cow)} - Calved`,
            description: `Calved ${calvingRecords[0].calfTag || 'Unknown'} (${calvingRecords[0].calfGender || 'Unknown'})`,
            cow: cow,
            date: new Date(calvingRecords[0].date),
            priority: 'high'
          });
        }
      }

      // Other health records
      if (cow.healthRecords) {
        const otherHealthRecords = cow.healthRecords.filter(record => 
          record.type !== 'Heat Detection' && record.date === dateStr
        );
        
        otherHealthRecords.forEach(health => {
          events.push({
            id: `health-${cow.id}-${health.id}`,
            type: 'health',
            title: `${getDisplayName(cow)} - ${health.type}`,
            description: health.description || health.type,
            cow: cow,
            date: new Date(health.date),
            priority: health.type === 'Vaccination' ? 'medium' : 'low'
          });
        });
      }
    });
    
    return events;
  };

  // Filter events based on selected filter
  const getFilteredEvents = (events) => {
    if (activeFilter === 'all') return events;
    return events.filter(event => event.type === activeFilter);
  };

  // Get event styling
  const getEventStyle = (event) => {
    const baseStyle = 'px-2 py-1 rounded text-xs font-medium mb-1 cursor-pointer hover:opacity-80 transition-opacity';
    
    switch (event.type) {
      case 'heat':
        return `${baseStyle} bg-red-100 text-red-700 border border-red-200`;
      case 'predicted_heat':
        return `${baseStyle} bg-orange-100 text-orange-700 border border-orange-200`;
      case 'breeding':
        return `${baseStyle} bg-blue-100 text-blue-700 border border-blue-200`;
      case 'due_date':
        return `${baseStyle} bg-purple-100 text-purple-700 border border-purple-200`;
      case 'calving':
        return `${baseStyle} bg-green-100 text-green-700 border border-green-200`;
      case 'health':
        return `${baseStyle} bg-indigo-100 text-indigo-700 border border-indigo-200`;
      default:
        return `${baseStyle} bg-gray-100 text-gray-700 border border-gray-200`;
    }
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

  // Calendar data
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
          <h1 className="text-3xl font-bold text-slate-900">Calendar</h1>
          <p className="text-slate-600 mt-1">
            Track breeding schedules, health appointments, and important events
          </p>
        </div>
        <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-2 shadow-lg hover:shadow-xl">
          <Plus className="w-5 h-5" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-6">
          {/* Navigation */}
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

          {/* View Mode */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setActiveFilter('heat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'heat' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Heat Detection
            </button>
            <button
              onClick={() => setActiveFilter('predicted_heat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'predicted_heat' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Predicted Heat
            </button>
            <button
              onClick={() => setActiveFilter('breeding')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'breeding' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Breeding
            </button>
            <button
              onClick={() => setActiveFilter('due_date')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'due_date' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Due Dates
            </button>
            <button
              onClick={() => setActiveFilter('calving')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'calving' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Calving
            </button>
            <button
              onClick={() => setActiveFilter('health')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === 'health' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Health
            </button>
          </div>
        </div>

        {/* Event Filter */}
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="heat">Heat Detection</option>
            <option value="predicted_heat">Predicted Heat</option>
            <option value="breeding">Breeding</option>
            <option value="due_date">Due Dates</option>
            <option value="calving">Calving</option>
            <option value="health">Health</option>
          </select>
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
            const isSelected = date.toDateString() === selectedDate?.toDateString();
            const events = getFilteredEvents(getEventsForDate(date));
            
            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`min-h-32 border-r border-b border-slate-200 p-2 cursor-pointer transition-colors ${
                  !isCurrentMonth ? 'bg-slate-50' : 'bg-white'
                } ${
                  isToday ? 'bg-blue-50' : ''
                } ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
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
                  {events.length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {events.length}
                    </span>
                  )}
                </div>
                
                {/* Events */}
                <div className="space-y-1">
                  {events.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={getEventStyle(event)}
                      title={event.description}
                    >
                      {event.title}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-xs text-slate-500">
                      +{events.length - 3} more
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
              Events for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </h3>
          </div>
          <div className="p-6">
            {(() => {
              const events = getFilteredEvents(getEventsForDate(selectedDate));
              
              if (events.length === 0) {
                return (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No events scheduled for this date.</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-4">
                  {events.map(event => (
                    <div key={event.id} className="flex items-start space-x-4 p-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className={`w-3 h-3 rounded-full mt-2 ${
                        event.priority === 'high' ? 'bg-red-500' :
                        event.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-slate-900">{event.title}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            event.type === 'breeding' ? 'bg-pink-100 text-pink-700' :
                            event.type === 'health' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{event.description}</p>
                        <p className="text-xs text-slate-500 mt-2">
                          {event.cow.tagNumber} • {event.cow.breed}
                        </p>
                      </div>
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details
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
  );
};

export default CalendarView; 