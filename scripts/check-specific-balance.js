import { ethers } from 'ethers';

async function checkBalance() {
  const provider = new ethers.JsonRpcProvider('https://rpc.api.moonbase.moonbeam.network');
  const balance = await provider.getBalance('0x2bd536440C77CFB8B81fA931aFF11Bb095AD82C8');
  console.log('Balance:', ethers.formatEther(balance), 'DEV');
}

checkBalance();
