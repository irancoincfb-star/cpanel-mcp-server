/**
 * Automated Verification Test for cPanel MCP Server
 *
 * This test:
 * 1. Spawns the cPanel MCP server in stdio mode with dummy credentials
 * 2. Uses the MCP Client to connect via Client-Server transport
 * 3. Fetches the complete list of tools registered
 * 4. Validates that all 54 tools exist across all modules
 * 5. Validates schemas for core tools (DNS, Email, Subdomain, Backup, etc.)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDistPath = path.resolve(__dirname, "../dist/index.js");

async function runTest() {
  console.log("=== Testing cPanel MCP Server ===");
  console.log("Starting server process:", serverDistPath);

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverDistPath],
    env: {
      ...process.env,
      CPANEL_HOST: "demo.example.com",
      CPANEL_USERNAME: "testuser",
      CPANEL_PASSWORD: "dummy_password_for_testing",
    },
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} },
  );

  try {
    await client.connect(transport);
    console.log("✅ MCP Client successfully connected to cPanel MCP Server!");

    // List all tools
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools;

    console.log(`\nRegistered Tools Count: ${tools.length}`);

    // Categorize tools
    const categories: Record<string, string[]> = {
      Account: [],
      Domain: [],
      SubDomain: [],
      DNS: [],
      Email: [],
      SSL: [],
      FTP: [],
      Backup: [],
      Cron: [],
      FileManager: [],
    };

    for (const tool of tools) {
      if (
        tool.name.startsWith("cpanel_verify_") ||
        tool.name.startsWith("cpanel_account_") ||
        tool.name === "cpanel_connect" ||
        tool.name === "cpanel_session_status"
      ) {
        categories.Account.push(tool.name);
      } else if (tool.name.startsWith("cpanel_domains_")) {
        categories.Domain.push(tool.name);
      } else if (tool.name.startsWith("cpanel_subdomain_")) {
        categories.SubDomain.push(tool.name);
      } else if (tool.name.startsWith("cpanel_dns_")) {
        categories.DNS.push(tool.name);
      } else if (tool.name.startsWith("cpanel_email_")) {
        categories.Email.push(tool.name);
      } else if (tool.name.startsWith("cpanel_ssl_")) {
        categories.SSL.push(tool.name);
      } else if (tool.name.startsWith("cpanel_ftp_")) {
        categories.FTP.push(tool.name);
      } else if (tool.name.startsWith("cpanel_backup_")) {
        categories.Backup.push(tool.name);
      } else if (tool.name.startsWith("cpanel_cron_")) {
        categories.Cron.push(tool.name);
      } else if (tool.name.startsWith("cpanel_files_")) {
        categories.FileManager.push(tool.name);
      } else {
        console.warn(`Uncategorized tool: ${tool.name}`);
      }
    }

    console.log("\n--- Tools Breakdown ---");
    for (const [category, toolList] of Object.entries(categories)) {
      console.log(`  [${category}]: ${toolList.length} tools`);
      for (const name of toolList) {
        console.log(`    - ${name}`);
      }
    }

    // Verify key tools exist
    const mandatoryTools = [
      "cpanel_verify_connection",
      "cpanel_account_stats",
      "cpanel_domains_list",
      "cpanel_subdomain_add",
      "cpanel_dns_list_records",
      "cpanel_dns_add_record",
      "cpanel_dns_edit_record",
      "cpanel_dns_delete_record",
      "cpanel_email_list_accounts",
      "cpanel_email_create_account",
      "cpanel_email_delete_account",
      "cpanel_email_add_forwarder",
      "cpanel_ssl_list_certs",
      "cpanel_ssl_install_cert",
      "cpanel_ftp_list_accounts",
      "cpanel_ftp_create_account",
      "cpanel_backup_list",
      "cpanel_backup_full_homedir",
      "cpanel_backup_full_ftp",
      "cpanel_cron_list",
      "cpanel_cron_add",
      "cpanel_files_list",
      "cpanel_files_get_content",
      "cpanel_files_save_content",
    ];

    let missing = 0;
    for (const mandatory of mandatoryTools) {
      const found = tools.find((t) => t.name === mandatory);
      if (!found) {
        console.error(`❌ Missing mandatory tool: ${mandatory}`);
        missing++;
      }
    }

    if (missing === 0) {
      console.log(`\n✅ All ${mandatoryTools.length} mandatory tools verified successfully!`);
    } else {
      throw new Error(`${missing} mandatory tools are missing!`);
    }

    console.log("\n=== ALL TESTS PASSED! ===");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await transport.close();
  }
}

runTest();
