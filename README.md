# App Store Connect MCP Server

Enterprise-grade Model Context Protocol (MCP) server for programmatic integration with Apple's App Store Connect API. Enables AI-powered automation of iOS app lifecycle management, build distribution, and metadata operations.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)

## Overview

This MCP server provides a secure, rate-limited interface to Apple's App Store Connect API, enabling AI assistants and automation tools to manage iOS applications, monitor build status, and streamline app distribution workflows. Built with enterprise security practices and production-grade error handling.

### Key Capabilities

- **Application Lifecycle Management**: Create, query, and manage iOS applications
- **Build Monitoring**: Track build processing status and distribution readiness
- **Secure Authentication**: JWT-based authentication with automatic token refresh
- **Rate Limiting**: Built-in request throttling to comply with Apple's API limits
- **Error Recovery**: Comprehensive error handling with actionable diagnostics

## Prerequisites

### Required Accounts & Access

- Active [Apple Developer Program](https://developer.apple.com/programs/) membership
- App Store Connect account with API access privileges
- Node.js runtime version 18.0.0 or higher

### API Credentials Setup

#### Generating App Store Connect API Keys

1. Navigate to [App Store Connect](https://appstoreconnect.apple.com)
2. Access **Users and Access** → **Integrations** → **App Store Connect API**
3. Select **Generate API Key** or use an existing key with appropriate permissions
4. Record the following credentials:
   - **Key ID**: 10-character alphanumeric identifier (e.g., `ABC123XYZ`)
   - **Issuer ID**: UUID format team identifier (e.g., `12345678-1234-1234-1234-123456789012`)
5. Download the `.p8` private key file (available only once upon generation)

**Security Notice**: Store the private key securely. Apple does not retain copies of private keys.

#### Private Key Formatting

The private key must be provided in PEM format. Two accepted formats:

**Option 1: Multi-line (Recommended)**
```
-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
[additional lines]
...xyz789==
-----END PRIVATE KEY-----
```

**Option 2: Single-line with escaped newlines**
```bash
cat AuthKey_ABC123XYZ.p8 | awk '{printf "%s\\n", $0}'
```

## Installation

### Standard Installation

```bash
# Clone repository
git clone https://github.com/thefiredev-cloud/Apple-App-Store-MCP.git
cd Apple-App-Store-MCP

# Install dependencies
npm install

# Compile TypeScript
npm run build
```

### Development Installation

```bash
# Install in watch mode for active development
npm install
npm run watch

# Link globally for system-wide access
npm link
```

## Configuration

### MCP Client Integration

#### Claude Desktop Configuration

Edit the Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "appstore-connect": {
      "command": "node",
      "args": ["/absolute/path/to/Apple-App-Store-MCP/build/index.js"],
      "env": {
        "APPLE_KEY_ID": "ABC123XYZ",
        "APPLE_ISSUER_ID": "12345678-1234-1234-1234-123456789012",
        "APPLE_PRIVATE_KEY": "-----BEGIN PRIVATE KEY-----\nMIGTAgEA...\n-----END PRIVATE KEY-----"
      }
    }
  }
}
```

**Important**: Use absolute file paths to the compiled `build/index.js` file.

### Environment Variables

Alternative configuration via environment variables:

```bash
export APPLE_KEY_ID="ABC123XYZ"
export APPLE_ISSUER_ID="12345678-1234-1234-1234-123456789012"
export APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg...
-----END PRIVATE KEY-----"
```

## API Reference

### Tools

#### `list_apps`

Retrieve all applications associated with your App Store Connect team.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `limit` | number | No | 50 | Maximum apps to return (1-200) |
| `bundleId` | string | No | - | Filter by specific bundle identifier |

**Returns:** Array of app objects containing name, bundle ID, SKU, and locale information.

**Example Query:**
```
"List all iOS applications in my account"
"Find the app with bundle ID com.example.production"
```

---

#### `get_app`

Fetch detailed information for a specific application.

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `appId` | string | Yes | App Store Connect application ID |

**Returns:** Comprehensive app metadata including status, version, and configuration.

**Example Query:**
```
"Retrieve details for app ID 1234567890"
```

---

#### `create_app`

Provision a new application in App Store Connect.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Application display name |
| `bundleId` | string | Yes | - | Pre-registered bundle identifier |
| `sku` | string | Yes | - | Unique alphanumeric SKU |
| `primaryLocale` | string | No | en-US | Primary localization (BCP 47 format) |

**Returns:** Created app object with assigned App Store Connect ID.

**Prerequisites:** Bundle identifier must be registered in Apple Developer Portal.

**Example Query:**
```
"Create new app named ProductionApp with bundle ID com.example.prod and SKU PROD001"
```

---

#### `list_builds`

Query build submissions for a specific application.

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `appId` | string | Yes | - | App Store Connect application ID |
| `limit` | number | No | 50 | Maximum builds to return |

**Returns:** Array of build objects with version numbers, processing status, and upload dates.

**Example Query:**
```
"Show recent builds for app 1234567890"
```

## Usage Examples

### Natural Language Workflow

```
User: "Display all applications in my App Store Connect account"
AI: [Executes list_apps tool]

