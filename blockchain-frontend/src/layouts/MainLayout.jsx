import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import WalletConnect from '../components/wallet/WalletConnect';

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-blue-900">
      <div className="p-4">
        <h1 className="text-white text-2xl">Dashboard</h1>
        {children}
      </div>
    </div>
  );
}

export default MainLayout; 