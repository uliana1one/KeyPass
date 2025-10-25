const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(express.json());

// Mock real credential data
const mockCredentials = [
  {
    id: 'cred_1',
    type: ['VerifiableCredential', 'EducationalCredential'],
    issuer: 'did:web:university.edu',
    issuanceDate: '2024-01-15T10:00:00Z',
    credentialSubject: {
      id: 'did:key:zpolkadot5bByGMXg1761362941291',
      name: 'John Doe',
      degree: 'Bachelor of Computer Science',
      gpa: 3.8,
      graduationDate: '2024-05-15'
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: '2024-01-15T10:00:00Z',
      verificationMethod: 'did:web:university.edu#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'z5J8X7K2M9N1P4Q6R8S3T5U7V9W2X4Y6Z8A1B3C5D7E9F2G4H6I8J1K3L5M7N9P2Q4R6S8T1U3V5W7X9Y2Z4A6B8C1D3E5F7G9H2I4J6K8L1M3N5P7Q9R2S4T6U8V1W3X5Y7Z9'
    }
  },
  {
    id: 'cred_2',
    type: ['VerifiableCredential', 'ProfessionalCredential'],
    issuer: 'did:web:company.com',
    issuanceDate: '2024-02-20T14:30:00Z',
    credentialSubject: {
      id: 'did:key:zpolkadot5bByGMXg1761362941291',
      name: 'John Doe',
      position: 'Senior Software Engineer',
      company: 'Tech Corp',
      startDate: '2024-01-01',
      skills: ['JavaScript', 'TypeScript', 'React', 'Node.js']
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: '2024-02-20T14:30:00Z',
      verificationMethod: 'did:web:company.com#key-1',
      proofPurpose: 'assertionMethod',
      proofValue: 'z9A2B4C6D8E1F3G5H7I9J2K4L6M8N1O3P5Q7R9S2T4U6V8W1X3Y5Z7A9B2C4D6E8F1G3H5I7J9K2L4M6N8O1P3Q5R7S9T2U4V6W8X1Y3Z5A7B9C2D4E6F8G1H3I5J7K9L2M4N6O8P1Q3R5S7T9U2V4W6X8Y1Z3A5B7C9D2E4F6G8H1I3J5K7L9M2N4O6P8Q1R3S5T7U9V2W4X6Y8Z1A3B5C7D9E2F4G6H8I1J3K5L7M9N2O4P6Q8R1S3T5U7V9W2X4Y6Z8A1B3C5D7E9F2G4H6I8J1K3L5M7N9P2Q4R6S8T1U3V5W7X9Y2Z4A6B8C1D3E5F7G9H2I4J6K8L1M3N5P7Q9R2S4T6U8V1W3X5Y7Z9'
    }
  }
];

const mockCredentialRequests = [
  {
    id: 'req_1',
    requester: 'did:web:employer.com',
    requestedCredential: 'EducationalCredential',
    purpose: 'Job Application',
    status: 'pending',
    requestedAt: '2024-03-01T09:00:00Z',
    expiresAt: '2024-03-15T09:00:00Z'
  }
];

const mockCredentialOffers = [
  {
    id: 'offer_1',
    issuer: 'did:web:certification.org',
    credentialType: 'ProfessionalCertification',
    title: 'Blockchain Developer Certification',
    description: 'Certified blockchain developer with expertise in smart contracts',
    requirements: ['Portfolio Review', 'Technical Interview'],
    validUntil: '2024-12-31T23:59:59Z',
    offeredAt: '2024-03-05T10:00:00Z'
  }
];

// API Routes
app.get('/api/credentials/:did', (req, res) => {
  console.log(`[API] GET /api/credentials/${req.params.did}`);
  res.json(mockCredentials);
});

app.get('/api/credential-requests/:did', (req, res) => {
  console.log(`[API] GET /api/credential-requests/${req.params.did}`);
  res.json(mockCredentialRequests);
});

app.get('/api/credential-offers/:did', (req, res) => {
  console.log(`[API] GET /api/credential-offers/${req.params.did}`);
  res.json(mockCredentialOffers);
});

app.post('/api/credentials/request', (req, res) => {
  console.log('[API] POST /api/credentials/request', req.body);
  res.json({ success: true, requestId: 'req_' + Date.now() });
});

app.post('/api/credentials/accept', (req, res) => {
  console.log('[API] POST /api/credentials/accept', req.body);
  res.json({ success: true, credentialId: 'cred_' + Date.now() });
});

app.post('/api/credentials/revoke', (req, res) => {
  console.log('[API] POST /api/credentials/revoke', req.body);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  GET /api/credentials/:did');
  console.log('  GET /api/credential-requests/:did');
  console.log('  GET /api/credential-offers/:did');
  console.log('  POST /api/credentials/request');
  console.log('  POST /api/credentials/accept');
  console.log('  POST /api/credentials/revoke');
});
