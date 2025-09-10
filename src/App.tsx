import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import AuthPage from '@/components/auth/AuthPage';
import CitizenDashboard from '@/components/citizen/CitizenDashboard';
import AdminDashboard from '@/components/admin/AdminDashboard';
import Navigation from '@/components/layout/Navigation';

const queryClient = new QueryClient();

function MainApp() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'citizen' | 'admin'>('citizen');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation currentView={currentView} onViewChange={setCurrentView} />
      {currentView === 'citizen' ? <CitizenDashboard /> : <AdminDashboard />}
    </div>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <MainApp />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
