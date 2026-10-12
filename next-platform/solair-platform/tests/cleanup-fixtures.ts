import {Store} from '../server/db';
const db=new Store();
await db.transaction(async tx=>{
 await tx.run("DELETE FROM help_requests WHERE mode='demo' AND (notes LIKE 'Browser test %' OR notes='Queued offline browser test')");
 await tx.run("DELETE FROM messages WHERE mode='demo' AND body LIKE 'Browser verified message%'");
 const notes='Software browser test only; physical ESP32 not connected';
 await tx.run('DELETE FROM bench_results WHERE notes=? AND id NOT IN (SELECT id FROM bench_results WHERE notes=? ORDER BY created_at DESC LIMIT 1)',[notes,notes]);
});await db.close();console.log('Only the known software-browser fixture records were cleaned; one BLOCKED software-only bench record retained.');
