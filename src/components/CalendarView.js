import React, { useState } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Filter
} from 'lucide-react';

const CalendarView = ({ cows }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [eventFilter, setEventFilter] = useState('all');

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

  // Get events for a specific date
  const getEventsForDate = (date) => {
    const events = [];
    const dateStr = date.toISOString().split('T')[0];
    
    cows.forEach(cow => {
      // Breeding due dates
      if (cow.breedingRecords) {
        cow.breedingRecords.forEach(breeding => {
          if (breeding.expectedDueDate) {
            const dueDate = new Date(breeding.expectedDueDate);
            if (dueDate.toISOString().split('T')[0] === dateStr) {
              events.push({
                id: `breeding-${cow.id}-${breeding.id}`,
                type: 'breeding',
                title: `${cow.name} - Due Date`,
                description: `Expected calving for ${cow.name}`,
                cow: cow,
                date: dueDate,
                priority: 'high'
              });
            }
          }
        });
      }
      
      // Health appointments
      if (cow.healthRecords) {
        cow.healthRecords.forEach(health => {
          if (health.date === dateStr) {
            events.push({
              id: `health-${cow.id}-${health.id}`,
              type: 'health',
              title: `${cow.name} - ${health.type}`,
              description: health.description,
              cow: cow,
              date: new Date(health.date),
              priority: health.type === 'Vaccination' ? 'medium' : 'low'
            });
          }
        });
      }
      
      // Calving records
      if (cow.calvingRecords) {
        cow.calvingRecords.forEach(calving => {
          if (calving.date === dateStr) {
            events.push({
              id: `calving-${cow.id}-${calving.id}`,
              type: 'calving',
              title: `${cow.name} - Calved`,
              description: `Calved ${calving.calfTag} (${calving.calfGender})`,
              cow: cow,
              date: new Date(calving.date),
              priority: 'high'
            });
          }
        });
      }
    });
    
    return events;
  };

  // Filter events based on selected filter
  const getFilteredEvents = (events) => {
    if (eventFilter === 'all') return events;
    return events.filter(event => event.type === eventFilter);
  };

  // Get event styling
  const getEventStyle = (event) => {
    const baseStyle = 'px-2 py-1 rounded text-xs font-medium mb-1 cursor-pointer hover:opacity-80 transition-opacity';
    
    switch (event.type) {
      case 'breeding':
        return `${baseStyle} bg-pink-100 text-pink-700 border border-pink-200`;
      case 'health':
        return `${baseStyle} bg-blue-100 text-blue-700 border border-blue-200`;
      case 'calving':
        return `${baseStyle} bg-green-100 text-green-700 border border-green-200`;
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
              onClick={() => setViewMode('month')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'month' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'week' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'day' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* Event Filter */}
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="breeding">Breeding</option>
            <option value="health">Health</option>
            <option value="calving">Calving</option>
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
            const isSelected = date.toDateString() === selectedDate.toDateString();
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