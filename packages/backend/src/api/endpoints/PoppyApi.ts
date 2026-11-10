import type { RequestFunction } from '../request';

export type PoppyMetadata = Record<string, unknown> & {
  organization: { name: string; domain: string };
  auth: { issuer: string; scopes: Record<string, string> };
};

export class PoppyAPI {
  constructor(private readonly request: RequestFunction) {}

  public async getMetadata() {
    const artifact = await this.request<{ object: 'artifact'; data: PoppyMetadata }>({
      method: 'GET',
      path: '/artifacts/well-known-poppy',
    });
    return artifact.data;
  }
}
