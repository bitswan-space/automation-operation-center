import React from "react";
import {
  useMQTTBrokers,
  type MQTTBroker,
} from "@/components/mqtt-brokers/hooks/useMQTTBrokers";

export const MQTTBrokerContext = React.createContext<MQTTBroker | undefined>(
  {} as unknown as MQTTBroker,
);

export function useMQTTBrokerSource() {
  const { data: mqttBrokers } = useMQTTBrokers();

  const currentActiveMQTTBroker = mqttBrokers?.results?.find(
    (broker) => broker.active,
  );

  return currentActiveMQTTBroker;
}

export function useActiveMQTTBroker() {
  const context = React.useContext(MQTTBrokerContext);

  return context;
}

export function MQTTBrokerProvider({
  children,
}: React.PropsWithChildren<unknown>) {
  const broker = useMQTTBrokerSource();

  return (
    <MQTTBrokerContext.Provider value={broker}>
      {children}
    </MQTTBrokerContext.Provider>
  );
}
