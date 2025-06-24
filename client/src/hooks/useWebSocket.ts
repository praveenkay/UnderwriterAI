import { useEffect, useRef, useState } from 'react';
import type { ChatMessage } from '../types';

interface UseWebSocketOptions {
  onMessage?: (message: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // WebSocket disabled to prevent connection loops during development
    console.log('WebSocket disabled to prevent connection loops');
    return;
  }, []);

  const sendMessage = (message: any) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage
  };
}
