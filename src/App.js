import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  Calendar, 
  BarChart3, 
  Settings, 
  Bell, 
  User,
  Plus,
  Activity,
  AlertTriangle,
  TrendingUp,
  Heart,
  Zap,
  ChevronRight,
  Search,
  Filter,
  Download,
  Eye,
  Camera,
  Award,
  Target
} from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [notifications, setNotifications] = useState(3);

  // Enhanced sample data
  const metrics = {
    total: { value: 247, change: '+12', trend: 'up' },
    pregnant: { value: 89, change: '+5', trend: 'up' },
    breeding: { value: 23, change: '-2', trend: 'down' },
    health: { value: 96, change: '+1', trend: 'up' }
  };

  // Priority alerts with visual hierarchy
  const alerts = [
    { 
      id: 1, 
      cow: 'Luna #H-003', 
      message: 'Optimal breeding window - 12 hours remaining', 
      priority: 'critical',
      type: 'breeding',
      time: '2 hours ago'
    },
    { 
      id: 2, 
      cow: 'Bella #H-001', 
      message: 'Pregnancy check overdue', 
      priority: 'high',
      type: 'health',
      time: '1 day ago'
    },
    { 
      id: 3, 
      cow: 'Daisy #H-002', 
      message: 'Due for vaccination', 
      priority: 'medium',
      type: 'routine',
      time: '3 days ago'
    }
  ];

  // Performance metrics
  const performance = {
    conceptionRate: 85,
    avgDaysOpen: 95,
    milkProduction: 32.4,
    healthScore: 94
  };

  // Navigation items with better organization
  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, active: true },
    { id: 'herd', label: 'Herd Management', icon: Users, badge: '247' },
    { id: 'breeding', label: 'Breeding Center', icon: Heart, badge: '23' },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Premium Sidebar */}
      <div className="w-72 bg-white shadow-xl border-r border-slate-200">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Holstein Pro</h1>
              <p className="text-sm text-slate-500">Breeding Excellence</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-4 border-b border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-100">
              <div className="text-lg font-bold text-green-700">89</div>
              <div className="text-xs text-green-600">Pregnant</div>
            </div>
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-100">
              <div className="text-lg font-bold text-orange-700">23</div>
              <div className="text-xs text-orange-600">In Heat</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-700'}`} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold">JD</span>
            </div>
            <div className="flex-1">
              <div className="font-medium text-slate-900">John Dairy</div>
              <div className="text-sm text-slate-500">Farm Manager</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-600">Monitor your breeding program performance</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder="Search cows, tasks..." 
                  className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                />
              </div>
              <button className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors">
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
                    {notifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6 overflow-y-auto max-h-full">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="text-green-500 text-sm font-medium flex items-center">
                      +12 <TrendingUp className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.total.value}</div>
                  <div className="text-slate-600 text-sm">Total Herd</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Heart className="w-6 h-6 text-green-600" />
                    </div>
                    <span className="text-green-500 text-sm font-medium flex items-center">
                      +5 <TrendingUp className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.pregnant.value}</div>
                  <div className="text-slate-600 text-sm">Confirmed Pregnant</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                    <span className="text-orange-500 text-sm font-medium">URGENT</span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.breeding.value}</div>
                  <div className="text-slate-600 text-sm">Ready to Breed</div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Activity className="w-6 h-6 text-emerald-600" />
                    </div>
                    <span className="text-green-500 text-sm font-medium flex items-center">
                      +1% <TrendingUp className="w-3 h-3 ml-1" />
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{metrics.health.value}%</div>
                  <div className="text-slate-600 text-sm">Health Score</div>
                </div>
              </div>

              {/* Priority Alerts */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Priority Alerts</h2>
                    <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                      {alerts.length} Active
                    </span>
                  </div>
                </div>
                <div className="divide-y divide-slate-100">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-6 hover:bg-slate-50 transition-colors ${
                      alert.priority === 'critical' ? 'border-l-4 border-l-red-500' :
                      alert.priority === 'high' ? 'border-l-4 border-l-orange-500' :
                      'border-l-4 border-l-yellow-500'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span className="font-semibold text-slate-900">{alert.cow}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              alert.priority === 'critical' ? 'bg-red-100 text-red-700' :
                              alert.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {alert.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-slate-700 mb-1">{alert.message}</p>
                          <p className="text-sm text-slate-500">{alert.time}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                            Take Action
                          </button>
                          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Health Overview */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                <div className="p-6 border-b border-slate-100">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-900">Health Overview</h2>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                      View All Records
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-4 gap-6 mb-6">
                    {/* Active Treatments */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <Activity className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <span className="text-blue-600 text-xs font-medium">ACTIVE</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-900 mb-1">4</div>
                      <div className="text-blue-700 text-sm">Active Treatments</div>
                    </div>

                    {/* Critical Items */}
                    <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-red-600 text-xs font-medium">URGENT</span>
                      </div>
                      <div className="text-2xl font-bold text-red-900 mb-1">2</div>
                      <div className="text-red-700 text-sm">Critical Health Issues</div>
                    </div>

                    {/* Upcoming Vaccinations */}
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-green-600 text-xs font-medium">DUE</span>
                      </div>
                      <div className="text-2xl font-bold text-green-900 mb-1">7</div>
                      <div className="text-green-700 text-sm">Vaccinations Due</div>
                    </div>

                    {/* Health Score */}
                    <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 rounded-xl border border-emerald-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-emerald-600 text-xs font-medium">EXCELLENT</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-900 mb-1">94%</div>
                      <div className="text-emerald-700 text-sm">Overall Health Score</div>
                    </div>
                  </div>

                  {/* Recent Health Events */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Health Events</h3>
                    
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Luna #H-003 - Lameness Treatment</div>
                          <div className="text-sm text-slate-600">Started antibiotic course • Day 3 of 7</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">Critical</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Update</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Bella #H-001 - Annual Vaccination</div>
                          <div className="text-sm text-slate-600">Due: July 20, 2025 • IBR/BVD/PI3/BRSV</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">Scheduled</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Schedule</button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-900">Daisy #H-002 - Mastitis Treatment</div>
                          <div className="text-sm text-slate-600">Completed treatment • Milk withhold: 2 days remaining</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">Monitoring</span>
                        <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">Details</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-4">
                  <button className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center">
                    <Plus className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Add Cow</span>
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center">
                    <Heart className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Record Breeding</span>
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center">
                    <Camera className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">Take Photo</span>
                  </button>
                  <button className="bg-white/20 backdrop-blur-sm rounded-xl p-4 hover:bg-white/30 transition-colors text-center">
                    <Target className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm font-medium">AI Match</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Other Views Placeholder */}
          {currentView !== 'dashboard' && (
            <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-slate-100">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-slate-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2 capitalize">{currentView}</h2>
              <p className="text-slate-600 mb-6">This section is being developed with advanced features</p>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                Coming Soon
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
