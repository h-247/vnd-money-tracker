import net from 'node:net';
import { spawn, exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

function isPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => {
      resolve(false);
    });
    server.once('listening', () => {
      server.close(() => {
        resolve(true);
      });
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findFreePort(startPort = 3000, maxPort = 3999) {
  for (let port = startPort; port <= maxPort; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(
    'No free port found between ' + startPort + ' and ' + maxPort,
  );
}

function openBrowser(url) {
  const startCmd =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(startCmd);
}

async function start() {
  const port = await findFreePort(3000);
  console.log(`\n=========================================`);
  console.log(`  VND Money Tracker`);
  console.log(`  Selected available port: ${port}`);
  console.log(`  URL: http://localhost:${port}`);
  console.log(`=========================================\n`);

  const npxCmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const child = spawn(npxCmd, ['vinext', 'dev', '-p', port.toString()], {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true,
  });

  // Poll until server is ready, then open browser
  const startTime = Date.now();
  const checkInterval = setInterval(async () => {
    const available = await isPortAvailable(port);
    // When port is no longer available, the dev server is successfully listening!
    if (!available) {
      clearInterval(checkInterval);
      console.log(
        `\nServer is ready! Opening http://localhost:${port} in your browser...`,
      );
      openBrowser(`http://localhost:${port}`);
    } else if (Date.now() - startTime > 30000) {
      clearInterval(checkInterval);
    }
  }, 500);

  child.on('exit', (code) => {
    clearInterval(checkInterval);
    process.exit(code ?? 0);
  });
}

void start();
