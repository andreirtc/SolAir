import {existsSync} from 'node:fs';
// Existing process variables (Railway secrets) take precedence over local files.
for(const path of ['.env.local','.env']) if(existsSync(path)) process.loadEnvFile(path);
