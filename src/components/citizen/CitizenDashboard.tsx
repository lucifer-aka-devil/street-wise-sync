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
  Filter,
  Map
} from 'lucide-react';
import ReportForm from './ReportForm';
import CitizenMapView from './MapView';

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

    // Set up real-time subscription for reports and votes
    const channel = supabase
      .channel('reports-and-votes-changes')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'report_votes'
        },
        () => {
          fetchReports();
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
        report_votes (user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    // Check if user has voted on each report
    const reportsWithVotes = data?.map((report: any) => ({
      ...report,
      user_voted: user ? (Array.isArray(report.report_votes) && report.report_votes.some((vote: any) => vote.user_id === user.id)) : false
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

    // Optimistically update the UI
    setReports(prevReports => 
      prevReports.map(report => {
        if (report.id === reportId) {
          return {
            ...report,
            user_voted: !hasVoted,
            votes_count: hasVoted ? report.votes_count - 1 : report.votes_count + 1
          };
        }
        return report;
      })
    );

    try {
      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from('report_votes')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', user.id);

        if (error) throw error;
        
        toast({
          title: "Vote removed",
          description: "Your vote has been removed from this report.",
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from('report_votes')
          .insert({
            report_id: reportId,
            user_id: user.id,
          });

        if (error) throw error;
        
        toast({
          title: "Vote added",
          description: "Your vote has been added to this report.",
        });
      }

      // Refresh reports to ensure consistency
      setTimeout(() => fetchReports(), 500);
    } catch (error: any) {
      console.error('Error voting:', error);
      
      // Revert optimistic update on error
      setReports(prevReports => 
        prevReports.map(report => {
          if (report.id === reportId) {
            return {
              ...report,
              user_voted: hasVoted,
              votes_count: hasVoted ? report.votes_count + 1 : report.votes_count - 1
            };
          }
          return report;
        })
      );
      
      toast({
        title: "Error",
        description: error.message || "There was an error processing your vote. Please try again.",
        variant: "destructive",
      });
    }
  };

  const ReportCard = ({ report }: { report: Report }) => {
    const StatusIcon = statusConfig[report.status].icon;
    
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start gap-3">
              <div className="space-y-2 min-w-0 flex-1">
                <CardTitle className="text-lg font-semibold text-slate-800 leading-tight">{report.title}</CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 flex-shrink-0 text-green-600" />
                  <span className="truncate">{report.address || 'Location not specified'}</span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${statusConfig[report.status].color}`}></div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1">
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: report.categories?.color }}
                />
                <span>{report.categories?.name}</span>
              </Badge>
              <Badge 
                className={`${priorityConfig[report.priority].color} text-white text-xs font-medium px-2.5 py-1`}
              >
                {priorityConfig[report.priority].label}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">{report.description}</p>
          
          {report.photos && report.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {report.photos.slice(0, 3).map((photo, index) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Report photo ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  loading="lazy"
                />
              ))}
              {report.photos.length > 3 && (
                <div className="w-full h-20 bg-slate-100 rounded-lg flex items-center justify-center text-xs text-slate-500 font-medium">
                  +{report.photos.length - 3} more
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <StatusIcon className="h-4 w-4" />
                <span className="font-medium">{statusConfig[report.status].label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleVote(report.id, report.user_voted || false)}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                report.user_voted 
                  ? 'text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100' 
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <ThumbsUp className="h-4 w-4" />
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8 sm:mb-10">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-2">
              Civic Reports
            </h1>
            <p className="text-base sm:text-lg text-slate-600">
              Report issues, track progress, and engage with your community for a better tomorrow
            </p>
          </div>
          <Button 
            onClick={() => setShowReportForm(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            <span className="sm:hidden">Report Issue</span>
            <span className="hidden sm:inline">New Report</span>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg bg-white/60 backdrop-blur-sm border border-white/20 shadow-sm">
            <TabsTrigger 
              value="all" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
            >
              All Reports
            </TabsTrigger>
            <TabsTrigger 
              value="mine" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600"
            >
              My Reports
            </TabsTrigger>
            <TabsTrigger 
              value="map" 
              className="text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 flex items-center gap-1"
            >
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {loading ? (
                <div className="col-span-full flex items-center justify-center py-16">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Loading reports...</p>
                  </div>
                </div>
              ) : reports.length === 0 ? (
                <div className="col-span-full text-center py-16">
                  <Filter className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p className="text-lg font-medium text-slate-600 mb-2">No reports found</p>
                  <p className="text-slate-500">Be the first to report an issue in your community!</p>
                </div>
              ) : (
                reports.map((report) => (
                  <ReportCard key={report.id} report={report} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="mine" className="mt-6 space-y-6">
            {!user ? (
              <Card className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="pt-8 text-center">
                  <p className="text-slate-600 text-lg">Please sign in to view your reports.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {myReports.length === 0 ? (
                  <div className="col-span-full text-center py-16">
                    <Plus className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-medium text-slate-600 mb-2">You haven't submitted any reports yet</p>
                    <p className="text-slate-500 mb-6">Start making a difference in your community today!</p>
                    <Button 
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200" 
                      onClick={() => setShowReportForm(true)}
                      size="lg"
                    >
                      <Plus className="mr-2 h-5 w-5" />
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

          <TabsContent value="map" className="mt-6">
            <div className="h-[600px] lg:h-[700px]">
              <CitizenMapView />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}