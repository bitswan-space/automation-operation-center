import { env } from "@/env.mjs";

export const BITSWAN_BACKEND_API_URL = `${env.BITSWAN_BACKEND_API_URL}/api`;

export type ActionState<T> = {
  errors?: {
    [K in keyof T]?: string[];
  };
  message?: string;
  data?: T;
  status?: "success" | "error";
};
