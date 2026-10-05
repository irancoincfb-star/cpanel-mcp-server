/**
 * SubDomain Management Tools
 *
 * Covers:
 *   - Add subdomain
 *   - Delete subdomain
 *   - Change subdomain document root
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerSubDomainTools(
  server: McpServer,
  client: CpanelClient,
) {
  // ── Add subdomain ─────────────────────────────────────────────────
  server.tool(
    "cpanel_subdomain_add",
    "Create a new subdomain. For example, to create blog.example.com, set domain='blog' and rootdomain='example.com'",
    {
      domain: z.string().describe("The subdomain prefix (e.g. 'blog')"),
      rootdomain: z
        .string()
        .describe("The parent domain (e.g. 'example.com')"),
      dir: z
        .string()
        .optional()
        .describe(
          "Document root relative to home dir. Defaults to public_html/{domain}.{rootdomain}",
        ),
    },
    async ({ domain, rootdomain, dir }) => {
      try {
        const params: Record<string, string> = { domain, rootdomain };
        if (dir) params.dir = dir;

        const result = await client.uapi("SubDomain", "addsubdomain", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `Subdomain ${domain}.${rootdomain} created successfully.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating subdomain: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete subdomain ──────────────────────────────────────────────
  server.tool(
    "cpanel_subdomain_delete",
    "Delete an existing subdomain",
    {
      domain: z
        .string()
        .describe("Full subdomain name to delete (e.g. 'blog.example.com')"),
    },
    async ({ domain }) => {
      try {
        const result = await client.uapi("SubDomain", "delsubdomain", {
          domain,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Subdomain ${domain} deleted successfully.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting subdomain: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Change subdomain document root ────────────────────────────────
  server.tool(
    "cpanel_subdomain_change_docroot",
    "Change the document root of an existing subdomain",
    {
      subdomain: z.string().describe("The subdomain (e.g. 'blog')"),
      rootdomain: z.string().describe("The parent domain (e.g. 'example.com')"),
      dir: z
        .string()
        .describe("New document root relative to home dir (e.g. '/public_html/new_dir')"),
    },
    async ({ subdomain, rootdomain, dir }) => {
      try {
        const result = await client.uapi("SubDomain", "changedocroot", {
          subdomain,
          rootdomain,
          dir,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Document root changed successfully.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error changing document root: ${e}`,
            },
          ],
        };
      }
    },
  );
}
