import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation data
const translations = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',
    'nav.profile': 'Profile',
    'nav.signIn': 'Sign In',
    
    // Auth Page
    'auth.welcome': 'Welcome Back',
    'auth.welcomeDesc': 'Sign in to your account or create a new one to start reporting civic issues',
    'auth.subtitle': 'Official platform for citizens to report civic issues and track their resolution with transparency and efficiency',
    'auth.locationTitle': 'Location-Based Reporting',
    'auth.locationDesc': 'Report issues exactly where they occur with precise GPS coordinates',
    'auth.communityTitle': 'Community Engagement',
    'auth.communityDesc': 'Vote on issues that matter to you and engage with your community',
    'auth.trackingTitle': 'Real-Time Tracking',
    'auth.trackingDesc': 'Follow your reports from submission to resolution with live updates',
    'auth.signIn': 'Sign In',
    'auth.signUp': 'Sign Up',
    'auth.email': 'Email Address',
    'auth.emailPlaceholder': 'your@email.com',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Minimum 6 characters',
    'auth.fullName': 'Full Name',
    'auth.fullNamePlaceholder': 'John Doe',
    'auth.signInButton': 'Sign In',
    'auth.signUpButton': 'Create Account',
    'auth.signingIn': 'Signing in...',
    'auth.creatingAccount': 'Creating account...',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.adminLogin': 'Admin Login',
    'auth.adminEmail': 'admin@civic.gov',
    'auth.adminPassword': 'admin123',
    
    // Citizen Dashboard
    'citizen.title': 'Civic Reports',
    'citizen.subtitle': 'Report issues, track progress, and engage with your community for a better tomorrow',
    'citizen.newReport': 'New Report',
    'citizen.reportIssue': 'Report Issue',
    'citizen.allReports': 'All Reports',
    'citizen.myReports': 'My Reports',
    'citizen.loading': 'Loading reports...',
    'citizen.noReports': 'No reports found',
    'citizen.noReportsDesc': 'Be the first to report an issue in your community!',
    'citizen.signInToView': 'Please sign in to view your reports.',
    'citizen.noMyReports': "You haven't submitted any reports yet",
    'citizen.noMyReportsDesc': 'Start making a difference in your community today!',
    'citizen.submitFirst': 'Submit Your First Report',
    'citizen.backToDashboard': '← Back to Dashboard',
    'citizen.mapView': 'Map View',
    'citizen.voteAdded': 'Vote added',
    'citizen.voteAddedDesc': 'Your vote has been added to this report.',
    'citizen.voteRemoved': 'Vote removed',
    'citizen.voteRemovedDesc': 'Your vote has been removed from this report.',
    'citizen.signInToVote': 'Please sign in',
    'citizen.signInToVoteDesc': 'You need to be signed in to vote on reports.',
    'citizen.voteError': 'Error',
    'citizen.voteErrorDesc': 'There was an error processing your vote. Please try again.',
    'citizen.locationNotSpecified': 'Location not specified',
    
    // Navigation
    'nav.portal': 'Civic Reporting Portal',
    'nav.citizenPortal': 'Citizen Portal',
    'nav.citizen': 'Citizen',
    'nav.adminDashboard': 'Admin Dashboard',
    'nav.admin': 'Admin',
    'nav.signOut': 'Sign Out',
    'nav.signInPrompt': 'Please sign in to access the platform',
    
    // Report Form
    'report.title': 'Report a Civic Issue',
    'report.subtitle': 'Help improve your community by reporting issues that need attention',
    'report.titleLabel': 'Issue Title',
    'report.titlePlaceholder': 'Brief description of the issue',
    'report.descriptionLabel': 'Description',
    'report.descriptionPlaceholder': 'Provide detailed information about the issue...',
    'report.categoryLabel': 'Category',
    'report.categoryPlaceholder': 'Select a category',
    'report.priorityLabel': 'Priority',
    'report.priorityPlaceholder': 'Select priority level',
    'report.locationLabel': 'Location',
    'report.locationPlaceholder': 'Enter the address or location',
    'report.photosLabel': 'Photos (Optional)',
    'report.photosDesc': 'Upload photos to help illustrate the issue',
    'report.uploadPhotos': 'Upload Photos',
    'report.submitReport': 'Submit Report',
    'report.submitting': 'Submitting...',
    'report.success': 'Report submitted successfully!',
    'report.successDesc': 'Thank you for helping improve our community.',
    'report.error': 'Error submitting report',
    'report.fillRequired': 'Please fill in all required fields',
    'report.locationError': 'Location Error',
    'report.locationErrorDesc': 'Could not get your current location. You can manually enter the address.',
    'report.tooManyPhotos': 'Too many photos',
    'report.tooManyPhotosDesc': 'You can upload a maximum of 5 photos per report.',
    'report.errorDesc': 'There was an error submitting your report. Please try again.',
    
    // Admin Dashboard
    'admin.title': 'Admin Dashboard',
    'admin.subtitle': 'Manage civic reports and monitor community issues',
    'admin.quickStats': 'Quick Stats',
    'admin.totalReports': 'Total Reports',
    'admin.pendingReports': 'Pending Reports',
    'admin.resolvedReports': 'Resolved Reports',
    'admin.activeUsers': 'Active Users',
    'admin.recentReports': 'Recent Reports',
    'admin.viewAll': 'View All',
    'admin.updateStatus': 'Update Status',
    'admin.assignTo': 'Assign To',
    'admin.addUpdate': 'Add Update',
    'admin.deleteReport': 'Delete Report',
    'admin.confirmDelete': 'Are you sure you want to delete this report?',
    'admin.deleteSuccess': 'Report deleted successfully',
    'admin.deleteError': 'Error deleting report',
    'admin.statusUpdated': 'Status updated successfully',
    'admin.statusError': 'Error updating status',
    
    // Status Labels
    'status.submitted': 'Submitted',
    'status.acknowledged': 'Acknowledged',
    'status.in_progress': 'In Progress',
    'status.resolved': 'Resolved',
    'status.rejected': 'Rejected',
    
    // Priority Labels
    'priority.low': 'Low',
    'priority.medium': 'Medium',
    'priority.high': 'High',
    'priority.urgent': 'Urgent',
    
    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.language': 'Language',
    'common.selectLanguage': 'Select Language',
  },
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.reports': 'रिपोर्ट्स',
    'nav.profile': 'प्रोफाइल',
    'nav.signIn': 'साइन इन',
    
    // Auth Page
    'auth.welcome': 'वापसी पर स्वागत है',
    'auth.welcomeDesc': 'अपने खाते में साइन इन करें या नागरिक मुद्दों की रिपोर्ट करना शुरू करने के लिए नया खाता बनाएं',
    'auth.subtitle': 'नागरिकों के लिए नागरिक मुद्दों की रिपोर्ट करने और पारदर्शिता और दक्षता के साथ उनके समाधान को ट्रैक करने का आधिकारिक मंच',
    'auth.locationTitle': 'स्थान-आधारित रिपोर्टिंग',
    'auth.locationDesc': 'सटीक GPS निर्देशांक के साथ मुद्दों की रिपोर्ट करें जहां वे होते हैं',
    'auth.communityTitle': 'सामुदायिक सहभागिता',
    'auth.communityDesc': 'आपके लिए महत्वपूर्ण मुद्दों पर वोट करें और अपने समुदाय के साथ जुड़ें',
    'auth.trackingTitle': 'रीयल-टाइम ट्रैकिंग',
    'auth.trackingDesc': 'लाइव अपडेट के साथ सबमिशन से समाधान तक अपनी रिपोर्ट्स का पालन करें',
    'auth.signIn': 'साइन इन',
    'auth.signUp': 'साइन अप',
    'auth.email': 'ईमेल पता',
    'auth.emailPlaceholder': 'आपका@ईमेल.com',
    'auth.password': 'पासवर्ड',
    'auth.passwordPlaceholder': 'न्यूनतम 6 अक्षर',
    'auth.fullName': 'पूरा नाम',
    'auth.fullNamePlaceholder': 'राम कुमार',
    'auth.signInButton': 'साइन इन करें',
    'auth.signUpButton': 'खाता बनाएं',
    'auth.signingIn': 'साइन इन हो रहा है...',
    'auth.creatingAccount': 'खाता बनाया जा रहा है...',
    'auth.forgotPassword': 'पासवर्ड भूल गए?',
    'auth.noAccount': 'खाता नहीं है?',
    'auth.hasAccount': 'पहले से खाता है?',
    'auth.adminLogin': 'एडमिन लॉगिन',
    'auth.adminEmail': 'admin@civic.gov',
    'auth.adminPassword': 'admin123',
    
    // Citizen Dashboard
    'citizen.title': 'नागरिक रिपोर्ट्स',
    'citizen.subtitle': 'मुद्दों की रिपोर्ट करें, प्रगति ट्रैक करें, और बेहतर कल के लिए अपने समुदाय के साथ जुड़ें',
    'citizen.newReport': 'नई रिपोर्ट',
    'citizen.reportIssue': 'मुद्दा रिपोर्ट करें',
    'citizen.allReports': 'सभी रिपोर्ट्स',
    'citizen.myReports': 'मेरी रिपोर्ट्स',
    'citizen.loading': 'रिपोर्ट्स लोड हो रही हैं...',
    'citizen.noReports': 'कोई रिपोर्ट नहीं मिली',
    'citizen.noReportsDesc': 'अपने समुदाय में मुद्दा रिपोर्ट करने वाले पहले व्यक्ति बनें!',
    'citizen.signInToView': 'अपनी रिपोर्ट्स देखने के लिए कृपया साइन इन करें।',
    'citizen.noMyReports': 'आपने अभी तक कोई रिपोर्ट सबमिट नहीं की है',
    'citizen.noMyReportsDesc': 'आज ही अपने समुदाय में बदलाव लाना शुरू करें!',
    'citizen.submitFirst': 'अपनी पहली रिपोर्ट सबमिट करें',
    'citizen.backToDashboard': '← डैशबोर्ड पर वापस',
    'citizen.mapView': 'मैप व्यू',
    'citizen.voteAdded': 'वोट जोड़ा गया',
    'citizen.voteAddedDesc': 'आपका वोट इस रिपोर्ट में जोड़ दिया गया है।',
    'citizen.voteRemoved': 'वोट हटाया गया',
    'citizen.voteRemovedDesc': 'आपका वोट इस रिपोर्ट से हटा दिया गया है।',
    'citizen.signInToVote': 'कृपया साइन इन करें',
    'citizen.signInToVoteDesc': 'रिपोर्ट्स पर वोट करने के लिए आपको साइन इन करना होगा।',
    'citizen.voteError': 'त्रुटि',
    'citizen.voteErrorDesc': 'आपका वोट प्रोसेस करने में त्रुटि हुई। कृपया फिर से कोशिश करें।',
    'citizen.locationNotSpecified': 'स्थान निर्दिष्ट नहीं',
    
    // Navigation
    'nav.portal': 'नागरिक रिपोर्टिंग पोर्टल',
    'nav.citizenPortal': 'नागरिक पोर्टल',
    'nav.citizen': 'नागरिक',
    'nav.adminDashboard': 'एडमिन डैशबोर्ड',
    'nav.admin': 'एडमिन',
    'nav.signOut': 'साइन आउट',
    'nav.signInPrompt': 'प्लेटफॉर्म एक्सेस करने के लिए कृपया साइन इन करें',
    
    // Report Form
    'report.title': 'नागरिक मुद्दे की रिपोर्ट करें',
    'report.subtitle': 'ध्यान देने वाले मुद्दों की रिपोर्ट करके अपने समुदाय को बेहतर बनाने में मदद करें',
    'report.titleLabel': 'मुद्दे का शीर्षक',
    'report.titlePlaceholder': 'मुद्दे का संक्षिप्त विवरण',
    'report.descriptionLabel': 'विवरण',
    'report.descriptionPlaceholder': 'मुद्दे के बारे में विस्तृत जानकारी प्रदान करें...',
    'report.categoryLabel': 'श्रेणी',
    'report.categoryPlaceholder': 'श्रेणी चुनें',
    'report.priorityLabel': 'प्राथमिकता',
    'report.priorityPlaceholder': 'चुनें प्राथमिकता स्तर',
    'report.locationLabel': 'स्थान',
    'report.locationPlaceholder': 'पता या स्थान दर्ज करें',
    'report.photosLabel': 'फोटो (वैकल्पिक)',
    'report.photosDesc': 'मुद्दे को स्पष्ट करने के लिए फोटो अपलोड करें',
    'report.uploadPhotos': 'फोटो अपलोड करें',
    'report.submitReport': 'रिपोर्ट सबमिट करें',
    'report.submitting': 'सबमिट हो रहा है...',
    'report.success': 'रिपोर्ट सफलतापूर्वक सबमिट की गई!',
    'report.successDesc': 'हमारे समुदाय को बेहतर बनाने में मदद करने के लिए धन्यवाद।',
    'report.error': 'रिपोर्ट सबमिट करने में त्रुटि',
    'report.fillRequired': 'कृपया सभी आवश्यक फ़ील्ड भरें',
    'report.locationError': 'स्थान त्रुटि',
    'report.locationErrorDesc': 'आपका वर्तमान स्थान प्राप्त नहीं हो सका। आप मैन्युअल रूप से पता दर्ज कर सकते हैं।',
    'report.tooManyPhotos': 'बहुत सारी फोटो',
    'report.tooManyPhotosDesc': 'आप प्रति रिपोर्ट अधिकतम 5 फोटो अपलोड कर सकते हैं।',
    'report.errorDesc': 'आपकी रिपोर्ट सबमिट करने में त्रुटि हुई। कृपया फिर से कोशिश करें।',
    
    // Admin Dashboard
    'admin.title': 'एडमिन डैशबोर्ड',
    'admin.subtitle': 'नागरिक रिपोर्ट्स का प्रबंधन करें और समुदायिक मुद्दों की निगरानी करें',
    'admin.quickStats': 'त्वरित आंकड़े',
    'admin.totalReports': 'कुल रिपोर्ट्स',
    'admin.pendingReports': 'लंबित रिपोर्ट्स',
    'admin.resolvedReports': 'हल की गई रिपोर्ट्स',
    'admin.activeUsers': 'सक्रिय उपयोगकर्ता',
    'admin.recentReports': 'हाल की रिपोर्ट्स',
    'admin.viewAll': 'सभी देखें',
    'admin.updateStatus': 'स्थिति अपडेट करें',
    'admin.assignTo': 'को असाइन करें',
    'admin.addUpdate': 'अपडेट जोड़ें',
    'admin.deleteReport': 'रिपोर्ट हटाएं',
    'admin.confirmDelete': 'क्या आप वाकई इस रिपोर्ट को हटाना चाहते हैं?',
    'admin.deleteSuccess': 'रिपोर्ट सफलतापूर्वक हटाई गई',
    'admin.deleteError': 'रिपोर्ट हटाने में त्रुटि',
    'admin.statusUpdated': 'स्थिति सफलतापूर्वक अपडेट हुई',
    'admin.statusError': 'स्थिति अपडेट करने में त्रुटि',
    
    // Status Labels
    'status.submitted': 'सबमिट किया गया',
    'status.acknowledged': 'स्वीकार किया गया',
    'status.in_progress': 'प्रगति में',
    'status.resolved': 'हल हो गया',
    'status.rejected': 'अस्वीकार किया गया',
    
    // Priority Labels
    'priority.low': 'कम',
    'priority.medium': 'मध्यम',
    'priority.high': 'उच्च',
    'priority.urgent': 'तत्काल',
    
    // Common
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.view': 'देखें',
    'common.close': 'बंद करें',
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.language': 'भाषा',
    'common.selectLanguage': 'भाषा चुनें',
  }
};

interface LanguageProviderProps {
  children: ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'hi')) {
      setLanguageState(savedLanguage);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
