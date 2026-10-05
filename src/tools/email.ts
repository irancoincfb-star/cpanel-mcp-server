/**
 * Email Management Tools
 *
 * Covers:
 *   - List email accounts
 *   - Create email account
 *   - Delete email account
 *   - Change email password
 *   - Get email quota
 *   - Set email quota
 *   - List email forwarders
 *   - Add email forwarder
 *   - Delete email forwarder
 *   - List email autoresponders
 *   - Add autoresponder
 *   - Delete autoresponder
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerEmailTools(server: McpServer, client: CpanelClient) {
  // ── List email accounts ───────────────────────────────────────────
  server.tool(
    "cpanel_email_list_accounts",
    "List all email accounts on the cPanel account with their quotas and disk usage",
    {},
    async () => {
      try {
        const result = await client.uapi("Email", "list_pops");
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
              text: `Error listing email accounts: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Create email account ──────────────────────────────────────────
  server.tool(
    "cpanel_email_create_account",
    "Create a new email account. Example: create user@example.com with a password and quota.",
    {
      email: z
        .string()
        .describe("Local part of the email (e.g. 'info' for info@example.com)"),
      domain: z
        .string()
        .describe("Domain part of the email (e.g. 'example.com')"),
      password: z.string().describe("Password for the email account"),
      quota: z
        .number()
        .optional()
        .default(250)
        .describe("Quota in MB (0 for unlimited, default 250)"),
    },
    async ({ email, domain, password, quota }) => {
      try {
        const result = await client.uapi("Email", "add_pop", {
          email,
          domain,
          password,
          quota: quota ?? 250,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Email account ${email}@${domain} created successfully.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating email account: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete email account ──────────────────────────────────────────
  server.tool(
    "cpanel_email_delete_account",
    "Delete an email account permanently",
    {
      email: z.string().describe("Local part of the email (e.g. 'info')"),
      domain: z.string().describe("Domain part (e.g. 'example.com')"),
    },
    async ({ email, domain }) => {
      try {
        const result = await client.uapi("Email", "delete_pop", {
          email,
          domain,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Email account ${email}@${domain} deleted.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting email account: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Change email password ─────────────────────────────────────────
  server.tool(
    "cpanel_email_change_password",
    "Change the password of an existing email account",
    {
      email: z.string().describe("Local part of the email"),
      domain: z.string().describe("Domain part"),
      password: z.string().describe("New password"),
    },
    async ({ email, domain, password }) => {
      try {
        const result = await client.uapi("Email", "passwd_pop", {
          email,
          domain,
          password,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Password changed for ${email}@${domain}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error changing email password: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Get email quota ───────────────────────────────────────────────
  server.tool(
    "cpanel_email_get_quota",
    "Get the current quota usage for an email account",
    {
      email: z.string().describe("Local part of the email"),
      domain: z.string().describe("Domain part"),
    },
    async ({ email, domain }) => {
      try {
        const result = await client.uapi("Email", "get_pop_quota", {
          email,
          domain,
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
              text: `Error getting email quota: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Set email quota ───────────────────────────────────────────────
  server.tool(
    "cpanel_email_set_quota",
    "Set the mailbox quota for an email account",
    {
      email: z.string().describe("Local part of the email"),
      domain: z.string().describe("Domain part"),
      quota: z.number().describe("New quota in MB (0 for unlimited)"),
    },
    async ({ email, domain, quota }) => {
      try {
        const result = await client.uapi("Email", "edit_pop_quota", {
          email,
          domain,
          quota,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Quota set to ${quota}MB for ${email}@${domain}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error setting email quota: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── List forwarders ───────────────────────────────────────────────
  server.tool(
    "cpanel_email_list_forwarders",
    "List all email forwarders for a domain",
    {
      domain: z.string().describe("Domain to list forwarders for"),
    },
    async ({ domain }) => {
      try {
        const result = await client.uapi("Email", "list_forwarders", {
          domain,
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
              text: `Error listing forwarders: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Add forwarder ─────────────────────────────────────────────────
  server.tool(
    "cpanel_email_add_forwarder",
    "Add an email forwarder (e.g. forward info@example.com to admin@gmail.com)",
    {
      domain: z.string().describe("Domain of the email"),
      email: z
        .string()
        .describe("Full email address to forward FROM (e.g. 'info@example.com')"),
      fwdopt: z
        .enum(["fwd", "fail", "blackhole", "pipe"])
        .default("fwd")
        .describe("Forward action: fwd=forward, fail=bounce, blackhole=discard"),
      fwdemail: z
        .string()
        .optional()
        .describe("Destination email address to forward TO"),
    },
    async ({ domain, email, fwdopt, fwdemail }) => {
      try {
        const params: Record<string, string> = { domain, email, fwdopt };
        if (fwdemail) params.fwdemail = fwdemail;

        const result = await client.uapi("Email", "add_forwarder", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `Forwarder added for ${email}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error adding forwarder: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete forwarder ──────────────────────────────────────────────
  server.tool(
    "cpanel_email_delete_forwarder",
    "Delete an email forwarder",
    {
      address: z
        .string()
        .describe("The email address that is being forwarded (e.g. 'info@example.com')"),
      forwarder: z
        .string()
        .describe("The destination email address of the forward rule"),
    },
    async ({ address, forwarder }) => {
      try {
        const result = await client.uapi("Email", "delete_forwarder", {
          address,
          forwarder,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Forwarder deleted.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting forwarder: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── List autoresponders ───────────────────────────────────────────
  server.tool(
    "cpanel_email_list_autoresponders",
    "List all email autoresponders for a domain",
    {
      domain: z.string().describe("Domain to list autoresponders for"),
    },
    async ({ domain }) => {
      try {
        const result = await client.uapi("Email", "list_auto_responders", {
          domain,
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
              text: `Error listing autoresponders: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Add autoresponder ─────────────────────────────────────────────
  server.tool(
    "cpanel_email_add_autoresponder",
    "Add an email autoresponder (vacation/out-of-office message)",
    {
      email: z.string().describe("Local part of the email (e.g. 'info')"),
      domain: z.string().describe("Domain (e.g. 'example.com')"),
      from: z.string().optional().describe("From name (defaults to email)"),
      subject: z.string().describe("Subject line of the autoresponse"),
      body: z.string().describe("Body text of the autoresponse"),
      interval: z
        .number()
        .optional()
        .default(24)
        .describe("Hours between autoresponses to same sender (default 24)"),
    },
    async ({ email, domain, from, subject, body, interval }) => {
      try {
        const params: Record<string, string | number> = {
          email,
          domain,
          subject,
          body,
          interval: interval ?? 24,
        };
        if (from) params.from = from;

        const result = await client.uapi(
          "Email",
          "add_auto_responder",
          params,
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `Autoresponder added for ${email}@${domain}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error adding autoresponder: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete autoresponder ──────────────────────────────────────────
  server.tool(
    "cpanel_email_delete_autoresponder",
    "Delete an email autoresponder",
    {
      email: z
        .string()
        .describe("Full email address of the autoresponder to delete"),
    },
    async ({ email }) => {
      try {
        const result = await client.uapi("Email", "delete_auto_responder", {
          email,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Autoresponder deleted for ${email}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting autoresponder: ${e}`,
            },
          ],
        };
      }
    },
  );
}