User: "Create application SuperApp with bundle com.company.superapp, SKU SUPER001"
AI: [Executes create_app tool with specified parameters]

User: "What builds exist for my newest app?"
AI: [Executes list_builds with relevant app ID]
```

### Programmatic Integration

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: "automation-client",
  version: "1.0.0"
});

// List apps
const result = await client.request({
  method: "tools/call",
  params: {
    name: "list_apps",
    arguments: { limit: 100 }
  }
});
```

## Error Handling

### Common Issues & Resolutions

#### Authentication Failures

**Symptom:** `Authentication failed` or `Invalid JWT token`

**Diagnosis:**
- Verify Key ID matches the downloaded `.p8` file name
- Confirm Issuer ID corresponds to your team in App Store Connect
- Validate private key includes PEM headers/footers
- Check API key hasn't been revoked in App Store Connect

**Resolution:**
```bash
# Verify key ID from filename
ls AuthKey_*.p8

# Validate Issuer ID in App Store Connect
# Users and Access → Keys → [Your Key] → Issuer ID

# Test key format
echo "$APPLE_PRIVATE_KEY" | grep "BEGIN PRIVATE KEY"
```

---

#### Rate Limiting

**Symptom:** `Rate limit exceeded` or HTTP 429 responses

**Cause:** Exceeded Apple's API rate limits (typically 500 requests/hour)

**Resolution:**
- Reduce request frequency
- Implement exponential backoff (built-in for 429 responses)
- Cache frequently-accessed data
- Contact Apple Developer Support for limit increases (enterprise accounts)

---

#### Missing Environment Variables

**Symptom:** `Missing required environment variables`

**Resolution:**
1. Verify all three environment variables are set:
   - `APPLE_KEY_ID`
   - `APPLE_ISSUER_ID`
   - `APPLE_PRIVATE_KEY`
2. Check for typos in variable names
3. Confirm values contain no leading/trailing whitespace
4. Restart MCP client after configuration changes

---

#### Bundle ID Not Registered

**Symptom:** `Bundle ID not found` when creating apps

**Resolution:**
1. Log in to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles** → **Identifiers**
3. Register bundle ID with appropriate capabilities
4. Wait 5-10 minutes for propagation
5. Retry app creation

## Performance & Rate Limiting

### Built-in Protections

- **Request Throttling**: 100ms minimum interval between requests
- **Token Caching**: 20-minute JWT lifetime with automatic refresh
- **Retry Logic**: Automatic retry with exponential backoff on 429 responses
- **Connection Pooling**: Reused HTTP connections for improved performance

### Apple API Limits

- **Hourly Limit**: ~500 requests/hour (subject to change)
- **Concurrent Requests**: Recommended maximum of 10 concurrent connections
- **Token Lifetime**: 20 minutes maximum

**Recommendation**: Implement application-level caching for frequently-accessed resources.

## Security Best Practices

### Credential Management

1. **Never Commit Secrets**: Add `.env` and credential files to `.gitignore`
2. **Use Secret Managers**: Store credentials in HashiCorp Vault, AWS Secrets Manager, or equivalent
3. **Rotate Keys Regularly**: Generate new API keys quarterly
4. **Minimum Permissions**: Create API keys with only required scopes
5. **Monitor Usage**: Review API activity in App Store Connect regularly

