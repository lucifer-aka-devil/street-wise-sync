import { memo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  MapPin,
  Calendar,
  User,
  Eye,
  Edit,
  ThumbsUp,
  AlertCircle,
  Clock,
  Trash2,
  CheckCircle
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

interface ReportCardProps {
  report: Report;
  departments: Department[];
  staff: Staff[];
  onAssignReport: (reportId: string, departmentId: string) => Promise<void>;
  onUpdateReport: (reportId: string, status: string, assignedTo?: string, message?: string) => Promise<void>;
  onUpdatePriority: (reportId: string, priority: string) => Promise<void>;
  onDeleteReport: (reportId: string) => Promise<void>;
}

const statusConfig = {
  submitted: { label: 'Submitted', color: 'bg-blue-500', textColor: 'text-blue-600' },
  acknowledged: { label: 'Acknowledged', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500', textColor: 'text-orange-600' },
  resolved: { label: 'Resolved', color: 'bg-green-500', textColor: 'text-green-600' },
  rejected: { label: 'Rejected', color: 'bg-red-500', textColor: 'text-red-600' },
};

const priorityConfig = {
  low: { label: 'Low', color: 'bg-gray-500', textColor: 'text-gray-600', icon: Clock },
  medium: { label: 'Medium', color: 'bg-blue-500', textColor: 'text-blue-600', icon: Clock },
  high: { label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600', icon: AlertCircle },
  urgent: { label: 'Urgent', color: 'bg-red-500', textColor: 'text-red-600', icon: AlertCircle },
};

const ReportCard = memo(({ 
  report, 
  departments, 
  staff, 
  onAssignReport, 
  onUpdateReport,
  onUpdatePriority,
  onDeleteReport 
}: ReportCardProps) => {
  const PriorityIcon = priorityConfig[report.priority].icon;

  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <CardTitle className="text-lg leading-tight">{report.title}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
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
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="flex items-center gap-1">
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: report.categories?.color }}
                />
                {report.categories?.name}
              </Badge>
              <Select
                defaultValue={report.priority}
                onValueChange={(value) => onUpdatePriority(report.id, value)}
              >
                <SelectTrigger className="w-[110px] h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Low
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Medium
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      High
                    </div>
                  </SelectItem>
                  <SelectItem value="urgent">
                    <div className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Urgent
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              <Badge 
                variant="secondary" 
                className={`${statusConfig[report.status].color} text-white flex items-center gap-1`}
              >
                {statusConfig[report.status].label}
              </Badge>
            </div>
            {report.assigned_user && (
              <div className="text-sm text-muted-foreground">
                Assigned to: {report.assigned_user.full_name}
              </div>
            )}
            {report.departments && (
              <div className="text-sm text-muted-foreground">
                Department: {report.departments.name}
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{report.description}</p>
        
        {report.photos && report.photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            {report.photos.slice(0, 3).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Report photo ${index + 1}`}
                className="w-full h-20 object-cover rounded-md"
                loading="lazy"
              />
            ))}
            {report.photos.length > 3 && (
              <div className="w-full h-20 bg-muted rounded-md flex items-center justify-center text-sm text-muted-foreground">
                +{report.photos.length - 3} more
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ThumbsUp className="h-4 w-4" />
              {report.votes_count}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              {report.views_count}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select
              defaultValue={report.departments?.id || ""}
              onValueChange={(value) => onAssignReport(report.id, value)}
            >
              <SelectTrigger className="w-[160px]">
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

            <ReportUpdateDialog
              report={report}
              staff={staff}
              onUpdate={onUpdateReport}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUpdateReport(report.id, 'resolved')}
              className="text-green-600 hover:text-green-700"
              disabled={report.status === 'resolved'}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Mark Complete
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteReport(report.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

interface ReportUpdateDialogProps {
  report: Report;
  staff: Staff[];
  onUpdate: (reportId: string, status: string, assignedTo?: string, message?: string) => Promise<void>;
}

const ReportUpdateDialog = memo(({ report, staff, onUpdate }: ReportUpdateDialogProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>(report.status);
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [updateMessage, setUpdateMessage] = useState('');

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-1" />
          Update
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Report Status</DialogTitle>
          <DialogDescription>
            Update the status of "{report.title}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
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
            <Select value={selectedStaff} onValueChange={setSelectedStaff}>
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
            <Button variant="outline">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                onUpdate(
                  report.id, 
                  selectedStatus, 
                  selectedStaff || undefined, 
                  updateMessage.trim() || undefined
                );
              }}
            >
              Update Report
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
});

ReportCard.displayName = 'ReportCard';
ReportUpdateDialog.displayName = 'ReportUpdateDialog';

export default ReportCard;