/**
 * File Manager Tools
 *
 * Covers:
 *   - List files/directories
 *   - Get file content
 *   - Create/write file
 *   - Delete file
 *   - Create directory
 *   - Rename/move file
 *   - Copy file
 *   - Change permissions
 *   - Get disk usage
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CpanelClient } from "../cpanel-client.js";

export function registerFileManagerTools(
  server: McpServer,
  client: CpanelClient,
) {
  // ── List directory contents ───────────────────────────────────────
  server.tool(
    "cpanel_files_list",
    "List files and directories in the given path. Similar to 'ls -la'. Returns file names, sizes, types, and permissions.",
    {
      dir: z
        .string()
        .default("/")
        .describe("Directory path (e.g. '/public_html' or '/'). Relative to home dir."),
      show_hidden: z
        .boolean()
        .optional()
        .default(false)
        .describe("Show hidden files (starting with .)"),
    },
    async ({ dir, show_hidden }) => {
      try {
        const params: Record<string, string | number> = {
          dir,
          include_mime: 1,
          include_permissions: 1,
          include_hash: 0,
          include_content: 0,
        };
        if (show_hidden) params.show_hidden = 1;

        const result = await client.uapi("Fileman", "list_files", params);
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
              text: `Error listing files: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Get file content ──────────────────────────────────────────────
  server.tool(
    "cpanel_files_get_content",
    "Read the content of a file. Only works for text files.",
    {
      dir: z
        .string()
        .describe("Directory containing the file (e.g. '/public_html')"),
      file: z.string().describe("Filename (e.g. 'index.html')"),
    },
    async ({ dir, file }) => {
      try {
        const result = await client.uapi("Fileman", "get_file_content", {
          dir,
          file,
        });
        return {
          content: [
            {
              type: "text" as const,
              text:
                typeof result.data === "string"
                  ? result.data
                  : JSON.stringify(result.data, null, 2),
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error reading file: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Save/write file content ───────────────────────────────────────
  server.tool(
    "cpanel_files_save_content",
    "Write/overwrite content to a file. Creates the file if it doesn't exist.",
    {
      dir: z.string().describe("Directory for the file"),
      file: z.string().describe("Filename"),
      content: z.string().describe("File content to write"),
    },
    async ({ dir, file, content: fileContent }) => {
      try {
        const result = await client.uapi("Fileman", "save_file_content", {
          dir,
          file,
          content: fileContent,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `File ${dir}/${file} saved.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error saving file: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Delete file or directory ──────────────────────────────────────
  server.tool(
    "cpanel_files_delete",
    "Delete a file or directory (permanently). Be careful!",
    {
      dir: z.string().describe("Directory path"),
      file: z.string().describe("File or directory name to delete"),
    },
    async ({ dir, file }) => {
      try {
        const result = await client.uapi("Fileman", "trash", {
          dir,
          file,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Deleted ${dir}/${file}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error deleting file: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Create directory ──────────────────────────────────────────────
  server.tool(
    "cpanel_files_mkdir",
    "Create a new directory",
    {
      dir: z.string().describe("Parent directory path"),
      name: z.string().describe("Name of the new directory"),
    },
    async ({ dir, name }) => {
      try {
        const result = await client.uapi("Fileman", "mkdir", {
          dir,
          name,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Directory ${dir}/${name} created.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error creating directory: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Rename / move file ────────────────────────────────────────────
  server.tool(
    "cpanel_files_rename",
    "Rename or move a file/directory",
    {
      dir: z.string().describe("Current directory path"),
      oldname: z.string().describe("Current file/directory name"),
      newname: z.string().describe("New file/directory name or new path"),
    },
    async ({ dir, oldname, newname }) => {
      try {
        const result = await client.uapi("Fileman", "rename", {
          dir,
          oldname,
          newname,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Renamed ${oldname} → ${newname}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error renaming file: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Copy file ─────────────────────────────────────────────────────
  server.tool(
    "cpanel_files_copy",
    "Copy a file from one location to another",
    {
      source_dir: z.string().describe("Source directory"),
      source_file: z.string().describe("Source filename"),
      dest_dir: z.string().describe("Destination directory"),
      dest_file: z
        .string()
        .optional()
        .describe("Destination filename (defaults to same name)"),
    },
    async ({ source_dir, source_file, dest_dir, dest_file }) => {
      try {
        const params: Record<string, string> = {
          sourcefiles: `${source_dir}/${source_file}`,
          destfiles: `${dest_dir}/${dest_file ?? source_file}`,
        };
        const result = await client.uapi("Fileman", "copy", params);
        return {
          content: [
            {
              type: "text" as const,
              text: `File copied.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error copying file: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Change permissions ────────────────────────────────────────────
  server.tool(
    "cpanel_files_chmod",
    "Change file/directory permissions (chmod)",
    {
      dir: z.string().describe("Directory path"),
      file: z.string().describe("File or directory name"),
      mode: z
        .string()
        .describe("Permission mode in octal (e.g. '0755', '0644')"),
    },
    async ({ dir, file, mode }) => {
      try {
        const result = await client.uapi("Fileman", "set_file_permissions", {
          dir,
          file,
          mode,
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Permissions for ${file} set to ${mode}.\n${JSON.stringify(result.data, null, 2)}`,
            },
          ],
        };
      } catch (e) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error changing permissions: ${e}`,
            },
          ],
        };
      }
    },
  );

  // ── Get disk usage ────────────────────────────────────────────────
  server.tool(
    "cpanel_files_disk_usage",
    "Get disk usage information for the cPanel account",
    {},
    async () => {
      try {
        const result = await client.uapi("Quota", "get_quota_info");
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
              text: `Error getting disk usage: ${e}`,
            },
          ],
        };
      }
    },
  );
}
