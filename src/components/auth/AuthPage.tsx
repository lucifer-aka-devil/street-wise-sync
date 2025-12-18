import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { AlertTriangle, Loader2, MapPin, Users, Landmark, Camera, ScrollText } from 'lucide-react';
import { useState } from 'react';

// Heritage places data - Famous ASI protected monuments
const heritagePlaces = [
  {
    name: "Taj Mahal",
    location: "Agra, Uttar Pradesh",
    description: "UNESCO World Heritage Site - A symbol of eternal love and Mughal architecture",
    image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=250&fit=crop"
  },
  {
    name: "Qutub Minar",
    location: "New Delhi",
    description: "UNESCO World Heritage Site - 73m tall victory tower from the 12th century",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=250&fit=crop"
  },
  {
    name: "Hampi Ruins",
    location: "Karnataka",
    description: "UNESCO World Heritage Site - Ruins of the Vijayanagara Empire",
    image: "https://images.unsplash.com/photo-1600100397608-e1d09b82a41e?w=400&h=250&fit=crop"
  },
  {
    name: "Konark Sun Temple",
    location: "Odisha",
    description: "UNESCO World Heritage Site - 13th century temple dedicated to the Sun God",
    image: "https://images.unsplash.com/photo-1621427642595-9bd5c0bb1929?w=400&h=250&fit=crop"
  }
];

