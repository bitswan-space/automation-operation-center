"use client";

import React from "react";
import { useMQTT } from "./useMQTT";
import { useQuery } from "@tanstack/react-query";
import { getMQTTTokens } from "@/data/mqtt";
import { MQTT_CONFIG_QUERY_KEY } from "../constants";
import { type TokenData } from "@/data/mqtt";

type UseMQTTRequestResponseArgs<ResponseT> = {
  requestTopic: string;
  responseTopic: string;
  requestMessage?: string | object;
  infiniteSubscription?: boolean;
  onMessage?: (response: ResponseT) => void;
  tokens: TokenData[];
};

export function useMQTTRequestResponse<ResponseT>({
  requestTopic,
  responseTopic,
  requestMessage,
  // infiniteSubscription = false,
  tokens,
}: UseMQTTRequestResponseArgs<ResponseT>) {
  const { mqttConnect, mqttSub, payload, mqttPublish } = useMQTT<
    ResponseT & { remaining_subscription_count?: number }
  >();

  const defaultRequest = React.useMemo(() => {
    return { count: 1 };
  }, []);

  const { data: mqttTokens, isLoading: tokensLoading, error: tokensError } = useQuery({
    queryKey: [MQTT_CONFIG_QUERY_KEY],
    queryFn: getMQTTTokens,
    // Only fetch tokens when we have a valid authentication context
    enabled: !!tokens && tokens.length > 0,
    retry: false, // Don't retry on auth errors
  });

  React.useEffect(() => {
    // Only connect if we have valid tokens from the backend
    if (tokens && tokens.length > 0) {
      tokens.forEach(tokenData => {
        // Validate token before attempting connection
        if (!tokenData.token || !tokenData.automation_server_id || !tokenData.workspace_id) {
          console.warn("Invalid token data, skipping MQTT connection:", tokenData);
          return;
        }

        console.log("Connecting to MQTT with token for server:", tokenData.automation_server_id);
        
        // Use dynamic host based on current location
        const currentHost = window.location.hostname;
        const protocol = 'wss:';
        
        // Replace subdomain with 'mqtt' for MQTT broker connection
        const mqttHostname = currentHost.replace(/^[^.]+\./, 'mqtt.');
        let mqttHost: string;
        mqttHost = `${protocol}//${mqttHostname}/mqtt`;

        mqttConnect(mqttHost, {
          clientId:
            "bitswan-poc" + Math.random().toString(16).substring(2, 8),
          clean: true,
          reconnectPeriod: 60,
          connectTimeout: 30 * 1000,
          username: "bitswan-frontend",
          password: tokenData.token,
        }, tokenData.automation_server_id, tokenData.workspace_id);

        mqttPublish({
          topic: requestTopic,
          payload:
            JSON.stringify(requestMessage) ?? JSON.stringify(defaultRequest),
          qos: 0,
        });

        mqttSub({
          topic: responseTopic,
          qos: 0,
        });
      });
    } else {
      console.log("No valid MQTT tokens available, skipping connection");
    }
  }, [
    tokens,
    defaultRequest,
    mqttConnect,
    mqttPublish,
    mqttSub,
    requestMessage,
    requestTopic,
    responseTopic,
  ]);

  const isLoading = !payload || tokensLoading;
  const response = payload?.message;
  const messageTopic = payload?.topic;
  const automationServerId = payload?.automationServerId;
  const workspaceId = payload?.workspaceId;

  return {
    response,
    isLoading,
    messageTopic,
    automationServerId,
    workspaceId,
    tokensError,
  };
}
