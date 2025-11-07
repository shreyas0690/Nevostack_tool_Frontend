import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/components/Auth/AuthProvider';
import { companyService } from '@/services/companyService';

interface CompanyData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
  domain?: string;
  website?: string;
  industry?: string;
  employeeCount?: string;
  description?: string;
  logo?: string;
  status?: string;
}

interface CompanyContextType {
  companyData: CompanyData | null;
  setCompanyData: (data: CompanyData) => void;
  isCompanyRegistered: boolean;
  clearCompanyData: () => void;
  isLoading: boolean;
  refetchCompanyData: () => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [companyData, setCompanyDataState] = useState<CompanyData | null>(null);
  const [isCompanyRegistered, setIsCompanyRegistered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  // Fetch company data from backend API
  const fetchCompanyData = async () => {
    if (!currentUser?.companyId) {
      console.log('⚠️ No company ID found for user:', currentUser);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Fetching company data for ID:', currentUser.companyId);
      const response = await companyService.getCompanyById(currentUser.companyId);
      
      if (response?.data) {
        const company = response.data;
        console.log('✅ Company data loaded from API:', company.name);
        
        // Transform the API response to match our interface
        const transformedCompany: CompanyData = {
          id: company.id,
          name: company.name,
          email: company.email,
          phone: company.phone,
          address: company.address,
          domain: company.domain,
          logo: company.logo,
          status: company.status
        };
        
        setCompanyDataState(transformedCompany);
        setIsCompanyRegistered(true);
        
        // Also store in localStorage for offline access
        localStorage.setItem('nevostack_company', JSON.stringify(transformedCompany));
      }
    } catch (error) {
      console.error('❌ Failed to fetch company data:', error);
      
      // Fallback to localStorage if API fails
      const storedCompany = localStorage.getItem('nevostack_company');
      if (storedCompany) {
        const company = JSON.parse(storedCompany);
        setCompanyDataState(company);
        setIsCompanyRegistered(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch company data when user changes or component mounts
  useEffect(() => {
    if (currentUser?.companyId) {
      fetchCompanyData();
    } else {
      // If no company ID, try to load from localStorage
      const storedCompany = localStorage.getItem('nevostack_company');
      if (storedCompany) {
        const company = JSON.parse(storedCompany);
        setCompanyDataState(company);
        setIsCompanyRegistered(true);
      }
    }
  }, [currentUser?.companyId]);

  const setCompanyData = (data: CompanyData) => {
    setCompanyDataState(data);
    setIsCompanyRegistered(true);
    localStorage.setItem('nevostack_company', JSON.stringify(data));
  };

  const clearCompanyData = () => {
    setCompanyDataState(null);
    setIsCompanyRegistered(false);
    localStorage.removeItem('nevostack_company');
  };

  const refetchCompanyData = () => {
    fetchCompanyData();
  };

  return (
    <CompanyContext.Provider value={{ 
      companyData, 
      setCompanyData, 
      isCompanyRegistered, 
      clearCompanyData,
      isLoading,
      refetchCompanyData
    }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider');
  }
  return context;
}
