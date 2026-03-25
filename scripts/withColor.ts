import { spawn } from 'node:child_process'

const [command, ...args] = process.argv.slice(2)

if (!command) {
  console.error('Usage: tsx scripts/withColor.ts <command> [args...]')
  process.exit(1)
}

const env = { ...process.env, FORCE_COLOR: '1' }
delete env.NO_COLOR

const child = spawn(command, args, {
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }

  process.exit(code ?? 1)
})
