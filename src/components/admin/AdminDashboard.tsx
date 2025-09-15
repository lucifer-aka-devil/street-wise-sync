import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import QuickStats from './QuickStats';
import ReportManagement from './ReportManagement';
import UserManagement from './UserManagement';
import CategoryManagement from './CategoryManagement';
import DepartmentManagement from './DepartmentManagement';
import MapView from './MapView';
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
} from 'recharts';

export default function AdminDashboard() {
  const { isAdmin, isStaff } = useAuth();
  const [stats, setStats] = useState({
    totalReports: 0,
    submittedReports: 0,
    inProgressReports: 0,
    resolvedReports: 0,
    totalUsers: 0,
    avgResolutionTime: 0,
  });

  const [statusStats, setStatusStats] = useState<any[]>([]);
  const [categoryStats, setCategoryStats] = useState<any[]>([]);
  const [trendStats, setTrendStats] = useState<any[]>([]);
  const [priorityStats, setPriorityStats] = useState<any[]>([]);
  const [resolutionStats, setResolutionStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
        fetchDashboardStats();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardStats = useCallback(async () => {
    try {
      const { data: reports } = await supabase.from('reports').select('status, created_at, resolved_at, priority, categories (name)');
      const { data: userStats } = await supabase.from('profiles').select('id').eq('role', 'citizen');

      if (!reports) return;

      const submitted = reports.filter(r => r.status === 'submitted').length;
      const acknowledged = reports.filter(r => r.status === 'acknowledged').length;
      const inProgress = reports.filter(r => r.status === 'in_progress').length;
      const resolved = reports.filter(r => r.status === 'resolved').length;
      const rejected = reports.filter(r => r.status === 'rejected').length;

      setStats({
        totalReports: reports.length,
        submittedReports: submitted,
        inProgressReports: inProgress,
        resolvedReports: resolved,
        totalUsers: userStats?.length || 0,
        avgResolutionTime: calculateAvgResolutionTime(reports),
      });

      setStatusStats([
        { name: 'Submitted', value: submitted, color: '#3B82F6' },
        { name: 'Acknowledged', value: acknowledged, color: '#F59E0B' },
        { name: 'In Progress', value: inProgress, color: '#10B981' },
        { name: 'Resolved', value: resolved, color: '#059669' },
        { name: 'Rejected', value: rejected, color: '#EF4444' },
      ]);

      // Reports by category
      const categoryCount: Record<string, number> = {};
      reports.forEach(r => {
        const categoryName = r.categories?.name || 'Unknown';
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
      });
      setCategoryStats(Object.entries(categoryCount).map(([name, count]) => ({ name, count })));

      // Reports trend over time (daily)
      const dailyCount: Record<string, number> = {};
      reports.forEach(r => {
        const day = new Date(r.created_at).toLocaleDateString();
        dailyCount[day] = (dailyCount[day] || 0) + 1;
      });
      setTrendStats(Object.entries(dailyCount).map(([date, count]) => ({ date, count })));

      // Reports by priority
      const priorityCount: Record<string, number> = {};
      reports.forEach(r => {
        const priority = r.priority || 'Unspecified';
        priorityCount[priority] = (priorityCount[priority] || 0) + 1;
      });
      setPriorityStats(Object.entries(priorityCount).map(([priority, count]) => ({ priority, count })));

      // Avg resolution time by category
      const resolutionData: Record<string, number[]> = {};
      reports.forEach(r => {
        if (r.status === 'resolved' && r.resolved_at) {
          const created = new Date(r.created_at).getTime();
          const resolved = new Date(r.resolved_at).getTime();
          const days = (resolved - created) / (1000 * 60 * 60 * 24);
          const cat = r.categories?.name || 'Unknown';
          if (!resolutionData[cat]) resolutionData[cat] = [];
          resolutionData[cat].push(days);
        }
      });
      setResolutionStats(
        Object.entries(resolutionData).map(([cat, times]) => ({
          category: cat,
          avgDays: times.reduce((a, b) => a + b, 0) / times.length,
        }))
      );

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  }, []);

  const calculateAvgResolutionTime = (reports: any[]) => {
    const resolvedReports = reports.filter(r => r.status === 'resolved' && r.resolved_at);
    if (resolvedReports.length === 0) return 0;
    const totalTime = resolvedReports.reduce((acc, r) => {
      const created = new Date(r.created_at).getTime();
      const resolved = new Date(r.resolved_at).getTime();
      return acc + (resolved - created);
    }, 0);
    return Math.round(totalTime / resolvedReports.length / (1000 * 60 * 60 * 24));
  };

  if (!isStaff) {
    return <div className="p-8 text-center">Access Denied</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header Section */}
        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
                Admin Dashboard
              </h1>
              <p className="text-base sm:text-lg text-slate-600">Monitor and analyze civic complaints with real-time insights</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Live Updates
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
            <TabsTrigger 
              value="overview" 
              className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger 
              value="reports" 
              className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger 
              value="users" 
              className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Users
            </TabsTrigger>
            <TabsTrigger 
              value="categories" 
              className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              <span className="hidden sm:inline">Categories</span>
              <span className="sm:hidden">Cat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="departments" 
              className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              <span className="hidden sm:inline">Departments</span>
              <span className="sm:hidden">Dept</span>
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="text-xs sm:text-sm px-3 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-medium"
            >
              Map
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading dashboard data...</p>
                </div>
              </div>
            ) : (
              <>
                <QuickStats {...stats} />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {/* Status Pie Chart */}
                  <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        Reports by Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie 
                            data={statusStats} 
                            dataKey="value" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={90}
                            label={(entry) => window.innerWidth > 640 ? entry.name : ''}
                            labelLine={false}
                          >
                            {statusStats.map((e, i) => (<Cell key={i} fill={e.color} />))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Category Bar Chart */}
                  <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Reports by Category
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={categoryStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                          <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Second Row of Charts */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {/* Trend Line Chart */}
                  <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                        Complaint Trend
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={trendStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="count" 
                            stroke="#10B981" 
                            strokeWidth={3}
                            dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                            activeDot={{ r: 6, stroke: '#10B981', strokeWidth: 2 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Priority Bar Chart */}
                  <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        Reports by Priority
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={priorityStats}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                          <XAxis 
                            dataKey="priority" 
                            tick={{ fontSize: 12, fill: '#64748b' }} 
                          />
                          <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.95)',
                              border: 'none',
                              borderRadius: '8px',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                            }}
                          />
                          <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Resolution Time Chart - Full Width */}
                <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl font-semibold text-slate-800 flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      Average Resolution Time by Category
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={resolutionStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="category" 
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          angle={-45}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis 
                          label={{ value: 'Days', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#64748b' } }}
                          tick={{ fontSize: 12, fill: '#64748b' }}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                          }}
                        />
                        <Bar dataKey="avgDays" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="reports" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <ReportManagement />
          </TabsContent>
          <TabsContent value="users" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <UserManagement />
          </TabsContent>
          <TabsContent value="categories" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <CategoryManagement />
          </TabsContent>
          <TabsContent value="departments" className="bg-white/40 backdrop-blur-sm rounded-lg p-6">
            <DepartmentManagement />
          </TabsContent>
          <TabsContent value="map" className="bg-white/40 backdrop-blur-sm rounded-lg p-2 h-[700px]">
            <MapView />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}