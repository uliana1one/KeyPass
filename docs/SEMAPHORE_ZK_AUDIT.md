## Semaphore ZK-Proof Audit (Current State)

Scope: examples/react-boilerplate zk proof stack

Key files
- `examples/react-boilerplate/src/services/zkProofService.ts`
- `examples/react-boilerplate/src/services/credentialService.ts`

Findings
- Real proof generation via `@semaphore-protocol/proof` is imported but NOT used; service forces mock path.
- Config defaults: `enableRealProofs: false`, `mockMode: true` — prevents real proof flow.
- Identity and group caches exist (`Map<string, Identity>` / `Map<string, Group>`), but identity derivation from a wallet signature is not implemented.
- Group management data (`SEMAPHORE_GROUPS`) present; real Merkle tree creation and onchain sync not wired.
- Tests mock `@semaphore-protocol/proof` and `poseidon-lite` to bypass real circuits.

Commented or missing real-proof logic
- `generateZKProof()` validates inputs then returns `generateMockProof(...)` unconditionally.
- No `verifyZKProof()` using `verifyProof` for real proofs; only mock verification available.
- No wasm/zkey circuit loading paths wired in config (`wasmFilePath`, `zkeyFilePath`).

Required inputs (real Semaphore)
- Identity: a deterministic `Identity` from wallet signature (e.g., `eth_sign` of domain-separated message).
- Group: Merkle tree of identity commitments (depth per use case), root used as public input.
- Signal: domain-separated message for the specific action/claim.
- External nullifier: domain or action scoping to prevent replay.
- Artifacts: corresponding `.wasm` and `.zkey` for the chosen circuit.

Expected outputs
- Proof object: Groth16 proof structure compatible with `@semaphore-protocol/proof`.
- Public signals: `[nullifierHash, merkleRoot, signal]` (per circuit), plus any extras required by specific circuits.
- Verification result: boolean from `verifyProof(...)` locally and/or onchain verifier.

Gaps to production-ready
1) Identity generation from wallet + secure storage of identity commitment
2) Group creation/updates + Merkle proofs for members
3) Real proof generation using wasm/zkey artifacts and error handling
4) Real proof verification (local and onchain), membership validation
5) Credential-specific circuits (age, student) with selective disclosure
6) Replace mock flags; update types and public API
7) Tests for identity, groups, proof gen, and verification

Recommended next steps
- Implement `generateSemaphoreIdentity(wallet)` using signed message -> Poseidon hash -> `Identity`.
- Add `createSemaphoreGroup()` and membership management; persist group roots and commitments.
- Wire `generateZKProof()` to `@semaphore-protocol/proof.generateProof` with configured artifacts.
- Add `verifyZKProof()` calling `verifyProof` and validating group membership.
- Provide age/student credential proof helpers and selective disclosure mapping.
- Add robust error handling around artifact loading and witness generation.

