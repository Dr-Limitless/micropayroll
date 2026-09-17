const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const logPath = path.join(__dirname, 'server.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try {
    fs.appendFileSync(logPath, line, 'utf8');
  } catch {}
}

function startServer() {
  log('Starting MMS API server (index.js)...');
  const outFd = fs.openSync(logPath, 'a');
  const child = spawn(process.execPath, [path.join(__dirname, 'index.js')], {
    cwd: __dirname,
    stdio: ['ignore', outFd, outFd],
    env: process.env
  });

  child.on('error', (err) => {
    log(`Process error: ${err.message}`);
  });

  child.on('exit', (code, signal) => {
    log(`Server exited (code: ${code}, signal: ${signal}). Restarting in 1.5s...`);
    setTimeout(startServer, 1500);
  });
}

startServer();
