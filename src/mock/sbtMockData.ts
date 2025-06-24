/**
 * Mock SBT (Soulbound Token) Data for Demonstration
 * 
 * This module provides realistic mock data for SBTs following the defined
 * interfaces and industry best practices. This data is used for development,
 * testing, and demonstration purposes.
 * 
 * @see ../types/sbt.ts
 */

import {
  SBTToken,
  SBTCollection,
  SBTChainType,
  SBTTokenStandard,
  SBTVerificationStatus,
  SBTTokenAttribute,
} from '../types/sbt';

/**
 * Mock SBT token attributes for educational credentials
 */
export const mockEducationalAttributes: SBTTokenAttribute[] = [
  {
    trait_type: 'Student Status',
    value: 'Active',
  },
  {
    trait_type: 'Enrollment Year',
    value: 2024,
    display_type: 'number',
  },
  {
    trait_type: 'Program Type',
    value: 'Computer Science',
  },
  {
    trait_type: 'GPA',
    value: 3.8,
    display_type: 'number',
    max_value: 4.0,
  },
  {
    trait_type: 'Credits Completed',
    value: 75,
    display_type: 'number',
  },
];

/**
 * Mock SBT token attributes for professional certifications
 */
export const mockProfessionalAttributes: SBTTokenAttribute[] = [
  {
    trait_type: 'Certification Type',
    value: 'Blockchain Developer',
  },
  {
    trait_type: 'Issuing Organization',
    value: 'Web3 Foundation',
  },
  {
    trait_type: 'Valid Until',
    value: '2025-12-31',
  },
  {
    trait_type: 'Skill Level',
    value: 'Advanced',
  },
  {
    trait_type: 'Verification Method',
    value: 'On-Chain',
  },
];

/**
 * Mock SBT token attributes for community badges
 */
export const mockCommunityAttributes: SBTTokenAttribute[] = [
  {
    trait_type: 'Community Role',
    value: 'Contributor',
  },
  {
    trait_type: 'Contribution Type',
    value: 'Code',
  },
  {
    trait_type: 'Projects Contributed',
    value: 5,
    display_type: 'number',
  },
  {
    trait_type: 'Member Since',
    value: '2023-01-15',
  },
  {
    trait_type: 'Reputation Score',
    value: 95,
    display_type: 'number',
    max_value: 100,
  },
];

/**
 * Mock SBT tokens for demonstration
 */
export const mockSBTTokens: SBTToken[] = [
  {
    id: '1',
    name: 'Computer Science Student',
    description: 'Active student in Computer Science program at KeyPass University',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z0',
    issuerName: 'KeyPass University',
    issuedAt: '2024-01-15T10:30:00.000Z',
    expiresAt: '2028-06-30T23:59:59.000Z',
    chainId: '1284', // Moonbeam
    chainType: SBTChainType.MOONBEAM,
    contractAddress: '0x1234567890123456789012345678901234567890',
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    tokenUri: 'ipfs://QmX123456789012345678901234567890123456789012345678901234567890',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    attributes: mockEducationalAttributes,
    revocable: true,
    collectionId: 'education-collection-1',
    rarityScore: 85,
    tags: ['education', 'student', 'computer-science', 'university'],
  },
  {
    id: '2',
    name: 'Blockchain Developer Certification',
    description: 'Certified blockchain developer with expertise in Polkadot ecosystem',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z1',
    issuerName: 'Web3 Foundation',
    issuedAt: '2024-02-20T14:15:00.000Z',
    expiresAt: '2025-12-31T23:59:59.000Z',
    chainId: '1', // Ethereum Mainnet
    chainType: SBTChainType.ETHEREUM,
    contractAddress: '0x2345678901234567890123456789012345678901',
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    tokenUri: 'ipfs://QmY234567890123456789012345678901234567890123456789012345678901',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    attributes: mockProfessionalAttributes,
    revocable: true,
    collectionId: 'professional-collection-1',
    rarityScore: 92,
    tags: ['professional', 'certification', 'blockchain', 'polkadot'],
  },
  {
    id: '3',
    name: 'Open Source Contributor',
    description: 'Active contributor to open source projects in the Web3 ecosystem',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z2',
    issuerName: 'GitHub DAO',
    issuedAt: '2024-03-10T09:45:00.000Z',
    chainId: '1284', // Moonbeam
    chainType: SBTChainType.MOONBEAM,
    contractAddress: '0x3456789012345678901234567890123456789012',
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    tokenUri: 'ipfs://QmZ345678901234567890123456789012345678901234567890123456789012',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    attributes: mockCommunityAttributes,
    revocable: false,
    collectionId: 'community-collection-1',
    rarityScore: 78,
    tags: ['community', 'open-source', 'contributor', 'github'],
  },
  {
    id: '4',
    name: 'DeFi Protocol User',
    description: 'Active user of decentralized finance protocols with verified transactions',
    image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=400&h=400&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z3',
    issuerName: 'DeFi Alliance',
    issuedAt: '2024-01-05T16:20:00.000Z',
    chainId: '1', // Ethereum Mainnet
    chainType: SBTChainType.ETHEREUM,
    contractAddress: '0x4567890123456789012345678901234567890123',
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    tokenUri: 'ipfs://QmA456789012345678901234567890123456789012345678901234567890123',
    verificationStatus: SBTVerificationStatus.PENDING,
    attributes: [
      {
        trait_type: 'Protocol Usage',
        value: 'High',
      },
      {
        trait_type: 'Total Volume',
        value: 50000,
        display_type: 'number',
      },
      {
        trait_type: 'Active Since',
        value: '2023-06-01',
      },
    ],
    revocable: true,
    collectionId: 'defi-collection-1',
    rarityScore: 88,
    tags: ['defi', 'protocol', 'user', 'ethereum'],
  },
  {
    id: '5',
    name: 'Polkadot Ecosystem Builder',
    description: 'Recognized builder and contributor to the Polkadot ecosystem',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z4',
    issuerName: 'Polkadot Foundation',
    issuedAt: '2024-02-28T11:00:00.000Z',
    chainId: '0', // Polkadot
    chainType: SBTChainType.POLKADOT,
    contractAddress: '0x5678901234567890123456789012345678901234',
    tokenStandard: SBTTokenStandard.POLKADOT_NFT,
    tokenUri: 'ipfs://QmB567890123456789012345678901234567890123456789012345678901234',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    attributes: [
      {
        trait_type: 'Builder Level',
        value: 'Senior',
      },
      {
        trait_type: 'Projects Built',
        value: 3,
        display_type: 'number',
      },
      {
        trait_type: 'Ecosystem Impact',
        value: 'High',
      },
      {
        trait_type: 'Recognition Date',
        value: '2024-02-28',
      },
    ],
    revocable: false,
    collectionId: 'polkadot-collection-1',
    rarityScore: 95,
    tags: ['polkadot', 'ecosystem', 'builder', 'foundation'],
  },
];

