// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title DIDRegistry
 * @dev A smart contract for managing Decentralized Identifiers (DIDs) on Moonbeam
 * @notice This contract allows users to register, update, and deactivate DIDs
 */
contract DIDRegistry {
    // Events
    event DIDRegistered(address indexed owner, string indexed did, string didDocument, uint256 timestamp);
    event DIDUpdated(address indexed owner, string indexed did, string newDidDocument, uint256 timestamp);
    event DIDDeactivated(address indexed owner, string indexed did, uint256 timestamp);
    
    // Structs
    struct DIDRecord {
        address owner;
        string did;
        string didDocument;
        bool isActive;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // State variables
    mapping(string => DIDRecord) public didRecords;
    mapping(address => string[]) public ownerDIDs;
    mapping(string => bool) public registeredDIDs;
    
    address public owner;
    uint256 public totalDIDs;
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this function");
        _;
    }
    
    modifier onlyDIDOwner(string memory did) {
        require(didRecords[did].owner == msg.sender, "Only DID owner can perform this action");
        _;
    }
    
    modifier didExists(string memory did) {
        require(registeredDIDs[did], "DID does not exist");
        _;
    }
    
    modifier didNotExists(string memory did) {
        require(!registeredDIDs[did], "DID already exists");
        _;
    }
    
    // Constructor
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Register a new DID
     * @param did The DID to register
     * @param didDocument The DID document JSON string
     */
    function registerDID(string memory did, string memory didDocument) 
        external 
        didNotExists(did) 
    {
        require(bytes(did).length > 0, "DID cannot be empty");
        require(bytes(didDocument).length > 0, "DID document cannot be empty");
        
        DIDRecord memory newRecord = DIDRecord({
            owner: msg.sender,
            did: did,
            didDocument: didDocument,
            isActive: true,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        didRecords[did] = newRecord;
        ownerDIDs[msg.sender].push(did);
        registeredDIDs[did] = true;
        totalDIDs++;
        
        emit DIDRegistered(msg.sender, did, didDocument, block.timestamp);
    }
    
    /**
     * @dev Update an existing DID document
     * @param did The DID to update
     * @param newDidDocument The new DID document JSON string
     */
    function updateDID(string memory did, string memory newDidDocument) 
        external 
        didExists(did) 
        onlyDIDOwner(did) 
    {
        require(bytes(newDidDocument).length > 0, "DID document cannot be empty");
        require(didRecords[did].isActive, "Cannot update deactivated DID");
        
        didRecords[did].didDocument = newDidDocument;
        didRecords[did].updatedAt = block.timestamp;
        
        emit DIDUpdated(msg.sender, did, newDidDocument, block.timestamp);
    }
    
    /**
     * @dev Deactivate a DID
     * @param did The DID to deactivate
     */
    function deactivateDID(string memory did) 
        external 
        didExists(did) 
        onlyDIDOwner(did) 
    {
        require(didRecords[did].isActive, "DID is already deactivated");
        
        didRecords[did].isActive = false;
        didRecords[did].updatedAt = block.timestamp;
        
        emit DIDDeactivated(msg.sender, did, block.timestamp);
    }
    
    /**
     * @dev Get DID information
     * @param did The DID to query
     * @return owner The DID owner address
     * @return didDocument The DID document
     * @return isActive Whether the DID is active
     * @return createdAt Creation timestamp
     * @return updatedAt Last update timestamp
     */
    function getDID(string memory did) 
        external 
        view 
        didExists(did) 
        returns (
            address owner,
            string memory didDocument,
            bool isActive,
            uint256 createdAt,
            uint256 updatedAt
        ) 
    {
        DIDRecord memory record = didRecords[did];
        return (
            record.owner,
            record.didDocument,
            record.isActive,
            record.createdAt,
            record.updatedAt
        );
    }
    
    /**
     * @dev Check if a DID exists and is active
     * @param did The DID to check
     * @return exists Whether the DID exists
     * @return isActive Whether the DID is active
     */
    function checkDID(string memory did) external view returns (bool exists, bool isActive) {
        exists = registeredDIDs[did];
        if (exists) {
            isActive = didRecords[did].isActive;
        }
    }
    
    /**
     * @dev Get all DIDs owned by an address
     * @param ownerAddress The owner address
     * @return dids Array of DIDs owned by the address
     */
    function getOwnerDIDs(address ownerAddress) external view returns (string[] memory dids) {
        return ownerDIDs[ownerAddress];
    }
    
    /**
     * @dev Get total number of registered DIDs
     * @return count Total number of DIDs
     */
    function getTotalDIDs() external view returns (uint256 count) {
        return totalDIDs;
    }
    
    /**
     * @dev Emergency function to pause the contract (only owner)
     */
    function emergencyPause() external onlyOwner {
        // This would require implementing a Pausable contract
        // For now, we'll just emit an event
        emit DIDDeactivated(address(0), "EMERGENCY_PAUSE", block.timestamp);
    }
}
