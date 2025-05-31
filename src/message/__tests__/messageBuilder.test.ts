import { buildLoginMessage } from '../messageBuilder';

describe('buildLoginMessage', () => {
  const validTemplate = 'KeyPass Login\nIssued At: {{issuedAt}}\nNonce: {{nonce}}\nAddress: {{address}}';
  const validParams = {
    template: validTemplate,
    address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
    nonce: 'abc123',
    issuedAt: '2024-03-20T12:00:00Z'
  };

  it('should build message with all placeholders replaced', async () => {
    const message = await buildLoginMessage(validParams);
    expect(message).toBe(
      'KeyPass Login\nIssued At: 2024-03-20T12:00:00Z\nNonce: abc123\nAddress: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    );
  });

  it('should handle template with only some placeholders', async () => {
    const template = 'Login with {{address}} at {{issuedAt}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe('Login with 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY at 2024-03-20T12:00:00Z');
  });

  it('should handle template with no placeholders', async () => {
    const template = 'Static message';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe('Static message');
  });

  it('should handle template with repeated placeholders', async () => {
    const template = 'Login with {{address}} and {{address}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe(
      'Login with 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY and 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    );
  });

  it('should handle template with nested placeholders', async () => {
    const template = 'Login with {{address}} at {{issuedAt}} and {{nonce}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe(
      'Login with 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY at 2024-03-20T12:00:00Z and abc123'
    );
  });

  it('should handle template with whitespace around placeholders', async () => {
    const template = 'Login with {{ address }} at {{ issuedAt }}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe('Login with 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY at 2024-03-20T12:00:00Z');
  });

  it('should handle template with escaped placeholders', async () => {
    const template = 'Login with \\{{address}} at {{issuedAt}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe('Login with {{address}} at 2024-03-20T12:00:00Z');
  });

  it('should throw error for missing nonce', async () => {
    await expect(
      buildLoginMessage({
        ...validParams,
        nonce: undefined
      })
    ).rejects.toThrow('Missing placeholder: nonce');
  });

  it('should throw error for missing address', async () => {
    const template = 'Login with {{address}}';
    await expect(
      buildLoginMessage({
        ...validParams,
        template,
        address: undefined as any
      })
    ).rejects.toThrow('Missing placeholder: address');
  });

  it('should throw error for missing issuedAt', async () => {
    const template = 'Login at {{issuedAt}}';
    await expect(
      buildLoginMessage({
        ...validParams,
        template,
        issuedAt: undefined as any
      })
    ).rejects.toThrow('Missing placeholder: issuedAt');
  });

  it('should throw error for missing template', async () => {
    await expect(
      buildLoginMessage({
        ...validParams,
        template: undefined as any
      })
    ).rejects.toThrow('Template is required');
  });

  it('should throw error for invalid template type', async () => {
    await expect(
      buildLoginMessage({
        ...validParams,
        template: 123 as any
      })
    ).rejects.toThrow('Template must be a string');
  });

  it('should handle empty string values', async () => {
    const message = await buildLoginMessage({
      ...validParams,
      nonce: '',
      address: ''
    });
    expect(message).toBe(
      'KeyPass Login\nIssued At: 2024-03-20T12:00:00Z\nNonce: \nAddress: '
    );
  });

  it('should handle special characters in values', async () => {
    const message = await buildLoginMessage({
      ...validParams,
      nonce: 'abc\n123',
      address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\n'
    });
    expect(message).toBe(
      'KeyPass Login\nIssued At: 2024-03-20T12:00:00Z\nNonce: abc\n123\nAddress: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY\n'
    );
  });

  it('should handle template with multiple newlines', async () => {
    const template = 'KeyPass Login\n\nIssued At: {{issuedAt}}\n\nNonce: {{nonce}}\n\nAddress: {{address}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe(
      'KeyPass Login\n\nIssued At: 2024-03-20T12:00:00Z\n\nNonce: abc123\n\nAddress: 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
    );
  });

  it('should handle template with mixed case placeholders', async () => {
    const template = 'Login with {{Address}} at {{ISSUEDAT}} and {{Nonce}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe(
      'Login with 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY at 2024-03-20T12:00:00Z and abc123'
    );
  });

  it('should handle template with unicode characters', async () => {
    const template = '🔑 Login with {{address}} at {{issuedAt}}';
    const message = await buildLoginMessage({
      ...validParams,
      template
    });
    expect(message).toBe('🔑 Login with 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY at 2024-03-20T12:00:00Z');
  });
});
