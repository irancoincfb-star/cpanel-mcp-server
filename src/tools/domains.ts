/**
 * Domain Management Tools
 *
 * Covers:
 *   - List all domains (main, addon, subdomains, aliases)
 *   - Domain information & data
 *   - Single domain details
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerDomainTools(server: McpServer, client: CpanelClient) {
  // ── List all domains ──────────────────────────────────────────────
  server.tool(
    "cpanel_domains_list",
    "List all domains on the cPanel account (main domain, addon domains, subdomains, aliases/parked domains)",
    {},
    async () => {
      try {
        const result = await client.uapi("DomainInfo", "list_domains");
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
            { type: "text" as const, text: `Error listing domains: ${e}` },
          ],
        };
      }
    },
  );

  // ── Get single domain info ────────────────────────────────────────
  server.tool(
    "cpanel_domains_get_info",
    "Get detailed information about a specific domain",
    { domain: z.string().describe("The domain name to get info for") },
    async ({ domain }) => {
      try {
        const result = await client.uapi("DomainInfo", "single_domain_data", {
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
              text: `Error getting domain info: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── List domains data (detailed) ──────────────────────────────────
  server.tool(
    "cpanel_domains_data",
    "Get comprehensive data for all domains including document roots and server aliases",
    {},
    async () => {
      try {
        const result = await client.uapi("DomainInfo", "domains_data", {
          format: "hash",
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
            { type: "text" as const, text: `Error getting domain data: ${e}` },
          ],
        };
      }
    },
  );
}
