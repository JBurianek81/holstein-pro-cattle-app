import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  Heart, 
  Activity, 
  Baby, 
  Target,
  Download,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Lightbulb,
  Zap,
  Award,
  Clock,
  Filter
} from 'lucide-react';
import { calculateReproductiveStatus, calculateAge, calculateHealthScore, calculateHerdHealthScore } from '../utils/cowDataModel';

const AnalyticsView = ({ cows, bullInventory = [] }) => {
  const [timeRange, setTimeRange] = useState('90d'); // 30d, 90d, 6m, 1y
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [expandedRecommendations, setExpandedRecommendations] = useState(new Set());

  // Calculate comprehensive business intelligence analytics
  const analytics = useMemo(() => {
    const now = new Date();
    const getDateRange = () => {
      switch (timeRange) {
        case '30d': return new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        case '90d': return new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        case '6m': return new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
        case '1y': return new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        default: return new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
      }
    };

    const startDate = getDateRange();
    
    // Filter cows for time range
    const relevantCows = cows.filter(cow => {
      const hasRecentActivity = cow.breedingRecords?.some(record => new Date(record.date) >= startDate) ||
                               cow.healthRecords?.some(record => new Date(record.date) >= startDate) ||
                               cow.calvingRecords?.some(record => new Date(record.date) >= startDate);
      return hasRecentActivity || cow.status === 'Active';
    });

    // Breeding Performance Analysis
    const breedingRecords = relevantCows.flatMap(cow => 
      (cow.breedingRecords || []).filter(record => new Date(record.date) >= startDate)
    );

    // Count confirmed pregnancies for success rate calculation
    const confirmedPregnancies = relevantCows.flatMap(cow => 
      (cow.healthRecords || []).filter(healthRecord => {
        if (healthRecord.type !== 'Pregnancy Check') return false;
        
        const checkDate = new Date(healthRecord.date);
        const description = (healthRecord.description || '').toLowerCase();
        
        const isInPeriod = checkDate >= startDate;
        const isPositive = description.includes('positive') || 
                          description.includes('confirmed positive') ||
                          description.includes('pregnant') ||
                          description.includes('pregnancy confirmed');
        
        return isInPeriod && isPositive;
      })
    );

    const breedingSuccessRate = breedingRecords.length > 0 
      ? Math.round((confirmedPregnancies.length / breedingRecords.length) * 100) 
      : 0;

    // Bull Usage Analysis - Simple tracking without success rate complexity
    const bullPerformance = {};
    breedingRecords.forEach((record) => {
      const bullId = record.semenId || record.bullName;
      
      if (bullId) {
        if (!bullPerformance[bullId]) {
          bullPerformance[bullId] = { 
            total: 0, 
            cost: 0, 
            displayName: record.bullName || bullId 
          };
        }
        bullPerformance[bullId].total++;
        
        // Add cost from inventory
        const bull = bullInventory.find(b => b.naabCode === bullId || b.name === record.bullName);
        if (bull) {
          bullPerformance[bullId].cost += bull.cost;
        }
      }
    });

    console.log('🐂 Bull Usage Summary:', Object.entries(bullPerformance).map(([id, data]) => ({
      id,
      name: data.displayName,
      breedings: data.total,
      totalCost: data.cost
    })));

    // Seasonal Analysis
    const seasonalData = {
      spring: { breedings: 0, success: 0 },
      summer: { breedings: 0, success: 0 },
      fall: { breedings: 0, success: 0 },
      winter: { breedings: 0, success: 0 }
    };

    breedingRecords.forEach(record => {
      const month = new Date(record.date).getMonth();
      let season;
      if (month >= 2 && month <= 4) season = 'spring';
      else if (month >= 5 && month <= 7) season = 'summer';
      else if (month >= 8 && month <= 10) season = 'fall';
      else season = 'winter';

      seasonalData[season].breedings++;
      
      // Check if this breeding resulted in a positive pregnancy check (same logic as bull performance)
      const hasPositivePregnancyCheck = (cows.find(cow => cow.id === record.cowId)?.healthRecords || []).some(healthRecord => {
        if (healthRecord.type !== 'Pregnancy Check') return false;
        
        const checkDate = new Date(healthRecord.date);
        const breedingDate = new Date(record.date);
        const description = (healthRecord.description || '').toLowerCase();
        
        // Must be after this breeding AND contain positive confirmation
        const isAfterBreeding = checkDate > breedingDate;
        const isPositive = description.includes('positive') || 
                          description.includes('confirmed positive') ||
                          description.includes('pregnant') ||
                          description.includes('pregnancy confirmed');
        
        return isAfterBreeding && isPositive;
      });
      
      if (hasPositivePregnancyCheck) {
        seasonalData[season].success++;
      }
    });

    // Age Group Performance
    const ageGroupPerformance = {
      'Heifers (15-24 months)': { count: 0, successRate: 0, breedings: 0, successful: 0 },
      'Young Cows (2-4 years)': { count: 0, successRate: 0, breedings: 0, successful: 0 },
      'Mature Cows (4-7 years)': { count: 0, successRate: 0, breedings: 0, successful: 0 },
      'Senior Cows (7+ years)': { count: 0, successRate: 0, breedings: 0, successful: 0 }
    };

    // Age Group Performance - Use confirmed pregnancies instead of calving records
    relevantCows.forEach(cow => {
      if (cow.dateOfBirth) {
        const age = calculateAge(cow.dateOfBirth);
        const ageInYears = parseInt(age.split(' ')[0]);
        let ageGroup;
        
        if (ageInYears < 2) ageGroup = 'Heifers (15-24 months)';
        else if (ageInYears < 4) ageGroup = 'Young Cows (2-4 years)';
        else if (ageInYears < 7) ageGroup = 'Mature Cows (4-7 years)';
        else ageGroup = 'Senior Cows (7+ years)';

        ageGroupPerformance[ageGroup].count++;
        
        const cowBreedings = (cow.breedingRecords || []).filter(record => new Date(record.date) >= startDate);
        ageGroupPerformance[ageGroup].breedings += cowBreedings.length;
        
        // Count confirmed pregnancies instead of calving records
        const confirmedPregnancies = cowBreedings.filter(breedingRecord => {
          return (cow.healthRecords || []).some(healthRecord => {
            if (healthRecord.type !== 'Pregnancy Check') return false;
            
            const checkDate = new Date(healthRecord.date);
            const breedingDate = new Date(breedingRecord.date);
            const description = (healthRecord.description || '').toLowerCase();
            
            // Must be after this breeding AND contain positive confirmation
            const isAfterBreeding = checkDate > breedingDate;
            const isPositive = description.includes('positive') || 
                              description.includes('confirmed positive') ||
                              description.includes('pregnant') ||
                              description.includes('pregnancy confirmed');
            
            return isAfterBreeding && isPositive;
          });
        });
        
        ageGroupPerformance[ageGroup].successful += confirmedPregnancies.length;
        
        console.log(`🔍 AGE GROUP: ${cow.name} (${ageGroup}): ${cowBreedings.length} breedings, ${confirmedPregnancies.length} confirmed pregnancies`);
      }
    });

    // Calculate success rates for age groups
    Object.keys(ageGroupPerformance).forEach(group => {
      const data = ageGroupPerformance[group];
      data.successRate = data.breedings > 0 ? Math.round((data.successful / data.breedings) * 100) : 0;
    });

    // Health Analysis
    const healthRecords = relevantCows.flatMap(cow => 
      (cow.healthRecords || []).filter(record => new Date(record.date) >= startDate)
    );

    const healthIncidents = healthRecords.filter(record => 
      ['Mastitis', 'D.A.', 'Cystic', 'Surgery', 'Injury', 'Illness'].includes(record.type)
    );

    const healthIncidentRate = relevantCows.length > 0 
      ? Math.round((healthIncidents.length / relevantCows.length) * 100) 
      : 0;

    // Financial Analysis
    const totalBreedingCost = breedingRecords.reduce((total, record) => {
      const bull = bullInventory.find(b => b.naabCode === record.semenId);
      return total + (bull?.cost || 0);
    }, 0);

    // Use the global confirmedPregnancies for cost calculation
    const costPerPregnancy = confirmedPregnancies.length > 0 
      ? Math.round(totalBreedingCost / confirmedPregnancies.length) 
      : 0;

    // Trend Analysis (compare with previous period)
    const previousStartDate = new Date(startDate.getTime() - (startDate.getTime() - now.getTime()));
    const previousBreedingRecords = relevantCows.flatMap(cow => 
      (cow.breedingRecords || []).filter(record => {
        const recordDate = new Date(record.date);
        return recordDate >= previousStartDate && recordDate < startDate;
      })
    );

    // Count previous confirmed pregnancies instead of calvings
    const previousConfirmedPregnancies = relevantCows.flatMap(cow => 
      (cow.healthRecords || []).filter(healthRecord => {
        if (healthRecord.type !== 'Pregnancy Check') return false;
        
        const checkDate = new Date(healthRecord.date);
        const description = (healthRecord.description || '').toLowerCase();
        
        const isInPreviousPeriod = checkDate >= previousStartDate && checkDate < startDate;
        const isPositive = description.includes('positive') || 
                          description.includes('confirmed positive') ||
                          description.includes('pregnant') ||
                          description.includes('pregnancy confirmed');
        
        return isInPreviousPeriod && isPositive;
      })
    );

    const previousSuccessRate = previousBreedingRecords.length > 0 
      ? Math.round((previousConfirmedPregnancies.length / previousBreedingRecords.length) * 100) 
      : 0;

    const successRateChange = previousSuccessRate > 0 
      ? Math.round(((breedingSuccessRate - previousSuccessRate) / previousSuccessRate) * 100) 
      : 0;

    return {
      overview: {
        totalCows: relevantCows.length,
        breedingSuccessRate,
        successRateChange,
        healthIncidentRate,
        costPerPregnancy
      },
      breeding: {
        totalBreedings: breedingRecords.length,
        totalConfirmedPregnancies: confirmedPregnancies.length,
        bullPerformance,
        seasonalData
      },
      ageGroups: ageGroupPerformance,
      health: {
        totalIncidents: healthIncidents.length,
        incidentsByType: healthIncidents.reduce((acc, record) => {
          acc[record.type] = (acc[record.type] || 0) + 1;
          return acc;
        }, {})
      },
      financial: {
        totalBreedingCost,
        costPerPregnancy,
        potentialSavings: 0 // Will be calculated in insights
      }
    };
  }, [cows, bullInventory, timeRange]);

  // Generate Automated Insights
  const generateInsights = () => {
    const insights = [];

    // Breeding Success Rate Insights
    if (analytics.overview.successRateChange > 0) {
      insights.push({
        id: 'breeding-improvement',
        type: 'positive',
        title: 'Breeding Success Rate Improved',
        message: `Your breeding success rate improved ${Math.abs(analytics.overview.successRateChange)}% this period`,
        icon: TrendingUp,
        priority: 'high',
        category: 'performance'
      });
    } else if (analytics.overview.successRateChange < 0) {
      insights.push({
        id: 'breeding-decline',
        type: 'warning',
        title: 'Breeding Success Rate Declined',
        message: `Your breeding success rate decreased ${Math.abs(analytics.overview.successRateChange)}% this period`,
        icon: TrendingDown,
        priority: 'high',
        category: 'performance'
      });
    }

    // Health Insights
    if (analytics.health.totalIncidents > 0) {
      const mostCommonIssue = Object.entries(analytics.health.incidentsByType)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostCommonIssue) {
        insights.push({
          id: 'health-trend',
          type: 'warning',
          title: 'Health Incident Trend',
          message: `${mostCommonIssue[0]} is your most common health issue (${mostCommonIssue[1]} cases)`,
          icon: AlertTriangle,
          priority: 'medium',
          category: 'health'
        });
      }
    }

    // Bull Usage Insights
    const bullUsageInsights = Object.entries(analytics.breeding.bullPerformance)
      .sort(([,a], [,b]) => b.total - a.total);

    if (bullUsageInsights.length > 0) {
      const mostUsedBull = bullUsageInsights[0];
      
      if (mostUsedBull[1].total >= 5) {
        insights.push({
          id: 'bull-usage',
          type: 'info',
          title: 'Bull Usage Pattern',
          message: `${mostUsedBull[0]} is your most used bull with ${mostUsedBull[1].total} breedings`,
          icon: Award,
          priority: 'medium',
          category: 'breeding'
        });
      }
    }

    // Seasonal Insights
    const seasonalSuccessRates = Object.entries(analytics.breeding.seasonalData)
      .map(([season, data]) => ({
        season,
        successRate: data.breedings > 0 ? Math.round((data.success / data.breedings) * 100) : 0
      }))
      .filter(data => data.successRate > 0)
      .sort((a, b) => b.successRate - a.successRate);

    if (seasonalSuccessRates.length > 1) {
      const bestSeason = seasonalSuccessRates[0];
      const worstSeason = seasonalSuccessRates[seasonalSuccessRates.length - 1];
      
      if (bestSeason.successRate - worstSeason.successRate > 15) {
        insights.push({
          id: 'seasonal-pattern',
          type: 'info',
          title: 'Seasonal Breeding Pattern',
          message: `${bestSeason.season} breeding has ${bestSeason.successRate}% success vs ${worstSeason.season} at ${worstSeason.successRate}%`,
          icon: Calendar,
          priority: 'medium',
          category: 'seasonal'
        });
      }
    }

    // Age Group Insights
    const ageGroupInsights = Object.entries(analytics.ageGroups)
      .filter(([, data]) => data.breedings >= 2)
      .sort(([,a], [,b]) => b.successRate - a.successRate);

    if (ageGroupInsights.length > 1) {
      const bestAgeGroup = ageGroupInsights[0];
      const worstAgeGroup = ageGroupInsights[ageGroupInsights.length - 1];
      
      if (bestAgeGroup[1].successRate - worstAgeGroup[1].successRate > 20) {
        insights.push({
          id: 'age-performance',
          type: 'info',
          title: 'Age Group Performance',
          message: `${bestAgeGroup[0]} performs best at ${bestAgeGroup[1].successRate}% success rate`,
          icon: Users,
          priority: 'medium',
          category: 'age'
        });
      }
    }

    // Cost Optimization Insights
    if (analytics.overview.costPerPregnancy > 0) {
      const highCostBulls = Object.entries(analytics.breeding.bullPerformance)
        .filter(([, data]) => data.cost > analytics.overview.costPerPregnancy * 3)
        .sort(([,a], [,b]) => b.cost - a.cost);

      if (highCostBulls.length > 0) {
        insights.push({
          id: 'cost-optimization',
          type: 'warning',
          title: 'High Breeding Costs',
          message: `${highCostBulls[0][0]} has cost $${highCostBulls[0][1].cost} in breeding expenses`,
          icon: DollarSign,
          priority: 'medium',
          category: 'financial'
        });
      }
    }

    return insights;
  };

  const insights = generateInsights();

  // Generate Recommendations
  const generateRecommendations = () => {
    const recommendations = [];

    // Culling Recommendations
    const lowHealthCows = cows.filter(cow => {
      const healthScore = calculateHealthScore(cow);
      return healthScore < 60 && cow.status === 'Active';
    });

    if (lowHealthCows.length > 0) {
      recommendations.push({
        id: 'culling-health',
        type: 'critical',
        title: 'Culling Recommendations - Health',
        message: `Consider culling ${lowHealthCows.length} animals with health scores below 60%`,
        action: 'Review low-performing animals',
        icon: AlertTriangle
      });
    }

    // Breeding Failure Culling Recommendations
    const breedingFailureCows = cows.filter(cow => {
      if (!cow.breedingRecords || cow.breedingRecords.length < 2) {
        return false; // Need at least 2 breeding records to consider
      }

      // Sort breeding records chronologically
      const sortedBreedings = [...cow.breedingRecords].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      let consecutiveFailures = 0;
      let lastBreedingDate = null;

      for (let i = 0; i < sortedBreedings.length; i++) {
        const breeding = sortedBreedings[i];
        const breedingDate = new Date(breeding.date);
        
        // Check if there's a positive pregnancy check after this breeding
        const hasPositivePregnancyCheck = (cow.healthRecords || []).some(healthRecord => {
          if (healthRecord.type !== 'Pregnancy Check') return false;
          
          const checkDate = new Date(healthRecord.date);
          const description = (healthRecord.description || '').toLowerCase();
          
          // Must be after this breeding date and contain positive indicators
          return checkDate > breedingDate && 
                 (description.includes('positive') || 
                  description.includes('confirmed positive') ||
                  description.includes('pregnant'));
        });

        // Only use pregnancy confirmations, not calving records
        if (hasPositivePregnancyCheck) {
          // Pregnancy confirmed, reset failure count
          consecutiveFailures = 0;
          lastBreedingDate = null;
        } else {
          // No pregnancy confirmed, increment failure count
          if (lastBreedingDate === null || 
              (breedingDate.getTime() - lastBreedingDate.getTime()) < (365 * 24 * 60 * 60 * 1000)) {
            // Within 1 year of last breeding, count as consecutive
            consecutiveFailures++;
          } else {
            // More than 1 year gap, reset count
            consecutiveFailures = 1;
          }
          lastBreedingDate = breedingDate;
        }

        // If we have 2 or more consecutive failures, this animal qualifies
        if (consecutiveFailures >= 2) {
          return true;
        }
      }

      return false;
    });

    if (breedingFailureCows.length > 0) {
      recommendations.push({
        id: 'culling-breeding-failure',
        type: 'critical',
        title: 'Culling Recommendations - Breeding Failure',
        message: `Consider culling ${breedingFailureCows.length} animals due to repeated breeding failures (2+ attempts without pregnancy)`,
        action: 'Review breeding failure animals',
        icon: AlertTriangle,
        details: breedingFailureCows.map(cow => ({
          name: cow.name || cow.tagNumber,
          tagNumber: cow.tagNumber,
          breedings: cow.breedingRecords?.length || 0
        }))
      });
    }

    // Breeding Optimization
    const bestSeason = Object.entries(analytics.breeding.seasonalData)
      .sort(([,a], [,b]) => (b.success / b.breedings) - (a.success / a.breedings))[0];
    
    if (bestSeason && bestSeason[1].breedings > 0) {
      recommendations.push({
        id: 'breeding-timing',
        type: 'positive',
        title: 'Optimal Breeding Window',
        message: `Focus breeding efforts during ${bestSeason[0]} for best results`,
        action: 'Plan breeding schedule',
        icon: Calendar
      });
    }

    // Bull Usage Recommendations
    const mostUsedBulls = Object.entries(analytics.breeding.bullPerformance)
      .sort(([,a], [,b]) => b.total - a.total)
      .slice(0, 3);

    if (mostUsedBulls.length > 0) {
      recommendations.push({
        id: 'bull-usage',
        type: 'positive',
        title: 'Most Used Bulls',
        message: `${mostUsedBulls.map(([name]) => name).join(', ')} are your most frequently used bulls`,
        action: 'Review inventory levels',
        icon: Award
      });
    }

    // Low Stock Alerts
    const lowStockBulls = bullInventory.filter(bull => bull.straws <= 5 && bull.straws > 0);
    if (lowStockBulls.length > 0) {
      recommendations.push({
        id: 'low-stock-bulls',
        type: 'warning',
        title: 'Low Stock Alerts',
        message: `${lowStockBulls.length} bull(s) have 5 or fewer straws remaining`,
        action: 'Replenish inventory',
        icon: AlertTriangle
      });
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  // Toggle recommendation expansion
  const toggleRecommendationExpansion = (recId) => {
    const newExpanded = new Set(expandedRecommendations);
    if (newExpanded.has(recId)) {
      newExpanded.delete(recId);
    } else {
      newExpanded.add(recId);
    }
    setExpandedRecommendations(newExpanded);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Business Intelligence</h1>
          <p className="text-slate-600 mt-1">
            Automated insights and performance optimization for profitable decisions
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="6m">Last 6 months</option>
            <option value="1y">Last year</option>
          </select>
          <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Automated Insights Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Automated Insights</h2>
              <p className="text-sm text-slate-600">AI-powered analysis of your herd performance</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {insights.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-500">No significant insights to report</p>
              <p className="text-sm text-slate-400 mt-1">Your herd is performing well</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    insight.type === 'positive' ? 'border-green-200 bg-green-50' :
                    insight.type === 'warning' ? 'border-orange-200 bg-orange-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                  onClick={() => setSelectedInsight(insight)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      insight.type === 'positive' ? 'bg-green-100' :
                      insight.type === 'warning' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      <insight.icon className={`w-4 h-4 ${
                        insight.type === 'positive' ? 'text-green-600' :
                        insight.type === 'warning' ? 'text-orange-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{insight.message}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          insight.priority === 'high' ? 'bg-red-100 text-red-700' :
                          insight.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {insight.priority} priority
                        </span>
                        <span className="text-xs text-slate-500 capitalize">{insight.category}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Breeding Success</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.overview.breedingSuccessRate}%</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center space-x-2">
            {analytics.overview.successRateChange >= 0 ? (
              <>
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">+{analytics.overview.successRateChange}%</span>
              </>
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">{analytics.overview.successRateChange}%</span>
              </>
            )}
            <span className="text-sm text-slate-500">vs previous period</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Health Incidents</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.health.totalIncidents}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">{analytics.overview.healthIncidentRate}% of herd affected</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Cost per Pregnancy</p>
              <p className="text-3xl font-bold text-slate-900">${analytics.overview.costPerPregnancy}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">Average breeding cost</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Breedings</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.breeding.totalBreedings}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-sm text-slate-500">{analytics.breeding.totalConfirmedPregnancies} confirmed pregnancies</p>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Actionable Recommendations</h2>
              <p className="text-sm text-slate-600">Optimize your operations with data-driven suggestions</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          {recommendations.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-slate-500">No recommendations at this time</p>
              <p className="text-sm text-slate-400 mt-1">Your herd management is optimal</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className={`p-4 rounded-xl border-2 ${
                    rec.type === 'critical' ? 'border-red-200 bg-red-50' :
                    rec.type === 'positive' ? 'border-green-200 bg-green-50' :
                    'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      rec.type === 'critical' ? 'bg-red-100' :
                      rec.type === 'positive' ? 'bg-green-100' :
                      'bg-blue-100'
                    }`}>
                      <rec.icon className={`w-4 h-4 ${
                        rec.type === 'critical' ? 'text-red-600' :
                        rec.type === 'positive' ? 'text-green-600' :
                        'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{rec.title}</h3>
                      <p className="text-sm text-slate-600 mt-1">{rec.message}</p>
                      
                      {/* Show detailed animal list for breeding failure recommendations */}
                      {rec.id === 'culling-breeding-failure' && rec.details && (
                        <div className="mt-3">
                          <button
                            onClick={() => toggleRecommendationExpansion(rec.id)}
                            className="flex items-center space-x-2 text-xs font-medium text-red-700 hover:text-red-800"
                          >
                            <span>
                              {expandedRecommendations.has(rec.id) ? 'Hide' : 'Show'} affected animals
                            </span>
                            <svg
                              className={`w-3 h-3 transition-transform ${
                                expandedRecommendations.has(rec.id) ? 'rotate-180' : ''
                              }`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          
                          {expandedRecommendations.has(rec.id) && (
                            <div className="mt-2 p-3 bg-white rounded-lg border border-red-200">
                              <p className="text-xs font-medium text-red-700 mb-2">Animals with Breeding Failures:</p>
                              <div className="space-y-2">
                                {rec.details.map((animal, index) => (
                                  <div key={index} className="flex items-center justify-between text-xs p-2 bg-red-50 rounded">
                                    <div>
                                      <span className="font-medium text-slate-700">
                                        {animal.name || 'Unnamed'}
                                      </span>
                                      <span className="text-slate-500 ml-2">
                                        #{animal.tagNumber}
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-red-600 font-medium">
                                        {animal.breedings} failed breedings
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <button className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                        {rec.action} →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Performance Analysis Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bulls by Usage Chart - Simpler and More Actionable */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Bulls by Usage</h3>
            <p className="text-sm text-slate-600">Most used bulls and breeding costs</p>
          </div>
          <div className="p-6">
            {Object.keys(analytics.breeding.bullPerformance).length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No breeding data available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(analytics.breeding.bullPerformance)
                  .sort(([,a], [,b]) => b.total - a.total) // Sort by most used
                  .map(([bullId, data]) => {
                    // Find bull in inventory for straws remaining
                    const inventoryBull = bullInventory.find(b => b.naabCode === bullId);
                    const strawsRemaining = inventoryBull?.straws || 0;
                    
                    return (
                      <div key={bullId} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{data.displayName}</p>
                          <p className="text-sm text-slate-600">{bullId}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-slate-500">{data.total} breedings</span>
                            <span className="text-sm text-slate-500">•</span>
                            <span className="text-sm text-slate-500">${data.cost} spent</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{strawsRemaining} straws</p>
                          <p className="text-sm text-slate-600">remaining</p>
                          {strawsRemaining <= 5 && strawsRemaining > 0 && (
                            <span className="inline-block px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full mt-1">
                              Low Stock
                            </span>
                          )}
                          {strawsRemaining === 0 && (
                            <span className="inline-block px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full mt-1">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Seasonal Analysis Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-lg font-semibold text-slate-900">Seasonal Breeding Patterns</h3>
            <p className="text-sm text-slate-600">Success rates by season</p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {Object.entries(analytics.breeding.seasonalData).map(([season, data]) => {
                const successRate = data.breedings > 0 ? Math.round((data.success / data.breedings) * 100) : 0;
                return (
                  <div key={season} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{season}</p>
                      <p className="text-sm text-slate-600">{data.breedings} breedings</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{successRate}%</p>
                      <p className="text-sm text-slate-600">{data.success} successful</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Age Group Analysis */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Age Group Performance</h3>
          <p className="text-sm text-slate-600">Breeding success by animal age</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(analytics.ageGroups).map(([ageGroup, data]) => (
              <div key={ageGroup} className="p-4 bg-slate-50 rounded-lg">
                <h4 className="font-medium text-slate-900 text-sm">{ageGroup}</h4>
                <p className="text-2xl font-bold text-slate-900 mt-2">{data.successRate}%</p>
                <p className="text-sm text-slate-600">{data.count} animals</p>
                <p className="text-xs text-slate-500 mt-1">{data.breedings} breedings</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                selectedInsight.type === 'positive' ? 'bg-green-100' :
                selectedInsight.type === 'warning' ? 'bg-orange-100' :
                'bg-blue-100'
              }`}>
                <selectedInsight.icon className={`w-5 h-5 ${
                  selectedInsight.type === 'positive' ? 'text-green-600' :
                  selectedInsight.type === 'warning' ? 'text-orange-600' :
                  'text-blue-600'
                }`} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">{selectedInsight.title}</h3>
            </div>
            <p className="text-slate-600 mb-4">{selectedInsight.message}</p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedInsight(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView; 