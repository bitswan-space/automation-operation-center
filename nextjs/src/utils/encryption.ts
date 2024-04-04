import crypto from "crypto";
import { env } from "@/env.mjs";

export type EncryptedResult = {
  encrypted: string;
  tag: string;
  iv: string;
};

export const encrypt = (value: string) => {
  const secretKey = env.NEXTAUTH_SECRET ?? "";

  const iv = crypto.randomBytes(12).toString("base64");
  const cipher = crypto.createCipheriv(
    "aes-256-gcm",
    Buffer.from(secretKey, "base64"),
    Buffer.from(iv, "base64"),
  );

  let encrypted = cipher.update(value, "utf8", "base64");
  encrypted += cipher.final("base64");
  const tag = cipher.getAuthTag().toString("base64");

  return {
    encrypted,
    tag,
    iv,
  };
};

export const decrypt = (value: EncryptedResult) => {
  const secretKey = env.NEXTAUTH_SECRET ?? "";

  const { encrypted, tag, iv } = value;

  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    Buffer.from(secretKey, "base64"),
    Buffer.from(iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(tag, "base64"));

  let decrypted = decipher.update(encrypted, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
};
