// node scripts/stills.mjs out/dir 0.5 t1 t2 ...   -> PNG stills at given times (seconds), bundle once.
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition, openBrowser} from '@remotion/renderer';
import path from 'node:path';
import fs from 'node:fs';

const [outDir, scaleArg, ...rest] = process.argv.slice(2);
const compId = rest[0] && isNaN(Number(rest[0])) ? rest.shift() : 'PigeonShort';
const times = rest;
const scale = Number(scaleArg);
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts'), outDir: path.resolve('build/bundle'), onProgress: () => {}});
const browserExecutable = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const browser = await openBrowser('chrome', {browserExecutable});
const composition = await selectComposition({serveUrl, id: compId, puppeteerInstance: browser, browserExecutable});
for (const ts of times) {
  const frame = Math.min(composition.durationInFrames - 1, Math.round(Number(ts) * composition.fps));
  const output = path.join(outDir, `t${String(ts).padStart(5, '0')}.png`);
  await renderStill({composition, serveUrl, output, frame, scale, puppeteerInstance: browser, browserExecutable, imageFormat: 'png'});
  console.log('rendered', ts, frame);
}
await browser.close({silent: true});
