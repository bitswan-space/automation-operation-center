// app/_components/NotificationProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Notification = {
  id: string;
  message: string;
  createdAt: string;
};

type NotificationContextType = {
  notifications: Notification[];
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("wss://your-api/ws/notifications");
    wsRef.current = ws;

    // ws.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   setNotifications((prev) => [data, ...prev]);
    // };

    ws.onclose = () => {
      // Optional: Add reconnect logic here
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};
