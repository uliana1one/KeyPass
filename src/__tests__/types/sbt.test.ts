/**
 * Tests for SBT (Soulbound Token) Types and Mock Data
 */

import {
  SBTChainType,
  SBTTokenStandard,
  SBTVerificationStatus,
  SBTToken,
  SBTCollection,
  SBTTokenAttribute,
} from '../../types/sbt';
import {
  mockSBTTokens,
  mockSBTCollections,
  getMockSBTTokensByAddress,
  getMockSBTCollectionById,
  getMockSBTTokenById,
  getMockSBTCollectionsByAddress,
} from '../../mock/sbtMockData';

describe('SBT Types', () => {
  describe('SBTChainType', () => {
    it('should have correct chain type values', () => {
      expect(SBTChainType.ETHEREUM).toBe('ethereum');
      expect(SBTChainType.MOONBEAM).toBe('moonbeam');
      expect(SBTChainType.POLKADOT).toBe('polkadot');
      expect(SBTChainType.KUSAMA).toBe('kusama');
    });
  });

  describe('SBTTokenStandard', () => {
    it('should have correct token standard values', () => {
      expect(SBTTokenStandard.ERC721_SOULBOUND).toBe('erc721-soulbound');
      expect(SBTTokenStandard.ERC1155_SOULBOUND).toBe('erc1155-soulbound');
      expect(SBTTokenStandard.POLKADOT_NFT).toBe('polkadot-nft');
    });
  });

  describe('SBTVerificationStatus', () => {
    it('should have correct verification status values', () => {
      expect(SBTVerificationStatus.VERIFIED).toBe('verified');
      expect(SBTVerificationStatus.PENDING).toBe('pending');
      expect(SBTVerificationStatus.FAILED).toBe('failed');
      expect(SBTVerificationStatus.REVOKED).toBe('revoked');
      expect(SBTVerificationStatus.UNKNOWN).toBe('unknown');
    });
  });
});

