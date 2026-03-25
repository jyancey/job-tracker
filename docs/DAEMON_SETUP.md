# Running Job Tracker as a macOS User Daemon

This guide explains how to run the standalone Job Tracker bundle on macOS with `launchd`.

## Prerequisites

- macOS 10.9 or later
- Node.js 20+
- A packaged standalone Job Tracker bundle

## Installation Steps

### 1. Build or Extract the Standalone Bundle

```bash
pnpm build
```

Then package it:

```bash
./scripts/package-standalone.sh deploy
```

Or extract the release/deploy zip. The bundle should contain:

```text
start.sh
server.js
.next/
public/
macos/
docs/DAEMON_SETUP.md
```

For manual startup (without launchd), run from the bundle root:

```bash
./start.sh
```

This wrapper normalizes host binding for Next.js standalone mode and avoids hostname resolution errors like `getaddrinfo ENOTFOUND <machine-name>`.
It also auto-rebuilds `better-sqlite3` if the bundled native binary was compiled for a different Node.js ABI.

### 2. Find Your Job Tracker Installation Path

Use the extracted bundle directory, for example `/Users/john/job-tracker`.

### 3. Install the LaunchAgent

From the bundle root:

```bash
./macos/install-launch-agent.sh
```

This script:

- creates `~/Library/LaunchAgents/com.local.job-tracker.plist`
- points it at `macos/start-job-tracker.sh`
- configures logs under `~/Library/Logs/job-tracker/`
- starts the LaunchAgent immediately

If you need to customize paths or ports manually, edit the generated plist:

```xml
<key>EnvironmentVariables</key>
<dict>
   <key>PORT</key>
   <string>3100</string>
   <key>JOB_TRACKER_HOST</key>
   <string>localhost</string>
   <key>JOB_TRACKER_DB_PATH</key>
   <string>/Users/your-user/job-tracker/data/job-tracker.sqlite</string>
</dict>

<key>ProgramArguments</key>
<array>
   <string>/bin/bash</string>
   <string>/Users/your-user/job-tracker/macos/start-job-tracker.sh</string>
</array>

<key>WorkingDirectory</key>
<string>/Users/your-user/job-tracker</string>
```

### 4. Set Permissions

The installer script already applies the correct permissions.

### 5. Load the LaunchAgent

```bash
launchctl print gui/$(id -u)/com.local.job-tracker
```

## Usage

### Start the Daemon

```bash
launchctl kickstart -k gui/$(id -u)/com.local.job-tracker
```

### Check Status

```bash
# Show agent details
launchctl print gui/$(id -u)/com.local.job-tracker

# View logs
tail -f ~/Library/Logs/job-tracker/job-tracker.log
tail -f ~/Library/Logs/job-tracker/job-tracker-error.log
```

### Access the Application

Once running, open your browser and navigate to:

```text
http://localhost:3100
```

### Stop the Daemon

```bash
launchctl kill TERM gui/$(id -u)/com.local.job-tracker
```

### Unload the Daemon (Disable at Login)

```bash
./macos/uninstall-launch-agent.sh
```

### Reload After Changes

If you edit the plist file:

```bash
./macos/install-launch-agent.sh
```

## Configuration

### Change the Port

Edit the plist file and modify:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>PORT</key>
   <string>3100</string>
</dict>
```

The startup wrapper reads `JOB_TRACKER_HOST` from the plist and maps it to the `HOSTNAME` environment variable expected by the standalone Next.js server.

### Set a Custom SQLite Database Path

Job Tracker stores jobs in `data/job-tracker.sqlite` inside the bundle by default. To use a persistent external path, set `JOB_TRACKER_DB_PATH`:

```xml
<key>EnvironmentVariables</key>
<dict>
   <key>PORT</key>
   <string>3100</string>
   <key>JOB_TRACKER_DB_PATH</key>
   <string>/Users/your-user/job-tracker-data/job-tracker.sqlite</string>
