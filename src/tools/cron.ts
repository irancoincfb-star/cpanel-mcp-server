/**
 * Cron Job Management Tools
 *
 * Uses API2 (Cron module) because UAPI does not yet have full cron support.
 *
 * Covers:
 *   - List cron jobs
 *   - Add cron job
 *   - Edit cron job
 *   - Delete cron job
 *   - Get cron email notification settings
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerCronTools(server: McpServer, client: CpanelClient) {
  // ── List cron jobs ────────────────────────────────────────────────
  server.tool(
    "cpanel_cron_list",
    "List all cron jobs on the account. Each job has a linekey that can be used for editing/deleting.",
    {},
    async () => {
      try {
        const result = await client.api2("Cron", "listcron");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error listing cron jobs: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Add cron job ──────────────────────────────────────────────────
  server.tool(
    "cpanel_cron_add",
    "Add a new cron job. Specify the schedule using standard cron fields (minute, hour, day, month, weekday) and the command to run.",
    {
      command: z
        .string()
        .describe("The command to execute (e.g. '/usr/bin/php /home/user/script.php')"),
      minute: z
        .string()
        .describe("Minute field (0-59, *, */5, etc.)"),
      hour: z
        .string()
        .describe("Hour field (0-23, *, etc.)"),
      day: z
        .string()
        .describe("Day of month field (1-31, *, etc.)"),
      month: z
        .string()
        .describe("Month field (1-12, *, etc.)"),
      weekday: z
        .string()
        .describe("Day of week field (0-7, 0=7=Sunday, *, etc.)"),
    },
    async ({ command, minute, hour, day, month, weekday }) => {
      try {
        const result = await client.api2("Cron", "add_line", {
          command,
          minute,
          hour,
          day,
          month,
          weekday,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Cron job added: ${minute} ${hour} ${day} ${month} ${weekday} ${command}\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error adding cron job: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Edit cron job ─────────────────────────────────────────────────
  server.tool(
    "cpanel_cron_edit",
    "Edit an existing cron job by its linekey (from cpanel_cron_list). Provide all fields.",
    {
      linekey: z
        .string()
        .describe("The linekey of the cron job to edit (from cpanel_cron_list)"),
      command: z.string().describe("The command to execute"),
      minute: z.string().describe("Minute field"),
      hour: z.string().describe("Hour field"),
      day: z.string().describe("Day of month field"),
      month: z.string().describe("Month field"),
      weekday: z.string().describe("Day of week field"),
    },
    async ({ linekey, command, minute, hour, day, month, weekday }) => {
      try {
        const result = await client.api2("Cron", "edit_line", {
          linekey,
          command,
          minute,
          hour,
          day,
          month,
          weekday,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Cron job updated.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error editing cron job: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete cron job ───────────────────────────────────────────────
  server.tool(
    "cpanel_cron_delete",
    "Delete a cron job by its linekey",
    {
      linekey: z
        .string()
        .describe("The linekey of the cron job to delete"),
    },
    async ({ linekey }) => {
      try {
        const result = await client.api2("Cron", "remove_line", { linekey });
        return {
          content: [
            {
              type: "text" as const,
              text: `Cron job deleted.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting cron job: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Get cron email settings ───────────────────────────────────────
  server.tool(
    "cpanel_cron_get_email",
    "Get the email address that cron job output is sent to",
    {},
    async () => {
      try {
        const result = await client.api2("Cron", "get_email");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error getting cron email: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Set cron email ────────────────────────────────────────────────
  server.tool(
    "cpanel_cron_set_email",
    "Set the email address to receive cron job output notifications",
    {
      email: z.string().describe("Email address for cron notifications"),
    },
    async ({ email }) => {
      try {
        const result = await client.api2("Cron", "set_email", { email });
        return {
          content: [
            {
              type: "text" as const,
              text: `Cron email set to ${email}.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error setting cron email: ${e}`,
            },
          ],
        };
      }
    },
  );
}
