import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/layout/Layout';
import AppRoutes from './routes';
import ConnectionStatus from './components/common/ConnectionStatus';
import { wsService, useWebSocket } from './services/websocket';
import WebSocketMonitor from './components/common/WebSocketMonitor';

function App() {
  const { isConnected, hasConnectedBefore } = useWebSocket();

  return (
    <Router>
      <Layout>
        <AppRoutes />
        {hasConnectedBefore && !isConnected && (
          <div className="fixed bottom-4 right-4">
            <div className="bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>Disconnected from network</span>
            </div>
          </div>
        )}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <WebSocketMonitor />
      </Layout>
    </Router>
  );
}

export default App;
    