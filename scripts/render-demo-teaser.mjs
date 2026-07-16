import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const outputDir = join(root, 'public/assets/pgnn-six/demo');
const output = join(outputDir, 'pgnn-six-winter-walkthrough-reel.mp4');
const framesDir = '/tmp/pgnn-six-winter-reel-frames';
const encoderBinary = '/tmp/pgnn-six-encode-demo';
const music = join(root, 'public/assets/pgnn-six/music/01-normalno.mp3');
const chrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const userDataDir = '/tmp/pgnn-six-winter-teaser-render-profile';
const port = 48165;
const frameCount = 540;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
};

if (!existsSync(chrome)) throw new Error(`Chrome was not found at ${chrome}`);
if (!existsSync(music)) throw new Error(`Music source is missing: ${music}`);
mkdirSync(outputDir, { recursive: true });
rmSync(output, { force: true });
rmSync(join(outputDir, 'pgnn-six-experience-teaser.mp4'), { force: true });
rmSync(framesDir, { recursive: true, force: true });
mkdirSync(framesDir, { recursive: true });
rmSync(userDataDir, { recursive: true, force: true });

let renderer;
let closing = false;
let captureComplete = false;
const receivedFrames = new Set();

function close(code = 0) {
  if (closing) return;
  closing = true;
  renderer?.kill('SIGTERM');
  server.close(() => process.exit(code));
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.on('data', chunk => process.stdout.write(chunk));
    child.stderr.on('data', chunk => process.stderr.write(chunk));
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code ?? 'an unknown error'}.`)));
  });
}

async function runEncoder() {
  try {
    await run('/usr/bin/clang', [
      '-fobjc-arc',
      '-framework', 'AVFoundation',
      '-framework', 'AppKit',
      '-framework', 'AudioToolbox',
      '-framework', 'CoreVideo',
      '-framework', 'CoreMedia',
      'scripts/encode-demo-teaser.m',
      '-o', encoderBinary,
    ]);
    await run(encoderBinary, [framesDir, music, output, '1080', '1920', String(frameCount)]);
    if (!existsSync(output)) throw new Error('Native encoder did not create an output file.');
    rmSync(framesDir, { recursive: true, force: true });
    console.log(`Rendered ${output.replace(`${root}/`, '')}.`);
    close();
  } catch (error) {
    console.error(`Native encoder failed: ${error.message}`);
    close(1);
  }
}

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);
  if (requestUrl.pathname === '/teaser-frame') {
    const index = Number(requestUrl.searchParams.get('index'));
    if (!Number.isInteger(index) || index < 0 || index >= frameCount) {
      response.writeHead(400).end('Unexpected frame.');
      return;
    }
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      writeFileSync(join(framesDir, `frame-${String(index).padStart(4, '0')}.png`), Buffer.concat(chunks));
      receivedFrames.add(index);
      if ((index + 1) % 90 === 0) console.log(`Rendered frames: ${index + 1}/${frameCount}.`);
      response.writeHead(201).end();
    });
    return;
  }
  if (requestUrl.pathname === '/teaser-frames-complete') {
    if (receivedFrames.size !== frameCount) {
      response.writeHead(400).end(`Expected ${frameCount} frames, received ${receivedFrames.size}.`);
      close(1);
      return;
    }
    captureComplete = true;
    response.writeHead(204).end();
    renderer?.kill('SIGTERM');
    runEncoder();
    return;
  }

  const requestedPath = decodeURIComponent(requestUrl.pathname).replace(/^\/+/, '');
  const relativePath = requestUrl.pathname === '/'
    ? 'index.html'
    : requestedPath.startsWith('assets/')
      ? `public/${requestedPath}`
      : requestedPath;
  const filePath = normalize(join(root, relativePath));
  if (!filePath.startsWith(root) || !existsSync(filePath)) {
    response.writeHead(404).end('Not found.');
    return;
  }
  response.writeHead(200, { 'Content-Type': contentTypes[extname(filePath)] ?? 'application/octet-stream' });
  const contents = readFileSync(filePath);
  if (relativePath === 'index.html') {
    const importMap = '<script type="importmap">{"imports":{"three":"./node_modules/three/build/three.module.js"}}</script>';
    response.end(contents.toString().replace('</head>', `${importMap}</head>`));
    return;
  }
  response.end(contents);
});

server.listen(port, '127.0.0.1', () => {
  renderer = spawn(chrome, [
    '--headless=new',
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-default-apps',
    '--disable-renderer-backgrounding',
    '--disable-sync',
    '--enable-webgl',
    '--hide-scrollbars',
    '--no-default-browser-check',
    '--no-first-run',
    '--use-angle=swiftshader',
    `--user-data-dir=${userDataDir}`,
    '--window-size=1080,1920',
    `http://127.0.0.1:${port}/?capture=reel`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  renderer.stderr.on('data', chunk => {
    const message = chunk.toString().trim();
    if (message && !message.includes('ERROR:gpu')) console.error(message);
  });
  renderer.on('exit', code => {
    if (!closing && !captureComplete) {
      console.error(`Chrome exited before the teaser frames were captured (exit ${code ?? 'unknown'}).`);
      close(1);
    }
  });
});

setTimeout(() => {
  if (!closing) {
    console.error('Timed out before the player teaser render completed.');
    close(1);
  }
}, 720_000);
