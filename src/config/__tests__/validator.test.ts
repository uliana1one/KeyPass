import { validateWalletConfig } from '../validator';
import { ConfigurationError } from '../../errors/WalletErrors';

describe('Config Validator', () => {
  const validConfig = {
    wallets: [
      {
        id: 'polkadot-js',
        name: 'Polkadot.js',
        adapter: 'PolkadotJsAdapter',
        priority: 1
      },
      {
        id: 'talisman',
        name: 'Talisman',
        adapter: 'TalismanAdapter',
        priority: 2
      }
    ]
  };

  it('should validate correct configuration', () => {
    expect(() => validateWalletConfig(validConfig)).not.toThrow();
  });

  it('should handle missing wallets array', () => {
    const invalidConfig = { ...validConfig, wallets: undefined };
    expect(() => validateWalletConfig(invalidConfig as any)).toThrow(ConfigurationError);
  });

  it('should handle empty wallets array', () => {
    const invalidConfig = { ...validConfig, wallets: [] };
    expect(() => validateWalletConfig(invalidConfig)).toThrow(ConfigurationError);
  });

  it('should validate wallet priorities', () => {
    const invalidConfig = {
      wallets: [
        {
          id: 'polkadot-js',
          name: 'Polkadot.js',
          adapter: 'PolkadotJsAdapter',
          priority: 2
        },
        {
          id: 'talisman',
          name: 'Talisman',
          adapter: 'TalismanAdapter',
          priority: 1
        }
      ]
    };
    expect(() => validateWalletConfig(invalidConfig)).toThrow(ConfigurationError);
  });

  it('should handle missing required wallet fields', () => {
    const invalidConfigs = [
      { ...validConfig, wallets: [{ id: 'polkadot-js' }] },
      { ...validConfig, wallets: [{ name: 'Polkadot.js' }] },
      { ...validConfig, wallets: [{ adapter: 'PolkadotJsAdapter' }] },
      { ...validConfig, wallets: [{ priority: 1 }] }
    ];

    invalidConfigs.forEach(config => {
      expect(() => validateWalletConfig(config as any)).toThrow(ConfigurationError);
    });
  });

  it('should handle invalid wallet types', () => {
    const invalidConfigs = [
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], id: 123 }] },
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], name: 123 }] },
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], adapter: 123 }] },
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], priority: '1' }] }
    ];

    invalidConfigs.forEach(config => {
      expect(() => validateWalletConfig(config as any)).toThrow(ConfigurationError);
    });
  });

  it('should handle duplicate wallet IDs', () => {
    const invalidConfig = {
      wallets: [
        validConfig.wallets[0],
        { ...validConfig.wallets[0] }
      ]
    };
    expect(() => validateWalletConfig(invalidConfig)).toThrow(ConfigurationError);
  });

  it('should handle invalid adapter names', () => {
    const invalidConfig = {
      wallets: [
        {
          ...validConfig.wallets[0],
          adapter: 'InvalidAdapter'
        }
      ]
    };
    expect(() => validateWalletConfig(invalidConfig)).toThrow(ConfigurationError);
  });

  it('should handle out of range priorities', () => {
    const invalidConfigs = [
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], priority: 0 }] },
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], priority: -1 }] },
      { ...validConfig, wallets: [{ ...validConfig.wallets[0], priority: 1000 }] }
    ];

    invalidConfigs.forEach(config => {
      expect(() => validateWalletConfig(config)).toThrow(ConfigurationError);
    });
  });
}); 