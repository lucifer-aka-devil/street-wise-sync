import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { 
  Home, 
  Shield, 
  User, 
  LogOut, 
  Landmark
} from 'lucide-react';

interface NavigationProps {
  currentView: 'citizen' | 'admin';
  onViewChange: (view: 'citizen' | 'admin') => void;
}

export default function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, profile, signOut, isStaff } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="bg-card/95 backdrop-blur-lg shadow-medium border-b border-border/50 sticky top-0 z-50 animate-fade-in">
      {/* Heritage decorative top line */}
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      
      <div className="container-responsive">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Logo and Brand - Heritage theme */}
          <div className="flex items-center space-x-4 sm:space-x-8 min-w-0">
            <div className="flex items-center min-w-0">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center text-primary-foreground font-bold text-sm sm:text-base flex-shrink-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-accent/30">
                  <Landmark className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold text-heading-heritage truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
                    <span className="hidden sm:inline">Archaeological Survey of India</span>
                    <span className="sm:hidden">ASI</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Heritage Reporting Portal
                  </p>
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - Heritage design */}
            {user && (
              <div className="hidden md:flex space-x-3">
                {/* Show citizen portal only for non-staff users */}
                {!isStaff && (
                  <Button
                    variant={currentView === 'citizen' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('citizen')}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      currentView === 'citizen' 
                        ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl' 
                        : 'hover:bg-secondary hover:text-primary'
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    size="sm"
                  >
                    <Home className="h-4 w-4" />
                    <span className="hidden lg:inline">{t('nav.citizenPortal')}</span>
                    <span className="lg:hidden">{t('nav.citizen')}</span>
                  </Button>
                )}
                
                {/* Only show admin dashboard for staff */}
                {isStaff && (
                  <Button
                    variant={currentView === 'admin' ? 'default' : 'ghost'}
                    onClick={() => onViewChange('admin')}
                    className={`flex items-center gap-2 text-sm font-medium transition-all duration-200 ${
                      currentView === 'admin' 
                        ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-lg hover:shadow-xl' 
                        : 'hover:bg-secondary hover:text-primary'
                    }`}
                    style={{ fontFamily: "'Playfair Display', serif" }}
                    size="sm"
                  >
                    <Shield className="h-4 w-4" />
                    <span className="hidden lg:inline">{t('nav.adminDashboard')}</span>
                    <span className="lg:hidden">{t('nav.admin')}</span>
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* User Info and Actions - Heritage styling */}
          <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
            {/* Language Selector */}
            <div className="animate-fade-in">
              <LanguageSelector />
            </div>
            {user ? (
              <>
                {/* User Info - Heritage Enhanced */}
                <div className="hidden sm:flex items-center space-x-3 text-sm min-w-0 animate-slide-up">
                  <div className="flex items-center gap-3 bg-gradient-to-r from-secondary to-muted rounded-xl px-4 py-2 shadow-soft hover:shadow-medium transition-all duration-300 border border-border/30">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate max-w-[120px] md:max-w-none font-semibold text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                        {profile?.full_name || user.email}
                      </div>
                      {profile?.role && profile.role !== 'citizen' && (
                        <div className="text-xs text-muted-foreground hidden md:block capitalize font-medium">
                          {profile.role}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Mobile User Icon */}
                <div className="sm:hidden flex items-center animate-fade-in">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center shadow-soft">
                    <User className="h-5 w-5 text-primary-foreground" />
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2 border-border hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all duration-300 touch-target hover:scale-105 shadow-sm hover:shadow-md"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline font-medium">{t('nav.signOut')}</span>
                </Button>
              </>
            ) : (
              <div className="text-sm text-muted-foreground hidden sm:block bg-gradient-to-r from-secondary to-muted px-4 py-2 rounded-xl shadow-soft animate-fade-in border border-border/30" style={{ fontFamily: "'Playfair Display', serif" }}>
                {t('nav.signInPrompt')}
              </div>
            )}
          </div>
        </div>
        
        {/* Mobile Navigation Menu - Heritage design */}
        {user && (
          <div className="md:hidden border-t border-border/50 pt-4 pb-4 bg-gradient-to-r from-secondary/80 to-card/80 backdrop-blur-sm animate-slide-up">
            <div className="flex space-x-3">
              {/* Show citizen portal only for non-staff users */}
              {!isStaff && (
                <Button
                  variant={currentView === 'citizen' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('citizen')}
                  className={`flex items-center gap-2 text-sm flex-1 font-medium transition-all duration-200 ${
                    currentView === 'citizen' 
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md' 
                      : 'hover:bg-secondary hover:text-primary'
                  }`}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  size="sm"
                >
                  <Home className="h-4 w-4" />
                  {t('nav.citizenPortal')}
                </Button>
              )}
              
              {/* Only show admin dashboard for staff */}
              {isStaff && (
                <Button
                  variant={currentView === 'admin' ? 'default' : 'ghost'}
                  onClick={() => onViewChange('admin')}
                  className={`flex items-center gap-2 text-sm flex-1 font-medium transition-all duration-200 ${
                    currentView === 'admin' 
                      ? 'bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-md' 
                      : 'hover:bg-secondary hover:text-primary'
                  }`}
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  size="sm"
                >
                  <Shield className="h-4 w-4" />
                  {t('nav.adminDashboard')}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
