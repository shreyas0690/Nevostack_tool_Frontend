import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

export interface CompanyFeatures {
  attendance: boolean;
  leaveManagement: boolean;
  taskManagement: boolean;
  meetingScheduler: boolean;
  deviceTracking: boolean;
  reports: boolean;
  notifications: boolean;
  analytics: boolean;
  meetings: boolean;
  apiAccess: boolean;
  customBranding: boolean;
}

export interface FeatureAccess {
  features: CompanyFeatures;
  isLoading: boolean;
  error: string | null;
  hasFeature: (feature: keyof CompanyFeatures) => boolean;
  hasAnyFeature: (features: (keyof CompanyFeatures)[]) => boolean;
  hasAllFeatures: (features: (keyof CompanyFeatures)[]) => boolean;
}

const defaultFeatures: CompanyFeatures = {
  attendance: false,
  leaveManagement: false,
  taskManagement: false,
  meetingScheduler: false,
  deviceTracking: false,
  reports: false,
  notifications: false,
  analytics: false,
  meetings: false,
  apiAccess: false,
  customBranding: false,
};

export const useFeatureAccess = (): FeatureAccess => {
  const [features, setFeatures] = useState<CompanyFeatures>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Track hook calls
  console.log('🔍 useFeatureAccess hook called');
  console.log('🔍 Current state:', { features, isLoading, error });

  useEffect(() => {
    const fetchCompanyFeatures = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
         // Get current user's company features
         const response = await apiService.get('/api/companies/features');
        
        console.log('🔍 Full API Response:', response);
        console.log('🔍 Response Data:', response.data);
        console.log('🔍 Response Success:', response.success);
        
            // Check different possible response structures
            let features = null;
            
            if (response.data && (response.data as any).features) {
              // Direct features in data
              features = (response.data as any).features;
              console.log('✅ Features found in response.data.features:', features);
            } else if (response.data && (response.data as any).data && (response.data as any).data.features) {
              // Nested features in data.data.features
              features = (response.data as any).data.features;
              console.log('✅ Features found in response.data.data.features:', features);
            } else if ((response as any).features) {
              // Direct features in response
              features = (response as any).features;
              console.log('✅ Features found in response.features:', features);
            }
        
        if (features) {
          console.log('✅ Setting features from API:', features);
          setFeatures(features);
        } else {
          console.log("❌ No features found, using defaults");
          console.log("Full response structure:", JSON.stringify(response, null, 2));
          console.log('🔧 Using default features:', defaultFeatures);
          setFeatures(defaultFeatures);
        }
      } catch (err) {
        console.error('Error fetching company features:', err);
        setError('Failed to load company features');
        setFeatures(defaultFeatures);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyFeatures();
  }, []);

  const hasFeature = (feature: keyof CompanyFeatures): boolean => {
    return features[feature] === true;
  };

  const hasAnyFeature = (featureList: (keyof CompanyFeatures)[]): boolean => {
    return featureList.some(feature => hasFeature(feature));
  };

  const hasAllFeatures = (featureList: (keyof CompanyFeatures)[]): boolean => {
    return featureList.every(feature => hasFeature(feature));
  };

  // Debug: Log when features change
  useEffect(() => {
    console.log('🔍 Features changed:', features);
    console.log('🔍 Feature summary:', {
      taskManagement: features.taskManagement,
      leaveManagement: features.leaveManagement,
      attendance: features.attendance,
      analytics: features.analytics,
      reports: features.reports,
      meetings: features.meetings
    });
  }, [features]);

  return {
    features,
    isLoading,
    error,
    hasFeature,
    hasAnyFeature,
    hasAllFeatures,
  };
};

// Feature mapping for admin panel sections
export const FEATURE_SECTION_MAP: Record<string, (keyof CompanyFeatures)[]> = {
  // Admin sections
  dashboard: [], // Always available
  tasks: ['taskManagement'],
  departments: [], // Always available for basic management
  users: [], // Always available for basic management
  meetings: ['meetings', 'meetingScheduler'],
  leave: ['leaveManagement'],
  attendance: ['attendance'],
  analytics: ['analytics'],
  reports: ['reports'],
  settings: [], // Always available
  
  // HOD sections
  'my-tasks': [], // Always available (personal tasks)
  team: [], // Always available for HOD
  profile: [], // Always available
  
  // Manager sections
  'team-tasks': ['taskManagement'], // Requires task management feature
  
  // HR sections
  'hr-dashboard': [], // Always available
  
  // Member sections
  'my-profile': [], // Always available
};

export type AdminSection = keyof typeof FEATURE_SECTION_MAP;
