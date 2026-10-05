/**
 * cPanel API Client
 *
 * Handles authentication (username/password and API token) and
 * HTTP communication with the cPanel UAPI and legacy API2 endpoints.
 *
 * Endpoint URL structure:
 *   UAPI:  https://{host}:2083/execute/{Module}/{Function}
 *   API2:  https://{host}:2083/json-api/cpanel?cpanel_jsonapi_apiversion=2&cpanel_jsonapi_module={Module}&cpanel_jsonapi_func={Function}
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
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor(private readonly config: CpanelConfig) {
    const port = config.port ?? 2083;
    this.baseUrl = `https://${config.host}:${port}`;

    if (config.apiToken) {
      // API Token authentication — preferred for automation
      this.authHeader = `cpanel ${config.username}:${config.apiToken}`;
    } else if (config.password) {
      // Basic authentication
      const credentials = Buffer.from(
        `${config.username}:${config.password}`,
      ).toString("base64");
      this.authHeader = `Basic ${credentials}`;
    } else {
      throw new Error(
        "Either password or apiToken must be provided for cPanel authentication.",
      );
    }
  }

  /**
   * Call a UAPI function.
   *
   * @example
   *   await client.uapi("Email", "list_pops");
   *   await client.uapi("SubDomain", "addsubdomain", { domain: "sub", rootdomain: "example.com" });
   */
  async uapi<T = unknown>(
    module: string,
    func: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<CpanelResponse<T>> {
    const url = new URL(`/execute/${module}/${func}`, this.baseUrl);

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
   * Call a legacy API 2 function (for modules not yet migrated to UAPI, e.g. Cron).
   *
   * @example
   *   await client.api2("Cron", "listcron");
   */
  async api2<T = unknown>(
    module: string,
    func: string,
    params?: Record<string, string | number | boolean>,
  ): Promise<T> {
    const url = new URL("/json-api/cpanel", this.baseUrl);
    url.searchParams.set("cpanel_jsonapi_apiversion", "2");
    url.searchParams.set("cpanel_jsonapi_module", module);
    url.searchParams.set("cpanel_jsonapi_func", func);
    url.searchParams.set("cpanel_jsonapi_user", this.config.username);

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const fetchOptions: RequestInit = {
        method: "GET",
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
        signal: controller.signal,
      };

      // Allow self-signed certificates in development
      if (this.config.insecure) {
        // Node.js 18+ supports this via the agent option
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
   * Verify that the credentials work by calling a lightweight UAPI function.
   */
  async verifyConnection(): Promise<{ ok: boolean; user: string; host: string }> {
    try {
      await this.uapi("DomainInfo", "list_domains");
      return { ok: true, user: this.config.username, host: this.config.host };
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
