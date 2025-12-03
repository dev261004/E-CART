import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from '@/routes/AppRoutes';
import { Toaster } from "react-hot-toast";
import "./styles/index.css";


createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
       <Toaster
      position="top-center"
      toastOptions={{
        duration: 2500,
      }}
    />
    </BrowserRouter>
  </React.StrictMode>
);