// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title MoonbeamDIDContract
 * @dev Smart contract for managing Decentralized Identifiers (DIDs) on Moonbeam
 * @notice Implements W3C DID standard for Moonbeam blockchain
 */
contract MoonbeamDIDContract is Ownable {
    using Counters for Counters.Counter;

    // DID Document structure
    struct DIDDocument {
        string did;                    // DID identifier (e.g., "did:moonbeam:0x...")
        string context;               // JSON-LD context
        string[] verificationMethods; // Array of verification method IDs
        string[] serviceEndpoints;    // Array of service endpoint IDs
        uint256 createdAt;           // Block timestamp when created
        uint256 updatedAt;           // Block timestamp when last updated
        bool active;                 // Whether the DID is active
    }

    // Verification Method structure
    struct VerificationMethod {
        string id;                   // Verification method ID
        string type;                 // Type of verification method
        string controller;          // DID controller
        string publicKeyMultibase;   // Public key in multibase format
        bool active;                 // Whether the verification method is active
    }

    // Service Endpoint structure
    struct ServiceEndpoint {
        string id;                   // Service endpoint ID
        string type;                 // Type of service
        string serviceEndpoint;      // Service endpoint URL
        bool active;                 // Whether the service endpoint is active
    }

    // State variables
    Counters.Counter private _didCounter;
    mapping(address => string) private _addressToDID;
    mapping(string => DIDDocument) private _didDocuments;
    mapping(string => VerificationMethod) private _verificationMethods;
    mapping(string => ServiceEndpoint) private _serviceEndpoints;
    mapping(string => bool) private _didExists;

    // Events
    event DIDRegistered(address indexed owner, string did, string didDocument);
    event DIDUpdated(address indexed owner, string did, string newDidDocument);
    event VerificationMethodAdded(string indexed did, string verificationMethodId);
    event VerificationMethodRemoved(string indexed did, string verificationMethodId);
    event ServiceEndpointAdded(string indexed did, string serviceEndpointId);
    event ServiceEndpointRemoved(string indexed did, string serviceEndpointId);
    event DIDDeactivated(string indexed did);

    // Modifiers
    modifier onlyDIDOwner(string memory did) {
        require(_didExists[did], "DID does not exist");
        require(keccak256(bytes(_addressToDID[msg.sender])) == keccak256(bytes(did)), "Not DID owner");
        _;
    }

    modifier onlyActiveDID(string memory did) {
        require(_didExists[did], "DID does not exist");
        require(_didDocuments[did].active, "DID is not active");
        _;
    }

    /**
     * @dev Register a new DID
     * @param didDocument JSON string containing the DID document
     * @return did The registered DID identifier
     */
    function registerDID(string memory didDocument) external returns (string memory) {
        require(bytes(_addressToDID[msg.sender]).length == 0, "Address already has a DID");
        
        // Generate DID identifier
        string memory did = string(abi.encodePacked("did:moonbeam:", _toHexString(msg.sender)));
        
        // Parse and validate DID document
        require(bytes(didDocument).length > 0, "DID document cannot be empty");
        
        // Create DID document
        DIDDocument memory newDID = DIDDocument({
            did: did,
            context: "https://www.w3.org/ns/did/v1",
            verificationMethods: new string[](0),
            serviceEndpoints: new string[](0),
            createdAt: block.timestamp,
            updatedAt: block.timestamp,
            active: true
        });

        // Store DID
        _didDocuments[did] = newDID;
        _addressToDID[msg.sender] = did;
        _didExists[did] = true;
        _didCounter.increment();

        emit DIDRegistered(msg.sender, did, didDocument);
        return did;
    }

    /**
     * @dev Update an existing DID document
     * @param did The DID identifier to update
     * @param newDidDocument New DID document JSON string
     */
    function updateDID(string memory did, string memory newDidDocument) external onlyDIDOwner(did) onlyActiveDID(did) {
        require(bytes(newDidDocument).length > 0, "DID document cannot be empty");
        
        _didDocuments[did].updatedAt = block.timestamp;
        
        emit DIDUpdated(msg.sender, did, newDidDocument);
    }

    /**
     * @dev Add a verification method to a DID
     * @param did The DID identifier
     * @param verificationMethodId Unique identifier for the verification method
     * @param verificationMethodType Type of verification method
     * @param publicKeyMultibase Public key in multibase format
     */
    function addVerificationMethod(
        string memory did,
        string memory verificationMethodId,
        string memory verificationMethodType,
        string memory publicKeyMultibase
    ) external onlyDIDOwner(did) onlyActiveDID(did) {
        require(bytes(verificationMethodId).length > 0, "Verification method ID cannot be empty");
        require(bytes(verificationMethodType).length > 0, "Verification method type cannot be empty");
        require(bytes(publicKeyMultibase).length > 0, "Public key cannot be empty");
        require(!_verificationMethods[verificationMethodId].active, "Verification method already exists");

        VerificationMethod memory vm = VerificationMethod({
            id: verificationMethodId,
            type: verificationMethodType,
            controller: did,
            publicKeyMultibase: publicKeyMultibase,
            active: true
        });

        _verificationMethods[verificationMethodId] = vm;
        _didDocuments[did].verificationMethods.push(verificationMethodId);

        emit VerificationMethodAdded(did, verificationMethodId);
    }

    /**
     * @dev Remove a verification method from a DID
     * @param did The DID identifier
     * @param verificationMethodId The verification method ID to remove
     */
    function removeVerificationMethod(
        string memory did,
        string memory verificationMethodId
    ) external onlyDIDOwner(did) onlyActiveDID(did) {
        require(_verificationMethods[verificationMethodId].active, "Verification method does not exist");

        _verificationMethods[verificationMethodId].active = false;
        
        // Remove from DID document array
        string[] storage vms = _didDocuments[did].verificationMethods;
        for (uint i = 0; i < vms.length; i++) {
            if (keccak256(bytes(vms[i])) == keccak256(bytes(verificationMethodId))) {
                vms[i] = vms[vms.length - 1];
                vms.pop();
                break;
            }
        }

        emit VerificationMethodRemoved(did, verificationMethodId);
    }

    /**
     * @dev Add a service endpoint to a DID
     * @param did The DID identifier
     * @param serviceEndpointId Unique identifier for the service endpoint
     * @param serviceType Type of service
     * @param serviceEndpointUrl Service endpoint URL
     */
    function addServiceEndpoint(
        string memory did,
        string memory serviceEndpointId,
        string memory serviceType,
        string memory serviceEndpointUrl
    ) external onlyDIDOwner(did) onlyActiveDID(did) {
        require(bytes(serviceEndpointId).length > 0, "Service endpoint ID cannot be empty");
        require(bytes(serviceType).length > 0, "Service type cannot be empty");
        require(bytes(serviceEndpointUrl).length > 0, "Service endpoint URL cannot be empty");
        require(!_serviceEndpoints[serviceEndpointId].active, "Service endpoint already exists");

        ServiceEndpoint memory se = ServiceEndpoint({
            id: serviceEndpointId,
            type: serviceType,
            serviceEndpoint: serviceEndpointUrl,
            active: true
        });

        _serviceEndpoints[serviceEndpointId] = se;
        _didDocuments[did].serviceEndpoints.push(serviceEndpointId);

        emit ServiceEndpointAdded(did, serviceEndpointId);
    }

    /**
     * @dev Remove a service endpoint from a DID
     * @param did The DID identifier
     * @param serviceEndpointId The service endpoint ID to remove
     */
    function removeServiceEndpoint(
        string memory did,
        string memory serviceEndpointId
    ) external onlyDIDOwner(did) onlyActiveDID(did) {
        require(_serviceEndpoints[serviceEndpointId].active, "Service endpoint does not exist");

        _serviceEndpoints[serviceEndpointId].active = false;
        
        // Remove from DID document array
        string[] storage ses = _didDocuments[did].serviceEndpoints;
        for (uint i = 0; i < ses.length; i++) {
            if (keccak256(bytes(ses[i])) == keccak256(bytes(serviceEndpointId))) {
                ses[i] = ses[ses.length - 1];
                ses.pop();
                break;
            }
        }

        emit ServiceEndpointRemoved(did, serviceEndpointId);
    }

    /**
     * @dev Deactivate a DID
     * @param did The DID identifier to deactivate
     */
    function deactivateDID(string memory did) external onlyDIDOwner(did) onlyActiveDID(did) {
        _didDocuments[did].active = false;
        _didDocuments[did].updatedAt = block.timestamp;

        emit DIDDeactivated(did);
    }

    /**
     * @dev Get DID document for a given DID
     * @param did The DID identifier
     * @return The DID document
     */
    function getDIDDocument(string memory did) external view returns (DIDDocument memory) {
        require(_didExists[did], "DID does not exist");
        return _didDocuments[did];
    }

    /**
     * @dev Get verification method for a given ID
     * @param verificationMethodId The verification method ID
     * @return The verification method
     */
    function getVerificationMethod(string memory verificationMethodId) external view returns (VerificationMethod memory) {
        require(_verificationMethods[verificationMethodId].active, "Verification method does not exist");
        return _verificationMethods[verificationMethodId];
    }

    /**
     * @dev Get service endpoint for a given ID
     * @param serviceEndpointId The service endpoint ID
     * @return The service endpoint
     */
    function getServiceEndpoint(string memory serviceEndpointId) external view returns (ServiceEndpoint memory) {
        require(_serviceEndpoints[serviceEndpointId].active, "Service endpoint does not exist");
        return _serviceEndpoints[serviceEndpointId];
    }

    /**
     * @dev Get DID for a given address
     * @param addr The address to look up
     * @return The DID identifier
     */
    function getDIDForAddress(address addr) external view returns (string memory) {
        return _addressToDID[addr];
    }

    /**
     * @dev Check if a DID exists
     * @param did The DID identifier
     * @return True if the DID exists
     */
    function didExists(string memory did) external view returns (bool) {
        return _didExists[did];
    }

    /**
     * @dev Get total number of registered DIDs
     * @return The total count
     */
    function getTotalDIDCount() external view returns (uint256) {
        return _didCounter.current();
    }

    /**
     * @dev Convert address to hex string
     * @param addr The address to convert
     * @return The hex string representation
     */
    function _toHexString(address addr) private pure returns (string memory) {
        return _toHexString(abi.encodePacked(addr));
    }

    /**
     * @dev Convert bytes to hex string
     * @param data The bytes to convert
     * @return The hex string representation
     */
    function _toHexString(bytes memory data) private pure returns (string memory) {
        bytes memory alphabet = "0123456789abcdef";
        bytes memory str = new bytes(2 + data.length * 2);
        str[0] = "0";
        str[1] = "x";
        for (uint i = 0; i < data.length; i++) {
            str[2 + i * 2] = alphabet[uint(uint8(data[i] >> 4))];
            str[2 + i * 2 + 1] = alphabet[uint(uint8(data[i] & 0x0f))];
        }
        return string(str);
    }
}
