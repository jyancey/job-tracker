const execPath = process.env.npm_execpath || ''
const userAgent = process.env.npm_config_user_agent || ''

if (execPath.includes('pnpm') || userAgent.startsWith('pnpm/')) {
  process.exit(0)
}

console.error('This repository uses pnpm. Run `pnpm install` instead of npm.')
process.exit(1)
