// A PHP-enabled preview for session-backed captchas and form endpoints.
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const portArg = process.argv.indexOf('--port');
const port = portArg >= 0 ? Number(process.argv[portArg + 1]) : 8082;
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('Choose a port between 1024 and 65535.'); process.exit(1);
}
const phpArgs = ['-S', `127.0.0.1:${port}`, '-t', root, path.join(root, 'scripts/preview-router.php')];
const native = spawnSync('php', ['-v'], { stdio: 'ignore' });
let command = 'php', args = phpArgs;
if (native.status !== 0) {
  try {
    const cli = path.join(path.dirname(require.resolve('@php-wasm/cli')), 'php-wasm.js');
    command = process.execPath; args = [cli, ...phpArgs];
  } catch {
    console.error('Run npm install, or install PHP 8.1+, then retry npm run serve.'); process.exit(1);
  }
}
console.log(`PHP preview: http://127.0.0.1:${port}/ (also accessible as http://localhost:${port}/)`);
console.log('Use this preview for captcha testing. Static Live Server / Go Live cannot execute PHP.');
const child = spawn(command, args, { cwd: root, stdio: 'inherit' });
child.on('error', error => { console.error(error.message); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
