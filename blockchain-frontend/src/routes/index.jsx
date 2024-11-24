import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Staking from '../pages/Staking';
import Governance from '../pages/Governance';
import Wallet from '../pages/Wallet';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/staking" element={<Staking />} />
      <Route path="/governance" element={<Governance />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="*" element={<div>404 - Page Not Found</div>} />
    </Routes>
  );
}

export default AppRoutes; 