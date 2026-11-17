import { randomBytes, scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
if (!process.stdin.isTTY) { console.error('Run this command in an interactive terminal.'); process.exit(1); }
const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write('Password (at least 16 characters; input hidden): ');
rl._writeToOutput = () => {};
rl.question('', password => {
  rl.close(); process.stdout.write('\n');
  if (password.length < 16 || password.length > 1024) { console.error('Use 16–1024 characters.'); process.exitCode = 1; return; }
  const salt = randomBytes(16).toString('hex');
  process.stdout.write(`ADMIN_PASSWORD_HASH=scrypt:${salt}:${scryptSync(password,salt,64).toString('hex')}\n`);
});
