import { buildLoginMessage } from '../messageBuilder';

describe('buildLoginMessage', () => {
  it('returns the correctly substituted string for a template with all placeholders', async () => {
    const template = 'Login with address {{address}}, nonce {{nonce}}, issued at {{issuedAt}}';
    const params = {
      template,
      address: '0x123',
      nonce: 'abc',
      issuedAt: '2023-10-01T00:00:00Z',
    };
    const result = await buildLoginMessage(params);
    expect(result).toBe('Login with address 0x123, nonce abc, issued at 2023-10-01T00:00:00Z');
  });

  it('throws an error when a placeholder is missing', async () => {
    const template = 'Login with address {{address}}, nonce {{nonce}}, issued at {{issuedAt}}';
    const params: {
      template: string;
      address: string;
      nonce: string | undefined;
      issuedAt: string;
    } = {
      template,
      address: '0x123',
      nonce: undefined,
      issuedAt: '2023-10-01T00:00:00Z',
    };
    await expect(buildLoginMessage(params)).rejects.toThrow('Missing placeholder: nonce');
  });

  it('ignores extra params not used in the template', async () => {
    const template = 'Login with address {{address}}';
    const params = {
      template,
      address: '0x123',
      nonce: 'abc',
      issuedAt: '2023-10-01T00:00:00Z',
      extra: 'extraParam',
    };
    const result = await buildLoginMessage(params);
    expect(result).toBe('Login with address 0x123');
  });
}); 