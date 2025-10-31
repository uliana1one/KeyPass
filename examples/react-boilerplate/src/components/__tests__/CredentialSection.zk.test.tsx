import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { CredentialSection } from '../CredentialSection';

// Mock zkProof service helpers to avoid ESM/proof generation
jest.mock('../../services/zkProofService', () => ({
  zkProofService: {
    verifyZKProof: jest.fn(async () => true),
  },
  generateAgeVerificationProof: jest.fn(async () => ({
    type: 'semaphore',
    circuit: 'semaphore-age-verification',
    proof: JSON.stringify({ signal: 'age' }),
    publicSignals: ['nh', 'root', 'age-signal'],
  })),
  generateStudentStatusProof: jest.fn(async () => ({
    type: 'semaphore',
    circuit: 'semaphore-membership-proof',
    proof: JSON.stringify({ signal: 'student' }),
    publicSignals: ['nh', 'root', 'student-signal'],
  })),
}));

const baseProps = {
  did: 'did:example:123',
  walletAddress: '0xabc',
  chainType: 'ethereum' as const,
};

function withCredentials(creds: any[]) {
  // Patch the CredentialService used inside to return our creds
  jest.resetModules();
  const actual = jest.requireActual('../../services/credentialService');
  jest.spyOn(actual, 'credentialService', 'get').mockReturnValue({
    getAvailableZKCircuits: jest.fn(() => []),
  } as any);
  jest.spyOn(actual, 'CredentialService').mockImplementation(() => ({
    getCredentials: jest.fn(async () => creds),
    getCredentialRequests: jest.fn(async () => []),
    getCredentialOffers: jest.fn(async () => []),
  }) as any);
  return actual;
}

describe('CredentialSection zk-proof UI', () => {
  let user: any;
  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
  });

  it('renders zk-proofs tab and generates age proof', async () => {
    withCredentials([
      {
        id: 'cred-age-1',
        type: ['VerifiableCredential', 'AgeCredential'],
        credentialSubject: { age: 22 },
        proof: {},
        metadata: {},
      },
    ]);

    render(<CredentialSection {...baseProps} useRealData={false} />);

    await waitFor(() => expect(screen.getByText('Verifiable Credentials')).toBeInTheDocument());

    await user.click(screen.getByText('ZK-Proofs (0)'));

    const btn = screen.getByRole('button', { name: /Generate Age Proof/i });
    await user.click(btn);

    await waitFor(() => expect(screen.getByText('Latest Proof')).toBeInTheDocument());
    expect(screen.getByText(/semaphore-age-verification/)).toBeInTheDocument();
    expect(screen.getByText(/Valid/)).toBeInTheDocument();
  });

  it('generates student proof and shows SBT status', async () => {
    withCredentials([
      {
        id: 'cred-student-1',
        type: ['VerifiableCredential', 'StudentCredential'],
        credentialSubject: { studentId: 'S123' },
        proof: {},
        metadata: {},
      },
    ]);

    render(<CredentialSection {...baseProps} useRealData={false} />);

    await waitFor(() => expect(screen.getByText('Verifiable Credentials')).toBeInTheDocument());
    await user.click(screen.getByText('ZK-Proofs (0)'));

    const btn = screen.getByRole('button', { name: /Prove Student Status/i });
    await user.click(btn);

    await waitFor(() => expect(screen.getByText('Latest Proof')).toBeInTheDocument());
    expect(screen.getByText(/semaphore-membership-proof/)).toBeInTheDocument();
    expect(screen.getByText(/SBT Ownership:/)).toBeInTheDocument();
  });
});
