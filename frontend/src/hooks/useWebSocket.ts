import { useEffect, useRef, useState } from "react";

export interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  autoReconnect?: boolean;
  reconnectInterval?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  messages: WebSocketMessage[];
  lastMessage: WebSocketMessage | null;
  sendMessage: (data: unknown) => void;
  clearMessages: () => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const { onMessage, autoReconnect = true, reconnectInterval = 3000 } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttempts = useRef(0);
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const connect = () => {
    const wsUrl = `ws://${window.location.host}/ws/`;
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WebSocket] Connected");
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onclose = (event) => {
        console.log("[WebSocket] Disconnected:", event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        if (autoReconnect) {
          const timeout = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`[WebSocket] Reconnecting... (attempt ${reconnectAttempts.current})`);
            connect();
          }, reconnectInterval);
          reconnectTimeoutRef.current = timeout;
        }
      };

      ws.onerror = (error) => {
        console.error("[WebSocket] Error:", error);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setMessages((prev) => [...prev, message]);
          setLastMessage(message);
          
          const callback = onMessageRef.current;
          if (callback) {
            callback(message);
          }
        } catch (error) {
          console.error("[WebSocket] Failed to parse message:", error);
        }
      };
    } catch (error) {
      console.error("[WebSocket] Failed to connect:", error);
    }
  };

  const sendMessage = (data: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn("[WebSocket] Cannot send message: not connected");
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setLastMessage(null);
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoReconnect, reconnectInterval]);

  return {
    isConnected,
    messages,
    lastMessage,
    sendMessage,
    clearMessages,
  };
}

export default useWebSocket;