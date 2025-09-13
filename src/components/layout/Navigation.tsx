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
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand - Responsive */}
          <div className="flex items-center space-x-2 sm:space-x-8 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                  JH
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-xl font-bold text-primary truncate">
                    <span className="hidden sm:inline">Government of Jharkhand</span>
                    <span className="sm:hidden">Jharkhand Gov</span>
                  </h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">Civic Reporting Portal</p>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - Responsive */}
            {user && (
              <div className="hidden md:flex space-x-2">
                <Button
                  variant={currentView === 'citizen' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('citizen')}
                  className="flex items-center gap-2 text-sm"
                  size="sm"
                >
                  <Home className="h-4 w-4" />
                  <span className="hidden lg:inline">Citizen Portal</span>
                  <span className="lg:hidden">Citizen</span>
                </Button>
                
                {isStaff && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('admin')}
                    className="flex items-center gap-2 text-sm"
                    size="sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">Admin Dashboard</span>
                    <span className="lg:hidden">Admin</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* User Info and Actions - Responsive */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            {user ? (
              <>
                {/* User Info - Hidden on very small screens */}
                <div className="hidden sm:flex items-center space-x-2 text-sm min-w-0">
                  <User className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate max-w-[120px] md:max-w-none">
                    {profile?.full_name || user.email}
                    {profile?.role && profile.role !== 'citizen' && (
                      <span className="ml-1 text-xs text-muted-foreground hidden md:inline">
                        ({profile.role})
                      </span>
                    )}
                  </span>
                </div>
                
                {/* Mobile User Icon */}
                <div className="sm:hidden flex items-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-1 sm:gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <div className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                Please sign in to access the platform
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu */}
        {user && (
          <div className="md:hidden border-t pt-2 pb-2">
            <div className="flex space-x-2">
              <Button
                variant={currentView === 'citizen' ? 'default' : 'ghost'}
                onClick={() => onViewChange('citizen')}
                className="flex items-center gap-2 text-sm flex-1"
                size="sm"
              >
                <Home className="h-4 w-4" />
                Citizen
              </Button>
              
              {isStaff && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('admin')}
                  className="flex items-center gap-2 text-sm flex-1"
                  size="sm"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}