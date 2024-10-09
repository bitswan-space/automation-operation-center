import { type MQTTConfig } from "@/pages/api/mqtt/config";

export const getMQTTConfig = async () => {
  const response = await fetch("/api/mqtt/config");
  return response.json() as Promise<MQTTConfig>;
};
