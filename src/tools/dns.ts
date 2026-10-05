/**
 * DNS Management Tools
 *
 * Covers:
 *   - List DNS zone records
 *   - Add DNS record (A, AAAA, CNAME, MX, TXT, SRV, CAA)
 *   - Edit DNS record
 *   - Delete DNS record
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

const dnsRecordTypeSchema = z.enum([
  "A",
  "AAAA",
  "CNAME",
  "MX",
  "TXT",
  "SRV",
  "CAA",
  "NS",
  "PTR",
]);

export function registerDnsTools(server: McpServer, client: CpanelClient) {
  // ── List DNS zone records ─────────────────────────────────────────
  server.tool(
    "cpanel_dns_list_records",
    "List all DNS zone records for a domain. Returns A, AAAA, CNAME, MX, TXT, SRV, CAA, NS records.",
    {
      domain: z.string().describe("The domain to list DNS records for"),
    },
    async ({ domain }) => {
      try {
        // Use API2 ZoneEdit::fetchzone since UAPI DNS module is limited
        const result = await client.api2("ZoneEdit", "fetchzone", {
          domain,
          customonly: 0,
        });
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
              text: `Error listing DNS records: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Add DNS record ────────────────────────────────────────────────
  server.tool(
    "cpanel_dns_add_record",
    "Add a new DNS record to a domain's zone file. Supports A, AAAA, CNAME, MX, TXT, SRV, CAA record types.",
    {
      domain: z.string().describe("The domain name"),
      name: z
        .string()
        .describe("Record name (e.g. 'www' for www.example.com, or '@' for root)"),
      type: dnsRecordTypeSchema.describe("DNS record type"),
      address: z
        .string()
        .optional()
        .describe("Record value — IP for A/AAAA, target for CNAME, etc."),
      cname: z
        .string()
        .optional()
        .describe("Target hostname for CNAME records"),
      txtdata: z
        .string()
        .optional()
        .describe("Text content for TXT records (e.g. SPF, DKIM)"),
      exchange: z
        .string()
        .optional()
        .describe("Mail server hostname for MX records"),
      preference: z
        .number()
        .optional()
        .describe("Priority for MX records (e.g. 10)"),
      ttl: z
        .number()
        .optional()
        .default(14400)
        .describe("Time to live in seconds (default 14400 = 4 hours)"),
    },
    async (args) => {
      try {
        const params: Record<string, string | number> = {
          domain: args.domain,
          name: args.name,
          type: args.type,
          ttl: args.ttl ?? 14400,
        };

        // Set value fields based on record type
        if (args.type === "A" || args.type === "AAAA") {
          if (!args.address)
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: "address is required for A/AAAA records",
                },
              ],
            };
          params.address = args.address;
        } else if (args.type === "CNAME") {
          if (!args.cname)
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: "cname is required for CNAME records",
                },
              ],
            };
          params.cname = args.cname;
        } else if (args.type === "TXT") {
          if (!args.txtdata)
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: "txtdata is required for TXT records",
                },
              ],
            };
          params.txtdata = args.txtdata;
        } else if (args.type === "MX") {
          if (!args.exchange)
            return {
              isError: true,
              content: [
                {
                  type: "text" as const,
                  text: "exchange is required for MX records",
                },
              ],
            };
          params.exchange = args.exchange;
          params.preference = args.preference ?? 10;
        } else if (args.address) {
          params.address = args.address;
        }

        const result = await client.api2("ZoneEdit", "add_zone_record", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `DNS ${args.type} record added successfully.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error adding DNS record: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Edit DNS record ───────────────────────────────────────────────
  server.tool(
    "cpanel_dns_edit_record",
    "Edit an existing DNS record by its line number. First use cpanel_dns_list_records to find the line number.",
    {
      domain: z.string().describe("The domain name"),
      line: z
        .number()
        .describe("Line number of the record (from cpanel_dns_list_records)"),
      name: z.string().optional().describe("New record name"),
      type: dnsRecordTypeSchema.optional().describe("New record type"),
      address: z.string().optional().describe("New record value"),
      cname: z.string().optional().describe("New CNAME target"),
      txtdata: z.string().optional().describe("New TXT data"),
      exchange: z.string().optional().describe("New MX exchange"),
      preference: z.number().optional().describe("New MX priority"),
      ttl: z.number().optional().describe("New TTL in seconds"),
    },
    async (args) => {
      try {
        const params: Record<string, string | number> = {
          domain: args.domain,
          line: args.line,
        };

        if (args.name) params.name = args.name;
        if (args.type) params.type = args.type;
        if (args.address) params.address = args.address;
        if (args.cname) params.cname = args.cname;
        if (args.txtdata) params.txtdata = args.txtdata;
        if (args.exchange) params.exchange = args.exchange;
        if (args.preference) params.preference = args.preference;
        if (args.ttl) params.ttl = args.ttl;

        const result = await client.api2(
          "ZoneEdit",
          "edit_zone_record",
          params,
        );
        return {
          content: [
            {
              type: "text" as const,
              text: `DNS record updated successfully.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error editing DNS record: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete DNS record ─────────────────────────────────────────────
  server.tool(
    "cpanel_dns_delete_record",
    "Delete a DNS record by its line number. First use cpanel_dns_list_records to find the line number.",
    {
      domain: z.string().describe("The domain name"),
      line: z
        .number()
        .describe("Line number of the record to delete"),
    },
    async ({ domain, line }) => {
      try {
        const result = await client.api2("ZoneEdit", "remove_zone_record", {
          domain,
          line,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `DNS record deleted successfully.\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting DNS record: ${e}`,
            },
          ],
        };
      }
    },
  );
}
