import Cryptr from "cryptr";
import { env } from "@/env.mjs";

export const encrypt = (value: string) => {
  const secretKey = env.NEXTAUTH_SECRET;
  const cryptr = new Cryptr(secretKey ?? "");
  return cryptr.encrypt(value);
};

export const decrypt = (value: string) => {
  const secretKey = env.NEXTAUTH_SECRET;
  const cryptr = new Cryptr(secretKey ?? "");
  return cryptr.decrypt(value);
};
