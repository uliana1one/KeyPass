import { v4 as uuidv4 } from 'uuid';

/**
 * Class responsible for generating DIDs using UUIDv4.
 */
export class UUIDProvider {
  /**
   * Creates a DID for the given address.
   * @param address - The address for which to create the DID.
   * @returns A string representing the DID in the format did:key:<UUIDv4>.
   */
  createDid(address: string): string {
    return `did:key:${uuidv4()}`;
  }
} 