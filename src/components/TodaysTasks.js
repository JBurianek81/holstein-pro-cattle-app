import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Heart, 
  Activity, 
  Baby,
  Target
} from 'lucide-react';
import { calculateReproductiveStatus } from '../utils/cowDataModel';

const TodaysTasks = ({ cows }) => {
  // Get today's date
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Calculate tasks based on cow data
  const getTodaysTasks = () => {
    const tasks = [];

    cows.forEach(cow => {
      // Check for breeding due dates
      if (cow.breedingRecords) {
        cow.breedingRecords.forEach(breeding => {
          if (breeding.expectedDueDate) {
            const dueDate = new Date(breeding.expectedDueDate);
            const dueDateStr = dueDate.toISOString().split('T')[0];
            
            if (dueDateStr === todayStr) {
              tasks.push({
                id: `breeding-${cow.id}-${breeding.id}`,
                type: 'breeding',
                priority: 'critical',
                title: `${cow.name} - Due Date`,
                description: `Expected calving for ${cow.name}`,
                cow: cow,
                time: 'Today',
                icon: Baby
              });
            } else if (dueDateStr < todayStr) {
              const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
              tasks.push({
                id: `breeding-overdue-${cow.id}-${breeding.id}`,
                type: 'breeding',
                priority: 'critical',
                title: `${cow.name} - Overdue`,
                description: `${daysOverdue} days overdue for calving`,
                cow: cow,
                time: `${daysOverdue} days overdue`,
                icon: AlertTriangle
              });
            }
          }
        });
      }

      // Check for health appointments
      if (cow.healthRecords) {
        cow.healthRecords.forEach(health => {
          if (health.date === todayStr) {
            tasks.push({
              id: `health-${cow.id}-${health.id}`,
              type: 'health',
              priority: health.type === 'Vaccination' ? 'high' : 'medium',
              title: `${cow.name} - ${health.type}`,
              description: health.description,
              cow: cow,
              time: 'Today',
              icon: Activity
            });
          }
        });
      }

      // Check for cows in heat (simplified logic)
      const reproductiveStatus = calculateReproductiveStatus(cow);
      if (reproductiveStatus === 'OPEN' && cow.category === 'Heifer') {
        tasks.push({
          id: `heat-${cow.id}`,
          type: 'heat',
          priority: 'medium',
          title: `${cow.name} - Ready for Breeding`,
          description: `${cow.name} is ready for breeding`,
          cow: cow,
          time: 'Today',
          icon: Heart
        });
      }
    });

    return tasks.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const tasks = getTodaysTasks();

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'critical':
        return <AlertTriangle className="w-4 h-4" />;
      case 'high':
        return <Clock className="w-4 h-4" />;
      case 'medium':
        return <Target className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Today's Tasks</h3>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
            {tasks.length} tasks
          </span>
        </div>
      </div>
      
      <div className="p-6">
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-900 mb-2">All Caught Up!</h4>
            <p className="text-slate-600">No tasks scheduled for today.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => {
              const IconComponent = task.icon;
              return (
                <div key={task.id} className="flex items-start space-x-4 p-4 rounded-xl border hover:bg-slate-50 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${getPriorityColor(task.priority)}`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-slate-900">{task.title}</h4>
                      <div className="flex items-center space-x-2">
                        {getPriorityIcon(task.priority)}
                        <span className="text-sm text-slate-500">{task.time}</span>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{task.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-slate-500">
                      <span>{task.cow.tagNumber}</span>
                      <span>•</span>
                      <span>{task.cow.breed}</span>
                      <span>•</span>
                      <span className={`px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    View Details
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default TodaysTasks; 