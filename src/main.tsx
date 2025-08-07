import * as React from "react";
import { createRoot } from 'react-dom/client'
import { AuthProvider } from "@/components/Auth/AuthProvider";
import App from './App.tsx'
import './index.css'

// Ensure React is available globally for all dependencies
if (typeof window !== 'undefined') {
  (window as any).React = React;
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
