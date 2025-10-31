# KeyPass React Demo Walkthrough

**Live Demo:** [keypass-react-demo.vercel.app](https://keypass-react-demo.vercel.app)

This walkthrough guides you through all the features of the KeyPass React demo.

## Prerequisites

Before starting, ensure you have:

1. **Browser with JavaScript enabled**
2. **Wallet extensions installed:**
   - [MetaMask](https://metamask.io/) for Ethereum/Moonbeam
   - [Polkadot.js Extension](https://polkadot.js.org/extension/) for KILT/Polkadot
   - [Talisman](https://talisman.xyz/) (alternative for Polkadot)

3. **Testnet tokens:**
   - DEV tokens from [Moonbase Alpha Faucet](https://apps.moonbeam.network/moonbase-alpha/faucet/)
   - KILT tokens from [KILT Faucet](https://faucet.kilt.io/)

## Demo Overview

The KeyPass demo showcases:

- ✅ **Multi-chain authentication** (Polkadot & Ethereum)
- ✅ **KILT DID creation** on blockchain
- ✅ **SBT minting** on Moonbase Alpha
- ✅ **Zero-knowledge proofs** for privacy
- ✅ **Credential management** and display
- ✅ **Real-time transaction monitoring**

## Step-by-Step Walkthrough

### Step 1: Home Screen

**What you'll see:**
- Beautiful gradient landing page
- "Get Started" button
- Feature highlights:
  - Multi-chain support
  - KILT DID integration
  - SBT minting
  - Privacy-preserving proofs

**Action:** Click "Get Started" to begin

---

### Step 2: Chain Selection

**What you'll see:**
- Two options displayed:
  - 🟣 **Polkadot/KILT** chain
  - 🔷 **Ethereum/Moonbeam** chain

**Choosing Polkadot/KILT:**
- Best for: DID creation, identity proofs
- Wallet: Polkadot.js or Talisman
- Features: KILT DID registration, credential management

**Choosing Ethereum/Moonbeam:**
- Best for: SBT minting, token operations
- Wallet: MetaMask or other EVM wallet
- Features: SBT creation, transfer verification

**Action:** Select your preferred chain

---

### Step 3: Wallet Connection

**For Polkadot/KILT:**

1. The app prompts to connect your Polkadot.js or Talisman wallet
2. Click "Connect Wallet" button
3. Select account in wallet popup
4. Approve connection request
5. You'll see: Connected address, account name, balance

**For Ethereum/Moonbeam:**

1. The app prompts to connect your MetaMask wallet
2. Click "Connect Wallet" button
3. Select account in MetaMask popup
4. Approve connection request
5. Switch to Moonbase Alpha network if prompted
6. You'll see: Connected address, ETH balance

**Action:** Connect your wallet

---

### Step 4: KILT DID Creation (Polkadot Path)

**If you selected Polkadot/KILT:**

**You'll see the DID Creation Wizard:**

1. **Step 1: Type Selection**
   - Choose "Basic" for quick setup
   - Or "Advanced" for full control

2. **Step 2: Preview**
   - Review the DID document preview
   - See your verification methods
   - Check service endpoints

3. **Step 3: Creation**
   - Click "Create DID on Blockchain"
   - Sign transaction in wallet
   - Wait for confirmation (~12 seconds)
   - See transaction hash and block number

**What happens on-chain:**
- DID registered on KILT Spiritnet
- Transaction recorded in block
- DID document publicly readable

**Action:** Create your DID

---

### Step 5: SBT Minting (Ethereum/Moonbeam Path)

**If you selected Ethereum/Moonbeam:**

**You'll see the SBT Section:**

1. **Connect to Moonbase Alpha**
   - Ensure MetaMask is on Moonbase Alpha
   - Have DEV tokens for gas

2. **View SBT Grid**
   - See existing SBT tokens
   - Check metadata and attributes
   - View transaction history

3. **Mint New SBT**
   - Click "Mint SBT" button
   - Fill in token metadata:
     - Name: e.g., "Student Badge"
     - Description: e.g., "Proof of student status"
     - Image URL: optional
   - Click "Confirm Mint"
   - Sign transaction in MetaMask
   - Wait for confirmation

**What happens on-chain:**
- SBT minted to your address
- Token ID assigned
- Metadata stored on IPFS
- Transaction on Moonbase Alpha
- Token is non-transferable (soulbound)

**Action:** Mint your first SBT

---

### Step 6: Zero-Knowledge Proof Generation

**For age verification:**

1. **Generate Age Proof**
   - Navigate to "Zero-Knowledge Proofs" section
   - Click "Generate Age Proof"
   - Enter minimum age (e.g., 18)
   - Click "Generate"
   - Wait for proof generation

**What you'll see:**
- Proof type: Semaphore
- Circuit: age-verification
- Public signals count
- Verification status: ✅ Valid
- Privacy indicator: ✅ Age verified without revealing exact age

**For student credential:**

1. **Prove Student Status**
   - Click "Prove Student Status"
   - Select SBT token (if available)
   - Click "Generate"
   - Wait for proof generation

**What you'll see:**
- Student status verified
- SBT ownership confirmed
- Zero-knowledge property maintained
- No identity revealed

**Action:** Generate your first ZK-proof

---

### Step 7: Credential Management

**View Your Credentials:**

1. Navigate to "Credentials" section
2. See all your credentials displayed as cards
3. Each card shows:
   - Issuer name and logo
   - Credential type
   - Issue date
   - Privacy level

**Manage Credentials:**

- Click credential to view details
- See DID document
- Check verification status
- Export credential JSON
- Request new credentials

**Action:** Explore your credentials

---

### Step 8: Transaction History

**View On-Chain Activity:**

1. Navigate to "Transactions" tab
2. See list of all blockchain transactions:
   - DID creation
   - SBT mints
   - Proof generations
3. Each entry shows:
   - Transaction hash
   - Block number
   - Timestamp
   - Gas used
   - Status

**Click on transaction:**
- Opens Moonscan/Subscan in new tab
- View full transaction details
- Check block explorer verification

**Action:** Review your blockchain activity

---

### Step 9: Real-Time Monitoring

**Performance Metrics:**

The demo includes a performance monitor showing:

- Transaction confirmation times
- Average gas costs
- Success/failure rates
- Network latency
- Wallet response times

**Error Handling:**

- Graceful error messages
- Retry suggestions
- Helpful troubleshooting tips
- Automatic retries for network errors

**Action:** Monitor performance metrics

---

## Common Scenarios

### Scenario 1: Proving Age Without Revealing It

**Use case:** Access age-restricted content

**Steps:**
1. Navigate to ZK-Proofs section
2. Click "Generate Age Proof"
3. Set minimum age: 21
4. Generate proof
5. Share proof with verifier
6. Verifier confirms you're over 21 without seeing your actual age

---

### Scenario 2: Verifying Student Status

**Use case:** Get student discounts

**Steps:**
1. Ensure you have student SBT minted
2. Navigate to ZK-Proofs section
3. Click "Prove Student Status"
4. Select your student SBT
5. Generate proof
6. Share proof with merchant
7. Merchant verifies you're a student without tracking you

---

### Scenario 3: Creating Professional DID

**Use case:** Professional identity verification

**Steps:**
1. Select Polkadot/KILT chain
2. Connect wallet
3. Choose "Advanced" DID creation
4. Add verification methods:
   - Authentication key
   - Assertion method
   - Key agreement
5. Add service endpoints
6. Create DID on blockchain
7. Share your DID for verification

---

## Troubleshooting

### Wallet Won't Connect

**Solutions:**
- Refresh page and try again
- Ensure wallet extension is installed
- Check extension permissions
- Try different wallet (Polkadot.js vs Talisman)

### Transaction Failed

**Common causes:**
- Insufficient balance for gas
- Network mismatch
- Transaction timeout

**Solutions:**
- Get testnet tokens from faucet
- Switch to correct network
- Retry transaction

### DID Creation Failed

**Possible issues:**
- DID already exists
- Insufficient KILT balance
- Network congestion

**Solutions:**
- Check if DID already created
- Get KILT tokens
- Wait and retry

### SBT Mint Failed

**Possible issues:**
- Contract not deployed
- Wrong network
- Gas estimation failed

**Solutions:**
- Verify contract address
- Switch to Moonbase Alpha
- Check gas prices

---

## Tips for Best Experience

1. **Testnet Tokens:** Always have extra DEV and KILT tokens for gas
2. **Network Selection:** Ensure wallet is on correct testnet
3. **Patience:** Blockchain transactions take time
4. **Explorer Links:** Use provided links to verify on-chain
5. **Testing:** Try different wallets to compare UX

---

## What's Next?

After exploring the demo:

1. **Read the documentation:** [Full docs](../docs/)
2. **Check the code:** [React boilerplate](../examples/react-boilerplate/)
3. **Integrate SDK:** `npm install keypass-login-sdk`
4. **Build your app:** Use boilerplate as starting point

---

## Feedback

Found issues? Have suggestions?

- **GitHub Issues:** [Report problems](https://github.com/uliana1one/keypass/issues)
- **Documentation:** [Read the docs](../docs/)
- **Community:** [Join discussions](https://github.com/uliana1one/keypass/discussions)

---

**Ready to build?** Start with our [Integration Guide](../docs/integration.md)!

