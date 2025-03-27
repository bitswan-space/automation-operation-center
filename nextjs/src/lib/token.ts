import jwt from "jsonwebtoken";

interface TokenOptions {
  secret: string;
  username: string;
  mountpoint?: string;
  expHours?: number;
}

export function createToken({
  secret,
  username,
  mountpoint = "",
  expHours = 2,
}: TokenOptions): string {
  const exp = Math.floor(Date.now() / 1000) + expHours * 60 * 60;

  const payload = {
    exp,
    username,
    client_attrs: { mountpoint },
  };

  return jwt.sign(payload, secret, { algorithm: "HS256" });
}
