#!/usr/bin/env node
/**
 * cPanel MCP Server
 *
 * A Model Context Protocol server that provides full cPanel management
 * capabilities to any MCP-compatible AI agent or client.
 *
 * Modules:
 *   - Connection: connect dynamically or via env vars, verify, session status
 *   - Domains: list, info, data
 *   - SubDomains: add, delete, change doc root
 *   - DNS: list/add/edit/delete zone records
 *   - Email: accounts, forwarders, autoresponders, quotas
 *   - SSL: certificates, CSR, AutoSSL
 *   - FTP: accounts, quotas, server info
 *   - Backup: list, create (homedir/FTP), restore
 *   - Cron: list/add/edit/delete jobs, email settings
 *   - FileManager: list/read/write/delete/mkdir/rename/copy/chmod, disk usage
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CpanelClient } from "./cpanel-client.js";
import { registerDomainTools } from "./tools/domains.js";
import { registerSubDomainTools } from "./tools/subdomains.js";
import { registerDnsTools } from "./tools/dns.js";
import { registerEmailTools } from "./tools/email.js";
import { registerSslTools } from "./tools/ssl.js";
import { registerFtpTools } from "./tools/ftp.js";
import { registerBackupTools } from "./tools/backup.js";
import { registerCronTools } from "./tools/cron.js";
import { registerFileManagerTools } from "./tools/filemanager.js";
import { z } from "zod";

// ── Read optional initial configuration from environment ────────────
const envHost = process.env.CPANEL_HOST;
const envPort = process.env.CPANEL_PORT ? parseInt(process.env.CPANEL_PORT, 10) : 2083;
const envUsername = process.env.CPANEL_USERNAME;
const envPassword = process.env.CPANEL_PASSWORD;
const envApiToken = process.env.CPANEL_API_TOKEN;
const envInsecure = process.env.CPANEL_INSECURE === "true";

// Initialize cPanel client
const cpanelClient = new CpanelClient();

if (envHost && envUsername && (envPassword || envApiToken)) {
  cpanelClient.configure({
    host: envHost,
    port: envPort,
    username: envUsername,
    password: envPassword,
    apiToken: envApiToken,
    insecure: envInsecure,
  });
  console.error(`cPanel MCP: Initialized with default host ${envHost} for ${envUsername}`);
} else {
  console.error("cPanel MCP: Running in dynamic mode. Use 'cpanel_connect' to connect to any cPanel host.");
}

// ── Create MCP Server ───────────────────────────────────────────────
const server = new McpServer({
  name: "cpanel-mcp-server",
  version: "1.1.0",
  description:
    "Full cPanel management MCP server — DNS, Email, Domains, SubDomains, SSL, FTP, Backup, Cron, FileManager",
});

// ── Dynamic Connection Tool ─────────────────────────────────────────
server.tool(
  "cpanel_connect",
  "Connect to a cPanel server dynamically. Use this when connecting to a new cPanel or switching accounts. You can use Username+Password or Username+API Token.",
  {
    host: z.string().describe("cPanel hostname or domain (e.g. 'cpanel.example.com' or 'server.host.com')"),
    username: z.string().describe("cPanel username"),
    password: z.string().optional().describe("cPanel password (required if no apiToken)"),
    apiToken: z.string().optional().describe("cPanel API token (required if no password)"),
    port: z.number().optional().default(2083).describe("cPanel port (default 2083)"),
    insecure: z.boolean().optional().default(false).describe("Allow self-signed SSL certs (default false)"),
  },
  async ({ host, username, password, apiToken, port, insecure }) => {
    try {
      if (!password && !apiToken) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: "Either 'password' or 'apiToken' must be provided.",
            },
          ],
        };
      }

      cpanelClient.configure({
        host,
        username,
        password,
        apiToken,
        port: port ?? 2083,
        insecure: insecure ?? false,
      });

      // Verify connection
      const verification = await cpanelClient.verifyConnection();
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Successfully connected to cPanel server!\nHost: ${verification.host}\nUser: ${verification.user}\nPort: ${port ?? 2083}`,
          },
        ],
      };
    } catch (e) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `❌ Connection failed: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
      };
    }
  },
);

// ── Register connection verification tool ───────────────────────────
server.tool(
  "cpanel_verify_connection",
  "Verify the current cPanel connection is active and working.",
  {},
  async () => {
    try {
      const result = await cpanelClient.verifyConnection();
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Connection active and verified!\nHost: ${result.host}\nUser: ${result.user}`,
          },
        ],
      };
    } catch (e) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `❌ Connection check failed: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
      };
    }
  },
);

// ── Get Active Session ──────────────────────────────────────────────
server.tool(
  "cpanel_session_status",
  "Check which cPanel host and user is currently connected in this session.",
  {},
  async () => {
    const session = cpanelClient.getActiveSession();
    if (!session) {
      return {
        content: [
          {
            type: "text" as const,
            text: "No active cPanel session. Call 'cpanel_connect' with host, username, and credentials.",
          },
        ],
      };
    }
    return {
      content: [
        {
          type: "text" as const,
          text: `Active cPanel session:\nHost: ${session.host}\nUser: ${session.username}\nPort: ${session.port}`,
        },
      ],
    };
  },
);

// ── Register account stats tool ─────────────────────────────────────
server.tool(
  "cpanel_account_stats",
  "Get cPanel account statistics: disk usage, bandwidth, email count, domain count, addon domains, subdomains, etc.",
  {},
  async () => {
    try {
      const result = await cpanelClient.uapi("StatsBar", "get_stats", {
        display:
          "hostname|dedicatedip|sharedip|diskusage|bandwidthusage|emailaccounts|addondomains|subdomains|parkeddomains|sqldatabases|ftpaccounts",
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result.data, null, 2),
          },
        ],
      };
    } catch (e) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error getting account stats: ${e instanceof Error ? e.message : String(e)}`,
          },
        ],
      };
    }
  },
);

// ── Register all tool modules ───────────────────────────────────────
registerDomainTools(server, cpanelClient);
registerSubDomainTools(server, cpanelClient);
registerDnsTools(server, cpanelClient);
registerEmailTools(server, cpanelClient);
registerSslTools(server, cpanelClient);
registerFtpTools(server, cpanelClient);
registerBackupTools(server, cpanelClient);
registerCronTools(server, cpanelClient);
registerFileManagerTools(server, cpanelClient);

// ── Start the server ────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("cPanel MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