### Deployment Considerations

- Use environment-specific API keys (development, staging, production)
- Implement audit logging for all API operations
- Enable IP allowlisting if available for your Apple account tier
- Encrypt credentials at rest and in transit

## Development

### Building

```bash
# One-time compilation
npm run build

# Watch mode for development
npm run watch
```

### Testing

```bash
# Run with development configuration
npm run dev

# Server will output to stderr for debugging
```

### Project Structure

```
Apple-App-Store-MCP/
├── src/
│   ├── index.ts              # MCP server implementation
│   ├── auth/
│   │   └── jwt.ts            # JWT authentication module
│   └── api/
│       └── client.ts         # App Store Connect API client
├── build/                    # Compiled JavaScript output
├── .env.example              # Example environment configuration
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── README.md
```

## Extending Functionality

### Adding New Tools

1. **Implement API Method** (`src/api/client.ts`):
```typescript
async getAppMetadata(appId: string, locale: string) {
  return this.get(`/apps/${appId}/appInfos`, {
    'filter[locale]': locale
  });
}
```

2. **Register Tool** (`src/index.ts` - ListToolsRequestSchema):
```typescript
{
  name: "get_app_metadata",
  description: "Retrieve localized app metadata",
  inputSchema: {
    type: "object",
    properties: {
      appId: { type: "string", description: "App ID" },
      locale: { type: "string", description: "Locale code (e.g., en-US)" }
    },
    required: ["appId", "locale"]
  }
}
```

3. **Implement Handler** (`src/index.ts` - CallToolRequestSchema):
```typescript
case "get_app_metadata": {
  const { appId, locale } = args as { appId: string; locale: string };
  const metadata = await apiClient.getAppMetadata(appId, locale);
  return {
    content: [{
      type: "text",
      text: JSON.stringify(metadata, null, 2)
    }]
  };
}
```

4. **Rebuild**: `npm run build`

## Roadmap

### Planned Enhancements

- [ ] **Metadata Management**: Update descriptions, screenshots, keywords, and release notes
- [ ] **TestFlight Distribution**: Manage beta testers, groups, and external builds
- [ ] **Analytics Integration**: Query app performance metrics and crash reports
- [ ] **Pricing Management**: Update pricing tiers and regional availability
- [ ] **Version Management**: Create and manage app versions
- [ ] **Asset Upload**: Upload app icons, screenshots, and preview videos
- [ ] **Review Submission**: Automated submission workflows with status tracking
- [ ] **Webhook Support**: Real-time notifications for build processing events

## Resources

### Official Documentation

- [App Store Connect API Reference](https://developer.apple.com/documentation/appstoreconnectapi)
- [Model Context Protocol Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)

### Related Tools

- [App Store Connect CLI](https://github.com/marketplace/actions/app-store-connect-api)
- [Fastlane](https://fastlane.tools/) - Ruby-based iOS automation

## Support

### Getting Help

1. Review this README and [SETUP.md](./SETUP.md) documentation
2. Check [Apple's API documentation](https://developer.apple.com/documentation/appstoreconnectapi)
3. Search existing [GitHub Issues](https://github.com/thefiredev-cloud/Apple-App-Store-MCP/issues)
4. Open a new issue with:
   - Environment details (Node.js version, OS)
   - Anonymized error messages
   - Steps to reproduce

### Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit changes with clear messages
4. Open a pull request with detailed description

## License

This project is licensed under the MIT License. See [LICENSE](./LICENSE) for details.

## Acknowledgments

**Built With:**
- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - MCP implementation framework
- [jose](https://www.npmjs.com/package/jose) - JWT generation and verification
- [axios](https://www.npmjs.com/package/axios) - Promise-based HTTP client
- [zod](https://www.npmjs.com/package/zod) - TypeScript-first schema validation

---

**Maintained by:** [TheFire Dev](https://github.com/thefiredev-cloud)
**Status:** Production Ready
**Last Updated:** 2025-09-30
