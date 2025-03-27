"use server";

import { BITSWAN_BACKEND_API_URL } from "./shared";
import { type RawNavItem } from "@/components/layout/Sidebar/utils/NavItems";
import { type Result, ok, err } from "neverthrow";
import { checkAuth } from "@/lib/auth";

export type MQTTProfile = {
  id: string;
  name: string;
  group_id: string;
  isAdmin: string;
  nav_items: RawNavItem[];
};

export type MQTTProfileListResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: MQTTProfile[];
};

export type FetchMQTTProfileError =
  | { kind: "AUTH_ERROR"; message: string }
  | {
      kind: "HTTP_ERROR";
      message: string;
      statusCode: number;
      details: string;
    }
  | { kind: "UNEXPECTED_ERROR"; message: string; details: string };

export const fetchMQTTProfiles = async (): Promise<
  Result<MQTTProfileListResponse, FetchMQTTProfileError>
> => {
  const authResult = await checkAuth();
  if (authResult.isErr()) {
    return err({
      kind: "AUTH_ERROR",
      message: authResult.error.message,
    });
  }

  const apiToken = authResult.value.access_token;

  try {
    const res = await fetch(
      `${BITSWAN_BACKEND_API_URL}/user-groups/mqtt_profiles`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error fetching MQTT profiles", res);
      console.error("response: ", errorText);

      return err({
        kind: "HTTP_ERROR",
        message: "Error fetching MQTT profiles",
        statusCode: res.status,
        details: errorText,
      });
    }

    const data = (await res.json()) as MQTTProfileListResponse;
    return ok(data);
  } catch (error) {
    console.error("Unexpected error fetching MQTT profiles:", error);
    return err({
      kind: "UNEXPECTED_ERROR",
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
      details: JSON.stringify(error),
    });
  }
};
