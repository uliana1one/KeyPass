import {
  KILTKeyType,
  KILTVerificationMethodType,
  KILTServiceType,
  KILTDIDStatus,
  KILTErrorType,
  KILTError,
  KILTDIDDocument,
  KILTVerificationMethod,
  KILTService,
  KILTParachainInfo,
  KILTTransactionResult,
} from '../KILTTypes.js';

describe('KILTTypes', () => {
  describe('Enums', () => {
    it('should have correct KILT key types', () => {
      expect(KILTKeyType.SR25519).toBe('sr25519');
      expect(KILTKeyType.ED25519).toBe('ed25519');
      expect(KILTKeyType.X25519).toBe('x25519');
      expect(KILTKeyType.KILT_AGGREGATE).toBe('kilt-aggregate');
    });

    it('should have correct KILT verification method types', () => {
      expect(KILTVerificationMethodType.SR25519_2020).toBe('Sr25519VerificationKey2020');
      expect(KILTVerificationMethodType.ED25519_2020).toBe('Ed25519VerificationKey2020');
      expect(KILTVerificationMethodType.X25519_2020).toBe('X25519KeyAgreementKey2020');
      expect(KILTVerificationMethodType.KILT_PARACHAIN_2023).toBe('KiltParachainVerificationMethod2023');
    });

    it('should have correct KILT service types', () => {
      expect(KILTServiceType.KILT_PARACHAIN).toBe('KiltParachainService');
      expect(KILTServiceType.KILT_DID_REGISTRY).toBe('KiltDIDRegistry');
      expect(KILTServiceType.KILT_CREDENTIAL_REGISTRY).toBe('KiltCredentialRegistry');
      expect(KILTServiceType.KILT_ATTESTATION_SERVICE).toBe('KiltAttestationService');
      expect(KILTServiceType.KILT_DELEGATION_SERVICE).toBe('KiltDelegationService');
    });

    it('should have correct KILT DID statuses', () => {
      expect(KILTDIDStatus.ACTIVE).toBe('active');
      expect(KILTDIDStatus.CREATING).toBe('creating');
      expect(KILTDIDStatus.UPDATING).toBe('updating');
      expect(KILTDIDStatus.REVOKED).toBe('revoked');
      expect(KILTDIDStatus.EXPIRED).toBe('expired');
      expect(KILTDIDStatus.ERROR).toBe('error');
    });

    it('should have correct KILT error types', () => {
      expect(KILTErrorType.NETWORK_ERROR).toBe('NETWORK_ERROR');
      expect(KILTErrorType.PARACHAIN_CONNECTION_ERROR).toBe('PARACHAIN_CONNECTION_ERROR');
      expect(KILTErrorType.INVALID_KILT_ADDRESS).toBe('INVALID_KILT_ADDRESS');
      expect(KILTErrorType.KILT_DID_NOT_FOUND).toBe('KILT_DID_NOT_FOUND');
      expect(KILTErrorType.INSUFFICIENT_BALANCE).toBe('INSUFFICIENT_BALANCE');
      expect(KILTErrorType.TRANSACTION_EXECUTION_ERROR).toBe('TRANSACTION_EXECUTION_ERROR');
      expect(KILTErrorType.DID_REGISTRATION_ERROR).toBe('DID_REGISTRATION_ERROR');
      expect(KILTErrorType.CREDENTIAL_VERIFICATION_ERROR).toBe('CREDENTIAL_VERIFICATION_ERROR');
      expect(KILTErrorType.GOVERNANCE_ERROR).toBe('GOVERNANCE_ERROR');
      expect(KILTErrorType.DELEGATION_ERROR).toBe('DELEGATION_ERROR');
    });
  });

  describe('KILTError', () => {
    it('should create KILT error with basic information', () => {
      const error = new KILTError('Test error', KILTErrorType.NETWORK_ERROR);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe(KILTErrorType.NETWORK_ERROR);
      expect(error.name).toBe('KILTError');
    });

    it('should create KILT error with transaction details', () => {
      const error = new KILTError(
        'Transaction failed',
        KILTErrorType.TRANSACTION_EXECUTION_ERROR,
        {
          transactionHash: '0x123456789abcdef',
          blockNumber: 12345,
        }
      );
      
      expect(error.transactionHash).toBe('0x123456789abcdef');
      expect(error.blockNumber).toBe(12345);
    });

    it('should create KILT error with parachain info', () => {
      const parachainInfo: KILTParachainInfo = {
        chainName: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5.0.0',
        runtimeVersion: 'runtime-v123',
        ss58Format: 38,
        genesisHash: '0xabcdef123456',
      };

      const error = new KILTError(
        'Connection failed',
        KILTErrorType.PARACHAIN_CONNECTION_ERROR,
        { parachainInfo }
      );
      
      expect(error.parachainInfo).toEqual(parachainInfo);
    });

    it('should create detailed error message', () => {
      const error = new KILTError(
        'Detailed error test',
        KILTErrorType.DID_REGISTRATION_ERROR,
        {
          transactionHash: '0x123456789abcdef',
          blockNumber: 12345,
          parachainInfo: {
            chainName: 'KILT Spiritnet',
            network: 'spiritnet',
            version: '5.0.0',
            runtimeVersion: 'runtime-v123',
            ss58Format: 38,
            genesisHash: '0xabcdef123456',
          },
        }
      );

      const detailedMessage = error.toDetailedMessage();
      
      expect(detailedMessage).toContain('KILT Error [DID_REGISTRATION_ERROR]: Detailed error test');
      expect(detailedMessage).toContain('Transaction Hash: 0x123456789abcdef');
      expect(detailedMessage).toContain('Block Number: 12345');
      expect(detailedMessage).toContain('Network: spiritnet (KILT Spiritnet)');
      expect(detailedMessage).toContain('Chain Version: 5.0.0');
    });
  });

  describe('KILTDIDDocument', () => {
    it('should create a valid KILT DID document', () => {
      const kiltService: KILTService = {
        id: 'did:kilt:test#kilt-parachain',
        type: KILTServiceType.KILT_PARACHAIN,
        serviceEndpoint: 'wss://spiritnet.kilt.io',
        metadata: {
          version: '1.0',
          provider: 'KILT Protocol',
          lastUpdated: '2024-01-01T00:00:00Z',
          status: 'active',
        },
      };

      const kiltVerificationMethod: KILTVerificationMethod = {
        id: 'did:kilt:test#kilt-key',
        type: KILTVerificationMethodType.SR25519_2020,
        controller: 'did:kilt:test',
        publicKeyMultibase: 'z123456789',
        keyType: KILTKeyType.SR25519,
        metadata: {
          isActive: true,
          accountIndex: 0,
        },
      };

      const doc: KILTDIDDocument = {
        '@context': [
          'https://www.w3.org/ns/did/v1',
          'https://w3id.org/security/suites/sr25519-2020/v1',
          'https://w3id.org/security/suites/kilt-2023/v1',
        ],
        id: 'did:kilt:test',
        controller: 'did:kilt:test',
        verificationMethod: [kiltVerificationMethod],
        authentication: [kiltVerificationMethod.id],
        assertionMethod: [kiltVerificationMethod.id],
        keyAgreement: [],
        capabilityInvocation: [kiltVerificationMethod.id],
        capabilityDelegation: [kiltVerificationMethod.id],
        service: [kiltService],
        kiltExtensions: {
          parachainInfo: {
            chainName: 'KILT Spiritnet',
            network: 'spiritnet',
            version: '5.0.0',
            runtimeVersion: 'runtime-v123',
            ss58Format: 38,
            genesisHash: '0xabcdef123456',
          },
          creationTransaction: '0x123456789',
          createdAtBlock: 1000,
          status: KILTDIDStatus.ACTIVE,
        },
      };

      expect(doc.id).toBe('did:kilt:test');
      expect(doc.verificationMethod).toHaveLength(1);
      expect(doc.service).toHaveLength(1);
      expect(doc.kiltExtensions?.parachainInfo?.network).toBe('spiritnet');
    });

    it('should handle KILT service with extended configuration', () => {
      const service: KILTService = {
        id: 'did:kilt:test#parachain',
        type: KILTServiceType.KILT_PARACHAIN,
        serviceEndpoint: 'wss://spiritnet.kilt.io',
        endpointConfig: {
          url: 'wss://spiritnet.kilt.io',
          alternatives: ['wss://spiritnet-backup.kilt.io'],
          timeout: 30000,
          headers: {
            'User-Agent': 'KeyPass/1.0',
          },
        },
        metadata: {
          version: '1.0',
          provider: 'KILT Protocol',
          lastUpdated: '2024-01-01T00:00:00Z',
          status: 'active',
        },
      };

      expect(service.endpointConfig?.timeout).toBe(30000);
      expect(service.endpointConfig?.alternatives).toContain('wss://spiritnet-backup.kilt.io');
    });
  });

  describe('KILTTransactionResult', () => {
    it('should create a valid transaction result', () => {
      const result: KILTTransactionResult = {
        success: true,
        transactionHash: '0x123456789abcdef',
        blockNumber: 12345,
        blockHash: '0xabcdef123456789',
        events: [
          {
            type: 'system.ExtrinsicSuccess',
            section: 'system',
            method: 'ExtrinsicSuccess',
            data: { dispatchInfo: undefined },
            index: 0,
          },
        ],
        fee: {
          amount: '1000000000', // 1 KILT (18 decimals)
          currency: 'KILT',
        },
        timestamp: '2024-01-01T12:00:00Z',
      };

      expect(result.success).toBe(true);
      expect(result.transactionHash).toBe('0x123456789abcdef');
      expect(result.events).toHaveLength(1);
      expect(result.fee.currency).toBe('KILT');
    });
  });

  describe('Type validation', () => {
    it('should validate KILT Parachain Info structure', () => {
      const parachainInfo: KILTParachainInfo = {
        chainName: 'KILT Spiritnet',
        network: 'spiritnet',
        version: '5.0.0',
        runtimeVersion: 'runtime-v123',
        ss58Format: 38,
        genesisHash: '0xabcdef123456',
        latestBlockNumber: 50000,
      };

      expect(parachainInfo.ss58Format).toBe(38);
      expect(parachainInfo.network).toBe('spiritnet');
      expect(parachainInfo.latestBlockNumber).toBe(50000);
    });

    it('should validate KILT verification method metadata', () => {
      const metadata = {
        accountIndex: 1,
        isDerived: true,
        derivationPath: "m/44'/60'/0'/0/0",
        createdAt: '2024-01-01T00:00:00Z',
        isActive: true,
      };

      expect(metadata.accountIndex).toBe(1);
      expect(metadata.isDerived).toBe(true);
      expect(metadata.derivationPath).toMatch(/^m\/\d+'\/+\d+'/);
      expect(metadata.isActive).toBe(true);
    });
  });
});
