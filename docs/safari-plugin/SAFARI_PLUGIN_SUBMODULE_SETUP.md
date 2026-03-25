# Safari Plugin Git Submodule Setup Guide

**Purpose:** Set up safari-plugin as a git submodule of job-tracker, allowing independent versioning and maintenance while keeping them logically connected.

**Created:** March 14, 2026

---

## Option 1: Git Submodule (Recommended for Plugin Development)

### Benefits

- ✅ Independent repository with its own issue tracking, releases, and CI/CD
- ✅ Separate versioning (plugin v1.0 != job-tracker v2.8.0)
- ✅ Can be published to a package registry or Safari App Store separately
- ✅ Clear separation of concerns (browser extension ≠ web app)
- ✅ Plugin can be used by other job-tracking apps
- ✅ Easy for contributors to clone/work on either part independently
- ✅ Different release cycles (plugin updates don't require app updates)

### Drawbacks

- ⚠️ Slightly more complex git workflow (submodule commands)
- ⚠️ Contributors need to know to `git submodule update --init --recursive`
- ⚠️ CI/CD pipelines need to handle submodule updates

---

## Setup Instructions

### Step 1: Create the Safari Plugin Repository

```bash
# Option A: Create on GitHub/Forgejo and clone locally
git clone https://github.com/yourusername/job-tracker-safari-plugin.git

# Option B: Create locally first, then push
cd ~/projects
mkdir job-tracker-safari-plugin
cd job-tracker-safari-plugin
git init
```

### Step 2: Initialize with Plugin Project Structure

```bash
# In the new plugin repo, create the structure:
mkdir -p src Resources tests/unit tests/integration tests/e2e
mkdir -p docs scripts build .github/workflows

# Create package.json
cat > package.json << 'EOF'
{
  "name": "@job-tracker/safari-plugin",
  "version": "1.0.0-alpha",
  "description": "Safari browser extension for job-tracker app",
  "main": "build/background.js",
  "scripts": {
    "build": "esbuild src/background.ts --bundle --outfile=build/background.js && esbuild src/content.ts --bundle --outfile=build/content.js",
    "dev": "pnpm build -- --sourcemap --watch",
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "lint": "eslint src tests --ext .ts",
    "type-check": "tsc --noEmit"
  },
  "keywords": ["job-tracker", "safari", "plugin", "browser-extension"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "vitest": "^4.0.0",
    "eslint": "^8.0.0"
  }
}
EOF

# Create TypeScript config
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "WebWorker"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./build"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests"]
}
EOF

# Create vitest config
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
})
EOF

# Create README
cat > README.md << 'EOF'
# Job Tracker Safari Plugin

A Safari browser extension that captures job postings directly from web pages and syncs them to job-tracker.

## Quick Start

1. Install dependencies: `pnpm install`
2. Build: `pnpm build`
3. Load in Safari: Xcode → Safari Extension settings

## Documentation

- [Architecture](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Release Plan](./docs/RELEASE_PLAN.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

## Contributing

See [DEVELOPMENT.md](./docs/DEVELOPMENT.md) for setup and development instructions.
EOF

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
dist/
build/
*.js
*.js.map
.DS_Store
.env
.env.local
coverage/
*.log
*.xcodeproj/
EOF

# Initialize git repo
git add .
git commit -m "chore: initial safari plugin project structure"
```

### Step 3: Push Plugin Repository

```bash
# If created on GitHub/Forgejo already:
git remote add origin https://github.com/yourusername/job-tracker-safari-plugin.git
git branch -M main
git push -u origin main

# Or if starting fresh:
# Go to GitHub/Forgejo and create repo, then:
git remote add origin https://github.com/yourusername/job-tracker-safari-plugin.git
git branch -M main
git push -u origin main
```

### Step 4: Add as Submodule to job-tracker

```bash
# From the job-tracker repo root
cd /Users/john/work/job-tracker

# Add the submodule
git submodule add https://github.com/yourusername/job-tracker-safari-plugin.git safari-plugin

# Commit the change
git add .gitmodules safari-plugin/
git commit -m "feat: add safari-plugin as git submodule

- Enables independent versioning and maintenance
- Plugin can be published separately
- Clear separation from web app codebase"
```

### Step 5: Verify Setup

```bash
# Check .gitmodules file
cat .gitmodules
# Should output:
# [submodule "safari-plugin"]
#   path = safari-plugin
#   url = https://github.com/yourusername/job-tracker-safari-plugin.git

# Check submodule status
git submodule status
# Should show: <hash> safari-plugin (checked out at specific commit)
```

---

## Working with the Submodule

### Cloning job-tracker with the Submodule

```bash
# New clone needs to initialize submodules
git clone https://github.com/yourusername/job-tracker.git
cd job-tracker
git submodule update --init --recursive

# Or, clone with submodules in one step
git clone --recursive https://github.com/yourusername/job-tracker.git
```

### Updating Submodule Code

```bash
# Navigate to submodule
cd safari-plugin

# Create and checkout branch
git checkout -b feature/my-feature

# Make changes
# Edit files...

# Commit and push
git add .
git commit -m "feat: implement feature"
git push origin feature/my-feature

# Create PR on safari-plugin repo
```

### Pulling Latest Submodule Changes

```bash
# From job-tracker repo root
git submodule update --remote safari-plugin

# Or manually update to specific commit
cd safari-plugin
git checkout <commit-hash>
cd ..

# Commit the submodule update
git add safari-plugin/
git commit -m "chore: update safari-plugin to latest version"
```

### Tracking Submodule Changes in job-tracker

```bash
# View recent submodule commits
cd safari-plugin
git log --oneline -5

# View submodule status
cd ..
git status
# Will show: modified:   safari-plugin (new commits)

# Update job-tracker to track latest plugin version
git add safari-plugin/
git commit -m "chore: update safari-plugin submodule reference"
```

---

## CI/CD Considerations

### GitHub Actions Example

Create `.github/workflows/plugin-build.yml` in **safari-plugin** repo:

```yaml
name: Plugin Build

on: [push, pull_request]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: pnpm install

      - name: Build
        run: pnpm build

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Test
        run: pnpm test:run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

Create `.github/workflows/job-tracker-build.yml` in **job-tracker** repo:

```yaml
name: Job Tracker Build

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: 'recursive'  # Important: clone submodules

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install job-tracker dependencies
        run: pnpm install

      - name: Install plugin dependencies
        run: pnpm --dir safari-plugin install

      - name: Build job-tracker
        run: pnpm build

      - name: Build plugin
        run: pnpm --dir safari-plugin build

      - name: Test job-tracker
        run: pnpm test:run

      - name: Test plugin
        run: pnpm --dir safari-plugin test:run
```

---

## Communication Between Repos

### Shared Types

Option 1: **Publish plugin types to a package registry**
```bash
# In safari-plugin/package.json, add types export
"exports": {
  "types": "./src/types.ts"
}

# Then publish to your package registry
pnpm publish

# In job-tracker, import from package
pnpm add @job-tracker/safari-plugin
import type { JobCapture } from '@job-tracker/safari-plugin/types'
```

Option 2: **Symlink during development**
```bash
# In job-tracker, during dev
pnpm link ../safari-plugin
```

Option 3: **Copy types during build**
```bash
# In job-tracker build script
cp safari-plugin/src/types.ts src/types/plugin.ts
```

### Documentation Cross-Reference

- **safari-plugin/docs/ARCHITECTURE.md** → Links to job-tracker ARCHITECTURE.md
- **job-tracker/docs/ARCHITECTURE.md** → Links to safari-plugin docs
- **Both READMEs** → Link to integration points

---

## Directory Structure After Setup

```
job-tracker/
├── safari-plugin/                  # Git submodule (separate repo)
│   ├── src/
│   │   ├── background.ts
│   │   ├── content.ts
│   │   ├── types.ts
│   │   └── ...
│   ├── Resources/
│   │   ├── manifest.json
│   │   ├── popup.html
│   │   └── ...
│   ├── tests/
│   ├── docs/
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── src/                            # job-tracker app
│   ├── hooks/
│   │   └── usePluginQueue.ts        # Imports from plugin queue
│   ├── services/
│   ├── ...
│
├── docs/
│   ├── ARCHITECTURE.md              # References safari-plugin
│   ├── SAFARI_PLUGIN_ARCHITECTURE.md
│   └── ...
│
├── .gitmodules                      # Submodule configuration
├── package.json
└── README.md
```

---

## .gitmodules Example

```ini
[submodule "safari-plugin"]
    path = safari-plugin
    url = https://github.com/yourusername/job-tracker-safari-plugin.git
```

---

## Updating .gitmodules (If URL Changes)

```bash
# If you need to change the remote URL
git config --file=.gitmodules submodule.safari-plugin.url "https://new-url.git"
git submodule sync
git add .gitmodules
git commit -m "chore: update safari-plugin submodule URL"
```

---

## Troubleshooting

### Submodule stuck at old commit

```bash
cd safari-plugin
git log --oneline -1
# Check if it's behind HEAD

# Update to latest
git checkout main
git pull origin main
cd ..
git add safari-plugin/
git commit -m "chore: update safari-plugin"
```

### Submodule not cloning

```bash
# Make sure to use --recursive during clone
git clone --recursive https://github.com/yourusername/job-tracker.git

# If already cloned without submodules:
git submodule update --init --recursive
```

### Submodule changes not appearing

```bash
# Make sure you're in the submodule directory
cd safari-plugin
git status

# Verify you have the right branch
git branch -a

# Pull latest
git pull origin main
```

---

## Alternative: Option 2 - Monorepo (Simpler Alternative)

If you prefer simpler git operations, you can use a monorepo structure instead:

```
job-tracker/
├── apps/
│   ├── web/              # React app
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   │
│   └── safari-plugin/    # Safari extension
│       ├── src/
│       ├── Resources/
│       ├── package.json
│       └── ...
│
├── packages/
│   └── shared-types/     # Shared TypeScript definitions
│
├── package.json          # Root workspace
└── pnpm-workspace.yaml   # (if using pnpm)
```

**Benefits of Monorepo:**
- ✅ Single git repo (easier for most developers)
- ✅ Shared TypeScript types naturally
- ✅ Atomic commits span both projects
- ✅ Single CI/CD workflow

**Drawbacks:**
- ❌ Harder to version independently
- ❌ Plugin can't be published separately as easily
- ❌ Larger repository

---

## Recommendation

### Use Git Submodule If:
- ✅ Plugin will be published to Safari App Store independently
- ✅ Plugin may support other apps in the future
- ✅ Plugin and app have different release cycles
- ✅ You want clear separation of concerns
- **→ This is recommended for your use case**

### Use Monorepo If:
- ✅ Plugin and app are always released together
- ✅ Contributors usually work on both at the same time
- ✅ You want simpler git operations
- ✅ You're using a monorepo tool (pnpm, yarn, turborepo)

---

## Next Steps

1. **Create safari-plugin repository** on GitHub/Forgejo
2. **Run setup commands** above to add as submodule
3. **Update CI/CD workflows** to build both projects
4. **Document in both READMEs** with setup instructions
5. **Create Forgejo issues** in safari-plugin repo (use SAFARI_PLUGIN_FORGEJO_ISSUES.md)
6. **Start Phase P1** implementation

---

## Example Workflow: Making Plugin Changes

```bash
# Clone job-tracker with submodules
git clone --recursive https://github.com/yourusername/job-tracker.git
cd job-tracker

# Create a feature branch in the main repo
git checkout -b feature/plugin-integration

# Enter plugin submodule
cd safari-plugin

# Create a branch in the plugin repo
git checkout -b feature/popup-form

# Make changes to plugin
# ... edit src/popup.ts, etc ...

# Commit and push plugin changes
git add src/popup.ts
git commit -m "feat: implement quick-capture popup form"
git push origin feature/popup-form

# Go back to main job-tracker repo
cd ..

# Create the usePluginQueue hook
git add src/hooks/usePluginQueue.ts
git commit -m "feat: add plugin queue integration hook"

# Update submodule reference (so main branch tracks your plugin commits)
git add safari-plugin/
git commit --amend --no-edit

# Push both changes
git push origin feature/plugin-integration
```
