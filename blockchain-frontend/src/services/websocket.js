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
      hasConnectedBefore: false,
      lastPing: null,
      reconnectAttempts: 0
    };
    this.subscribers = new Map();
    this.lastBlockchainState = null;
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
    };

    this.ws.onmessage = (event) => {
      try {
        // First, try to parse as JSON
        const data = JSON.parse(event.data);
        console.log('Received message:', data);

        // Handle different message types
        switch (data.type) {
          case 'BLOCKCHAIN_STATE':
            this.lastBlockchainState = data.data;
            this.notifySubscribers('BLOCKCHAIN_STATE', data.data);
            break;

          case 'PONG':
            console.log('Received PONG with data:', data.data);
            if (data.data) {
                this.lastBlockchainState = data.data;
                this.notifySubscribers('BLOCKCHAIN_STATE', data.data);
            }
            break;

          case 'Connected to Nexuschain WebSocket':
            console.log('Connected to blockchain node');
            break;

          default:
            console.log('Received other message type:', data.type);
        }
      } catch (error) {
        // If it's not JSON, handle as plain text
        console.log('Received raw message:', event.data);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.handleError(error);
    };

    this.ws.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.connectionStatus.isConnected = false;
      if (!this.intentionalClose) {
        this.reconnect();
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
        this.connectionStatus.lastPing = new Date();
        
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

  getDetailedStatus() {
    return {
      isConnected: this.isConnected(),
      readyState: this.ws?.readyState,
      lastPing: this.connectionStatus.lastPing,
      reconnectAttempts: this.reconnectAttempts,
      url: this.wsUrl
    };
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }
    this.subscribers.get(eventType).add(callback);
    
    // Send initial state if available
    if (eventType === 'BLOCKCHAIN_STATE' && this.lastBlockchainState) {
      callback(this.lastBlockchainState);
    }

    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  notifySubscribers(eventType, data) {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in subscriber callback:', error);
        }
      });
    }
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