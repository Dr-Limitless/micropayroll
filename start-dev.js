const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');
console.log('\x1b[32m%s\x1b[0m', '  🚀 Starting Microfinancial Management System (MMS)...');
console.log('\x1b[36m%s\x1b[0m', '═══════════════════════════════════════════════════════════');

// 1. Start Server (Node / Express on port 5000)
const serverDir = path.join(__dirname, 'server');
const server = spawn('npm', ['start'], {
  cwd: serverDir,
  shell: true,
  stdio: 'pipe'
});

server.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[34m[SERVER]\x1b[0m ${data}`);
});

server.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[31m[SERVER ERROR]\x1b[0m ${data}`);
});

// 2. Start Client (React / Vite on port 5173)
const clientDir = path.join(__dirname, 'client');
const client = spawn('npm', ['run', 'dev'], {
  cwd: clientDir,
  shell: true,
  stdio: 'pipe'
});

client.stdout.on('data', (data) => {
  process.stdout.write(`\x1b[32m[CLIENT]\x1b[0m ${data}`);
});

client.stderr.on('data', (data) => {
  process.stderr.write(`\x1b[33m[CLIENT MSG]\x1b[0m ${data}`);
});

process.on('SIGINT', () => {
  console.log('\nStopping all services...');
  server.kill();
  client.kill();
  process.exit();
});
