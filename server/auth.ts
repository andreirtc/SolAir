import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
export const token = () => randomBytes(32).toString("hex");
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export function passwordHash(p: string) {
  const salt = randomBytes(16).toString("hex");
  return salt + ":" + scryptSync(p, salt, 64).toString("hex");
}
export function verifyPassword(p: string, h: string) {
  const [salt, v] = h.split(":");
  if (!salt || !v) return false;
  const a = Buffer.from(v, "hex"),
    b = scryptSync(p, salt, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}
export type User = {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: "driver" | "operator" | "engineer" | "admin";
  notifications: number;
};
