# Running Job Tracker as a macOS User Daemon

This guide explains how to set up Job Tracker to run automatically in the background on macOS using `launchd`.

## Prerequisites

- macOS 10.9 or later
- Node.js 18+
- Job Tracker built (run `npm run build`)

## Installation Steps

### 1. Build the Application

```bash
npm run build
```

This creates the `dist/` directory with the production build.

### 2. Find Your Job Tracker Installation Path

```bash
pwd
# Note the full path, e.g., /Users/john/tmp
```

### 3. Create the LaunchAgent Plist File

Copy and customize the template:

```bash
# Copy the template
cp com.local.job-tracker.plist.template ~/Library/LaunchAgents/com.local.job-tracker.plist

# Edit to replace paths (use your favorite editor)
nano ~/Library/LaunchAgents/com.local.job-tracker.plist
```

**Replace these paths with your actual paths:**
- `/path/to/job-tracker` → Your actual Job Tracker directory (e.g., `/Users/john/tmp`)
- All occurrences of `/path/to/job-tracker` in both `Program` and `ProgramArguments`

Example (for `/Users/john/tmp`):

```xml
<key>Program</key>
<string>/usr/local/bin/node</string>

<key>ProgramArguments</key>
<array>
  <string>/usr/local/bin/node</string>
  <string>/Users/john/tmp/server.js</string>
</array>

<key>WorkingDirectory</key>
<string>/Users/john/tmp</string>
```

### 4. Set Permissions

```bash
chmod 644 ~/Library/LaunchAgents/com.local.job-tracker.plist
```

### 5. Load the LaunchAgent

```bash
# Load the service
launchctl load ~/Library/LaunchAgents/com.local.job-tracker.plist

# Verify it's running
launchctl list | grep job-tracker
```

## Usage

### Start the Daemon

```bash
# The daemon starts automatically on login, but you can manually start it:
launchctl start com.local.job-tracker
```

### Check Status

```bash
# List running launch agents (grep for job-tracker)
launchctl list | grep job-tracker

# View logs
tail -f /var/log/job-tracker.log
tail -f /var/log/job-tracker-error.log
```

### Access the Application

Once running, open your browser and navigate to:

```
http://localhost:3100
```

### Stop the Daemon

```bash
launchctl stop com.local.job-tracker
```

### Unload the Daemon (Disable at Login)

```bash
launchctl unload ~/Library/LaunchAgents/com.local.job-tracker.plist
```

### Reload After Changes

If you edit the plist file:

```bash
launchctl unload ~/Library/LaunchAgents/com.local.job-tracker.plist
launchctl load ~/Library/LaunchAgents/com.local.job-tracker.plist
```

## Configuration

### Change the Port

Edit the plist file and modify:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>PORT</key>
  <string>3100</string>  <!-- Change this to your desired port (default is 3100) -->
</dict>
```

Then reload:

```bash
launchctl unload ~/Library/LaunchAgents/com.local.job-tracker.plist
launchctl load ~/Library/LaunchAgents/com.local.job-tracker.plist
```

### View Detailed Logs

```bash
# Real-time log streaming
log stream --predicate 'process == "node"' --level debug

# Or use the generated log files
tail -f /var/log/job-tracker.log
tail -f /var/log/job-tracker-error.log
```

## Troubleshooting

### Application Won't Start

1. **Check the plist syntax:**
   ```bash
   plutil -lint ~/Library/LaunchAgents/com.local.job-tracker.plist
   ```

2. **Verify paths are correct:**
   ```bash
   # Check if node exists at the path
   /usr/local/bin/node --version
   
   # Check if server.js exists
   ls -la /path/to/job-tracker/server.js
   ```

3. **Check logs for errors:**
   ```bash
   tail -50 /var/log/job-tracker-error.log
   ```

### Port Already in Use

If port 3100 is already in use, change the port in the plist:

```xml
<key>PORT</key>
<string>3101</string>  <!-- Use a different port -->
```

### Node Command Not Found

If `launchctl` can't find Node, find the correct path:

```bash
which node
# Output: /usr/local/bin/node (or /opt/homebrew/bin/node for M1/M2 Macs)
```

Update the `Program` and `ProgramArguments` in the plist with the correct path.

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
npm run build
# LaunchAgent automatically serves the updated dist/ directory
# No restart needed!
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