</dict>
```

Then reload:

```bash
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.local.job-tracker.plist
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.local.job-tracker.plist
```

### View Detailed Logs

```bash
# Real-time log streaming
log stream --predicate 'process == "node"' --level debug

# Or use the generated log files
tail -f ~/Library/Logs/job-tracker/job-tracker.log
tail -f ~/Library/Logs/job-tracker/job-tracker-error.log
```

## Troubleshooting

### Application Won't Start

1. **Check the plist syntax:**

   ```bash
   plutil -lint ~/Library/LaunchAgents/com.local.job-tracker.plist
   ```

2. **Verify paths are correct:**

   ```bash
   # Check if the standalone server exists
   ls -la /path/to/job-tracker/server.js

   # Check if the startup helper exists
   ls -la /path/to/job-tracker/macos/start-job-tracker.sh
   ```

3. **Check logs for errors:**

   ```bash
   tail -50 ~/Library/Logs/job-tracker/job-tracker-error.log
   ```

4. **If you see `getaddrinfo ENOTFOUND <machine-name>`:**

   - Start the standalone bundle with `./start.sh` (or `./macos/start-job-tracker.sh` for launchd)
   - Ensure `JOB_TRACKER_HOST` is set to `localhost`, `127.0.0.1`, or `0.0.0.0`

5. **If you see `NODE_MODULE_VERSION` / `ERR_DLOPEN_FAILED` for `better-sqlite3`:**

   - The startup wrappers now attempt `pnpm rebuild better-sqlite3` automatically
   - If it still fails, run manually from the bundle root:

   ```bash
   pnpm rebuild better-sqlite3
   ```

6. **If you see `Cannot find module 'better-sqlite3-<hash>'`:**

   - This means a Next.js external alias package under `.next/node_modules/` is missing
   - The startup wrappers now auto-repair missing `better-sqlite3-<hash>` aliases on launch
   - If needed, re-package and re-extract the standalone bundle, then start via `./start.sh`

### Port Already in Use

If port 3100 is already in use, change the port in the plist:

```xml
<key>PORT</key>
<string>3101</string>  <!-- Use a different port -->
```

### Node Command Not Found

If `launchctl` can't find Node, check that `node` is on the daemon PATH:

```bash
which node
# Example: /opt/homebrew/bin/node
```

Then update `macos/start-job-tracker.sh` to use the absolute Node path if needed.

### Permission Denied

Ensure the plist has correct permissions:

```bash
chmod 644 ~/Library/LaunchAgents/com.local.job-tracker.plist
```

## Advanced: Run as System Daemon

To run Job Tracker as a system daemon (available to all users, starts before login):

1. Use `/Library/LaunchDaemons/` instead of `~/Library/LaunchAgents/`
2. Change ownership:

   ```bash
   sudo chown root:wheel /Library/LaunchDaemons/com.local.job-tracker.plist
   chmod 644 /Library/LaunchDaemons/com.local.job-tracker.plist
   ```

3. Load with `sudo`:

   ```bash
   sudo launchctl load /Library/LaunchDaemons/com.local.job-tracker.plist
   ```

## Monitoring with Activity Monitor

1. Open **Activity Monitor**
2. Search for `node`
3. You should see the Job Tracker server process running

## Automatic Updates

If you rebuild the application:

```bash
pnpm build
# Reinstall or restart the agent after replacing the bundle
./macos/install-launch-agent.sh
```

## Disable on macOS Restart

To prevent Job Tracker from starting at login:

```bash
launchctl unload ~/Library/LaunchAgents/com.local.job-tracker.plist
```

To re-enable:

```bash
launchctl load ~/Library/LaunchAgents/com.local.job-tracker.plist
```

## References

- [Apple's launchd Documentation](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchDaemons.html)
- [launchd.info](http://launchd.info/) - Community documentation
- `man launchd.plist` - View the manual page locally
