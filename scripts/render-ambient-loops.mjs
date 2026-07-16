import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, 'public/assets/pgnn-six/ambient');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const userDataDir = '/tmp/pgnn-six-ambient-render-profile';
const port = 48163;
const clipIds = ['apartment-window-drift', 'courtyard-snow-drift', 'tram-stop-blue-hour'];
const expected = new Set(clipIds);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.webm': 'video/webm',
};

function encodeOneByteVint(value) {
  if (!Number.isInteger(value) || value < 0 || value > 126) {
    throw new Error(`Cannot encode ${value} as a one-byte EBML size.`);
  }
  return Buffer.from([0x80 | value]);
}

function addDurationMetadata(webm, durationMilliseconds) {
  const infoId = Buffer.from([0x15, 0x49, 0xa9, 0x66]);
  const infoOffset = webm.indexOf(infoId);
  if (infoOffset < 0) throw new Error('WebM Info element was not found.');

  const sizeOffset = infoOffset + infoId.length;
  const sizeByte = webm[sizeOffset];
  if ((sizeByte & 0x80) === 0) throw new Error('WebM Info uses an unsupported EBML size.');
  const infoSize = sizeByte & 0x7f;
  const infoStart = sizeOffset + 1;
  const infoEnd = infoStart + infoSize;
  const duration = Buffer.alloc(11);
  duration.set([0x44, 0x89, 0x88]); // Duration element: ID, eight-byte payload length.
  duration.writeDoubleBE(durationMilliseconds, 3);

  return Buffer.concat([
    webm.subarray(0, sizeOffset),
    encodeOneByteVint(infoSize + duration.length),
    webm.subarray(infoStart, infoEnd),
    duration,
    webm.subarray(infoEnd),
  ]);
}

if (!existsSync(chrome)) {
  throw new Error(`Chrome was not found at ${chrome}`);
}

mkdirSync(outputDir, { recursive: true });
for (const clip of expected) rmSync(join(outputDir, `${clip}.webm`), { force: true });
rmSync(userDataDir, { recursive: true, force: true });

let completed = 0;
let renderer;
let closing = false;
let activeClip;
const remainingClips = [...clipIds];
const completedClips = new Set();

function finish(code = 0) {
  if (closing) return;
  closing = true;
  setTimeout(() => {
    renderer?.kill('SIGTERM');
    server.close(() => process.exit(code));
  }, 1200);
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);

  if (requestUrl.pathname === '/done') {
    const clip = requestUrl.searchParams.get('clip');
    if (!expected.has(clip) || clip !== activeClip || completedClips.has(clip)) {
      response.writeHead(400).end('Unexpected clip.');
      return;
    }

    completedClips.add(clip);
    completed += 1;
    console.log(`Rendered ${clip} (${completed}/${expected.size}).`);
    response.writeHead(204).end();
    setTimeout(() => {
      renderer?.kill('SIGTERM');
      if (completed === expected.size) finish();
      else launchRenderer();
    }, 1200);
    return;
  }

  if (requestUrl.pathname === '/upload') {
    const clip = requestUrl.searchParams.get('clip');
    if (!expected.has(clip) || clip !== activeClip || completedClips.has(clip)) {
      response.writeHead(400).end('Unexpected clip.');
      return;
    }

    const chunks = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      writeFileSync(join(outputDir, `${clip}.webm`), addDurationMetadata(Buffer.concat(chunks), 8_000));
      response.writeHead(201).end();
    });
    return;
  }

  const rawPath = requestUrl.pathname === '/' ? '/scripts/ambient-loop-renderer.html' : requestUrl.pathname;
  const filePath = normalize(join(root, decodeURIComponent(rawPath)));
  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404).end('Not found.');
    return;
  }

  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
  response.end(readFileSync(filePath));
});

function launchRenderer() {
  const clip = remainingClips.shift();
  activeClip = clip;
  renderer = spawn(chrome, [
    '--headless=new',
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-gpu',
    '--disable-sync',
    '--no-default-browser-check',
    '--no-first-run',
    '--run-all-compositor-stages-before-draw',
    `--user-data-dir=${userDataDir}`,
    `--download-default-directory=${outputDir}`,
    '--virtual-time-budget=90000',
    `http://127.0.0.1:${port}/scripts/ambient-loop-renderer.html?clip=${clip}`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  renderer.stderr.on('data', (chunk) => {
    const message = chunk.toString().trim();
    if (message && !message.includes('ERROR:gpu')) console.error(message);
  });
  renderer.on('exit', (code) => {
    if (!closing && !completedClips.has(clip)) {
      console.error(`Chrome exited before all loops completed (exit ${code ?? 'unknown'}).`);
      finish(1);
    }
  });
}

server.listen(port, '127.0.0.1', () => {
  launchRenderer();
});

setTimeout(() => {
  if (completed !== expected.size) {
    console.error('Timed out before every loop was rendered.');
    finish(1);
  }
}, 150_000);
