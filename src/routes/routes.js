// Import all necessary components and layouts
import Dashboard from '../pages/Dashboard';
import Blocks from '../pages/Blocks';
import Transactions from '../pages/Transactions';
import Staking from '../pages/Staking';
import Governance from '../pages/Governance';

export const routes = [
  {
    path: '/',
    element: Dashboard,
  },
  {
    path: '/blocks',
    element: Blocks,
  },
  {
    path: '/transactions',
    element: Transactions,
  },
  {
    path: '/staking',
    element: Staking,
  },
  {
    path: '/governance',
    element: Governance,
  },
]; 