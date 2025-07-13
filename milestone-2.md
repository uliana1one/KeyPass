# Milestone Delivery :mailbox:

**The delivery is according to the official [milestone delivery guidelines](https://github.com/w3f/Grants-Program/blob/master/docs/Support%20Docs/milestone-deliverables-guidelines.md).**  

* **Application Document:** [KeyPass Application](https://github.com/uliana1one/KeyPass/blob/main/applications/keypass.md)
* **Milestone Number:** 2

**Context**

This milestone delivers the KeyPass DID Explorer dashboard and zkProof credential demo, fulfilling the next phase of the wallet-based identity platform for Web3 learners. The deliverables include a full-featured frontend for DID creation, SBT/credential display, and zero-knowledge proof generation, all integrated with the Polkadot ecosystem. The implementation demonstrates seamless wallet-based login, DID issuance, SBT minting, and private credential verification, with a focus on privacy, user control, and developer integration.

**Deliverables**

| Number | Deliverable | Link | Notes |
| ------ | ----------- | ---- | ----- |
| 2.1 | DID Explorer Dashboard | [React Boilerplate Example](examples/react-boilerplate) <br> [DID Wizard Guide](examples/react-boilerplate/DID_WIZARD_README.md) | Complete dashboard for DID creation, viewing, and management. Supports Polkadot and Ethereum DIDs, wallet-based login, and SBT display. |
| 2.2 | zkProof Credential Demo | [ZK Proof Implementation](examples/react-boilerplate/ZK_PROOF_IMPLEMENTATION.md) <br> [Credential Guide](examples/react-boilerplate/CREDENTIAL_IMPLEMENTATION_GUIDE.md) | End-to-end demo of credential issuance, display, and zero-knowledge proof generation/verification (Semaphore, PLONK, Groth16). Includes UI for proof generation and credential sharing. |

**Additional Information**

- Tagline: The wallet-based identity layer for the next billion Web3 learners.
- Project Description: KeyPass is a self-sovereign login and identity system that replaces “Sign in with Google” using DIDs and crypto wallets. Users can log into apps using their wallet, own their digital identity, and prove traits like age or student status via zk-proofs—all while maintaining privacy and data control.
- Polkadot Integration: DIDs issued/resolved via Polkadot parachains (e.g., KILT), SBTs minted on Moonbeam, zk-proofs using Polkadot-compatible frameworks, reusable login SDK for Polkadot dApps.
- Tech Stack: EIP-4361, WalletConnect, KILT/Ceramic, SBTs, zkLogin/Semaphore, Node.js/Express, Next.js/Tailwind, Solidity, potential Ink!
- Limitations: No email/password login, no off-chain user data hosting, no general-purpose social/credential network.

> Any further comments on the milestone that you would like to share with us.