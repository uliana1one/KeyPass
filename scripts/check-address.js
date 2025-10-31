import { ethers } from 'ethers';

const wallet = new ethers.Wallet('0x41c11df12f3ae8c7f88a6e06c5cd80db928ab2ca949e728d809de4b75630678d');
console.log('Address:', wallet.address);
