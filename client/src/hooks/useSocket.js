import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { baseURL } from "../services/api";

export function useSocket(surveyId) {
  const socketRef = useRef(null);

  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!surveyId) {
      setConnected(false);
      setSocket(null);
      socketRef.current = null;
      setEvents([]);
      return;
    }

    let mounted = true;

    let socketOrigin;

    try {
      socketOrigin = new URL(baseURL).origin;
    } catch (error) {
      console.error("Invalid API base URL:", baseURL);
      setConnected(false);
      return;
    }

    const socketInstance = io(socketOrigin, {
      transports: ["polling", "websocket"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    const pushEvent = (type) => (payload) => {
      if (!mounted) return;

      setEvents((previous) => [
        ...previous.slice(-49),
        {
          type,
          payload,
          at: Date.now(),
        },
      ]);
    };

    const handleConnect = () => {
      if (!mounted) return;

      console.log(
        "MarineGuard Socket.IO connected:",
        socketInstance.id
      );

      setConnected(true);

      socketInstance.emit("survey:join", surveyId);
    };

    const handleDisconnect = (reason) => {
      if (!mounted) return;

      console.warn(
        "MarineGuard Socket.IO disconnected:",
        reason
      );

      setConnected(false);
    };

    const handleConnectError = (error) => {
      if (!mounted) return;

      console.warn(
        "MarineGuard Socket.IO unavailable:",
        error?.message || "Connection failed"
      );

      setConnected(false);
    };

    const handlers = {
      "analysis:started": pushEvent("analysis:started"),
      "analysis:progress": pushEvent("analysis:progress"),
      "analysis:completed": pushEvent("analysis:completed"),
      "analysis:failed": pushEvent("analysis:failed"),
      "detection:created": pushEvent("detection:created"),
    };

    socketInstance.on("connect", handleConnect);
    socketInstance.on("disconnect", handleDisconnect);
    socketInstance.on("connect_error", handleConnectError);

    Object.entries(handlers).forEach(
      ([eventName, handler]) => {
        socketInstance.on(eventName, handler);
      }
    );

    return () => {
      mounted = false;

      if (socketInstance.connected) {
        socketInstance.emit("survey:leave", surveyId);
      }

      socketInstance.off("connect", handleConnect);
      socketInstance.off("disconnect", handleDisconnect);
      socketInstance.off(
        "connect_error",
        handleConnectError
      );

      Object.entries(handlers).forEach(
        ([eventName, handler]) => {
          socketInstance.off(eventName, handler);
        }
      );

      socketInstance.disconnect();

      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }

      setSocket(null);
      setConnected(false);
    };
  }, [surveyId]);

  return {
    connected,
    events,
    socket,
  };
}