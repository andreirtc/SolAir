import { DatabaseSync } from "node:sqlite";
import { Pool, type PoolClient } from "pg";
import { mkdirSync } from "node:fs";
import {coreMigrations,supabaseMigrations,readMigration} from "./migrations";
export class Store {
  private sqliteTransactions:Promise<void>=Promise.resolve();
  private sqlite?: DatabaseSync;
  private pg?: Pool;
  private client?: PoolClient;
  constructor(path = process.env.SOLAIR_DB_PATH || "data/solair.db") {
    if (process.env.DATABASE_URL && path !== ":memory:") {
      const url=new URL(process.env.DATABASE_URL);
      const ca=process.env.SOLAIR_DATABASE_CA;
      if(ca){for(const key of ['sslmode','sslcert','sslkey','sslrootcert'])url.searchParams.delete(key);}
      this.pg = new Pool({ connectionString: url.toString(), ...(ca?{ssl:{ca:ca.replace(/\\n/g,'\n'),rejectUnauthorized:true}}:{}) });
    }
    else {
      if (path !== ":memory:") mkdirSync("data", { recursive: true });
      this.sqlite = new DatabaseSync(path);
      this.sqlite.exec("PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL;");
    }
  }
  async query(sql: string, args: any[] = []): Promise<any[]> {
    if (this.pg || this.client) {
      let i = 0;
      return (
        await (this.client || this.pg!).query(
          sql.replace(/\?/g, () => `$${++i}`),
          args,
        )
      ).rows;
    }
    return this.sqlite!.prepare(sql).all(...args);
  }
  async run(sql: string, args: any[] = []) {
    if (this.pg || this.client) {
      let i = 0;
      await (this.client || this.pg!).query(
        sql.replace(/\?/g, () => `$${++i}`),
        args,
      );
    } else this.sqlite!.prepare(sql).run(...args);
  }
  async transaction<T>(fn: (tx: Store) => Promise<T>): Promise<T> {
    if (this.pg) {
      const client = await this.pg.connect();
      const tx = Object.create(Store.prototype) as Store;
      tx.client = client;
      try {
        await client.query("BEGIN");
        const result = await fn(tx);
        await client.query("COMMIT");
        return result;
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }
    }
    const previous=this.sqliteTransactions;
    let release!:()=>void;
    this.sqliteTransactions=new Promise<void>(resolve=>{release=resolve;});
    await previous;
    let begun=false;
    try {
      this.sqlite!.exec("BEGIN IMMEDIATE");begun=true;
      const r = await fn(this);
      this.sqlite!.exec("COMMIT");
      return r;
    } catch (e) {
      if(begun)this.sqlite!.exec("ROLLBACK");
      throw e;
    } finally {release();}
  }
  async migrate() {
    for(const name of coreMigrations){
      const sql=readMigration(name);
      if(this.pg)await this.pg.query(sql);else this.sqlite!.exec(sql);
    }
    if(this.pg)await this.pg.query('ALTER TABLE cpe_samples ENABLE ROW LEVEL SECURITY; ALTER TABLE battery_references ENABLE ROW LEVEL SECURITY; ALTER TABLE research_records ENABLE ROW LEVEL SECURITY; ALTER TABLE research_forecast_outcomes ENABLE ROW LEVEL SECURITY');
    if(this.pg&&process.env.SOLAIR_AUTH_PROVIDER==='supabase')for(const name of supabaseMigrations)await this.pg.query(readMigration(name));
  }
  async close() {
    if (this.pg) await this.pg.end();
    else this.sqlite!.close();
  }
}
