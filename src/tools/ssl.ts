/**
 * SSL/TLS Management Tools
 *
 * Covers:
 *   - List installed SSL certificates
 *   - Install SSL certificate
 *   - Generate CSR
 *   - AutoSSL status
 *   - Start AutoSSL
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerSslTools(server: McpServer, client: CpanelClient) {
  // ── List installed SSL certificates ───────────────────────────────
  server.tool(
    "cpanel_ssl_list_certs",
    "List all installed SSL/TLS certificates on the account",
    {},
    async () => {
      try {
        const result = await client.uapi("SSL", "list_certs");
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
              text: `Error listing SSL certificates: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Get SSL status for domains ────────────────────────────────────
  server.tool(
    "cpanel_ssl_show_status",
    "Show SSL/TLS status for all domains on the account (which domains have active SSL certificates)",
    {},
    async () => {
      try {
        const result = await client.uapi("SSL", "installed_hosts");
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
              text: `Error getting SSL status: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Install SSL certificate ───────────────────────────────────────
  server.tool(
    "cpanel_ssl_install_cert",
    "Install an SSL/TLS certificate for a domain. Provide the certificate, key, and optionally the CA bundle.",
    {
      domain: z
        .string()
        .describe("Domain to install the SSL certificate for"),
      cert: z.string().describe("PEM-encoded SSL certificate"),
      key: z.string().describe("PEM-encoded private key"),
      cabundle: z
        .string()
        .optional()
        .describe("PEM-encoded CA bundle (intermediate certificates)"),
    },
    async ({ domain, cert, key, cabundle }) => {
      try {
        const params: Record<string, string> = { domain, cert, key };
        if (cabundle) params.cabundle = cabundle;

        const result = await client.uapi("SSL", "install_ssl", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `SSL certificate installed for ${domain}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error installing SSL certificate: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete SSL certificate ────────────────────────────────────────
  server.tool(
    "cpanel_ssl_delete_cert",
    "Delete an SSL certificate by its ID",
    {
      id: z.string().describe("Certificate ID to delete"),
    },
    async ({ id }) => {
      try {
        const result = await client.uapi("SSL", "delete_cert", { id });
        return {
          content: [
            {
              type: "text" as const,
              text: `SSL certificate ${id} deleted.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting SSL certificate: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Generate CSR ──────────────────────────────────────────────────
  server.tool(
    "cpanel_ssl_generate_csr",
    "Generate a Certificate Signing Request (CSR) for a domain",
    {
      domains: z
        .string()
        .describe("Domain name(s) for the CSR, comma-separated"),
      city: z.string().describe("City/Locality"),
      state: z.string().describe("State/Province"),
      country: z
        .string()
        .describe("Two-letter country code (e.g. 'US', 'IR')"),
      company: z.string().describe("Organization/Company name"),
      companydivision: z
        .string()
        .optional()
        .describe("Department/Division"),
      email: z.string().optional().describe("Contact email"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {
          domains: args.domains,
          city: args.city,
          state: args.state,
          country: args.country,
          company: args.company,
        };
        if (args.companydivision)
          params.companydivision = args.companydivision;
        if (args.email) params.email = args.email;

        const result = await client.uapi("SSL", "generate_csr", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `CSR generated.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error generating CSR: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Check AutoSSL status ──────────────────────────────────────────
  server.tool(
    "cpanel_ssl_autossl_check",
    "Check the current AutoSSL status and pending orders",
    {},
    async () => {
      try {
        const result = await client.uapi("SSL", "get_autossl_problems");
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
              text: `Error checking AutoSSL status: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Start AutoSSL ─────────────────────────────────────────────────
  server.tool(
    "cpanel_ssl_autossl_start",
    "Trigger an AutoSSL check/renewal for the account",
    {},
    async () => {
      try {
        const result = await client.uapi("SSL", "start_autossl_check");
        return {
          content: [
            {
              type: "text" as const,
              text: `AutoSSL check started.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error starting AutoSSL: ${e}`,
            },
          ],
        };
      }
    },
  );
}
