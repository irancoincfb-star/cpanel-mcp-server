#!/usr/bin/env node
/**
 * cPanel MCP Server
 *
 * A Model Context Protocol server that provides full cPanel management
 * capabilities to any MCP-compatible AI agent or client.
 *
 * Modules:
 *   - Domains: list, info, data
 *   - SubDomains: add, delete, change doc root
 *   - DNS: list/add/edit/delete zone records
 *   - Email: accounts, forwarders, autoresponders, quotas
 *   - SSL: certificates, CSR, AutoSSL
 *   - FTP: accounts, quotas, server info
 *   - Backup: list, create (homedir/FTP), restore
 *   - Cron: list/add/edit/delete jobs, email settings
 *   - FileManager: list/read/write/delete/mkdir/rename/copy/chmod, disk usage
 *
 * Authentication:
 *   - Username + Password (Basic Auth)
 *   - Username + API Token (recommended for automation)
 *
 * Configuration via environment variables:
 *   CPANEL_HOST     — cPanel server hostname (required)
 *   CPANEL_PORT     — cPanel port (default 2083)
 *   CPANEL_USERNAME — cPanel username (required)
 *   CPANEL_PASSWORD — cPanel password (optional if token is provided)
 *   CPANEL_API_TOKEN — cPanel API token (optional if password is provided)
 *   CPANEL_INSECURE — Set to "true" to allow self-signed certs
 *
 * Usage:
 *   CPANEL_HOST=example.com CPANEL_USERNAME=user CPANEL_PASSWORD=pass node dist/index.js
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

// ── Read configuration from environment ─────────────────────────────
const host = process.env.CPANEL_HOST;
const port = process.env.CPANEL_PORT ? parseInt(process.env.CPANEL_PORT, 10) : 2083;
const username = process.env.CPANEL_USERNAME;
const password = process.env.CPANEL_PASSWORD;
const apiToken = process.env.CPANEL_API_TOKEN;
const insecure = process.env.CPANEL_INSECURE === "true";

if (!host || !username) {
  console.error(
    "Error: CPANEL_HOST and CPANEL_USERNAME environment variables are required.\n\n" +
      "Usage:\n" +
      "  CPANEL_HOST=example.com CPANEL_USERNAME=user CPANEL_PASSWORD=pass node dist/index.js\n" +
      "  CPANEL_HOST=example.com CPANEL_USERNAME=user CPANEL_API_TOKEN=token node dist/index.js\n",
  );
  process.exit(1);
}

if (!password && !apiToken) {
  console.error(
    "Error: Either CPANEL_PASSWORD or CPANEL_API_TOKEN must be provided.\n",
  );
  process.exit(1);
}

// ── Initialize cPanel client ────────────────────────────────────────
const cpanelClient = new CpanelClient({
  host,
  port,
  username,
  password,
  apiToken,
  insecure,
});

// ── Create MCP Server ───────────────────────────────────────────────
const server = new McpServer({
  name: "cpanel-mcp-server",
  version: "1.0.0",
  description:
    "Full cPanel management MCP server — DNS, Email, Domains, SubDomains, SSL, FTP, Backup, Cron, FileManager",
});

// ── Register connection verification tool ───────────────────────────
server.tool(
  "cpanel_verify_connection",
  "Verify the cPanel connection is working. Call this first to confirm credentials are valid.",
  {},
  async () => {
    try {
      const result = await cpanelClient.verifyConnection();
      return {
        content: [
          {
            type: "text" as const,
            text: `✅ Connection verified!\nHost: ${result.host}\nUser: ${result.user}`,
          },
        ],
      };
    } catch (e) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `❌ Connection failed: ${e}`,
          },
        ],
      };
    }
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
            text: `Error getting account stats: ${e}`,
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
  // Log to stderr (never stdout — stdout is reserved for JSON-RPC)
  console.error("cPanel MCP Server running on stdio");
  console.error(`Connected to ${host} as ${username}`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
