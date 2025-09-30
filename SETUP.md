# Quick Setup Guide

## 1. Generate App Store Connect API Key

1. Visit [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to: **Users and Access** → **Integrations** → **App Store Connect API**
3. Click **Generate API Key** (or select existing)
4. Copy these values:
   - **Key ID** (looks like: `ABC123XYZ`)
   - **Issuer ID** (looks like: `12345678-1234-1234-1234-123456789012`)
5. **Download** the `.p8` file (⚠️ You can only download this ONCE!)

## 2. Format Your Private Key

### Option A: Single Line (for JSON config)

```bash
cat AuthKey_ABC123XYZ.p8 | awk '{printf "%s\\n", $0}'
```

Copy the output - it will look like:
```
-----BEGIN PRIVATE KEY-----\nMIGTAgEA...\n-----END PRIVATE KEY-----
```

### Option B: Multi-line (easier to read)

Just copy the entire content of your `.p8` file as-is:
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
...
-----END PRIVATE KEY-----
```

## 3. Configure Claude Desktop

### macOS

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "appstore-connect": {
      "command": "node",
      "args": ["/Users/YOUR_USERNAME/mcp-appstore-connect/build/index.js"],
      "env": {
        "APPLE_KEY_ID": "ABC123XYZ",
        "APPLE_ISSUER_ID": "12345678-1234-1234-1234-123456789012",
        "APPLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\nMIGTAgEA...\n-----END PRIVATE KEY-----"
      }
    }
  }
}
```

**⚠️ Important**: Replace `/Users/YOUR_USERNAME/` with your actual home directory path!

### Windows

Edit: `%APPDATA%\Claude\claude_desktop_config.json`

Use the same JSON format, but with Windows path:
```json
"args": ["C:\\Users\\YOUR_USERNAME\\mcp-appstore-connect\\build\\index.js"]
```

## 4. Install and Build

```bash
cd mcp-appstore-connect
npm install
npm run build
```

## 5. Restart Claude Desktop

Completely quit and restart Claude Desktop for changes to take effect.

## 6. Test It

In Claude, try:
```
"List all my iOS apps"
```

If it works, you'll see your apps! 🎉

## Troubleshooting

### ❌ "Missing required environment variables"

**Fix**:
- Double-check your config file path
- Verify all three env vars are set (KEY_ID, ISSUER_ID, PRIVATE_KEY)
- Make sure there are no typos

### ❌ "Authentication failed"

**Fix**:
- Confirm your API key is still active in App Store Connect
- Verify the Key ID matches your downloaded .p8 file
- Check that Issuer ID is correct (it's your Team ID)

### ❌ "ENOENT: no such file or directory"

**Fix**:
- Use the **absolute path** to index.js in your config
- Run `pwd` in the mcp-appstore-connect directory to get the full path
- The path should end with `/build/index.js`

### ❌ Can't see the tools in Claude

**Fix**:
- Make sure you ran `npm run build` after making changes
- Restart Claude Desktop (completely quit and reopen)
- Check Claude Desktop logs for errors

### 🔍 View Logs

**macOS**:
```bash
tail -f ~/Library/Logs/Claude/mcp*.log
```

## Common Commands

```bash
# Rebuild after changes
npm run build

# Watch mode (auto-rebuild)
npm run watch

# Test manually
npm run dev
```

## Next Steps

Once working, you can:
- Create new apps
- List builds
- Get app details
- And more!

See [README.md](./README.md) for complete documentation.