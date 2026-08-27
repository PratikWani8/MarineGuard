import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { baseURL } from "../services/api";

export function useSocket(surveyId) {
  const socketRef = useRef(null);

  const [connected, setConnected] =
    useState(false);

  const [events, setEvents] =
    useState([]);

  useEffect(() => {
    // -------------------------------------------------------
    // No survey = no socket connection
    // -------------------------------------------------------

    if (!surveyId) {
      setConnected(false);
      return undefined;
    }

    let mounted = true;

    // -------------------------------------------------------
    // Determine socket origin safely
    // -------------------------------------------------------

    let socketOrigin;

    try {
      socketOrigin = new URL(
        baseURL
      ).origin;
    } catch (error) {
      console.error(
        "Invalid API base URL:",
        baseURL
      );

      setConnected(false);

      return undefined;
    }

    // -------------------------------------------------------
    // Create Socket.IO connection
    // -------------------------------------------------------

    const socket = io(
      socketOrigin,
      {
        transports: [
          "websocket",
          "polling",
        ],

        autoConnect: true,

        reconnection: true,

        reconnectionAttempts: 5,

        reconnectionDelay: 1000,

        timeout: 5000,
      }
    );

    socketRef.current = socket;

    // -------------------------------------------------------
    // Event helper
    // -------------------------------------------------------

    const pushEvent =
      (type) =>
      (payload) => {
        if (!mounted) {
          return;
        }

        setEvents(
          (previous) => [
            ...previous.slice(-49),

            {
              type,
              payload,
              at: Date.now(),
            },
          ]
        );
      };

    // -------------------------------------------------------
    // CONNECT
    // -------------------------------------------------------

    const handleConnect = () => {
      if (!mounted) {
        return;
      }

      console.log(
        "MarineGuard Socket.IO connected:",
        socket.id
      );

      setConnected(true);

      socket.emit(
        "survey:join",
        surveyId
      );
    };

    // -------------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------------

    const handleDisconnect = (
      reason
    ) => {
      if (!mounted) {
        return;
      }

      console.warn(
        "MarineGuard Socket.IO disconnected:",
        reason
      );

      setConnected(false);
    };

    // -------------------------------------------------------
    // CONNECTION ERROR
    // -------------------------------------------------------

    const handleConnectError = (
      error
    ) => {
      if (!mounted) {
        return;
      }

      console.warn(
        "MarineGuard Socket.IO unavailable:",
        error?.message ||
          "Connection failed"
      );

      setConnected(false);
    };

    // -------------------------------------------------------
    // REGISTER CONNECTION EVENTS
    // -------------------------------------------------------

    socket.on(
      "connect",
      handleConnect
    );

    socket.on(
      "disconnect",
      handleDisconnect
    );

    socket.on(
      "connect_error",
      handleConnectError
    );

    // -------------------------------------------------------
    // SURVEY EVENTS
    // -------------------------------------------------------

    const handlers = {
      "analysis:started":
        pushEvent(
          "analysis:started"
        ),

      "analysis:progress":
        pushEvent(
          "analysis:progress"
        ),

      "analysis:completed":
        pushEvent(
          "analysis:completed"
        ),

      "analysis:failed":
        pushEvent(
          "analysis:failed"
        ),

      "detection:created":
        pushEvent(
          "detection:created"
        ),
    };

    Object.entries(
      handlers
    ).forEach(
      ([
        eventName,
        handler,
      ]) => {
        socket.on(
          eventName,
          handler
        );
      }
    );

    // -------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------

    return () => {
      mounted = false;

      // Leave survey room.
      if (socket.connected) {
        socket.emit(
          "survey:leave",
          surveyId
        );
      }

      // Remove listeners.
      socket.off(
        "connect",
        handleConnect
      );

      socket.off(
        "disconnect",
        handleDisconnect
      );

      socket.off(
        "connect_error",
        handleConnectError
      );

      Object.entries(
        handlers
      ).forEach(
        ([
          eventName,
          handler,
        ]) => {
          socket.off(
            eventName,
            handler
          );
        }
      );

      // Close connection.
      socket.disconnect();

      if (
        socketRef.current ===
        socket
      ) {
        socketRef.current = null;
      }

      setConnected(false);
    };
  }, [surveyId]);

  return {
    connected,
    events,
    socket: socketRef.current,
  };
}