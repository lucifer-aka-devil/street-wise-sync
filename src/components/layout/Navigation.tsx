import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { 
  Home, 
  Shield, 
  User, 
  LogOut, 
  FileText,
  Settings
} from 'lucide-react';

interface NavigationProps {
  currentView: 'citizen' | 'admin';
  onViewChange: (view: 'citizen' | 'admin') => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, profile, signOut, isStaff } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold">
                  JH
                </div>
                <div>
                  <h1 className="text-xl font-bold text-primary">Government of Jharkhand</h1>
                  <p className="text-xs text-muted-foreground">Civic Reporting Portal</p>
                </div>
              </div>
            </div>
            
            {user && (
              <div className="flex space-x-4">
                <Button
                  variant={currentView === 'citizen' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('citizen')}
                  className="flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Citizen Portal
                </Button>
                
                {isStaff && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('admin')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Admin Dashboard
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span>
                    {profile?.full_name || user.email}
                    {profile?.role && profile.role !== 'citizen' && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        ({profile.role})
                      </span>
                    )}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Please sign in to access the platform
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}