# SBT Contracts

This directory contains Solidity smart contracts for Soulbound Tokens (SBTs) on Moonbeam networks.

## Files

### `SBTSimple.sol`
Main SBT contract implementation with ERC-721 compatibility and soulbound functionality.

### `SBTContract.ts`
TypeScript interface for interacting with SBT contracts.

### `SBTContractFactory.ts`
Factory for deploying and managing SBT contracts.

### `artifacts/`
Compiled contract artifacts, deployment configurations, and verification data.

## SBTSimple Contract

### Features

#### ERC-721 Compatibility
- Full ERC-721 standard implementation
- ERC721Enumerable for token enumeration
- ERC721URIStorage for individual token URIs
- Metadata support with base URI and individual URIs

#### Soulbound Functionality
- **Non-transferable tokens**: Prevents all token transfers
- **Mint and burn only**: Tokens can only be created or destroyed
- **Revocation system**: Tokens can be marked as invalid
- **Emergency recovery**: Contract owner can recover accidentally sent tokens

#### Access Control
- **Owner role**: Full contract control
- **Minter role**: Can mint new tokens
- **Burner role**: Can burn tokens
- **Token owner**: Can burn their own tokens

#### Advanced Features
- **Batch minting**: Mint multiple tokens in one transaction
- **Max supply control**: Optional maximum token supply
- **Token enumeration**: Query tokens by owner
- **Revocation tracking**: Track and manage revoked tokens
- **Reentrancy protection**: Prevents reentrancy attacks

### Contract Functions

#### Core Functions
```solidity
// Mint a new token with URI
function mint(address to, string memory tokenURI) returns (uint256)

// Mint a new token without URI (uses base URI)
function safeMint(address to) returns (uint256)

// Burn a token
function burn(uint256 tokenId)

// Batch mint multiple tokens
function batchMint(address to, string[] memory tokenURIs) returns (uint256[])
```

#### Access Control
```solidity
// Add/remove minters
function addMinter(address account)
function removeMinter(address account)

// Add/remove burners
function addBurner(address account)
function removeBurner(address account)

// Check roles
function isMinter(address account) returns (bool)
function isBurner(address account) returns (bool)
```

#### Token Management
```solidity
// Revoke/unrevoke tokens
function revoke(uint256 tokenId)
function unrevoke(uint256 tokenId)
function isRevoked(uint256 tokenId) returns (bool)

// Query tokens
function tokensOfOwner(address owner) returns (uint256[])
function validTokensOfOwner(address owner) returns (uint256[])
function totalSupply() returns (uint256)
```

#### Configuration
```solidity
// Set base URI
function setBaseURI(string memory newBaseURI)

// Set maximum supply
function setMaxSupply(uint256 newMaxSupply)

// Get contract info
function getContractInfo() returns (string, string, uint256, uint256, string)
```

### Constructor Parameters

```solidity
constructor(
    string memory name,        // Token name (e.g., "KeyPass SBT")
    string memory symbol,      // Token symbol (e.g., "KPASS")
    string memory baseURI      // Base URI for metadata (e.g., "https://api.keypass.com/metadata/")
)
```

### Events

```solidity
event TokenMinted(address indexed to, uint256 indexed tokenId, string tokenURI);
event TokenBurned(uint256 indexed tokenId);
event TokenRevoked(uint256 indexed tokenId);
event TokenUnrevoked(uint256 indexed tokenId);
event MinterAdded(address indexed account);
event MinterRemoved(address indexed account);
event BurnerAdded(address indexed account);
event BurnerRemoved(address indexed account);
event BaseURIUpdated(string newBaseURI);
event MaxSupplyUpdated(uint256 newMaxSupply);
```

### Security Features

#### Soulbound Protection
- **Transfer prevention**: Overrides `_beforeTokenTransfer` to block transfers
- **Mint/burn only**: Only allows creation and destruction of tokens
- **Owner validation**: Ensures tokens can only be minted to valid addresses

#### Access Control
- **Role-based permissions**: Separate roles for minting and burning
- **Owner privileges**: Contract owner has all permissions
- **Token owner rights**: Token owners can burn their own tokens

#### Reentrancy Protection
- **NonReentrant modifier**: Prevents reentrancy attacks on state-changing functions
- **Safe external calls**: Uses OpenZeppelin's ReentrancyGuard

#### Input Validation
- **Zero address checks**: Prevents minting to zero address
- **Token existence checks**: Validates token IDs before operations
- **URI validation**: Ensures token URIs are not empty
- **Supply limits**: Enforces maximum supply constraints

### Usage Examples

#### Deployment
```solidity
// Deploy with constructor parameters
SBTSimple sbt = new SBTSimple(
    "KeyPass SBT",                    // name
    "KPASS",                          // symbol
    "https://api.keypass.com/metadata/" // baseURI
);
```