describe('SBT Mock Data', () => {
  describe('mockSBTTokens', () => {
    it('should have valid SBT token structure', () => {
      expect(mockSBTTokens).toBeInstanceOf(Array);
      expect(mockSBTTokens.length).toBeGreaterThan(0);

      mockSBTTokens.forEach((token: SBTToken) => {
        // Required fields
        expect(token.id).toBeDefined();
        expect(token.name).toBeDefined();
        expect(token.description).toBeDefined();
        expect(token.image).toBeDefined();
        expect(token.issuer).toBeDefined();
        expect(token.issuerName).toBeDefined();
        expect(token.issuedAt).toBeDefined();
        expect(token.chainId).toBeDefined();
        expect(token.chainType).toBeDefined();
        expect(token.contractAddress).toBeDefined();
        expect(token.tokenStandard).toBeDefined();
        expect(token.verificationStatus).toBeDefined();
        expect(token.revocable).toBeDefined();

        // Type validation
        expect(typeof token.id).toBe('string');
        expect(typeof token.name).toBe('string');
        expect(typeof token.description).toBe('string');
        expect(typeof token.image).toBe('string');
        expect(typeof token.issuer).toBe('string');
        expect(typeof token.issuerName).toBe('string');
        expect(typeof token.issuedAt).toBe('string');
        expect(typeof token.chainId).toBe('string');
        expect(typeof token.contractAddress).toBe('string');
        expect(typeof token.revocable).toBe('boolean');

        // Enum validation
        expect(Object.values(SBTChainType)).toContain(token.chainType);
        expect(Object.values(SBTTokenStandard)).toContain(token.tokenStandard);
        expect(Object.values(SBTVerificationStatus)).toContain(token.verificationStatus);

        // Date validation
        expect(() => new Date(token.issuedAt)).not.toThrow();
        if (token.expiresAt) {
          expect(() => new Date(token.expiresAt)).not.toThrow();
        }
        if (token.revokedAt) {
          expect(() => new Date(token.revokedAt)).not.toThrow();
        }

        // Attributes validation
        if (token.attributes) {
          expect(Array.isArray(token.attributes)).toBe(true);
          token.attributes.forEach((attr: SBTTokenAttribute) => {
            expect(attr.trait_type).toBeDefined();
            expect(attr.value).toBeDefined();
            expect(typeof attr.trait_type).toBe('string');
          });
        }

        // Tags validation
        if (token.tags) {
          expect(Array.isArray(token.tags)).toBe(true);
          token.tags.forEach((tag: string) => {
            expect(typeof tag).toBe('string');
          });
        }
      });
    });

    it('should have diverse token types', () => {
      const chainTypes = new Set(mockSBTTokens.map(token => token.chainType));
      const tokenStandards = new Set(mockSBTTokens.map(token => token.tokenStandard));
      const verificationStatuses = new Set(mockSBTTokens.map(token => token.verificationStatus));

      expect(chainTypes.size).toBeGreaterThan(1);
      expect(tokenStandards.size).toBeGreaterThan(1);
      expect(verificationStatuses.size).toBeGreaterThan(1);
    });
  });

  describe('mockSBTCollections', () => {
    it('should have valid SBT collection structure', () => {
      expect(mockSBTCollections).toBeInstanceOf(Array);
      expect(mockSBTCollections.length).toBeGreaterThan(0);

      mockSBTCollections.forEach((collection: SBTCollection) => {
        // Required fields
        expect(collection.id).toBeDefined();
        expect(collection.name).toBeDefined();
        expect(collection.description).toBeDefined();
        expect(collection.image).toBeDefined();
        expect(collection.issuer).toBeDefined();
        expect(collection.issuerName).toBeDefined();
        expect(collection.contractAddress).toBeDefined();
        expect(collection.chainId).toBeDefined();
        expect(collection.chainType).toBeDefined();
        expect(collection.tokenStandard).toBeDefined();
        expect(collection.totalSupply).toBeDefined();
        expect(collection.uniqueHolders).toBeDefined();
        expect(collection.createdAt).toBeDefined();
        expect(collection.verificationStatus).toBeDefined();
        expect(collection.tokens).toBeDefined();

        // Type validation
        expect(typeof collection.id).toBe('string');
        expect(typeof collection.name).toBe('string');
        expect(typeof collection.description).toBe('string');
        expect(typeof collection.image).toBe('string');
        expect(typeof collection.issuer).toBe('string');
        expect(typeof collection.issuerName).toBe('string');
        expect(typeof collection.contractAddress).toBe('string');
        expect(typeof collection.chainId).toBe('string');
        expect(typeof collection.totalSupply).toBe('number');
        expect(typeof collection.uniqueHolders).toBe('number');
        expect(typeof collection.createdAt).toBe('string');
        expect(Array.isArray(collection.tokens)).toBe(true);

        // Enum validation
        expect(Object.values(SBTChainType)).toContain(collection.chainType);
        expect(Object.values(SBTTokenStandard)).toContain(collection.tokenStandard);
        expect(Object.values(SBTVerificationStatus)).toContain(collection.verificationStatus);

        // Date validation
        expect(() => new Date(collection.createdAt)).not.toThrow();

        // Numeric validation
        expect(collection.totalSupply).toBeGreaterThan(0);
        expect(collection.uniqueHolders).toBeGreaterThan(0);
        expect(collection.uniqueHolders).toBeLessThanOrEqual(collection.totalSupply);

        // Social links validation
        if (collection.socialLinks) {
          expect(typeof collection.socialLinks).toBe('object');
          Object.values(collection.socialLinks).forEach((link) => {
            if (link) {
              expect(typeof link).toBe('string');
              expect(link.startsWith('http')).toBe(true);
            }
          });
        }
      });
    });
  });

  describe('Helper Functions', () => {
    it('should return tokens by address', () => {
      const tokens = getMockSBTTokensByAddress('0x1234567890123456789012345678901234567890');
      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
    });

    it('should return collection by ID', () => {
      const collection = getMockSBTCollectionById('education-collection-1');
      expect(collection).toBeDefined();
      expect(collection?.id).toBe('education-collection-1');
      expect(collection?.name).toBe('KeyPass University Credentials');
    });

    it('should return undefined for non-existent collection', () => {
      const collection = getMockSBTCollectionById('non-existent-collection');
      expect(collection).toBeUndefined();
    });

    it('should return undefined for non-existent token', () => {
      const token = getMockSBTTokenById('non-existent-token-id');
      expect(token).toBeUndefined();
    });

    it('should return collections by address', () => {
      const collections = getMockSBTCollectionsByAddress('0x1234567890123456789012345678901234567890');
      expect(Array.isArray(collections)).toBe(true);
      expect(collections.length).toBeGreaterThan(0);
    });

    it('should return existing token by ID', () => {
      const token = getMockSBTTokenById('1');
      expect(token).toBeDefined();
      expect(token?.id).toBe('1');
      expect(token?.name).toBe('Computer Science Student');
    });
  });
}); 