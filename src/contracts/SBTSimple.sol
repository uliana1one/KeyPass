// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title SBTSimple
 * @dev Soulbound Token (SBT) implementation based on ERC-721
 * 
 * This contract implements a Soulbound Token that:
 * - Extends ERC-721 with soulbound functionality (non-transferable)
 * - Supports minting and burning operations
 * - Includes metadata URI support
 * - Implements proper access control
 * - Prevents token transfers (soulbound behavior)
 * 
 * @author KeyPass Team
 * @notice This contract is designed for Moonbeam network deployment
 */
contract SBTSimple is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    using Strings for uint256;

    // Token ID counter
    Counters.Counter private _tokenIdCounter;

    // Base URI for token metadata
    string private _baseTokenURI;

    // Maximum supply (0 = unlimited)
    uint256 public maxSupply;

    // Token URI mapping for individual tokens
    mapping(uint256 => string) private _tokenURIs;

    // Revoked tokens mapping
    mapping(uint256 => bool) private _revokedTokens;

    // Minter role mapping
    mapping(address => bool) private _minters;

    // Burner role mapping
    mapping(address => bool) private _burners;

    // Events
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

    // Modifiers
    modifier onlyMinter() {
        require(_minters[msg.sender] || msg.sender == owner(), "SBTSimple: caller is not a minter");
        _;
    }

    modifier onlyBurner() {
        require(_burners[msg.sender] || msg.sender == owner(), "SBTSimple: caller is not a burner");
        _;
    }

    modifier tokenExists(uint256 tokenId) {
        require(_exists(tokenId), "SBTSimple: token does not exist");
        _;
    }

    modifier notRevoked(uint256 tokenId) {
        require(!_revokedTokens[tokenId], "SBTSimple: token is revoked");
        _;
    }

    modifier validTokenURI(string memory tokenURI) {
        require(bytes(tokenURI).length > 0, "SBTSimple: token URI cannot be empty");
        _;
    }

    /**
     * @dev Constructor function
     * @param name Token name
     * @param symbol Token symbol
     * @param baseURI Base URI for token metadata
     */
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) {
        _baseTokenURI = baseURI;
        maxSupply = 0; // Unlimited by default
        
        // Owner is automatically a minter and burner
        _minters[msg.sender] = true;
        _burners[msg.sender] = true;
        
        emit MinterAdded(msg.sender);
        emit BurnerAdded(msg.sender);
    }

    /**
     * @dev Mint a new SBT token
     * @param to Address to mint the token to
     * @param tokenURI URI for the token metadata
     * @return tokenId The ID of the minted token
     */
    function mint(address to, string memory tokenURI) 
        public 
        onlyMinter 
        nonReentrant 
        validTokenURI(tokenURI)
        returns (uint256) 
    {
        require(to != address(0), "SBTSimple: mint to the zero address");
        require(to != address(this), "SBTSimple: mint to contract address");
        
        // Check max supply
        if (maxSupply > 0) {
            require(totalSupply() < maxSupply, "SBTSimple: max supply exceeded");
        }

        // Increment token ID counter
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Mint the token
        _safeMint(to, tokenId);
        
        // Set token URI
        _setTokenURI(tokenId, tokenURI);

        emit TokenMinted(to, tokenId, tokenURI);
        
        return tokenId;
    }

    /**
     * @dev Mint a new SBT token without URI (uses base URI)
     * @param to Address to mint the token to
     * @return tokenId The ID of the minted token
     */
    function safeMint(address to) 
        public 
        onlyMinter 
        nonReentrant 
        returns (uint256) 
    {
        require(to != address(0), "SBTSimple: mint to the zero address");
        require(to != address(this), "SBTSimple: mint to contract address");
        
        // Check max supply
        if (maxSupply > 0) {
            require(totalSupply() < maxSupply, "SBTSimple: max supply exceeded");
        }

        // Increment token ID counter
        _tokenIdCounter.increment();
        uint256 tokenId = _tokenIdCounter.current();

        // Mint the token
        _safeMint(to, tokenId);

        emit TokenMinted(to, tokenId, "");
        
        return tokenId;
    }

    /**
     * @dev Burn a token
     * @param tokenId ID of the token to burn
     */
    function burn(uint256 tokenId) 
        public 
        tokenExists(tokenId)
        nonReentrant 
    {
        address tokenOwner = ownerOf(tokenId);
        
        // Only owner, burner, or token owner can burn
        require(
            msg.sender == tokenOwner || 
            _burners[msg.sender] || 
            msg.sender == owner(),
            "SBTSimple: caller is not authorized to burn this token"
        );

        // Burn the token
        _burn(tokenId);
        
        // Clear token URI
        delete _tokenURIs[tokenId];
        
        // Clear revoked status
        delete _revokedTokens[tokenId];

        emit TokenBurned(tokenId);
    }

    /**
     * @dev Revoke a token (mark as invalid)
     * @param tokenId ID of the token to revoke
     */
    function revoke(uint256 tokenId) 
        public 
        onlyOwner 
        tokenExists(tokenId)
        notRevoked(tokenId)
    {
        _revokedTokens[tokenId] = true;
        emit TokenRevoked(tokenId);
    }

    /**
     * @dev Unrevoke a token (mark as valid again)
     * @param tokenId ID of the token to unrevoke
     */
    function unrevoke(uint256 tokenId) 
        public 
        onlyOwner 
        tokenExists(tokenId)
    {
        require(_revokedTokens[tokenId], "SBTSimple: token is not revoked");
        delete _revokedTokens[tokenId];
        emit TokenUnrevoked(tokenId);
    }

    /**
     * @dev Check if a token is revoked
     * @param tokenId ID of the token to check
     * @return isRevoked True if the token is revoked
     */
    function isRevoked(uint256 tokenId) 
        public 
        view 
        tokenExists(tokenId)
        returns (bool) 
    {
        return _revokedTokens[tokenId];
    }

    /**
     * @dev Add a minter address
     * @param account Address to add as minter
     */
    function addMinter(address account) public onlyOwner {
        require(account != address(0), "SBTSimple: minter is the zero address");
        require(!_minters[account], "SBTSimple: account is already a minter");
        
        _minters[account] = true;
        emit MinterAdded(account);
    }

    /**
     * @dev Remove a minter address
     * @param account Address to remove as minter
     */
    function removeMinter(address account) public onlyOwner {
        require(_minters[account], "SBTSimple: account is not a minter");
        require(account != owner(), "SBTSimple: owner cannot be removed as minter");
        
        delete _minters[account];
        emit MinterRemoved(account);
    }

    /**
     * @dev Add a burner address
     * @param account Address to add as burner
     */
    function addBurner(address account) public onlyOwner {
        require(account != address(0), "SBTSimple: burner is the zero address");
        require(!_burners[account], "SBTSimple: account is already a burner");
        
        _burners[account] = true;
        emit BurnerAdded(account);
    }

    /**
     * @dev Remove a burner address
     * @param account Address to remove as burner
     */
    function removeBurner(address account) public onlyOwner {
        require(_burners[account], "SBTSimple: account is not a burner");
        require(account != owner(), "SBTSimple: owner cannot be removed as burner");
        
        delete _burners[account];
        emit BurnerRemoved(account);
    }

    /**
     * @dev Check if an address is a minter
     * @param account Address to check
     * @return isMinter True if the address is a minter
     */
    function isMinter(address account) public view returns (bool) {
        return _minters[account] || account == owner();
    }

    /**
     * @dev Check if an address is a burner
     * @param account Address to check
     * @return isBurner True if the address is a burner
     */
    function isBurner(address account) public view returns (bool) {
        return _burners[account] || account == owner();
    }

    /**
     * @dev Set the base URI for all tokens
     * @param newBaseURI New base URI
     */
    function setBaseURI(string memory newBaseURI) public onlyOwner {
        _baseTokenURI = newBaseURI;
        emit BaseURIUpdated(newBaseURI);
    }

    /**
     * @dev Set the maximum supply
     * @param newMaxSupply New maximum supply (0 = unlimited)
     */
    function setMaxSupply(uint256 newMaxSupply) public onlyOwner {
        require(newMaxSupply == 0 || newMaxSupply >= totalSupply(), "SBTSimple: max supply cannot be less than current supply");
        maxSupply = newMaxSupply;
        emit MaxSupplyUpdated(newMaxSupply);
    }

    /**
     * @dev Get the base URI
     * @return Base URI string
     */
    function baseURI() public view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Get the total supply
     * @return Total number of tokens minted
     */
    function totalSupply() public view override returns (uint256) {
        return _tokenIdCounter.current();
    }

    /**
     * @dev Get all tokens owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs owned by the address
     */
    function tokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](tokenCount);
        
        for (uint256 i = 0; i < tokenCount; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }
        
        return tokenIds;
    }

    /**
     * @dev Get all tokens owned by an address (excluding revoked tokens)
     * @param owner Address to query
     * @return tokenIds Array of valid token IDs owned by the address
     */
    function validTokensOfOwner(address owner) public view returns (uint256[] memory) {
        uint256 tokenCount = balanceOf(owner);
        uint256[] memory tempTokenIds = new uint256[](tokenCount);
        uint256 validCount = 0;
        
        for (uint256 i = 0; i < tokenCount; i++) {
            uint256 tokenId = tokenOfOwnerByIndex(owner, i);
            if (!_revokedTokens[tokenId]) {
                tempTokenIds[validCount] = tokenId;
                validCount++;
            }
        }
        
        uint256[] memory tokenIds = new uint256[](validCount);
        for (uint256 i = 0; i < validCount; i++) {
            tokenIds[i] = tempTokenIds[i];
        }
        
        return tokenIds;
    }

    // Override required functions from multiple inheritance

    /**
     * @dev Override _baseURI to return the base token URI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override tokenURI to return the specific token URI or base URI + token ID
     */
    function tokenURI(uint256 tokenId) 
        public 
        view 
        override(ERC721, ERC721URIStorage) 
        tokenExists(tokenId)
        returns (string memory) 
    {
        string memory _tokenURI = _tokenURIs[tokenId];
        
        // If there is a specific token URI, return it
        if (bytes(_tokenURI).length > 0) {
            return _tokenURI;
        }
        
        // Otherwise, return base URI + token ID
        string memory base = _baseURI();
        if (bytes(base).length > 0) {
            return string(abi.encodePacked(base, tokenId.toString()));
        }
        
        return "";
    }

    /**
     * @dev Override _setTokenURI to store token URI
     */
    function _setTokenURI(uint256 tokenId, string memory _tokenURI) 
        internal 
        override(ERC721URIStorage) 
    {
        require(_exists(tokenId), "SBTSimple: URI set of nonexistent token");
        _tokenURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev Override _beforeTokenTransfer to prevent transfers (soulbound behavior)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) {
        // Allow minting (from == address(0)) and burning (to == address(0))
        require(
            from == address(0) || to == address(0),
            "SBTSimple: transfers not allowed (soulbound token)"
        );
        
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    /**
     * @dev Override _burn to handle token burning
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     * @dev Override supportsInterface to handle multiple inheritance
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Emergency function to recover accidentally sent tokens
     * @param tokenId ID of the token to recover
     */
    function emergencyRecover(uint256 tokenId) public onlyOwner tokenExists(tokenId) {
        address tokenOwner = ownerOf(tokenId);
        require(tokenOwner == address(this), "SBTSimple: token is not owned by contract");
        
        // Transfer to owner
        _transfer(address(this), owner(), tokenId);
    }

    /**
     * @dev Batch mint multiple tokens
     * @param to Address to mint tokens to
     * @param tokenURIs Array of URIs for each token
     * @return tokenIds Array of minted token IDs
     */
    function batchMint(address to, string[] memory tokenURIs) 
        public 
        onlyMinter 
        nonReentrant 
        returns (uint256[] memory) 
    {
        require(to != address(0), "SBTSimple: mint to the zero address");
        require(to != address(this), "SBTSimple: mint to contract address");
        require(tokenURIs.length > 0, "SBTSimple: token URIs array cannot be empty");
        require(tokenURIs.length <= 100, "SBTSimple: batch size too large");
        
        // Check max supply
        if (maxSupply > 0) {
            require(totalSupply() + tokenURIs.length <= maxSupply, "SBTSimple: max supply exceeded");
        }

        uint256[] memory tokenIds = new uint256[](tokenURIs.length);
        
        for (uint256 i = 0; i < tokenURIs.length; i++) {
            require(bytes(tokenURIs[i]).length > 0, "SBTSimple: token URI cannot be empty");
            
            _tokenIdCounter.increment();
            uint256 tokenId = _tokenIdCounter.current();
            
            _safeMint(to, tokenId);
            _setTokenURI(tokenId, tokenURIs[i]);
            
            tokenIds[i] = tokenId;
            emit TokenMinted(to, tokenId, tokenURIs[i]);
        }
        
        return tokenIds;
    }

    /**
     * @dev Get contract information
     * @return name Token name
     * @return symbol Token symbol
     * @return totalSupply Total number of tokens minted
     * @return maxSupply Maximum supply (0 = unlimited)
     * @return baseURI Base URI for metadata
     */
    function getContractInfo() public view returns (
        string memory,
        string memory,
        uint256,
        uint256,
        string memory
    ) {
        return (
            name(),
            symbol(),
            totalSupply(),
            maxSupply,
            _baseTokenURI
        );
    }
}
