/**
 * FTP Account Management Tools
 *
 * Covers:
 *   - List FTP accounts
 *   - Create FTP account
 *   - Delete FTP account
 *   - Change FTP password
 *   - Change FTP quota
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerFtpTools(server: McpServer, client: CpanelClient) {
  // ── List FTP accounts ─────────────────────────────────────────────
  server.tool(
    "cpanel_ftp_list_accounts",
    "List all FTP accounts on the cPanel account with their directories and quotas",
    {},
    async () => {
      try {
        const result = await client.uapi("Ftp", "list_ftp_with_disk");
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
              text: `Error listing FTP accounts: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Create FTP account ────────────────────────────────────────────
  server.tool(
    "cpanel_ftp_create_account",
    "Create a new FTP account with a username, password, quota, and home directory",
    {
      user: z.string().describe("FTP username"),
      pass: z.string().describe("FTP password"),
      homedir: z
        .string()
        .optional()
        .describe("Home directory relative to cPanel user home (e.g. 'public_html/site')"),
      quota: z
        .number()
        .optional()
        .default(0)
        .describe("Quota in MB (0 for unlimited)"),
    },
    async ({ user, pass, homedir, quota }) => {
      try {
        const params: Record<string, string | number> = {
          user,
          pass,
          quota: quota ?? 0,
        };
        if (homedir) params.homedir = homedir;

        const result = await client.uapi("Ftp", "add_ftp", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `FTP account ${user} created.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating FTP account: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete FTP account ────────────────────────────────────────────
  server.tool(
    "cpanel_ftp_delete_account",
    "Delete an FTP account. Optionally delete its files too.",
    {
      user: z.string().describe("FTP username to delete"),
      destroy: z
        .boolean()
        .optional()
        .default(false)
        .describe("Also delete the FTP user's files (default false)"),
    },
    async ({ user, destroy }) => {
      try {
        const result = await client.uapi("Ftp", "delete_ftp", {
          user,
          destroy: destroy ? 1 : 0,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `FTP account ${user} deleted.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting FTP account: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Change FTP password ───────────────────────────────────────────
  server.tool(
    "cpanel_ftp_change_password",
    "Change the password for an FTP account",
    {
      user: z.string().describe("FTP username"),
      pass: z.string().describe("New password"),
    },
    async ({ user, pass }) => {
      try {
        const result = await client.uapi("Ftp", "passwd", { user, pass });
        return {
          content: [
            {
              type: "text" as const,
              text: `FTP password changed for ${user}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error changing FTP password: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Change FTP quota ──────────────────────────────────────────────
  server.tool(
    "cpanel_ftp_set_quota",
    "Set/change the disk quota for an FTP account",
    {
      user: z.string().describe("FTP username"),
      quota: z.number().describe("New quota in MB (0 for unlimited)"),
    },
    async ({ user, quota }) => {
      try {
        const result = await client.uapi("Ftp", "setquota", { user, quota });
        return {
          content: [
            {
              type: "text" as const,
              text: `FTP quota for ${user} set to ${quota}MB.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error setting FTP quota: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Get FTP server info ───────────────────────────────────────────
  server.tool(
    "cpanel_ftp_server_info",
    "Get FTP server connection details (hostname, port, etc.)",
    {},
    async () => {
      try {
        const result = await client.uapi("Ftp", "get_ftp_daemon_info");
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
              text: `Error getting FTP server info: ${e}`,
            },
          ],
        };
      }
    },
  );
}