export default function AuthPage() {
  const { signIn, signUp, loading } = useAuth();
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    await signIn(email, password);
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    await signUp(email, password, fullName);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(35_30%_95%)] via-[hsl(35_35%_92%)] to-[hsl(30_25%_88%)] heritage-pattern">
      {/* Decorative top border */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary" />
      
      {/* Language Selector - Fixed position */}
      <div className="fixed top-6 right-4 z-50">
        <LanguageSelector />
      </div>
      
      <div className="container mx-auto px-4 py-8 lg:py-12">
        {/* Main content grid */}
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left side - Branding & Features */}
          <div className="space-y-8 text-center lg:text-left order-2 lg:order-1">
            {/* Header Section with Heritage styling */}
            <div className="space-y-6">
              <div className="flex items-center justify-center lg:justify-start gap-4">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl overflow-hidden border-2 border-accent/30">
                  <img
                    src="/logo.png"
                    alt="Archaeological Survey of India Logo"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain p-1"
                  />
                </div>
                <div className="text-left">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading-heritage" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Archaeological Survey of India
                  </h1>
                  <p className="text-lg sm:text-xl text-muted-foreground font-medium" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Heritage Reporting Portal
                  </p>
                </div>
              </div>
              
              {/* Heritage tagline */}
              <div className="max-w-2xl mx-auto lg:mx-0">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
                  <div className="h-px w-8 bg-gradient-to-r from-transparent to-accent" />
                  <ScrollText className="w-5 h-5 text-accent" />
                  <div className="h-px w-8 bg-gradient-to-l from-transparent to-accent" />
                </div>
                <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed italic" style={{ fontFamily: "'Playfair Display', serif" }}>
                  "Protecting India's Cultural Heritage — Every report contributes to our legacy"
                </p>
              </div>
            </div>

            {/* Features Grid with Heritage styling */}
            <div className="grid sm:grid-cols-1 gap-5 max-w-2xl mx-auto lg:mx-0">
              <div className="flex items-start gap-4 p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 heritage-texture">
                <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex-shrink-0 border border-primary/20">
                  <Landmark className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Heritage Documentation
                  </h3>
                  <p className="text-muted-foreground mt-1">Document and preserve archaeological sites, monuments and heritage structures</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 heritage-texture">
                <div className="p-3 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex-shrink-0 border border-accent/20">
                  <Camera className="h-6 w-6 text-accent" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Site Preservation
                  </h3>
                  <p className="text-muted-foreground mt-1">Report and track preservation efforts at heritage sites across India</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 shadow-md hover:shadow-lg transition-all duration-300 heritage-texture">
                <div className="p-3 bg-gradient-to-br from-[hsl(85_45%_40%)]/20 to-[hsl(85_45%_40%)]/10 rounded-xl flex-shrink-0 border border-[hsl(85_45%_40%)]/20">
                  <Users className="h-6 w-6 text-[hsl(85_45%_40%)]" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-foreground text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Community Participation
                  </h3>
                  <p className="text-muted-foreground mt-1">Join hands with citizens to protect our collective cultural heritage</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Auth Form */}
          <div className="space-y-6 order-1 lg:order-2">
            <Card className="w-full max-w-md mx-auto lg:max-w-lg bg-card/95 backdrop-blur-sm border-2 border-border/50 shadow-2xl relative overflow-hidden">
              {/* Decorative corner ornaments */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-4 border-l-4 border-accent/40 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-16 h-16 border-t-4 border-r-4 border-accent/40 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b-4 border-l-4 border-accent/40 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-4 border-r-4 border-accent/40 rounded-br-lg" />
              
              <CardHeader className="space-y-2 pb-6 pt-8">
                <div className="flex justify-center mb-2">
                  <div className="p-3 bg-gradient-to-br from-primary to-accent rounded-full shadow-lg">
                    <ScrollText className="w-6 h-6 text-primary-foreground" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold text-center text-foreground" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {t('auth.welcome')}
                </CardTitle>
                <CardDescription className="text-center text-muted-foreground text-base">
                  {t('auth.welcomeDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-secondary p-1 rounded-lg">
                    <TabsTrigger 
                      value="signin" 
                      className="data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary rounded-md transition-all"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {t('auth.signIn')}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="data-[state=active]:bg-card data-[state=active]:shadow-md data-[state=active]:text-primary rounded-md transition-all"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                      {t('auth.signUp')}
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="space-y-4 mt-6">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="text-foreground font-medium">{t('auth.email')}</Label>
                        <Input
                          id="signin-email"
                          name="email"
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
                          required
                          className="h-11 bg-background/50 border-border focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="text-foreground font-medium">{t('auth.password')}</Label>
                        <Input
                          id="signin-password"
                          name="password"
                          type="password"
                          required
                          className="h-11 bg-background/50 border-border focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        disabled={isLoading || loading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('auth.signingIn')}
                          </>
                        ) : (
                          t('auth.signInButton')
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="space-y-4 mt-6">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-foreground font-medium">{t('auth.fullName')}</Label>
                        <Input
                          id="signup-name"
                          name="fullName"
                          type="text"
                          placeholder={t('auth.fullNamePlaceholder')}
                          required
                          className="h-11 bg-background/50 border-border focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-foreground font-medium">{t('auth.email')}</Label>
                        <Input
                          id="signup-email"
                          name="email"
                          type="email"
                          placeholder={t('auth.emailPlaceholder')}
                          required
                          className="h-11 bg-background/50 border-border focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-foreground font-medium">{t('auth.password')}</Label>
                        <Input
                          id="signup-password"
                          name="password"
                          type="password"
                          required
                          minLength={6}
                          placeholder={t('auth.passwordPlaceholder')}
                          className="h-11 bg-background/50 border-border focus:border-primary focus:ring-primary"
                        />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-200" 
                        style={{ fontFamily: "'Playfair Display', serif" }}
                        disabled={isLoading || loading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {t('auth.creatingAccount')}
                          </>
                        ) : (
                          t('auth.signUpButton')
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Heritage Places Section */}
        <div className="mt-16 max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-accent" />
              <Landmark className="w-8 h-8 text-accent" />
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-accent" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-heading-heritage mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              India's Protected Monuments
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto" style={{ fontFamily: "'Playfair Display', serif" }}>
              Discover the magnificent heritage sites protected by the Archaeological Survey of India
            </p>
          </div>

          {/* Heritage Places Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {heritagePlaces.map((place, index) => (
              <div 
                key={index}
                className="group bg-card/90 backdrop-blur-sm rounded-xl overflow-hidden border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={place.image} 
                    alt={place.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <h3 className="text-primary-foreground font-bold text-lg" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {place.name}
                    </h3>
                    <div className="flex items-center gap-1 text-primary-foreground/80 text-sm">
                      <MapPin className="w-3 h-3" />
                      {place.location}
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {place.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer tagline */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 bg-card/80 rounded-full border border-border/50 shadow-md">
              <Landmark className="w-5 h-5 text-primary" />
              <p className="text-muted-foreground text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                Join us in preserving and protecting India's cultural heritage for future generations
              </p>
              <Landmark className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative bottom border */}
      <div className="h-2 bg-gradient-to-r from-primary via-accent to-primary mt-8" />
    </div>
  );
}
