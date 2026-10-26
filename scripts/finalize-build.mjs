import {readdirSync,readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name]);}
const assets=walk('.next/static').filter(p=>/\.(js|css|woff2?|png|svg)$/.test(p)).map(p=>p.replace('.next/static','/_next/static'));
const template=readFileSync('public/sw.js','utf8');
const shellDeclaration=template.match(/const SHELL_ASSETS=(\[[\s\S]*?\]);/);
if(!shellDeclaration)throw new Error('Missing public offline-shell asset declaration');
const shellAssets=JSON.parse(shellDeclaration[1]);
const contentHash=createHash('sha256').update(template).update(assets.join('|')).update(readFileSync('.next/BUILD_ID'));
for(const asset of shellAssets)if(asset!=='/')contentHash.update(asset).update(readFileSync('public'+asset));
const digest=contentHash.digest('hex').slice(0,12);
const sw=template.replace(/const ASSETS=.*?;/,`const ASSETS=${JSON.stringify(assets)};`).replace(/const CACHE='[^']+';/,`const CACHE='solair-shell-${digest}';`);
writeFileSync('.next/solair-sw.js',sw);
