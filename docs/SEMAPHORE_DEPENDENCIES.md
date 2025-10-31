## Semaphore Dependency Verification

Detected (from package.json)
- @semaphore-protocol/group: ^4.11.1
- @semaphore-protocol/identity: ^4.11.1
- @semaphore-protocol/proof: ^4.11.1
- poseidon-lite: ^0.3.0 (added)

Notes
- `poseidon-lite` is required for hashing utilities used by the zk proof service; it was missing and has been added to dependencies. Run install to fetch it.
- Ensure compatible circuit artifacts (wasm/zkey) for the chosen Semaphore version (4.11.x) are present when enabling real proofs.

Install
```bash
npm install
```

