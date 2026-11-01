import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import console from 'node:console';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = await build({ entryPoints: [path.join(root, 'src/assembly-monitor.ts')], bundle: true,
  platform: 'browser', format: 'iife', target: 'chrome100', minify: true, write: false });
const template = await readFile(path.join(root, 'scripts/assembly-monitor.html'), 'utf8');
const html = template.replace('/* INLINE_USB_READER */', () => result.outputFiles[0].text.replaceAll('</script', '<\\/script'));
for (const dir of ['public', 'output/solair-solderer']) {
  await mkdir(path.join(root, dir), { recursive: true });
  await writeFile(path.join(root, dir, 'SOLAIR_ASSEMBLY_MONITOR.html'), html);
}
console.log('Built offline SOLAIR_ASSEMBLY_MONITOR.html (public + output/solair-solderer).');
