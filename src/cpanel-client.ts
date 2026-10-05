/**
 * cPanel API Client
 *
 * Handles authentication (username/password and API token) and
 * HTTP communication with the cPanel UAPI and legacy API2 endpoints.
 *
 * Supports dynamic configuration at runtime so agents can connect to any cPanel
 * by supplying host, username, and password/token on the fly.
 */

export interface CpanelConfig {
  host: string;
  port?: number;
  username: string;
  password?: string;
  apiToken?: string;
  /** Set to true to allow self-signed certs (development only) */
  insecure?: boolean;
}

export interface CpanelResponse<T = unknown> {
  status: number;
  errors: string[] | null;
  messages: string[] | null;
  data: T;
  metadata?: Record<string, unknown>;
}

export class CpanelApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errors: string[],
  ) {
    super(message);
    this.name = "CpanelApiError";
  }
}

export class CpanelClient {
  private config?: CpanelConfig;
  private baseUrl?: string;
  private authHeader?: string;

  constructor(config?: CpanelConfig) {
    if (config?.host && config?.username && (config?.password || config?.apiToken)) {
      this.configure(config);
    }
  }

  /**
   * Configure or switch credentials dynamically at runtime.
   */
  configure(config: CpanelConfig): void {
    if (!config.host || !config.username) {
      throw new Error("Both host and username are required.");
    }
    if (!config.password && !config.apiToken) {
      throw new Error(
        "Either password or apiToken must be provided for cPanel authentication.",
      );
    }

    const port = config.port ?? 2083;
    this.baseUrl = `https://${config.host}:${port}`;
    this.config = { ...config, port };

    if (config.apiToken) {
      this.authHeader = `cpanel ${config.username}:${config.apiToken}`;
    } else {
      const credentials = Buffer.from(
        `${config.username}:${config.password}`,
      ).toString("base64");
      this.authHeader = `Basic ${credentials}`;
    }
  }

  /**
   * Check if the client currently has active credentials.
   */
  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.authHeader && this.config);
  }

  /**
   * Get the current active configuration (safe details, no passwords).
   */
  getActiveSession(): { host?: string; username?: string; port?: number } | null {
    if (!this.config) return null;
    return {
      host: this.config.host,
      username: this.config.username,
      port: this.config.port,
    };
  }

  private assertConfigured(): void {
    if (!this.isConfigured() || !this.baseUrl || !this.authHeader || !this.config) {
      throw new CpanelApiError(
        "cPanel is not connected yet. Please call 'cpanel_connect' tool first with your cPanel host, username, and password or API token.",
        401,
        ["Not connected"],
      );
    }
  }

  /**
   * Call a UAPI function.
   */
  async uapi<T = unknown>(
    module: string,
    func: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<CpanelResponse<T>> {
    this.assertConfigured();
    const url = new URL(`/execute/${module}/${func}`, this.baseUrl!);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return this.request<CpanelResponse<T>>(url.toString());
  }

  /**
   * Call a legacy API 2 function (e.g. ZoneEdit, Cron).
   */
  async api2<T = unknown>(
    module: string,
    func: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    this.assertConfigured();
    const url = new URL("/json-api/cpanel", this.baseUrl!);
    url.searchParams.set("cpanel_jsonapi_apiversion", "2");
    url.searchParams.set("cpanel_jsonapi_module", module);
    url.searchParams.set("cpanel_jsonapi_func", func);
    url.searchParams.set("cpanel_jsonapi_user", this.config!.username);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const response = await this.request<{
      cpanelresult?: { data?: T; error?: string };
    }>(url.toString());

    if (response.cpanelresult?.error) {
      throw new CpanelApiError(response.cpanelresult.error, 500, [
        response.cpanelresult.error,
      ]);
    }

    return response.cpanelresult?.data as T;
  }

  /**
   * Execute a raw HTTP request against the cPanel server.
   */
  private async request<T>(url: string): Promise<T> {
    this.assertConfigured();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const fetchOptions: RequestInit = {
        method: "GET",
        headers: {
          Authorization: this.authHeader!,
          Accept: "application/json",
        },
        signal: controller.signal,
      };

      if (this.config?.insecure) {
        // @ts-expect-error — Node-specific extension
        fetchOptions.dispatcher = new (await import("undici")).Agent({
          connect: { rejectUnauthorized: false },
        });
      }

      const response = await fetch(url, fetchOptions);

      if (!response.ok) {
        const body = await response.text();
        throw new CpanelApiError(
          `cPanel API returned HTTP ${response.status}: ${body}`,
          response.status,
          [body],
        );
      }

      const json = (await response.json()) as T;
      return json;
    } catch (error) {
      if (error instanceof CpanelApiError) throw error;

      const message =
        error instanceof Error ? error.message : "Unknown cPanel API error";
      throw new CpanelApiError(message, 0, [message]);
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Verify that current credentials work by calling a lightweight UAPI function.
   */
  async verifyConnection(): Promise<{ ok: boolean; user: string; host: string }> {
    this.assertConfigured();
    try {
      await this.uapi("DomainInfo", "list_domains");
      return { ok: true, user: this.config!.username, host: this.config!.host };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      throw new CpanelApiError(
        `Connection verification failed: ${msg}`,
        0,
        [msg],
      );
    }
  }
}
