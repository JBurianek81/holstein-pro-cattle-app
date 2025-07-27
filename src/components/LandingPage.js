import React from 'react';
import { 
  Home, 
  Users, 
  Plus, 
  Key,
  ArrowRight,
  Shield,
  Globe,
  Zap
} from 'lucide-react';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Holstein Pro</h1>
                <p className="text-sm text-slate-600">Cattle Management System</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Welcome to Holstein Pro
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            The complete cattle management solution for modern cattle farms. 
            Track your herd, manage breeding, monitor health, and optimize your operation.
          </p>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Herd Management</h3>
              <p className="text-slate-600">Complete animal profiles, health records, and performance tracking</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Breeding Center</h3>
              <p className="text-slate-600">Heat detection, breeding records, and pregnancy monitoring</p>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Multi-User Access</h3>
              <p className="text-slate-600">Team collaboration with secure farm codes and role management</p>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Create New Farm */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Create New Farm</h3>
                  <p className="text-blue-100">Start your cattle management journey</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Farm Registration</h4>
                    <p className="text-slate-600">Set up your farm profile with name, location, and operation details</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Unique Farm Code</h4>
                    <p className="text-slate-600">Get a secure farm code to invite team members and share access</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-blue-600 text-sm font-bold">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Owner Account</h4>
                    <p className="text-slate-600">Create your admin account with full farm management permissions</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('register')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>Create New Farm</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Join Existing Farm */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-8 text-white">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Key className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Join Farm / Login</h3>
                  <p className="text-green-100">Sign in or join your team's cattle data</p>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">A</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Existing User</h4>
                    <p className="text-slate-600">Sign in with your email and password to access your farm</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-green-600 text-sm font-bold">B</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">New Team Member</h4>
                    <p className="text-slate-600">Enter farm code and create your account to join the team</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Secure Access</h4>
                    <p className="text-slate-600">Role-based permissions ensure data security and team collaboration</p>
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => onNavigate('login')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                <span>Join Farm / Login</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t border-slate-200">
          <p className="text-slate-600">
            Secure • Reliable • Professional Cattle Management
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage; 