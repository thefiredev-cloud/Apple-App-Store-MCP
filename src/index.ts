#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createAuthFromEnv } from "./auth/jwt.js";
import { AppStoreConnectClient } from "./api/client.js";

// Initialize authentication and API client
let apiClient: AppStoreConnectClient;

try {
  const auth = createAuthFromEnv();
  apiClient = new AppStoreConnectClient(auth);
} catch (error) {
  console.error("Failed to initialize App Store Connect client:", error);
  process.exit(1);
}

// Server instance
const server = new Server(
  {
    name: "mcp-appstore-connect",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "list_apps",
        description: "List all apps for your team from App Store Connect. Returns app name, bundle ID, SKU, and primary locale.",
        inputSchema: {
          type: "object",
          properties: {
            limit: {
              type: "number",
              description: "Maximum number of apps to return (default: 50, max: 200)",
              default: 50,
            },
            bundleId: {
              type: "string",
              description: "Filter apps by bundle ID (optional)",
            },
          },
        },
      },
      {
        name: "get_app",
        description: "Get detailed information about a specific app by its App Store Connect ID",
        inputSchema: {
          type: "object",
          properties: {
            appId: {
              type: "string",
              description: "The App Store Connect app ID",
            },
          },
          required: ["appId"],
        },
      },
      {
        name: "create_app",
        description: "Create a new app in App Store Connect. Requires bundle ID to be registered in your developer account.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "The name of the app",
            },
            bundleId: {
              type: "string",
              description: "The bundle identifier (must be pre-registered)",
            },
            sku: {
              type: "string",
              description: "A unique SKU for the app (alphanumeric)",
            },
            primaryLocale: {
              type: "string",
              description: "Primary locale code (e.g., 'en-US', 'ja', 'fr-FR')",
              default: "en-US",
            },
          },
          required: ["name", "bundleId", "sku"],
        },
      },
      {
        name: "list_builds",
        description: "List builds for a specific app",
        inputSchema: {
          type: "object",
          properties: {
            appId: {
              type: "string",
              description: "The App Store Connect app ID",
            },
            limit: {
              type: "number",
              description: "Maximum number of builds to return (default: 50)",
              default: 50,
            },
          },
          required: ["appId"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "list_apps": {
        const limit = (args as { limit?: number }).limit || 50;
        const bundleId = (args as { bundleId?: string }).bundleId;

        const filter = bundleId ? { bundleId } : undefined;
        const result = await apiClient.listApps({
          limit,
          fields: ["bundleId", "name", "sku", "primaryLocale"],
          filter,
        });

        if (result.data.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: bundleId
                  ? `No apps found with bundle ID: ${bundleId}`
                  : "No apps found for your team.",
              },
            ],
          };
        }

        const appsList = result.data
          .map((app) => {
            return `• ${app.attributes.name}\n  Bundle ID: ${app.attributes.bundleId}\n  SKU: ${app.attributes.sku}\n  ID: ${app.id}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.data.length} app(s):\n\n${appsList}`,
            },
          ],
        };
      }

      case "get_app": {
        const { appId } = args as { appId: string };
        const result = await apiClient.getApp(appId, [
          "bundleId",
          "name",
          "sku",
          "primaryLocale",
        ]);

        const app = result.data;
        return {
          content: [
            {
              type: "text",
              text: `App Details:\n\nName: ${app.attributes.name}\nBundle ID: ${app.attributes.bundleId}\nSKU: ${app.attributes.sku}\nPrimary Locale: ${app.attributes.primaryLocale}\nID: ${app.id}`,
            },
          ],
        };
      }

      case "create_app": {
        const { name, bundleId, sku, primaryLocale } = args as {
          name: string;
          bundleId: string;
          sku: string;
          primaryLocale?: string;
        };

        const result = await apiClient.createApp({
          name,
          bundleId,
          sku,
          primaryLocale: primaryLocale || "en-US",
        });

        const app = result.data;
        return {
          content: [
            {
              type: "text",
              text: `✅ Successfully created app!\n\nName: ${app.attributes.name}\nBundle ID: ${app.attributes.bundleId}\nSKU: ${app.attributes.sku}\nID: ${app.id}\n\nYou can now upload builds and configure app metadata in App Store Connect.`,
            },
          ],
        };
      }

      case "list_builds": {
        const { appId, limit } = args as { appId: string; limit?: number };
        const result = await apiClient.listBuilds(appId, limit || 50);

        if (result.data.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: "No builds found for this app.",
              },
            ],
          };
        }

        const buildsList = result.data
          .map((build) => {
            return `• Version ${build.attributes.version}\n  Status: ${build.attributes.processingState}\n  Uploaded: ${build.attributes.uploadedDate}\n  ID: ${build.id}`;
          })
          .join("\n\n");

        return {
          content: [
            {
              type: "text",
              text: `Found ${result.data.length} build(s):\n\n${buildsList}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("App Store Connect MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});