/**
 * Test Results Processor for E2E Tests
 * 
 * This processes test results and generates additional reports
 * for E2E test analysis and monitoring.
 */

interface TestResult {
  testFilePath: string;
  testResults: Array<{
    ancestorTitles: string[];
    title: string;
    status: 'passed' | 'failed' | 'pending' | 'skipped';
    duration?: number;
    failureMessages: string[];
  }>;
  success: boolean;
  testExecError?: string;
  coverageMap?: any;
}

export default function testResultsProcessor(results: any) {
  console.log('=== Processing E2E Test Results ===');
  
  const processedResults = {
    ...results,
    e2eSummary: generateE2ESummary(results),
    performanceMetrics: extractPerformanceMetrics(results),
    testCoverage: analyzeTestCoverage(results),
  };
  
  // Log summary
  logTestSummary(processedResults);
  
  // Save detailed report
  saveDetailedReport(processedResults);
  
  return processedResults;
}

function generateE2ESummary(results: any) {
  const totalTests = results.numTotalTests;
  const passedTests = results.numPassedTests;
  const failedTests = results.numFailedTests;
  const skippedTests = results.numPendingTests;
  
  const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  
  return {
    totalTests,
    passedTests,
    failedTests,
    skippedTests,
    successRate: Math.round(successRate * 100) / 100,
    totalDuration: results.startTime ? Date.now() - results.startTime : 0,
    timestamp: new Date().toISOString(),
  };
}

function extractPerformanceMetrics(results: any) {
  const testResults = results.testResults || [];
  const durations = testResults
    .flatMap((suite: TestResult) => suite.testResults)
    .map((test: any) => test.duration)
    .filter((duration: number) => duration !== undefined);
  
  if (durations.length === 0) {
    return {
      averageDuration: 0,
      minDuration: 0,
      maxDuration: 0,
      totalDuration: 0,
    };
  }
  
  const totalDuration = durations.reduce((sum: number, duration: number) => sum + duration, 0);
  const averageDuration = totalDuration / durations.length;
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  
  return {
    averageDuration: Math.round(averageDuration),
    minDuration,
    maxDuration,
    totalDuration,
    testCount: durations.length,
  };
}

function analyzeTestCoverage(results: any) {
  // This would analyze coverage if enabled
  return {
    enabled: false,
    message: 'Coverage analysis not enabled for E2E tests',
  };
}

function logTestSummary(results: any) {
  const summary = results.e2eSummary;
  const performance = results.performanceMetrics;
  
  console.log(`
=== E2E Test Summary ===
📊 Results:
  • Total Tests: ${summary.totalTests}
  • Passed: ${summary.passedTests} ✅
  • Failed: ${summary.failedTests} ❌
  • Skipped: ${summary.skippedTests} ⏭️
  • Success Rate: ${summary.successRate}%

⏱️  Performance:
  • Average Duration: ${performance.averageDuration}ms
  • Min Duration: ${performance.minDuration}ms
  • Max Duration: ${performance.maxDuration}ms
  • Total Duration: ${performance.totalDuration}ms

🕐 Timestamp: ${summary.timestamp}
  `);
  
  if (summary.failedTests > 0) {
    console.log('❌ Some tests failed. Check the detailed report for more information.');
  } else {
    console.log('✅ All E2E tests passed successfully!');
  }
}

function saveDetailedReport(results: any) {
  const fs = require('fs');
  const path = require('path');
  
  const reportDir = path.join(process.cwd(), 'test-results', 'e2e');
  const reportPath = path.join(reportDir, 'detailed-report.json');
  
  // Ensure directory exists
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Save detailed report
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}
