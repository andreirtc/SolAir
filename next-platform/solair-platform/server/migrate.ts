import './env';
import { Store } from "./db";
const db = new Store();
await db.migrate();
await db.close();
console.log("Schema migrated");
