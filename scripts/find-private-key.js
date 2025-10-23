import { ethers } from 'ethers';

// The address that has 1.1 DEV tokens
const targetAddress = '0x2bd536440C77CFB8B81fA931aFF11Bb095AD82C8';

// Let's check if we can find the private key for this address
// This is just for testing - in production you'd never do this
console.log('Looking for private key for address:', targetAddress);

// Check if there are any other private keys in the environment or files
const possibleKeys = [
  '0x41c11df12f3ae8c7f88a6e06c5cd80db928ab2ca949e728d809de4b75630678d', // Current key
  // Add other possible keys here if you have them
];

for (const key of possibleKeys) {
  try {
    const wallet = new ethers.Wallet(key);
    if (wallet.address.toLowerCase() === targetAddress.toLowerCase()) {
      console.log('✅ Found matching private key:', key);
      console.log('Address:', wallet.address);
      break;
    } else {
      console.log('❌ Key', key, '-> Address:', wallet.address);
    }
  } catch (error) {
    console.log('❌ Invalid key:', key);
  }
}
