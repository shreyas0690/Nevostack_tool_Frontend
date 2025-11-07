import * as React from "react";
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from "@/components/Auth/AuthProvider";
import { CompanyProvider } from "@/components/Company/CompanyProvider";
import { TenantProvider } from "@/components/SaaS/TenantProvider";
import App from './App.tsx'
import './index.css'

// Setup test user for development - DISABLED to show login page first
// import './utils/setupTestUser'
import './utils/debugHelper'

// Ensure React is available globally for all dependencies
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TenantProvider>
          <AuthProvider>
            <CompanyProvider>
              <App />
            </CompanyProvider>
          </AuthProvider>
        </TenantProvider>
      </ThemeProvider>
  );
}
