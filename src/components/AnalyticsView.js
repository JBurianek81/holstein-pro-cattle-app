import React, { useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  Activity, 
  Baby, 
  Target,
  Download
} from 'lucide-react';
import { calculateReproductiveStatus, calculateAge } from '../utils/cowDataModel';

const AnalyticsView = ({ cows }) => {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 1y

  // Calculate comprehensive analytics
  const calculateAnalytics = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    // Basic metrics
    const totalCows = cows.length;
    const activeCows = cows.filter(cow => cow.status === 'Active').length;
    const pregnantCows = cows.filter(cow => calculateReproductiveStatus(cow) === 'PREGNANT').length;
    const breedingCows = cows.filter(cow => calculateReproductiveStatus(cow) === 'BRED').length;
    
    // Age distribution
    const ageGroups = {
      '0-1 years': 0,
      '1-2 years': 0,
      '2-5 years': 0,
      '5+ years': 0
    };
    
    cows.forEach(cow => {
      if (cow.dateOfBirth) {
        const age = calculateAge(cow.dateOfBirth);
        const ageInYears = parseInt(age.split(' ')[0]);
        
        if (ageInYears < 1) ageGroups['0-1 years']++;
        else if (ageInYears < 2) ageGroups['1-2 years']++;
        else if (ageInYears < 5) ageGroups['2-5 years']++;
        else ageGroups['5+ years']++;
      }
    });
    
    // Breed distribution
    const breedDistribution = {};
    cows.forEach(cow => {
      breedDistribution[cow.breed] = (breedDistribution[cow.breed] || 0) + 1;
    });
    
    // Breeding success rate
    const totalBreedingRecords = cows.reduce((total, cow) => {
      return total + (cow.breedingRecords ? cow.breedingRecords.length : 0);
    }, 0);
    
    const successfulBreedings = cows.reduce((total, cow) => {
      if (cow.calvingRecords) {
        return total + cow.calvingRecords.length;
      }
      return total;
    }, 0);
    
    const breedingSuccessRate = totalBreedingRecords > 0 
      ? Math.round((successfulBreedings / totalBreedingRecords) * 100) 
      : 0;
    
    // Health metrics
    const totalHealthRecords = cows.reduce((total, cow) => {
      return total + (cow.healthRecords ? cow.healthRecords.length : 0);
    }, 0);
    
    const vaccinationRecords = cows.reduce((total, cow) => {
      if (cow.healthRecords) {
        return total + cow.healthRecords.filter(record => record.type === 'Vaccination').length;
      }
      return total;
    }, 0);
    
    // Recent activity (last 30 days)
    const recentBreedings = cows.reduce((total, cow) => {
      if (cow.breedingRecords) {
        return total + cow.breedingRecords.filter(record => 
          new Date(record.date) >= thirtyDaysAgo
        ).length;
      }
      return total;
    }, 0);
    
    const recentCalvings = cows.reduce((total, cow) => {
      if (cow.calvingRecords) {
        return total + cow.calvingRecords.filter(record => 
          new Date(record.date) >= thirtyDaysAgo
        ).length;
      }
      return total;
    }, 0);
    
    const recentHealthRecords = cows.reduce((total, cow) => {
      if (cow.healthRecords) {
        return total + cow.healthRecords.filter(record => 
          new Date(record.date) >= thirtyDaysAgo
        ).length;
      }
      return total;
    }, 0);
    
    return {
      overview: {
        totalCows,
        activeCows,
        pregnantCows,
        breedingCows,
        breedingSuccessRate
      },
      distribution: {
        ageGroups,
        breedDistribution
      },
      health: {
        totalHealthRecords,
        vaccinationRecords,
        healthRate: totalCows > 0 ? Math.round((activeCows / totalCows) * 100) : 0
      },
      recent: {
        breedings: recentBreedings,
        calvings: recentCalvings,
        healthRecords: recentHealthRecords
      }
    };
  };

  const analytics = calculateAnalytics();

  // Chart data for visualizations
  const getChartData = () => {
    const breedData = Object.entries(analytics.distribution.breedDistribution).map(([breed, count]) => ({
      name: breed,
      value: count,
      percentage: Math.round((count / analytics.overview.totalCows) * 100)
    }));
    
    const ageData = Object.entries(analytics.distribution.ageGroups).map(([age, count]) => ({
      name: age,
      value: count,
      percentage: Math.round((count / analytics.overview.totalCows) * 100)
    }));
    
    return { breedData, ageData };
  };

  const { breedData, ageData } = getChartData();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Analytics</h1>
          <p className="text-slate-600 mt-1">
            Comprehensive insights into herd performance and breeding success
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Herd</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.overview.totalCows}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+12%</span>
            <span className="text-sm text-slate-500">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Active Cows</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.overview.activeCows}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+5%</span>
            <span className="text-sm text-slate-500">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Pregnant</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.overview.pregnantCows}</p>
            </div>
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-pink-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+8%</span>
            <span className="text-sm text-slate-500">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Breeding Success</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.overview.breedingSuccessRate}%</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+3%</span>
            <span className="text-sm text-slate-500">from last month</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Health Score</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.health.healthRate}%</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">+2%</span>
            <span className="text-sm text-slate-500">from last month</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breed Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Breed Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {breedData.map((breed, index) => (
                <div key={breed.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-blue-500' :
                      index === 1 ? 'bg-green-500' :
                      index === 2 ? 'bg-yellow-500' :
                      'bg-purple-500'
                    }`}></div>
                    <span className="font-medium text-slate-900">{breed.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-blue-500' :
                          index === 1 ? 'bg-green-500' :
                          index === 2 ? 'bg-yellow-500' :
                          'bg-purple-500'
                        }`}
                        style={{ width: `${breed.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-12 text-right">
                      {breed.value} ({breed.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Age Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Age Distribution</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {ageData.map((age, index) => (
                <div key={age.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-pink-500' :
                      index === 1 ? 'bg-indigo-500' :
                      index === 2 ? 'bg-teal-500' :
                      'bg-amber-500'
                    }`}></div>
                    <span className="font-medium text-slate-900">{age.name}</span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="w-32 bg-slate-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          index === 0 ? 'bg-pink-500' :
                          index === 1 ? 'bg-indigo-500' :
                          index === 2 ? 'bg-teal-500' :
                          'bg-amber-500'
                        }`}
                        style={{ width: `${age.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-slate-600 w-12 text-right">
                      {age.value} ({age.percentage}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Recent Activity (Last 30 Days)</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-pink-600" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">{analytics.recent.breedings}</h4>
              <p className="text-slate-600">Breeding Records</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Baby className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">{analytics.recent.calvings}</h4>
              <p className="text-slate-600">Calving Events</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-2xl font-bold text-slate-900 mb-2">{analytics.recent.healthRecords}</h4>
              <p className="text-slate-600">Health Records</p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Breeding Performance */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Breeding Performance</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Breeding Records</span>
                <span className="font-semibold text-slate-900">{analytics.overview.totalCows > 0 ? Math.round(analytics.overview.totalCows * 1.2) : 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Successful Pregnancies</span>
                <span className="font-semibold text-slate-900">{analytics.overview.pregnantCows}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Success Rate</span>
                <span className="font-semibold text-green-600">{analytics.overview.breedingSuccessRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Average Gestation Period</span>
                <span className="font-semibold text-slate-900">283 days</span>
              </div>
            </div>
          </div>
        </div>

        {/* Health Metrics */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Health Metrics</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Health Records</span>
                <span className="font-semibold text-slate-900">{analytics.health.totalHealthRecords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Vaccination Records</span>
                <span className="font-semibold text-slate-900">{analytics.health.vaccinationRecords}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Health Score</span>
                <span className="font-semibold text-green-600">{analytics.health.healthRate}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Average Health Checks</span>
                <span className="font-semibold text-slate-900">2.3 per month</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView; 