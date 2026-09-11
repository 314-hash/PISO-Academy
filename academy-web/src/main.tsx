import React from 'react';
import ReactDOM from 'react-dom/client';
import { AcademyProvider } from './context/AcademyContext';
import { AppContent } from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AcademyProvider>
      <AppContent />
    </AcademyProvider>
  </React.StrictMode>
);
