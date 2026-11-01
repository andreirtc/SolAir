// Reproducible frontend assets rendered from our vector symbol; no photograph edits.
import sharp from 'sharp';
import {log} from 'node:console';
for(const size of [192,512])await sharp('public/icon.svg').resize(size,size).png().toFile(`public/icon-${size}.png`);
log('Rendered SolAir vector app icons at 192px and 512px.');
