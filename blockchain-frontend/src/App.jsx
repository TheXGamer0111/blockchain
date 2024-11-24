import { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Layout from './components/layout/Layout';
import AppRoutes from './routes';
import ConnectionStatus from './components/common/ConnectionStatus';
import { wsService, useWebSocket } from './services/websocket';

function App() {
  const isWebSocketConnected = useWebSocket();

  useEffect(() => {
    if (!wsService.isConnected() && !wsService.isConnecting) {
      wsService.connect();
    }

    return () => {
      wsService.disconnect();
    };
  }, []);

  return (
    <Router>
      <Layout>
        <AppRoutes />
        <ConnectionStatus />
      </Layout>
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
        limit={1}
      />
    </Router>
  );
}

export default App;
