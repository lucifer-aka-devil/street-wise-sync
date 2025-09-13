import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  Eye, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  Filter
} from 'lucide-react';
import ReportForm from './ReportForm';

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
  categories: {
    name: string;
    color: string;
  };
  user_voted?: boolean;
}

const statusConfig = {
  submitted: { label: 'Submitted', icon: Clock, color: 'bg-blue-500' },
  acknowledged: { label: 'Acknowledged', icon: Eye, color: 'bg-yellow-500' },
  in_progress: { label: 'In Progress', icon: AlertCircle, color: 'bg-orange-500' },
  resolved: { label: 'Resolved', icon: CheckCircle, color: 'bg-green-500' },
  rejected: { label: 'Rejected', icon: XCircle, color: 'bg-red-500' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-500' },
  medium: { label: 'Medium', color: 'bg-blue-500' },
  high: { label: 'High', color: 'bg-orange-500' },
  urgent: { label: 'Urgent', color: 'bg-red-500' },
};

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchReports();
    fetchMyReports();

    // Set up real-time subscription
    const channel = supabase
      .channel('reports-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reports'
        },
        () => {
          fetchReports();
          if (user) fetchMyReports();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories (name, color),
        report_votes!inner (user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    // Check if user has voted on each report
    const reportsWithVotes = data?.map(report => ({
      ...report,
      user_voted: user ? report.report_votes.some((vote: any) => vote.user_id === user.id) : false
    })) || [];

    setReports(reportsWithVotes as Report[]);
    setLoading(false);
  };

  const fetchMyReports = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('reports')
      .select(`
        *,
        categories (name, color)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching my reports:', error);
      return;
    }

    setMyReports((data || []) as Report[]);
  };

  const handleVote = async (reportId: string, hasVoted: boolean) => {
    if (!user) {
      toast({
        title: "Please sign in",
        description: "You need to be signed in to vote on reports.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('report_votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from('report_votes')
          .insert({
            report_id: reportId,
            user_id: user.id,
          });

        if (error) throw error;
      }

      // Refresh reports
      fetchReports();
    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: "There was an error processing your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ReportCard = ({ report }: { report: Report }) => {
    const StatusIcon = statusConfig[report.status].icon;
    
    return (
      <Card className="hover:shadow-md transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="space-y-1 min-w-0 flex-1">
              <CardTitle className="text-base sm:text-lg leading-tight">{report.title}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs sm:text-sm">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="truncate">{report.address || 'Location not specified'}</span>
              </CardDescription>
            </div>
            <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
              <Badge variant="outline" className="flex items-center gap-1 text-xs">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: report.categories?.color }}
                />
                <span className="truncate">{report.categories?.name}</span>
              </Badge>
              <Badge 
                variant="secondary" 
                className={`${priorityConfig[report.priority].color} text-white text-xs`}
              >
                {priorityConfig[report.priority].label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{report.description}</p>
          
          {report.photos && report.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
              {report.photos.slice(0, 3).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Report photo ${index + 1}`}
                  className="w-full h-16 sm:h-20 object-cover rounded-md"
                  loading="lazy"
                />
              ))}
              {report.photos.length > 3 && (
                <div className="w-full h-16 sm:h-20 bg-muted rounded-md flex items-center justify-center text-xs text-muted-foreground">
                  +{report.photos.length - 3} more
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <StatusIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{statusConfig[report.status].label}</span>
                <span className="sm:hidden">{statusConfig[report.status].label.substring(0, 8)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{new Date(report.created_at).toLocaleDateString()}</span>
                <span className="sm:hidden">{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(report.id, report.user_voted || false)}
              className={`flex items-center gap-1 text-xs sm:text-sm ${
                report.user_voted ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4" />
              {report.votes_count}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showReportForm) {
    return (
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <Button variant="outline" onClick={() => setShowReportForm(false)} size="sm">
            ← Back to Dashboard
          </Button>
        </div>
        <ReportForm onSuccess={() => setShowReportForm(false)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Civic Reports</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Report issues, track progress, and engage with your community
          </p>
        </div>
        <Button 
          onClick={() => setShowReportForm(true)}
          className="w-full sm:w-auto"
          size="sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          <span className="sm:hidden">Report Issue</span>
          <span className="hidden sm:inline">New Report</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="all" className="text-sm">All Reports</TabsTrigger>
          <TabsTrigger value="mine" className="text-sm">My Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4 sm:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : reports.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <p className="text-muted-foreground">No reports found.</p>
              </div>
            ) : (
              reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-4 sm:mt-6">
          {!user ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">Please sign in to view your reports.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {myReports.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">You haven't submitted any reports yet.</p>
                  <Button 
                    className="mt-4" 
                    onClick={() => setShowReportForm(true)}
                    size="sm"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Your First Report
                  </Button>
                </div>
              ) : (
                myReports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}