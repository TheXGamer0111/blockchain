import React, { useState, useEffect } from 'react';
import { wsService } from '../../services/websocket';
import { toast } from 'react-toastify';

const WebSocketMonitor = () => {
  const [status, setStatus] = useState(wsService.getDetailedStatus());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const checkStatus = setInterval(() => {
      setStatus(wsService.getDetailedStatus());
    }, 1000);

    return () => clearInterval(checkStatus);
  }, []);

  const getReadyStateText = (readyState) => {
    switch (readyState) {
      case 0: return 'Connecting';
      case 1: return 'Connected';
      case 2: return 'Closing';
      case 3: return 'Closed';
      default: return 'Unknown';
    }
  };

  const handleClick = () => {
    const details = wsService.getDetailedStatus();
    toast.info(
      <div className="space-y-2">
        <p><strong>Status:</strong> {getReadyStateText(details.readyState)}</p>
        <p><strong>URL:</strong> {details.url}</p>
        <p><strong>Last Ping:</strong> {details.lastPing ? new Date(details.lastPing).toLocaleTimeString() : 'N/A'}</p>
        <p><strong>Reconnect Attempts:</strong> {details.reconnectAttempts}</p>
      </div>,
      {
        toastId: 'ws-details',
        autoClose: 5000,
      }
    );
  };

  return (
    <div 
      onClick={handleClick}
      className="fixed bottom-4 right-4 flex items-center bg-gray-800 px-4 py-2 rounded-full 
        shadow-lg hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
    >
      <div 
        className={`w-3 h-3 rounded-full mr-2 ${
          status.isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
        }`}
      />
      <span className="text-sm text-white">
        {status.isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'}
      </span>
      {status.reconnectAttempts > 0 && (
        <span className="text-xs text-gray-400 ml-2">
          (Retries: {status.reconnectAttempts})
        </span>
      )}
    </div>
  );
};

export default WebSocketMonitor; 