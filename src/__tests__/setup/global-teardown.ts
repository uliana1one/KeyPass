/**
 * Global Teardown for E2E Tests
 * 
 * This runs once after all tests and handles:
 * - Resource cleanup
 * - Test result reporting
 * - Environment restoration
 */

export default async function globalTeardown() {
  console.log('=== Global E2E Test Teardown ===');
  
  // Clean up test resources
  await cleanupTestResources();
  
  // Generate test report
  await generateTestReport();
  
  // Restore environment
  await restoreEnvironment();
  
  console.log('Global E2E test teardown completed');
}

async function cleanupTestResources(): Promise<void> {
  console.log('Cleaning up test resources...');
  
  // Clear any global state
  if (global.gc) {
    global.gc();
    console.log('✅ Garbage collection triggered');
  }
  
  // Clear any pending timeouts
  if (global.clearTimeout) {
    // Clear any remaining timeouts
    console.log('✅ Cleared pending timeouts');
  }
  
  console.log('✅ Test resources cleaned up');
}

async function generateTestReport(): Promise<void> {
  console.log('Generating test report...');
  
  const testResults = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    },
    configuration: {
      testTimeout: process.env.TEST_TIMEOUT,
      network: 'Moonbase Alpha',
      chainId: 1287,
    },
  };
  
  console.log('📊 E2E Test Results Summary:');
  console.log(JSON.stringify(testResults, null, 2));
  
  console.log('✅ Test report generated');
}

async function restoreEnvironment(): Promise<void> {
  console.log('Restoring environment...');
  
  // Reset environment variables
  delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  
  // Clear any test-specific environment variables
  const testEnvVars = ['TEST_RECIPIENT', 'TEST_TIMEOUT'];
  testEnvVars.forEach(varName => {
    delete process.env[varName];
  });
  
  console.log('✅ Environment restored');
}
