import type { RequestFunction } from '../request';
import { buildRequest } from '../request';

export type PoppyBrowserSession = {
  session_id: string;
  client_id: string;
  user_id: string;
  agent_id?: string;
  account?: { user_id: string; scopes: string[]; session_id: string };
};

export type PoppyMetadata = Record<string, unknown> & {
  organization: { name: string; domain: string };
  auth: { issuer: string; scopes: Record<string, string> };
};

export type PoppyCredential = { type: 'session'; token: string };

export class PoppyAPI {
  constructor(
    private readonly request: RequestFunction,
    private readonly userAgent?: string,
  ) {}

  public async getMetadata() {
    const artifact = await this.request<{ object: 'artifact'; data: PoppyMetadata }>({
      method: 'GET',
      path: '/artifacts/well-known-poppy',
    });
    return artifact.data;
  }

  public resolveSession(credential: PoppyCredential, frontendApi: string) {
    const request = buildRequest({
      apiUrl: frontendApi.startsWith('http') ? frontendApi : `https://${frontendApi}`,
      requireSecretKey: false,
      userAgent: this.userAgent,
    });
    return request<PoppyBrowserSession>({
      method: 'POST',
      path: '/poppy/browser_sessions/resolve',
      bodyParams: { credential },
    });
  }
}
