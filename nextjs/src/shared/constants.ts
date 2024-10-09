import { env } from "@/env.mjs";

export const BASE_API_URL = `${env.NEXT_PUBLIC_BITSWAN_BACKEND_API_URL}/api`;

export const USER_GROUPS_QUERY_KEY = "user-groups";
export const ORG_USERS_QUERY_KEY = "org-users";
export const MQTT_CONFIG_QUERY_KEY = "mqtt-config";

export const ACTIVE_MQTT_USER_STORAGE_KEY = "active-mqtt-user";
