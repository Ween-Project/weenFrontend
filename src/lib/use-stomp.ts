"use client";

import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import { authApi } from "@/lib/api";

export function useStomp<T>(
  destination: string | null,
  onMessageReceived: (message: T) => void,
  fallbackPoll: () => void,
  pollInterval = 4000
) {
  const [connected, setConnected] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const fallbackIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!destination) return;

    let active = true;

    const startStomp = async () => {
      try {
        const { token } = await authApi.token();
        if (!active) return;

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
        const wsUrl = backendUrl.replace(/^http/, "ws") + "/ws/websocket";

        const client = new Client({
          brokerURL: `${wsUrl}?token=${token}`,
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
          onConnect: () => {
            if (!active) {
              client.deactivate();
              return;
            }
            setConnected(true);
            if (fallbackIntervalRef.current) {
              window.clearInterval(fallbackIntervalRef.current);
              fallbackIntervalRef.current = null;
            }

            client.subscribe(destination, (frame) => {
              try {
                const body = JSON.parse(frame.body) as T;
                onMessageReceived(body);
              } catch (e) {
                console.error("Error parsing message body", e);
              }
            });
          },
          onDisconnect: () => {
            setConnected(false);
            if (active) startFallback();
          },
          onStompError: (frame) => {
            console.error("STOMP error", frame);
            setConnected(false);
            if (active) startFallback();
          },
          onWebSocketClose: () => {
            setConnected(false);
            if (active) startFallback();
          }
        });

        stompClientRef.current = client;
        client.activate();
      } catch (e) {
        console.error("Failed to fetch token or init Stomp", e);
        if (active) startFallback();
      }
    };

    const startFallback = () => {
      if (fallbackIntervalRef.current) return;
      fallbackPoll();
      fallbackIntervalRef.current = window.setInterval(() => {
        fallbackPoll();
      }, pollInterval);
    };

    void startStomp();

    return () => {
      active = false;
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
      }
      if (fallbackIntervalRef.current) {
        window.clearInterval(fallbackIntervalRef.current);
      }
    };
  }, [destination]);

  return connected;
}
