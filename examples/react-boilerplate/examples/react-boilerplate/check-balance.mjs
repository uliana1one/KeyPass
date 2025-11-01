import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts } from '@polkadot/extension-dapp';

async function checkBalance() {
  // Connect to Peregrine testnet
  const wsProvider = new WsProvider('wss://peregrine.kilt.io');
  const api = await ApiPromise.create({ provider: wsProvider });
  
  console.log('🔍 Connected to Peregrine testnet');
  
  // Get accounts from extension
  const accounts = await web3Accounts();
  
  if (accounts.length === 0) {
    console.log('❌ No accounts found in wallet');
    process.exit(1);
  }
  
  console.log(`\n📊 Found ${accounts.length} account(s):\n`);
  
  for (const account of accounts) {
    try {
      const accountInfo = await api.query.system.account(account.address);
      const balance = accountInfo.data.free.toBigInt();
      const balanceInKilt = Number(balance) / 1e15; // KILT has 15 decimals
      
      console.log(`📍 ${account.meta.name || 'Unnamed'} (${account.address.slice(0, 20)}...)`);
      console.log(`   Balance: ${balanceInKilt.toFixed(4)} KILT`);
      console.log(`   ${balance > 0n ? '✅ Has funds' : '❌ Zero balance'}\n`);
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }
  }
  
  await api.disconnect();
}

checkBalance().catch(console.error);
