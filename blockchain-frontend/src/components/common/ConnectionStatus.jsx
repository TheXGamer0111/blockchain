import React from 'react';
import { useWebSocket } from '../../services/websocket';

const ConnectionStatus = () => {
  const isConnected = useWebSocket();

  return (
    <div className="fixed bottom-4 right-4 flex items-center bg-gray-800 px-4 py-2 rounded-full shadow-lg">
      <div 
        className={`w-3 h-3 rounded-full mr-2 ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        } ${
          isConnected ? 'animate-pulse' : ''
        }`}
      />
      <span className="text-sm text-white">
        {isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
};

export default ConnectionStatus; 