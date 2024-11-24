import { store } from '../store';
import { useState, useEffect } from 'react';
import { 
  addBlock, 
  updateNetworkStats, 
  updateMempoolTransactions 
} from '../store/slices/blockchainSlice';
import { toast } from 'react-toastify';

const MessageTypes = {
  NEW_BLOCK: 'NEW_BLOCK',
  NEW_TRANSACTION: 'NEW_TRANSACTION',
  CHAIN_UPDATE: 'CHAIN_UPDATE',
  PEER_CONNECTED: 'PEER_CONNECTED',
  PEER_DISCONNECTED: 'PEER_DISCONNECTED',
  MINING_STATUS: 'MINING_STATUS',
  NETWORK_STATS: 'NETWORK_STATS',
  MEMPOOL_UPDATE: 'MEMPOOL_UPDATE'
};

export class WebSocketService {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws';
    this.isConnecting = false;
    this.intentionalClose = false;
    this.reconnectTimeout = null;
    this.initialConnection = true;
    this.pingInterval = null;
    this.pongTimeout = null;
    this.pingIntervalTime = 30000; // 30 seconds
    this.pongTimeoutTime = 10000; // 10 seconds
    this.connectionStatus = {
      isConnected: false,
      hasConnectedBefore: false
    };
  }

  connect() {
    if (this.isConnecting || this.isConnected()) {
      return;
    }

    try {
      this.isConnecting = true;
      this.intentionalClose = false;
      console.log('Connecting to WebSocket:', this.wsUrl);
      
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.ws = new WebSocket(this.wsUrl);
      this.setupEventHandlers();
    } catch (error) {
      this.handleError(error);
    }
  }

  setupEventHandlers() {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('WebSocket connected successfully');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.clearReconnectTimeout();
      this.connectionStatus.isConnected = true;
      
      this.startPingPong();
      
      if (!this.initialConnection && !this.intentionalClose) {
        if (this.connectionStatus.hasConnectedBefore) {
          toast.success('Reconnected to blockchain network', {
            toastId: 'ws-reconnected'
          });
        } else {
          toast.success('Connected to blockchain network', {
            toastId: 'ws-connected'
          });
          this.connectionStatus.hasConnectedBefore = true;
        }
      }
      this.initialConnection = false;
    };

    this.ws.onmessage = (event) => {
      try {
        if (typeof event.data === 'string' && event.data.includes('Connected')) {
          console.log('Received connection confirmation:', event.data);
          if (this.initialConnection) {
            toast.success('Connected to blockchain network', {
              toastId: 'ws-connected'
            });
            this.initialConnection = false;
          }
          return;
        }

        const data = JSON.parse(event.data);
        this.handleWebSocketMessage(data);
      } catch (error) {
        if (!event.data.includes('Connected')) {
          console.error('Error parsing WebSocket message:', error);
        }
      }
    };

    this.ws.onclose = (event) => {
      this.isConnecting = false;
      this.connectionStatus.isConnected = false;
      console.log('WebSocket connection closed:', event);
      
      if (!this.intentionalClose && !this.initialConnection) {
        toast.warning('Connection to blockchain network lost', {
          toastId: 'ws-disconnected'
        });
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      if (!this.initialConnection) {
        this.handleError(error);
      } else {
        console.error('Initial WebSocket connection error:', error);
      }
    };
  }

  handleError(error) {
    this.isConnecting = false;
    console.error('WebSocket error:', error);
    
    if (!this.initialConnection && !this.intentionalClose) {
      toast.error('WebSocket connection error', {
        toastId: 'ws-error'
      });
    }
  }

  handleWebSocketMessage(data) {
    if (!data || !data.type) {
      console.log('Received non-event message:', data);
      return;
    }

    switch(data.type) {
      case 'PONG':
        if (this.pongTimeout) {
          clearTimeout(this.pongTimeout);
          this.pongTimeout = null;
        }
        break;

      case MessageTypes.NEW_BLOCK:
        store.dispatch(addBlock(data.payload));
        toast.info(`New block mined: ${data.payload.hash.slice(0, 8)}...`, {
          toastId: `block-${data.payload.hash.slice(0, 8)}`
        });
        break;

      case MessageTypes.NEW_TRANSACTION:
        store.dispatch(addTransaction(data.payload));
        break;

      case MessageTypes.CHAIN_UPDATE:
        store.dispatch(updateChain(data.payload));
        break;

      case MessageTypes.PEER_CONNECTED:
        store.dispatch(addPeer(data.payload));
        toast.info(`New peer connected: ${data.payload.id.slice(0, 8)}...`, {
          toastId: `peer-${data.payload.id.slice(0, 8)}`
        });
        break;

      case MessageTypes.PEER_DISCONNECTED:
        store.dispatch(removePeer(data.payload));
        break;

      case MessageTypes.MINING_STATUS:
        store.dispatch(updateMiningStatus(data.payload));
        break;

      case MessageTypes.NETWORK_STATS:
        store.dispatch(updateNetworkStats(data.payload));
        break;

      case MessageTypes.MEMPOOL_UPDATE:
        store.dispatch(updateMempoolTransactions(data.payload));
        break;

      default:
        console.log('Unhandled websocket message type:', data.type);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && !this.isConnecting && !this.intentionalClose) {
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Attempting to reconnect in ${delay/1000} seconds...`);
      
      this.clearReconnectTimeout();
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.connect();
      }, delay);
    }
  }

  clearReconnectTimeout() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  disconnect() {
    this.intentionalClose = true;
    this.clearReconnectTimeout();
    this.stopPingPong();
    this.connectionStatus.isConnected = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
    
    this.isConnecting = false;
  }

  isConnected() {
    return this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionStatus() {
    return {
      ...this.connectionStatus,
      isConnected: this.isConnected()
    };
  }

  startPingPong() {
    this.pingInterval = setInterval(() => {
      if (this.isConnected()) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
        
        this.pongTimeout = setTimeout(() => {
          console.log('Pong not received, reconnecting...');
          this.reconnect();
        }, this.pongTimeoutTime);
      }
    }, this.pingIntervalTime);
  }

  stopPingPong() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = null;
    }
  }

  reconnect() {
    this.ws?.close();
    this.handleReconnect();
  }

  cleanup() {
    this.disconnect();
    this.stopPingPong();
    this.clearReconnectTimeout();
  }
}

export const wsService = new WebSocketService();

export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState(wsService.getConnectionStatus());

  useEffect(() => {
    const checkConnection = () => {
      const status = wsService.getConnectionStatus();
      setConnectionStatus(status);
    };

    if (!wsService.isConnected() && !wsService.isConnecting) {
      wsService.connect();
    }

    checkConnection();
    const interval = setInterval(checkConnection, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return connectionStatus;
}; 