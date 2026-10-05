# cPanel MCP Server

A comprehensive **Model Context Protocol (MCP)** server that provides full cPanel hosting management capabilities to any MCP-compatible AI agent (Claude, Gemini, Cursor, etc.).

> 🔌 **MCP = USB for AI** — Connect any AI agent to your cPanel hosting with a single configuration line.

## ✨ Features

| Module | Tools | Description |
|--------|-------|-------------|
| **Domains** | 3 tools | List domains, get domain info, domain data |
| **SubDomains** | 3 tools | Create, delete, change document root |
| **DNS** | 4 tools | List/add/edit/delete DNS records (A, AAAA, CNAME, MX, TXT, SRV, CAA) |
| **Email** | 11 tools | Create/delete accounts, passwords, quotas, forwarders, autoresponders |
| **SSL** | 6 tools | List/install/delete certs, CSR, AutoSSL check/start |
| **FTP** | 6 tools | Create/delete accounts, passwords, quotas, server info |
| **Backup** | 4 tools | List, full backup (homedir/FTP), restore database |
| **Cron** | 6 tools | List/add/edit/delete jobs, email notifications |
| **FileManager** | 9 tools | List/read/write/delete/mkdir/rename/copy/chmod, disk usage |
| **Account** | 2 tools | Verify connection, account stats |

**Total: 54 tools** covering virtually all cPanel operations.

## 🔐 Authentication

Two authentication methods are supported:

1. **API Token** (Recommended for automation)
   - Generate in cPanel → Security → Manage API Tokens
   - More secure, can be revoked without changing password

2. **Username + Password**
   - Standard cPanel credentials
   - Works with all cPanel versions

## 📦 Installation

### From npm (after publishing)

```bash
npm install -g cpanel-mcp-server
```

### From source

```bash
git clone https://github.com/irancoincfb-star/cpanel-mcp-server.git
cd cpanel-mcp-server
npm install
npm run build
```

## 🚀 Quick Start

### 1. Configure in your AI client

#### Claude Desktop / Antigravity / Cursor

Add to your MCP configuration file:

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "node",
      "args": ["path/to/cpanel-mcp-server/dist/index.js"],
      "env": {
        "CPANEL_HOST": "your-server.com",
        "CPANEL_USERNAME": "your-cpanel-username",
        "CPANEL_PASSWORD": "your-cpanel-password"
      }
    }
  }
}
```

#### Using API Token (Recommended)

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "node",
      "args": ["path/to/cpanel-mcp-server/dist/index.js"],
      "env": {
        "CPANEL_HOST": "your-server.com",
        "CPANEL_USERNAME": "your-cpanel-username",
        "CPANEL_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

#### Using npx (after publishing)

```json
{
  "mcpServers": {
    "cpanel": {
      "command": "npx",
      "args": ["-y", "cpanel-mcp-server"],
      "env": {
        "CPANEL_HOST": "your-server.com",
        "CPANEL_USERNAME": "your-cpanel-username",
        "CPANEL_API_TOKEN": "your-api-token"
      }
    }
  }
}
```

### 2. DeepGraph (One-Click Cloud MCP)

After pushing to GitHub, you can use [DeepGraph](https://deepgraph.co) to instantly convert this repository into a cloud-hosted MCP server:

1. Push the repo to GitHub
2. Replace `github.com` with `deepgraph.co` in the URL
3. Use the generated MCP server configuration

### 3. Self-Signed Certificates

If your cPanel server uses a self-signed SSL certificate, add:

```json
"env": {
  "CPANEL_INSECURE": "true"
}
```

## ⚙️ Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CPANEL_HOST` | ✅ | — | cPanel server hostname (e.g. `server.example.com`) |
| `CPANEL_USERNAME` | ✅ | — | cPanel account username |
| `CPANEL_PASSWORD` | ⚡ | — | cPanel password (required if no API token) |
| `CPANEL_API_TOKEN` | ⚡ | — | cPanel API token (required if no password) |
| `CPANEL_PORT` | ❌ | `2083` | cPanel HTTPS port |
| `CPANEL_INSECURE` | ❌ | `false` | Allow self-signed SSL certificates |

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode (with hot reload)
npm run dev

# Build for production
npm run build

