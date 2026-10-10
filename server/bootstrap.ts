import './env';
import { randomUUID } from "node:crypto";
import { Store } from "./db";
import { passwordHash } from "./auth";
import {identityProvider} from './identity';
const email = process.env.SOLAIR_ADMIN_EMAIL,
  password = process.env.SOLAIR_ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error(
    "Set SOLAIR_ADMIN_EMAIL and SOLAIR_ADMIN_PASSWORD (at least 12 characters) in your environment.",
  );
const db = new Store();
await db.migrate();
const identity=identityProvider();
if((await db.query('SELECT id FROM profiles WHERE email=?',[email.toLowerCase()])).length){await db.close();throw new Error('Administrator already exists; bootstrap does not reset roles/passwords.');}
const adminId=identity?await identity.createUser(email.toLowerCase(),password):randomUUID();
const org = process.env.SOLAIR_ORG_ID || "manila";
try{await db.transaction(async tx=>{
await tx.run(
  "INSERT INTO organizations VALUES (?,?) ON CONFLICT(id) DO NOTHING",
  [org, process.env.SOLAIR_ORG_NAME || "Manila Central TODA"],
);
await tx.run(
  "INSERT INTO profiles(id,org_id,email,name,role,password_hash) VALUES (?,?,?,?,?,?)",
  [
    adminId,
    org,
    email.toLowerCase(),
    "Platform Administrator",
    "admin",
    identity?'supabase-managed':passwordHash(password),
  ],
);
await tx.run(
  "INSERT INTO vehicles(id,org_id,name) VALUES (?,?,?) ON CONFLICT(id) DO NOTHING",
  ["ET-01", org, "ET-01"],
);
});}catch(error){if(identity?.removeUser)await identity.removeUser(adminId);throw error;}finally{await db.close();}
console.log(
  "Administrator and first vehicle created. Provision the ESP32 in CPE Lab. No demo telemetry was seeded.",
);
