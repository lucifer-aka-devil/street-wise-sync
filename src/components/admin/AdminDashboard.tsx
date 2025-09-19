import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, TrendingUp, TrendingDown, Filter, Download, RefreshCw } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  LineChart,
  Line,
  AreaChart,
  Area,
  ComposedChart,
  Legend,
  RadialBarChart,
  RadialBar,
  ScatterChart,
  Scatter
} from 'recharts';

// Mock data for demonstration - replace with actual Supabase integration
const generateMockData = () => {
  const categories = ['Road & Transport', 'Water Supply', 'Electricity', 'Sanitation', 'Public Safety', 'Healthcare', 'Education', 'Environment'];
  const statuses = ['submitted', 'acknowledged', 'in_progress', 'resolved', 'rejected'];
  const priorities = ['low', 'medium', 'high', 'critical'];
  const departments = ['Municipal Corp', 'Water Board', 'Electricity Board', 'Health Dept', 'Traffic Police'];

  const reports = [];
  const now = new Date();
  
  for (let i = 0; i < 500; i++) {
    const createdDate = new Date(now.getTime() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const resolvedDate = Math.random() > 0.4 ? new Date(createdDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
    
    reports.push({
      id: i,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      category: categories[Math.floor(Math.random() * categories.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      created_at: createdDate,
      resolved_at: resolvedDate,
      satisfaction_rating: Math.random() > 0.3 ? Math.floor(Math.random() * 5) + 1 : null,
      location: {
        lat: 28.6139 + (Math.random() - 0.5) * 0.1,
        lng: 77.2090 + (Math.random() - 0.5) * 0.1
      }
    });
  }
  
  return reports;
};

export default function EnhancedAdminDashboard() {
  const [reports, setReports] = useState(generateMockData());
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(false);

  // Enhanced statistics with detailed calculations
  const stats = useMemo(() => {
    const filteredReports = reports.filter(report => {
      const daysDiff = (new Date().getTime() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const timeFilter = timeRange === '7d' ? daysDiff <= 7 : 
                        timeRange === '30d' ? daysDiff <= 30 : 
                        timeRange === '90d' ? daysDiff <= 90 : true;
      
      const categoryFilter = selectedCategory === 'all' || report.category === selectedCategory;
      
      return timeFilter && categoryFilter;
    });

    const totalReports = filteredReports.length;
    const submittedReports = filteredReports.filter(r => r.status === 'submitted').length;
    const inProgressReports = filteredReports.filter(r => r.status === 'in_progress').length;
    const resolvedReports = filteredReports.filter(r => r.status === 'resolved').length;
    const rejectedReports = filteredReports.filter(r => r.status === 'rejected').length;

    const resolvedWithTime = filteredReports.filter(r => r.status === 'resolved' && r.resolved_at);
    const avgResolutionTime = resolvedWithTime.length > 0 
      ? resolvedWithTime.reduce((acc, r) => acc + ((new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0) / resolvedWithTime.length
      : 0;

    const satisfactionRatings = filteredReports.filter(r => r.satisfaction_rating);
    const avgSatisfaction = satisfactionRatings.length > 0
      ? satisfactionRatings.reduce((acc, r) => acc + r.satisfaction_rating, 0) / satisfactionRatings.length
      : 0;

    const resolutionRate = totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0;
    const escalationRate = totalReports > 0 ? (filteredReports.filter(r => r.priority === 'critical').length / totalReports) * 100 : 0;

    return {
      totalReports,
      submittedReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
      avgSatisfaction: Math.round(avgSatisfaction * 10) / 10,
      resolutionRate: Math.round(resolutionRate * 10) / 10,
      escalationRate: Math.round(escalationRate * 10) / 10,
      totalUsers: 1250 // Mock data
    };
  }, [reports, timeRange, selectedCategory]);

  // Enhanced chart data
  const chartData = useMemo(() => {
    const filteredReports = reports.filter(report => {
      const daysDiff = (new Date().getTime() - new Date(report.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const timeFilter = timeRange === '7d' ? daysDiff <= 7 : 
                        timeRange === '30d' ? daysDiff <= 30 : 
                        timeRange === '90d' ? daysDiff <= 90 : true;
      return timeFilter;
    });

    // Status distribution with enhanced data
    const statusStats = [
      { name: 'Submitted', value: filteredReports.filter(r => r.status === 'submitted').length, color: '#F97316', change: '+12%' },
      { name: 'Acknowledged', value: filteredReports.filter(r => r.status === 'acknowledged').length, color: '#F59E0B', change: '+5%' },
      { name: 'In Progress', value: filteredReports.filter(r => r.status === 'in_progress').length, color: '#10B981', change: '+8%' },
      { name: 'Resolved', value: filteredReports.filter(r => r.status === 'resolved').length, color: '#059669', change: '+15%' },
      { name: 'Rejected', value: filteredReports.filter(r => r.status === 'rejected').length, color: '#EF4444', change: '-3%' }
    ];

    // Category analysis with additional metrics
    const categoryCount = {};
    const categoryResolution = {};
    const categorySatisfaction = {};
    
    filteredReports.forEach(r => {
      const cat = r.category;
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      
      if (r.status === 'resolved') {
        categoryResolution[cat] = (categoryResolution[cat] || 0) + 1;
      }
      
      if (r.satisfaction_rating) {
        if (!categorySatisfaction[cat]) categorySatisfaction[cat] = [];
        categorySatisfaction[cat].push(r.satisfaction_rating);
      }
    });

    const categoryStats = Object.entries(categoryCount).map(([name, count]) => ({
      name,
      count,
      resolved: categoryResolution[name] || 0,
      resolutionRate: count > 0 ? Math.round((categoryResolution[name] || 0) / count * 100) : 0,
      satisfaction: categorySatisfaction[name] 
        ? Math.round(categorySatisfaction[name].reduce((a, b) => a + b, 0) / categorySatisfaction[name].length * 10) / 10 
        : 0
    }));

    // Daily trend analysis
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const trendStats = last30Days.map(date => {
      const dayReports = filteredReports.filter(r => r.created_at.toISOString().split('T')[0] === date);
      const resolved = dayReports.filter(r => r.status === 'resolved').length;
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayReports.length,
        resolved,
        pending: dayReports.length - resolved,
        cumulative: filteredReports.filter(r => new Date(r.created_at) <= new Date(date)).length
      };
    });

    // Priority distribution with urgency metrics
    const priorityStats = ['low', 'medium', 'high', 'critical'].map(priority => {
      const priorityReports = filteredReports.filter(r => r.priority === priority);
      const resolved = priorityReports.filter(r => r.status === 'resolved');
      const avgTime = resolved.length > 0 
        ? resolved.reduce((acc, r) => acc + ((new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)), 0) / resolved.length
        : 0;

      return {
        priority: priority.charAt(0).toUpperCase() + priority.slice(1),
        count: priorityReports.length,
        avgResolutionTime: Math.round(avgTime * 10) / 10,
        urgencyScore: priority === 'critical' ? 100 : priority === 'high' ? 75 : priority === 'medium' ? 50 : 25
      };
    });

    // Department performance analysis
    const deptStats = {};
    filteredReports.forEach(r => {
      if (!deptStats[r.department]) {
        deptStats[r.department] = { total: 0, resolved: 0, avgTime: [], satisfaction: [] };
      }
      deptStats[r.department].total++;
      
      if (r.status === 'resolved') {
        deptStats[r.department].resolved++;
        if (r.resolved_at) {
          const time = (new Date(r.resolved_at).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24);
          deptStats[r.department].avgTime.push(time);
        }
      }
      
      if (r.satisfaction_rating) {
        deptStats[r.department].satisfaction.push(r.satisfaction_rating);
      }
    });

    const departmentStats = Object.entries(deptStats).map(([dept, data]) => ({
      department: dept,
      total: data.total,
      resolved: data.resolved,
      efficiency: data.total > 0 ? Math.round(data.resolved / data.total * 100) : 0,
      avgTime: data.avgTime.length > 0 ? Math.round(data.avgTime.reduce((a, b) => a + b, 0) / data.avgTime.length * 10) / 10 : 0,
      satisfaction: data.satisfaction.length > 0 ? Math.round(data.satisfaction.reduce((a, b) => a + b, 0) / data.satisfaction.length * 10) / 10 : 0
    }));

    // Heatmap data for report trends
    const heatmapData = [];
    const hours = Array.from({ length: 24 }, (_, i) => i);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    days.forEach((day, dayIndex) => {
      hours.forEach(hour => {
        const count = filteredReports.filter(r => {
          const reportDate = new Date(r.created_at);
          return reportDate.getDay() === dayIndex && reportDate.getHours() === hour;
        }).length;
        
        heatmapData.push({
          day,
          hour,
          count,
          intensity: count > 0 ? Math.min(count / 5, 1) : 0
        });
      });
    });

    return {
      statusStats,
      categoryStats,
      trendStats,
      priorityStats,
      departmentStats,
      heatmapData
    };
  }, [reports, timeRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((pld, index) => (
            <p key={index} className="text-sm" style={{ color: pld.color }}>
              {pld.dataKey}: {pld.value}
              {pld.dataKey.includes('Rate') && '%'}
              {pld.dataKey.includes('Time') && ' days'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const HeatmapCell = ({ data, maxCount }) => {
    const opacity = data.count / maxCount;
    const color = `rgba(249, 115, 22, ${Math.max(opacity, 0.1)})`;
    
    return (
      <div 
        className="w-4 h-4 rounded-sm cursor-pointer hover:scale-110 transition-transform"
        style={{ backgroundColor: color }}
        title={`${data.day} ${data.hour}:00 - ${data.count} reports`}
      />
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Enhanced Header */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent mb-2">
                Advanced Admin Dashboard
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-4">Real-time analytics with enhanced insights and predictive trends</p>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  Live Updates
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Analytics Enabled
                </Badge>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Calendar className="w-3 h-3 mr-1" />
                  Last updated: {new Date().toLocaleTimeString()}
                </Badge>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-2">
                {['7d', '30d', '90d', 'all'].map(range => (
                  <Button
                    key={range}
                    variant={timeRange === range ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTimeRange(range)}
                    className={timeRange === range ? "bg-gradient-to-r from-orange-500 to-amber-500" : ""}
                  >
                    {range === 'all' ? 'All Time' : range.toUpperCase()}
                  </Button>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setLoading(true)}>
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { title: 'Total Reports', value: stats.totalReports, icon: '📊', color: 'blue', change: '+12%' },
            { title: 'Resolution Rate', value: `${stats.resolutionRate}%`, icon: '✅', color: 'green', change: '+5%' },
            { title: 'Avg Resolution', value: `${stats.avgResolutionTime}d`, icon: '⏱️', color: 'amber', change: '-2d' },
            { title: 'Satisfaction', value: `${stats.avgSatisfaction}/5`, icon: '⭐', color: 'purple', change: '+0.3' },
            { title: 'Critical Issues', value: `${stats.escalationRate}%`, icon: '🚨', color: 'red', change: '-1%' }
          ].map((stat, index) => (
            <Card key={index} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                    <div className="flex items-center mt-1">
                      <span className={`text-xs px-1.5 py-0.5 rounded text-${stat.color}-700 bg-${stat.color}-100`}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className="text-2xl opacity-70">{stat.icon}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-white/70 backdrop-blur-sm border border-orange-200/30 shadow-sm rounded-xl">
            {[
              { value: 'overview', label: 'Overview' },
              { value: 'trends', label: 'Trends' },
              { value: 'performance', label: 'Performance' },
              { value: 'heatmap', label: 'Heatmap' },
              { value: 'reports', label: 'Reports' },
              { value: 'users', label: 'Users' },
              { value: 'settings', label: 'Settings' }
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md font-medium rounded-lg"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Enhanced Status Pie Chart with Drill-down */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      Reports by Status
                    </div>
                    <Button variant="ghost" size="sm">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie 
                        data={chartData.statusStats} 
                        dataKey="value" 
                        cx="50%" 
                        cy="50%" 
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        label={({name, value, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.statusStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Status change indicators */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    {chartData.statusStats.map((stat, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: stat.color}}></div>
                          {stat.name}
                        </span>
                        <span className={`font-semibold ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {stat.change}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Category Analysis */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Category Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={chartData.categoryStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 10, fill: '#64748b' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#F97316" name="Total Reports" radius={[2, 2, 0, 0]} />
                      <Bar yAxisId="left" dataKey="resolved" fill="#10B981" name="Resolved" radius={[2, 2, 0, 0]} />
                      <Line yAxisId="right" type="monotone" dataKey="resolutionRate" stroke="#8B5CF6" strokeWidth={2} name="Resolution Rate %" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-8">
            {/* Advanced Trend Analysis */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  Advanced Trend Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <ComposedChart data={chartData.trendStats}>
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    
                    <Area 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#8B5CF6" 
                      fillOpacity={0.1}
                      fill="url(#colorGradient)"
                      name="Cumulative Reports"
                    />
                    <Bar yAxisId="left" dataKey="count" fill="#F97316" name="Daily Reports" radius={[2, 2, 0, 0]} />
                    <Bar yAxisId="left" dataKey="resolved" fill="#10B981" name="Daily Resolved" radius={[2, 2, 0, 0]} />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="pending" 
                      stroke="#EF4444" 
                      strokeWidth={2}
                      name="Pending Reports"
                      dot={{ fill: '#EF4444', strokeWidth: 2, r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              {/* Department Performance Radar */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Department Efficiency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData.departmentStats} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="department" tick={{ fontSize: 11, fill: '#64748b' }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="efficiency" fill="#10B981" radius={[0, 4, 4, 0]} name="Efficiency %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Priority vs Resolution Time Scatter */}
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Priority vs Resolution Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <ScatterChart data={chartData.priorityStats}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number" 
                        dataKey="urgencyScore" 
                        name="Priority Score" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        domain={[0, 100]}
                      />
                      <YAxis 
                        type="number" 
                        dataKey="avgResolutionTime" 
                        name="Avg Days" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip 
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
                                <p className="font-semibold text-gray-800">{data.priority} Priority</p>
                                <p className="text-sm text-gray-600">Reports: {data.count}</p>
                                <p className="text-sm text-gray-600">Avg Resolution: {data.avgResolutionTime} days</p>
                                <p className="text-sm text-gray-600">Priority Score: {data.urgencyScore}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Scatter 
                        name="Priority Analysis" 
                        dataKey="avgResolutionTime" 
                        fill="#8B5CF6"
                        fillOpacity={0.6}
                        strokeOpacity={0.8}
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        r={8}
                      />
                    </ScatterChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Department Satisfaction Radial Chart */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                  Department Satisfaction Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" data={chartData.departmentStats}>
                    <RadialBar 
                      minAngle={15} 
                      label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }} 
                      background 
                      clockWise 
                      dataKey="satisfaction" 
                      cornerRadius={10}
                      fill="#F59E0B"
                    />
                    <Legend iconSize={12} width={120} height={140} layout="vertical" verticalAlign="middle" wrapperStyle={{ paddingLeft: '20px' }} />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-lg border border-gray-200">
                              <p className="font-semibold text-gray-800">{data.department}</p>
                              <p className="text-sm text-gray-600">Satisfaction: {data.satisfaction}/5</p>
                              <p className="text-sm text-gray-600">Efficiency: {data.efficiency}%</p>
                              <p className="text-sm text-gray-600">Avg Time: {data.avgTime} days</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap" className="space-y-8">
            {/* Report Activity Heatmap */}
            <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    Report Activity Heatmap
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    Peak Hours Analysis
                  </Badge>
                </CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  Visualize report submission patterns across days and hours to optimize resource allocation
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Time labels */}
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <div className="w-12"></div>
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} className="w-4 text-center">
                        {i % 4 === 0 ? i : ''}
                      </div>
                    ))}
                  </div>
                  
                  {/* Heatmap grid */}
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => (
                    <div key={day} className="flex items-center gap-2">
                      <div className="w-12 text-xs font-medium text-slate-700">{day}</div>
                      <div className="flex gap-1">
                        {Array.from({ length: 24 }, (_, hour) => {
                          const cellData = chartData.heatmapData.find(d => d.day === day && d.hour === hour);
                          const maxCount = Math.max(...chartData.heatmapData.map(d => d.count));
                          return (
                            <HeatmapCell 
                              key={hour} 
                              data={cellData || { day, hour, count: 0 }} 
                              maxCount={maxCount}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  
                  {/* Legend */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-600">Activity Level:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-500">Low</span>
                        <div className="flex gap-1">
                          {[0.1, 0.3, 0.5, 0.7, 1.0].map(opacity => (
                            <div 
                              key={opacity}
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: `rgba(249, 115, 22, ${opacity})` }}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">High</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-500">
                      Peak: {(() => {
                        const peak = chartData.heatmapData.reduce((max, curr) => curr.count > max.count ? curr : max, { count: 0, day: '', hour: 0 });
                        return `${peak.day} ${peak.hour}:00 (${peak.count} reports)`;
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Heatmap Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Peak Hours
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const hourlyTotals = {};
                    chartData.heatmapData.forEach(d => {
                      hourlyTotals[d.hour] = (hourlyTotals[d.hour] || 0) + d.count;
                    });
                    
                    return Object.entries(hourlyTotals)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([hour, count], index) => (
                        <div key={hour} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {index + 1}. {hour}:00 - {parseInt(hour) + 1}:00
                          </span>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                            {count} reports
                          </Badge>
                        </div>
                      ));
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Busiest Days
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const dayTotals = {};
                    chartData.heatmapData.forEach(d => {
                      dayTotals[d.day] = (dayTotals[d.day] || 0) + d.count;
                    });
                    
                    return Object.entries(dayTotals)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([day, count], index) => (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {index + 1}. {day}
                          </span>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            {count} reports
                          </Badge>
                        </div>
                      ));
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Quiet Periods
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(() => {
                    const hourlyTotals = {};
                    chartData.heatmapData.forEach(d => {
                      hourlyTotals[d.hour] = (hourlyTotals[d.hour] || 0) + d.count;
                    });
                    
                    return Object.entries(hourlyTotals)
                      .sort(([,a], [,b]) => a - b)
                      .slice(0, 3)
                      .map(([hour, count], index) => (
                        <div key={hour} className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">
                            {index + 1}. {hour}:00 - {parseInt(hour) + 1}:00
                          </span>
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {count} reports
                          </Badge>
                        </div>
                      ));
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="reports" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Report Management</h3>
              <p className="text-slate-600">Detailed report management interface would be implemented here</p>
            </div>
          </TabsContent>

          <TabsContent value="users" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <div className="text-center py-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">User Management</h3>
              <p className="text-slate-600">User management interface would be implemented here</p>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Dashboard Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base">Display Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Auto-refresh data</span>
                      <div className="w-10 h-6 bg-orange-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-orange-500 rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Dark mode</span>
                      <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-gray-400 rounded-full absolute top-0.5 left-0.5 transition-all"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Show animations</span>
                      <div className="w-10 h-6 bg-orange-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-orange-500 rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-base">Notification Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Critical reports</span>
                      <div className="w-10 h-6 bg-red-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-red-500 rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Daily summary</span>
                      <div className="w-10 h-6 bg-orange-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-orange-500 rounded-full absolute top-0.5 right-0.5 transition-all"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700">Weekly reports</span>
                      <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                        <div className="w-5 h-5 bg-gray-400 rounded-full absolute top-0.5 left-0.5 transition-all"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}