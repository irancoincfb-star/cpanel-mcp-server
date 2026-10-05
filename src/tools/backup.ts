/**
 * Backup Management Tools
 *
 * Covers:
 *   - List available backups
 *   - Create full backup (to home dir, FTP, or SCP)
 *   - Download/restore specific backup
 *   - Backup status
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerBackupTools(server: McpServer, client: CpanelClient) {
  // ── List available backups ────────────────────────────────────────
  server.tool(
    "cpanel_backup_list",
    "List all available backups on the account",
    {},
    async () => {
      try {
        const result = await client.uapi("Backup", "list_backups");
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
              text: `Error listing backups: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Create full backup to home directory ──────────────────────────
  server.tool(
    "cpanel_backup_full_homedir",
    "Create a full account backup and save it to the home directory. The backup file will be available in the home dir.",
    {
      email: z
        .string()
        .optional()
        .describe("Email address to notify when backup is complete"),
    },
    async ({ email }) => {
      try {
        const params: Record<string, string> = {};
        if (email) params.email = email;

        const result = await client.uapi(
          "Backup",
          "fullbackup_to_homedir",
          params,
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Full backup initiated (saving to home directory).\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating backup: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Create full backup to FTP server ──────────────────────────────
  server.tool(
    "cpanel_backup_full_ftp",
    "Create a full account backup and transfer it to a remote FTP server",
    {
      server: z.string().describe("FTP server hostname"),
      user: z.string().describe("FTP username"),
      pass: z.string().describe("FTP password"),
      port: z
        .number()
        .optional()
        .default(21)
        .describe("FTP port (default 21)"),
      rdir: z
        .string()
        .optional()
        .describe("Remote directory on FTP server"),
      email: z
        .string()
        .optional()
        .describe("Email to notify when complete"),
    },
    async (args) => {
      try {
        const params: Record<string, string | number> = {
          server: args.server,
          user: args.user,
          pass: args.pass,
          port: args.port ?? 21,
        };
        if (args.rdir) params.rdir = args.rdir;
        if (args.email) params.email = args.email;

        const result = await client.uapi(
          "Backup",
          "fullbackup_to_ftp",
          params,
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Full backup initiated (transferring to FTP).\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating FTP backup: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Restore a database backup ─────────────────────────────────────
  server.tool(
    "cpanel_backup_restore_database",
    "Restore a MySQL database from a backup file. The backup file must be uploaded to the account first.",
    {
      backup: z
        .string()
        .describe("Path to the backup file (relative to home dir or absolute)"),
      timeout: z
        .number()
        .optional()
        .default(120)
        .describe("Timeout in seconds (default 120)"),
    },
    async ({ backup, timeout }) => {
      try {
        const result = await client.uapi(
          "Backup",
          "restore_databases",
          {
            backup,
            timeout: timeout ?? 120,
          },
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Database restore initiated from ${backup}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error restoring database: ${e}`,
            },
          ],
        };
      }
    },
  );
}
