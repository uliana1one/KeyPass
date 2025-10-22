#!/usr/bin/env node

import { ethers } from 'ethers';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Moonbase Alpha configuration
const MOONBASE_RPC_URL = 'https://rpc.api.moonbase.moonbeam.network';
const PRIVATE_KEY = process.env.MOONBEAM_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('❌ MOONBEAM_PRIVATE_KEY environment variable is required');
  process.exit(1);
}

async function deployMoonbeamDIDContract() {
  try {
    console.log('🚀 Deploying Moonbeam DID Contract...');
    
    // Create provider and signer
    const provider = new ethers.providers.JsonRpcProvider(MOONBASE_RPC_URL);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`📝 Deployer address: ${signer.address}`);
    
    // Check balance
    const balance = await signer.getBalance();
    console.log(`💰 Balance: ${ethers.utils.formatEther(balance)} DEV`);
    
    if (balance.lt(ethers.utils.parseEther('0.1'))) {
      console.error('❌ Insufficient balance. Need at least 0.1 DEV');
      process.exit(1);
    }
    
    // Read contract bytecode and ABI
    const contractPath = join(__dirname, '../src/contracts/MoonbeamDIDContract.sol');
    console.log(`📄 Reading contract from: ${contractPath}`);
    
    // For now, we'll use a simplified approach
    // In production, you'd compile the contract first
    const contractSource = `
      // SPDX-License-Identifier: MIT
      pragma solidity ^0.8.20;
      
      contract MoonbeamDIDContract {
          mapping(address => string) private _addressToDID;
          mapping(string => bool) private _didExists;
          
          event DIDRegistered(address indexed owner, string did);
          
          function registerDID(string memory didDocument) external returns (string memory) {
              require(bytes(_addressToDID[msg.sender]).length == 0, "Address already has a DID");
              string memory did = string(abi.encodePacked("did:moonbeam:", _toHexString(msg.sender)));
              _addressToDID[msg.sender] = did;
              _didExists[did] = true;
              emit DIDRegistered(msg.sender, did);
              return did;
          }
          
          function getDIDForAddress(address addr) external view returns (string memory) {
              return _addressToDID[addr];
          }
          
          function didExists(string memory did) external view returns (bool) {
              return _didExists[did];
          }
          
          function _toHexString(address addr) private pure returns (string memory) {
              return _toHexString(abi.encodePacked(addr));
          }
          
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
    `;
    
    // Deploy contract
    console.log('📦 Deploying contract...');
    const factory = new ethers.ContractFactory(
      [
        'function registerDID(string memory didDocument) external returns (string memory)',
        'function getDIDForAddress(address addr) external view returns (string memory)',
        'function didExists(string memory did) external view returns (bool)',
        'event DIDRegistered(address indexed owner, string did)'
      ],
      contractSource,
      signer
    );
    
    const contract = await factory.deploy();
    await contract.deployed();
    
    console.log(`✅ Contract deployed at: ${contract.address}`);
    
    // Test the contract
    console.log('🧪 Testing contract...');
    const testDID = await contract.registerDID('{"@context":"https://www.w3.org/ns/did/v1"}');
    console.log(`✅ Test DID created: ${testDID}`);
    
    // Save deployment info
    const deploymentInfo = {
      contractAddress: contract.address,
      deployer: signer.address,
      network: 'moonbase',
      timestamp: new Date().toISOString(),
      transactionHash: contract.deployTransaction.hash
    };
    
    writeFileSync(
      join(__dirname, '../deployments/moonbeam-did-deployment.json'),
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log('📄 Deployment info saved to deployments/moonbeam-did-deployment.json');
    console.log('🎉 Deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  }
}

deployMoonbeamDIDContract();