# Test with MCP Inspector
npm run inspect
```

### Testing with MCP Inspector

The MCP Inspector provides a web UI for testing your tools:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## 📋 Tool Reference

### Connection & Account

| Tool | Description |
|------|-------------|
| `cpanel_verify_connection` | Test that credentials work |
| `cpanel_account_stats` | Get disk, bandwidth, email count, etc. |

### Domains

| Tool | Description |
|------|-------------|
| `cpanel_domains_list` | List all domains (main, addon, sub, alias) |
| `cpanel_domains_get_info` | Info about a specific domain |
| `cpanel_domains_data` | Detailed data for all domains |

### SubDomains

| Tool | Description |
|------|-------------|
| `cpanel_subdomain_add` | Create a subdomain |
| `cpanel_subdomain_delete` | Delete a subdomain |
| `cpanel_subdomain_change_docroot` | Change document root |

### DNS

| Tool | Description |
|------|-------------|
| `cpanel_dns_list_records` | List all DNS zone records |
| `cpanel_dns_add_record` | Add A/AAAA/CNAME/MX/TXT/SRV/CAA record |
| `cpanel_dns_edit_record` | Edit a DNS record by line number |
| `cpanel_dns_delete_record` | Delete a DNS record |

### Email

| Tool | Description |
|------|-------------|
| `cpanel_email_list_accounts` | List all email accounts |
| `cpanel_email_create_account` | Create email account |
| `cpanel_email_delete_account` | Delete email account |
| `cpanel_email_change_password` | Change email password |
| `cpanel_email_get_quota` | Get email quota |
| `cpanel_email_set_quota` | Set email quota |
| `cpanel_email_list_forwarders` | List forwarders |
| `cpanel_email_add_forwarder` | Add forwarder |
| `cpanel_email_delete_forwarder` | Delete forwarder |
| `cpanel_email_list_autoresponders` | List autoresponders |
| `cpanel_email_add_autoresponder` | Add autoresponder |

### SSL

| Tool | Description |
|------|-------------|
| `cpanel_ssl_list_certs` | List SSL certificates |
| `cpanel_ssl_show_status` | Show SSL status per domain |
| `cpanel_ssl_install_cert` | Install SSL certificate |
| `cpanel_ssl_delete_cert` | Delete SSL certificate |
| `cpanel_ssl_generate_csr` | Generate CSR |
| `cpanel_ssl_autossl_check` | Check AutoSSL status |
| `cpanel_ssl_autossl_start` | Start AutoSSL check |

### FTP

| Tool | Description |
|------|-------------|
| `cpanel_ftp_list_accounts` | List FTP accounts |
| `cpanel_ftp_create_account` | Create FTP account |
| `cpanel_ftp_delete_account` | Delete FTP account |
| `cpanel_ftp_change_password` | Change FTP password |
| `cpanel_ftp_set_quota` | Set FTP quota |
| `cpanel_ftp_server_info` | Get FTP server details |

### Backup

| Tool | Description |
|------|-------------|
| `cpanel_backup_list` | List available backups |
| `cpanel_backup_full_homedir` | Full backup to home dir |
| `cpanel_backup_full_ftp` | Full backup to FTP server |
| `cpanel_backup_restore_database` | Restore a database |

### Cron

| Tool | Description |
|------|-------------|
| `cpanel_cron_list` | List cron jobs |
| `cpanel_cron_add` | Add cron job |
| `cpanel_cron_edit` | Edit cron job |
| `cpanel_cron_delete` | Delete cron job |
| `cpanel_cron_get_email` | Get notification email |
| `cpanel_cron_set_email` | Set notification email |

### File Manager

| Tool | Description |
|------|-------------|
| `cpanel_files_list` | List directory contents |
| `cpanel_files_get_content` | Read file content |
| `cpanel_files_save_content` | Write/create file |
| `cpanel_files_delete` | Delete file/directory |
| `cpanel_files_mkdir` | Create directory |
| `cpanel_files_rename` | Rename/move |
| `cpanel_files_copy` | Copy file |
| `cpanel_files_chmod` | Change permissions |
| `cpanel_files_disk_usage` | Get disk usage |

## 🏗️ Architecture

```
cpanel-mcp-server/
├── src/
│   ├── index.ts              # Entry point — config, server setup
│   ├── cpanel-client.ts      # HTTP client for UAPI & API2
│   └── tools/
│       ├── domains.ts        # Domain management
│       ├── subdomains.ts     # Subdomain management
│       ├── dns.ts            # DNS zone management
│       ├── email.ts          # Email account management
│       ├── ssl.ts            # SSL/TLS management
│       ├── ftp.ts            # FTP account management
│       ├── backup.ts         # Backup management
│       ├── cron.ts           # Cron job management
│       └── filemanager.ts    # File management
├── package.json
├── tsconfig.json
└── README.md
```

## 🔒 Security Notes

- **Never commit credentials** — Use environment variables
- **Prefer API tokens** over passwords
- **Use HTTPS** (port 2083) — never connect over HTTP
- **Set `CPANEL_INSECURE=true` only in development** with self-signed certs
- API tokens can be revoked in cPanel without changing your password

## 📄 License

MIT

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Add tools following the pattern in `src/tools/`
4. Test with MCP Inspector
5. Submit a PR
