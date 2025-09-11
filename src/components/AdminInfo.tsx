import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Mail, Lock } from 'lucide-react';

export default function AdminInfo() {
  return (
    <Card className="mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Shield className="h-5 w-5" />
          Admin Portal Access
        </CardTitle>
        <CardDescription>
          Use these hardcoded credentials to access the admin portal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Email:</span>
            <Badge variant="secondary" className="font-mono">
              admin@civic.gov
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Password:</span>
            <Badge variant="secondary" className="font-mono">
              admin123
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}