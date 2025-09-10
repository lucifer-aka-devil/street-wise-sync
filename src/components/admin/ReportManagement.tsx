import { useState, useEffect } from 'react';
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
  MapPin,
  Calendar,
  User,
  Eye,
  Edit,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  ThumbsUp
} from 'lucide-react';

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
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [updateMessage, setUpdateMessage] = useState('');

  useEffect(() => {
    fetchReports();
    fetchDepartments();
    fetchStaff();

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

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories (id, name, color),
        departments (id, name),
        profiles!reports_user_id_fkey (full_name, email),
        assigned_user:profiles!reports_assigned_to_fkey (full_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    setReports((data || []) as Report[]);
    setLoading(false);
  };

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

  const updateReportStatus = async (reportId: string, status: string, assignedTo?: string) => {
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
      if (updateMessage.trim()) {
        await supabase
          .from('report_updates')
          .insert({
            report_id: reportId,
            user_id: user?.id,
            status,
            message: updateMessage.trim(),
          });
      }

      toast({
        title: "Report Updated",
        description: "The report status has been updated successfully.",
      });

      setUpdateMessage('');
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
  };

  const assignReport = async (reportId: string, departmentId: string) => {
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
  };

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

            <div className="text-sm text-muted-foreground flex items-center">
              {filteredReports.length} of {reports.length} reports
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reports List */}
      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <Card key={report.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{report.title}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {report.profiles?.full_name || 'Unknown User'}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {report.address || 'No address'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(report.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: report.categories?.color }}
                      />
                      {report.categories?.name}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`${priorityConfig[report.priority].color} text-white`}
                    >
                      {priorityConfig[report.priority].label}
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={`${statusConfig[report.status].color} text-white`}
                    >
                      {statusConfig[report.status].label}
                    </Badge>
                  </div>
                  {report.assigned_user && (
                    <div className="text-sm text-muted-foreground">
                      Assigned to: {report.assigned_user.full_name}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{report.description}</p>
              
              {report.photos && report.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {report.photos.slice(0, 3).map((photo, index) => (
                    <img
                      key={index}
                      src={photo}
                      alt={`Report photo ${index + 1}`}
                      className="w-full h-20 object-cover rounded-md"
                    />
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ThumbsUp className="h-4 w-4" />
                    {report.votes_count} votes
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    {report.views_count} views
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select
                    defaultValue={report.departments?.id || ""}
                    onValueChange={(value) => assignReport(report.id, value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Assign Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Update Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Update Report Status</DialogTitle>
                        <DialogDescription>
                          Update the status of "{report.title}"
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>New Status</Label>
                          <Select 
                            defaultValue={report.status}
                            onValueChange={(value) => {
                              if (selectedReport) {
                                setSelectedReport({ ...selectedReport, status: value as any });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="submitted">Submitted</SelectItem>
                              <SelectItem value="acknowledged">Acknowledged</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="resolved">Resolved</SelectItem>
                              <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Assign to Staff Member (Optional)</Label>
                          <Select onValueChange={(value) => {
                            if (selectedReport) {
                              setSelectedReport({ ...selectedReport, assigned_to: value });
                            }
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select staff member" />
                            </SelectTrigger>
                            <SelectContent>
                              {staff.map((member) => (
                                <SelectItem key={member.user_id} value={member.user_id}>
                                  {member.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label>Update Message (Optional)</Label>
                          <Textarea
                            placeholder="Provide an update message for the citizen..."
                            value={updateMessage}
                            onChange={(e) => setUpdateMessage(e.target.value)}
                          />
                        </div>

                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setSelectedReport(null)}>
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => {
                              if (selectedReport) {
                                updateReportStatus(
                                  selectedReport.id, 
                                  selectedReport.status,
                                  selectedReport.assigned_to
                                );
                              }
                            }}
                          >
                            Update Report
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
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