import { BITSWAN_BACKEND_API_URL } from "@/shared/server-constants";
import { auth } from "./auth";
import axios from "axios";

export const authenticatedBitswanBackendInstance = async (
  headers: Record<string, string> = {},
) => {
  const session = await auth();
  const apiToken = session?.access_token;

  return axios.create({
    baseURL: BITSWAN_BACKEND_API_URL,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...headers,
    },
  });
};
