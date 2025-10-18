const { Wallet } = require('ethers');

const wallet = Wallet.createRandom();

console.log('\n🔑 TEST WALLET GENERATED\n');
console.log('═══════════════════════════════════════════════════════\n');
console.log('Address (for faucet):');
console.log(wallet.address);
console.log('\nPrivate Key (save this for testing):');
console.log(wallet.privateKey);
console.log('\n═══════════════════════════════════════════════════════');
console.log('\n⚠️  This is a TEST wallet - NEVER use for real funds!\n');