#### Minting Tokens
```solidity
// Mint with specific URI
uint256 tokenId = sbt.mint(
    userAddress,
    "https://api.keypass.com/metadata/1"
);

// Mint with base URI
uint256 tokenId2 = sbt.safeMint(userAddress);

// Batch mint
string[] memory uris = [
    "https://api.keypass.com/metadata/1",
    "https://api.keypass.com/metadata/2",
    "https://api.keypass.com/metadata/3"
];
uint256[] memory tokenIds = sbt.batchMint(userAddress, uris);
```

#### Token Management
```solidity
// Check token ownership
address owner = sbt.ownerOf(tokenId);

// Get token URI
string memory uri = sbt.tokenURI(tokenId);

// Get all tokens owned by user
uint256[] memory userTokens = sbt.tokensOfOwner(userAddress);

// Get valid (non-revoked) tokens
uint256[] memory validTokens = sbt.validTokensOfOwner(userAddress);
```

#### Access Control
```solidity
// Add minter
sbt.addMinter(minterAddress);

// Remove minter
sbt.removeMinter(minterAddress);

// Check if address is minter
bool canMint = sbt.isMinter(address);

// Add burner
sbt.addBurner(burnerAddress);
```

#### Token Operations
```solidity
// Burn token (by owner or burner)
sbt.burn(tokenId);

// Revoke token (by owner only)
sbt.revoke(tokenId);

// Unrevoke token
sbt.unrevoke(tokenId);

// Check if token is revoked
bool revoked = sbt.isRevoked(tokenId);
```

### Gas Estimates

Based on typical usage patterns:

#### Deployment
- **Estimated Gas**: ~1,800,000 gas
- **Cost (Moonbase)**: ~0.0018 DEV
- **Cost (Moonbeam)**: ~0.0018 GLMR

#### Operations
- **Mint (with URI)**: ~80,000 gas
- **Mint (without URI)**: ~75,000 gas
- **Batch Mint (3 tokens)**: ~200,000 gas
- **Burn**: ~45,000 gas
- **Revoke**: ~30,000 gas
- **Add/Remove Minter**: ~50,000 gas

### Network Compatibility

#### Moonbeam Networks
- **Moonbase Alpha**: Testnet deployment
- **Moonbeam**: Mainnet deployment
- **Moonriver**: Mainnet deployment

#### EVM Compatibility
- **Solidity Version**: ^0.8.19
- **OpenZeppelin**: Latest compatible version
- **Gas Optimization**: Enabled with 200 runs

### Integration

#### With TypeScript Services
```typescript
import { SBTContract } from './SBTContract.js';
import { SBTMintingService } from '../services/SBTMintingService.js';

// Create contract instance
const contract = new SBTContract(contractAddress, adapter, signer);

// Mint token
const result = await contract.mint(userAddress, tokenURI);

// Use minting service
const mintingService = new SBTMintingService(adapter);
const mintResult = await mintingService.mintSBT(contractAddress, {
  to: userAddress,
  metadata: { name: "Test SBT", description: "A test token" }
}, signer);
```

#### With Deployment Script
```bash
# Deploy contract
export PRIVATE_KEY="0x1234567890abcdef..."
node scripts/deploySBT.js

# Verify deployment
npx hardhat verify --network moonbase-alpha <contract_address> "KeyPass SBT" "KPASS" "https://api.keypass.com/metadata/"
```

### Testing

#### Unit Tests
```bash
# Run contract tests
npm test -- --testPathPattern=SBTContract

# Run with coverage
npm test -- --coverage --testPathPattern=SBTContract
```

#### Manual Testing
```bash
# Deploy to testnet
export NETWORK=moonbase-alpha
export PRIVATE_KEY="0x1234567890abcdef..."
node scripts/deploySBT.js

# Interact with deployed contract
npx hardhat console --network moonbase-alpha
```

### Security Considerations

#### Best Practices
- **Test thoroughly** on testnet before mainnet deployment
- **Verify contracts** on block explorer after deployment
- **Monitor gas prices** for cost optimization
- **Use multisig** for owner operations in production
- **Regular audits** of contract code and dependencies

#### Known Limitations
- **No transfer functionality** by design (soulbound)
- **Owner has significant power** (can revoke tokens)
- **Batch operations** have gas limits
- **URI validation** is basic (length check only)

### Upgrade Path

#### Current Version: v1.0.0
- Basic SBT functionality
- ERC-721 compatibility
- Access control system
- Revocation mechanism

#### Future Versions
- **v1.1.0**: Enhanced metadata support
- **v1.2.0**: Batch operations optimization
- **v2.0.0**: Upgradeable contract pattern

### Support

For issues with the SBT contract:

1. Check the troubleshooting section
2. Review the gas estimates
3. Verify network compatibility
4. Test on testnet first
5. Check OpenZeppelin documentation

### License

MIT License - see LICENSE file for details.
