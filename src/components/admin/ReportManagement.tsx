import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
} from 'lucide-react';
import ReportCard from './ReportCard';

interface Report {
  id: string;
  title: string;
  description: string;
  status: 'submitted' | 'acknowledged' | 'in_progress' | 'resolved' | 'rejected';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  address: string;
  photos: string[];
  votes_count: number;
  views_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
  assigned_to?: string;
  categories: {
    id: string;
    name: string;
    color: string;
  };
  departments: {
    id: string;
    name: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
  assigned_user?: {
    full_name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

interface Staff {
  user_id: string;
  full_name: string;
}

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-500' },
  acknowledged: { label: 'Acknowledged', color: 'bg-yellow-500' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500' },
  resolved: { label: 'Resolved', color: 'bg-green-500' },
  rejected: { label: 'Rejected', color: 'bg-red-500' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-500' },
  medium: { label: 'Medium', color: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500' },
};

export default function ReportManagement() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchReports();
    fetchDepartments();
    fetchStaff();
    fetchCategories();

    // Set up real-time subscription
    const channel = supabase
      .channel('admin-reports')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReports = useCallback(async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories!left (id, name, color),
        departments!left (id, name),
        profiles!left!reports_user_id_fkey (full_name, email),
        assigned_user:profiles!left!reports_assigned_to_fkey (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    setReports((data || []) as unknown as Report[]);
    setLoading(false);
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching departments:', error);
      return;
    }

    setDepartments(data || []);
  };

  const fetchStaff = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('role', ['admin', 'staff']);

    if (error) {
      console.error('Error fetching staff:', error);
      return;
    }

    setStaff(data || []);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }

    setCategories(data || []);
  };

  const updateReportStatus = useCallback(async (reportId: string, status: string, assignedTo?: string, message?: string) => {
    try {
      const updateData: any = { 
        status,
        resolved_at: status === 'resolved' ? new Date().toISOString() : null
      };
      
      if (assignedTo) {
        updateData.assigned_to = assignedTo;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) throw error;

      // Add status update record
      if (message?.trim()) {
        await supabase
          .from('report_updates')
          .insert({
            report_id: reportId,
            user_id: user?.id,
            status,
            message: message.trim(),
          });
      }

      toast({
        title: "Report Updated",
        description: "The report status has been updated successfully.",
      });

      setSelectedReport(null);
      fetchReports();
    } catch (error) {
      console.error('Error updating report:', error);
      toast({
        title: "Update Error",
        description: "There was an error updating the report. Please try again.",
        variant: "destructive",
      });
    }
  }, [user?.id, fetchReports]);

  const assignReport = useCallback(async (reportId: string, departmentId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ department_id: departmentId })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report Assigned",
        description: "The report has been assigned to the department.",
      });

      fetchReports();
    } catch (error) {
      console.error('Error assigning report:', error);
      toast({
        title: "Assignment Error",
        description: "There was an error assigning the report. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetchReports]);

  const updatePriority = useCallback(async (reportId: string, priority: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ priority })
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Priority Updated",
        description: "The report priority has been updated successfully.",
      });

      fetchReports();
    } catch (error) {
      console.error('Error updating priority:', error);
      toast({
        title: "Update Error",
        description: "There was an error updating the priority. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetchReports]);

  const deleteReport = useCallback(async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId);

      if (error) throw error;

      toast({
        title: "Report Deleted",
        description: "The report has been permanently deleted.",
      });

      fetchReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: "Delete Error",
        description: "There was an error deleting the report. Please try again.",
        variant: "destructive",
      });
    }
  }, [fetchReports]);

  const filteredReports = useMemo(() => {
    return reports.filter(report => {
      const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           report.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' || report.categories?.id === categoryFilter;
      const matchesDepartment = departmentFilter === 'all' || report.departments?.id === departmentFilter;
      
      return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDepartment;
    });
  }, [reports, searchTerm, statusFilter, priorityFilter, categoryFilter, departmentFilter]);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center justify-center">
              <Badge variant="outline">
                {filteredReports.length} of {reports.length} reports
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            departments={departments}
            staff={staff}
            onAssignReport={assignReport}
            onUpdateReport={updateReportStatus}
            onUpdatePriority={updatePriority}
            onDeleteReport={deleteReport}
          />
        ))}
      </div>

      {filteredReports.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">No reports found matching your filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}