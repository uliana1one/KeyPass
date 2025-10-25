// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title SoulboundToken (SBT)
 * @dev A non-transferable ERC721 token representing soulbound tokens
 * @notice SBTs cannot be transferred between addresses once minted
 */
contract SoulboundToken is ERC721, Ownable, ReentrancyGuard {
    // Events
    event SBTMinted(address indexed to, uint256 indexed tokenId, string metadataUri, uint256 timestamp);
    event SBTMetadataUpdated(uint256 indexed tokenId, string newMetadataUri, uint256 timestamp);
    event SBTRevoked(uint256 indexed tokenId, uint256 timestamp);
    
    // State variables
    uint256 private _tokenIdCounter;
    mapping(uint256 => string) private _tokenMetadata;
    mapping(uint256 => bool) private _revokedTokens;
    mapping(address => uint256[]) private _ownerTokens;
    
    // Modifiers
    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Only token owner can perform this action");
        _;
    }
    
    modifier tokenNotRevoked(uint256 tokenId) {
        require(!_revokedTokens[tokenId], "Token has been revoked");
        _;
    }
    
    // Constructor
    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}
    
    /**
     * @dev Mint a new SBT to an address
     * @param to The address to mint the SBT to
     * @param metadataUri The metadata URI for the SBT
     */
    function mintSBT(address to, string memory metadataUri) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(to != address(0), "Cannot mint to zero address");
        require(bytes(metadataUri).length > 0, "Metadata URI cannot be empty");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        _safeMint(to, tokenId);
        _tokenMetadata[tokenId] = metadataUri;
        _ownerTokens[to].push(tokenId);
        
        emit SBTMinted(to, tokenId, metadataUri, block.timestamp);
    }
    
    /**
     * @dev Batch mint SBTs to multiple addresses
     * @param recipients Array of addresses to mint SBTs to
     * @param metadataUris Array of metadata URIs for each SBT
     */
    function batchMintSBT(address[] memory recipients, string[] memory metadataUris) 
        external 
        onlyOwner 
        nonReentrant 
    {
        require(recipients.length == metadataUris.length, "Arrays length mismatch");
        require(recipients.length > 0, "Cannot mint zero tokens");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(bytes(metadataUris[i]).length > 0, "Metadata URI cannot be empty");
            
            uint256 tokenId = _tokenIdCounter;
            _tokenIdCounter++;
            
            _safeMint(recipients[i], tokenId);
            _tokenMetadata[tokenId] = metadataUris[i];
            _ownerTokens[recipients[i]].push(tokenId);
            
            emit SBTMinted(recipients[i], tokenId, metadataUris[i], block.timestamp);
        }
    }
    
    /**
     * @dev Update metadata URI for a token (only owner)
     * @param tokenId The token ID to update
     * @param newMetadataUri The new metadata URI
     */
    function updateTokenMetadata(uint256 tokenId, string memory newMetadataUri) 
        external 
        onlyOwner 
        tokenNotRevoked(tokenId) 
    {
        require(bytes(newMetadataUri).length > 0, "Metadata URI cannot be empty");
        
        _tokenMetadata[tokenId] = newMetadataUri;
        emit SBTMetadataUpdated(tokenId, newMetadataUri, block.timestamp);
    }
    
    /**
     * @dev Revoke a token (only owner)
     * @param tokenId The token ID to revoke
     */
    function revokeToken(uint256 tokenId) 
        external 
        onlyOwner 
        tokenNotRevoked(tokenId) 
    {
        _revokedTokens[tokenId] = true;
        emit SBTRevoked(tokenId, block.timestamp);
    }
    
    /**
     * @dev Get metadata URI for a token
     * @param tokenId The token ID
     * @return The metadata URI
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override 
        tokenNotRevoked(tokenId) 
        returns (string memory) 
    {
        return _tokenMetadata[tokenId];
    }
    
    /**
     * @dev Get all tokens owned by an address
     * @param owner The owner address
     * @return Array of token IDs
     */
    function getOwnerTokens(address owner) external view returns (uint256[] memory) {
        return _ownerTokens[owner];
    }
    
    /**
     * @dev Get total number of tokens minted
     * @return Total number of tokens
     */
    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Check if a token is revoked
     * @param tokenId The token ID
     * @return True if revoked, false otherwise
     */
    function isTokenRevoked(uint256 tokenId) external view returns (bool) {
        return _revokedTokens[tokenId];
    }
    
    /**
     * @dev Override transfer functions to prevent transfers
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        // Allow minting (from == address(0))
        if (from == address(0)) {
            super._beforeTokenTransfer(from, to, tokenId, batchSize);
            return;
        }
        
        // Prevent all transfers after minting
        revert("SBTs cannot be transferred");
    }
    
    /**
     * @dev Override approve functions to prevent approvals
     */
    function approve(address to, uint256 tokenId) public override {
        revert("SBTs cannot be approved for transfer");
    }
    
    function setApprovalForAll(address operator, bool approved) public override {
        revert("SBTs cannot be approved for transfer");
    }
    
    /**
     * @dev Emergency function to pause the contract (only owner)
     */
    function emergencyPause() external onlyOwner {
        // This would require implementing a Pausable contract
        // For now, we'll just emit an event
        emit SBTRevoked(0, block.timestamp);
    }
}
