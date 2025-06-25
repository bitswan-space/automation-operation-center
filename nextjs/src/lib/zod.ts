import { z } from "zod";

export type Primitive = string | number | boolean | null;

export type JsonType =
  | Primitive
  | { [key: PropertyKey]: JsonType }
  | JsonType[];

export const zJsonString = z.string().transform((str, ctx): JsonType => {
  try {
    return JSON.parse(str) as JsonType;
  } catch (e) {
    ctx.addIssue({ code: "custom", message: "Invalid JSON" });
    return z.NEVER;
  }
});