/**
 * Mock SBT collections for demonstration
 */
export const mockSBTCollections: SBTCollection[] = [
  {
    id: 'education-collection-1',
    name: 'KeyPass University Credentials',
    description: 'Official academic credentials and achievements from KeyPass University',
    image: 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=400&h=400&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9e1?w=1200&h=300&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z0',
    issuerName: 'KeyPass University',
    contractAddress: '0x1234567890123456789012345678901234567890',
    chainId: '1284',
    chainType: SBTChainType.MOONBEAM,
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    totalSupply: 1500,
    uniqueHolders: 1200,
    createdAt: '2024-01-01T00:00:00.000Z',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    tags: ['education', 'university', 'academic', 'credentials'],
    website: 'https://keypass.university',
    socialLinks: {
      twitter: 'https://twitter.com/keypassuniversity',
      discord: 'https://discord.gg/keypassuniversity',
    },
    tokens: [mockSBTTokens[0]],
  },
  {
    id: 'professional-collection-1',
    name: 'Web3 Foundation Certifications',
    description: 'Professional certifications and achievements in Web3 development',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=400&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=300&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z1',
    issuerName: 'Web3 Foundation',
    contractAddress: '0x2345678901234567890123456789012345678901',
    chainId: '1',
    chainType: SBTChainType.ETHEREUM,
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    totalSupply: 500,
    uniqueHolders: 450,
    createdAt: '2024-01-01T00:00:00.000Z',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    tags: ['professional', 'certification', 'web3', 'development'],
    website: 'https://web3.foundation',
    socialLinks: {
      twitter: 'https://twitter.com/web3foundation',
      github: 'https://github.com/web3foundation',
    },
    tokens: [mockSBTTokens[1]],
  },
  {
    id: 'community-collection-1',
    name: 'Open Source Contributors',
    description: 'Recognition badges for active contributors to open source projects',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop',
    bannerImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=300&fit=crop',
    issuer: 'did:key:zQ3sharFd1Kvci3mJ9Pk1pDqjRt4y2Q8X9L2M4N6P8R0T2V4W6Y8Z0A2B4C6D8E0F2G4H6I8J0K2L4M6N8P0Q2R4S6T8U0V2W4X6Y8Z2',
    issuerName: 'GitHub DAO',
    contractAddress: '0x3456789012345678901234567890123456789012',
    chainId: '1284',
    chainType: SBTChainType.MOONBEAM,
    tokenStandard: SBTTokenStandard.ERC721_SOULBOUND,
    totalSupply: 2000,
    uniqueHolders: 1800,
    createdAt: '2024-01-01T00:00:00.000Z',
    verificationStatus: SBTVerificationStatus.VERIFIED,
    tags: ['community', 'open-source', 'contributor', 'github'],
    website: 'https://github.com',
    socialLinks: {
      twitter: 'https://twitter.com/github',
      discord: 'https://discord.gg/github',
    },
    tokens: [mockSBTTokens[2]],
  },
];

/**
 * Helper function to get mock SBT tokens by address
 */
export function getMockSBTTokensByAddress(address: string): SBTToken[] {
  // In a real implementation, this would query the blockchain
  // For demo purposes, return all tokens
  return mockSBTTokens;
}

/**
 * Helper function to get mock SBT collections by address
 */
export function getMockSBTCollectionsByAddress(address: string): SBTCollection[] {
  // In a real implementation, this would query the blockchain
  // For demo purposes, return all collections
  return mockSBTCollections;
}

/**
 * Helper function to get mock SBT token by ID
 */
export function getMockSBTTokenById(tokenId: string): SBTToken | undefined {
  return mockSBTTokens.find(token => token.id === tokenId);
}

/**
 * Helper function to get mock SBT collection by ID
 */
export function getMockSBTCollectionById(collectionId: string): SBTCollection | undefined {
  return mockSBTCollections.find(collection => collection.id === collectionId);
} 