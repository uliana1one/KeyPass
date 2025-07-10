#!/usr/bin/env node

/**
 * Production Readiness Verification Script
 * 
 * This script performs automated checks to verify that the DID + SBT Dashboard
 * is ready for production deployment.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

class ProductionVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    };
    this.issues = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: `${colors.blue}[INFO]${colors.reset}`,
      success: `${colors.green}[PASS]${colors.reset}`,
      warning: `${colors.yellow}[WARN]${colors.reset}`,
      error: `${colors.red}[FAIL]${colors.reset}`
    }[type];
    
    console.log(`${prefix} ${timestamp} ${message}`);
  }

  async checkFileExists(filePath, description) {
    this.results.total++;
    try {
      if (fs.existsSync(filePath)) {
        this.log(`${description}: File exists`, 'success');
        this.results.passed++;
        return true;
      } else {
        this.log(`${description}: File missing`, 'error');
        this.results.failed++;
        this.issues.push(`${description}: File not found at ${filePath}`);
        return false;
      }
    } catch (error) {
      this.log(`${description}: Error checking file - ${error.message}`, 'error');
      this.results.failed++;
      return false;
    }
  }

  async checkPackageJson() {
    this.log('Checking package.json configuration...', 'info');
    
    const packagePath = path.join(process.cwd(), 'package.json');
    if (await this.checkFileExists(packagePath, 'package.json')) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check for required scripts
        const requiredScripts = ['test', 'build', 'start'];
        for (const script of requiredScripts) {
          if (packageJson.scripts && packageJson.scripts[script]) {
            this.log(`  ✓ Script '${script}' exists`, 'success');
            this.results.passed++;
          } else {
            this.log(`  ✗ Script '${script}' missing`, 'error');
            this.results.failed++;
            this.issues.push(`Missing script: ${script}`);
          }
          this.results.total++;
        }

        // Check for required dependencies
        const requiredDeps = ['react', 'typescript'];
        for (const dep of requiredDeps) {
          if (packageJson.dependencies && packageJson.dependencies[dep]) {
            this.log(`  ✓ Dependency '${dep}' exists`, 'success');
            this.results.passed++;
          } else if (packageJson.devDependencies && packageJson.devDependencies[dep]) {
            this.log(`  ✓ Dev dependency '${dep}' exists`, 'success');
            this.results.passed++;
          } else {
            this.log(`  ✗ Dependency '${dep}' missing`, 'error');
            this.results.failed++;
            this.issues.push(`Missing dependency: ${dep}`);
          }
          this.results.total++;
        }
      } catch (error) {
        this.log(`Error parsing package.json: ${error.message}`, 'error');
        this.results.failed++;
      }
    }
  }

  async checkSecurity() {
    this.log('Checking security configuration...', 'info');
    
    // Check for security-related files
    const securityFiles = [
      '.env.example',
      'src/server/constants.ts',
      'src/config/validator.ts'
    ];

    for (const file of securityFiles) {
      await this.checkFileExists(file, `Security config: ${file}`);
    }

    // Check for environment variables
    const envVars = ['NODE_ENV', 'PORT'];
    for (const envVar of envVars) {
      if (process.env[envVar]) {
        this.log(`  ✓ Environment variable '${envVar}' set`, 'success');
        this.results.passed++;
      } else {
        this.log(`  ⚠ Environment variable '${envVar}' not set`, 'warning');
        this.results.warnings++;
      }
      this.results.total++;
    }
  }

  async checkTesting() {
    this.log('Checking testing configuration...', 'info');
    
    // Check for test files
    const testFiles = [
      'jest.config.js',
      'src/__tests__/',
      'examples/react-boilerplate/src/components/__tests__/'
    ];

    for (const file of testFiles) {
      await this.checkFileExists(file, `Test config: ${file}`);
    }

    // Check for test coverage
    try {
      const coveragePath = path.join(process.cwd(), 'coverage');
      if (fs.existsSync(coveragePath)) {
        this.log('  ✓ Test coverage directory exists', 'success');
        this.results.passed++;
      } else {
        this.log('  ⚠ Test coverage directory missing', 'warning');
        this.results.warnings++;
      }
      this.results.total++;
    } catch (error) {
      this.log(`  ✗ Error checking test coverage: ${error.message}`, 'error');
      this.results.failed++;
    }
  }

  async checkDocumentation() {
    this.log('Checking documentation...', 'info');
    
    const docsFiles = [
      'README.md',
      'docs/README.md',
      'docs/api.md',
      'docs/architecture.md',
      'examples/react-boilerplate/README.md'
    ];

    for (const file of docsFiles) {
      await this.checkFileExists(file, `Documentation: ${file}`);
    }
  }

  async checkBuildProcess() {
    this.log('Checking build process...', 'info');
    
    try {
      // Check if build directory exists or can be created
      const buildDir = path.join(process.cwd(), 'dist');
      if (fs.existsSync(buildDir)) {
        this.log('  ✓ Build directory exists', 'success');
        this.results.passed++;
      } else {
        this.log('  ⚠ Build directory missing (will be created on build)', 'warning');
        this.results.warnings++;
      }
      this.results.total++;

      // Check for TypeScript configuration
      const tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
      await this.checkFileExists(tsConfigPath, 'TypeScript configuration');

    } catch (error) {
      this.log(`Error checking build process: ${error.message}`, 'error');
      this.results.failed++;
    }
  }

  async runNpmAudit() {
    this.log('Running security audit...', 'info');
    
    try {
      const result = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(result);
      
      if (audit.metadata && audit.metadata.vulnerabilities) {
        const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
        
        if (critical > 0 || high > 0) {
          this.log(`  ✗ Critical/High vulnerabilities found: ${critical + high}`, 'error');
          this.results.failed++;
        } else if (moderate > 0) {
          this.log(`  ⚠ Moderate vulnerabilities found: ${moderate}`, 'warning');
          this.results.warnings++;
        } else {
          this.log('  ✓ No critical/high vulnerabilities found', 'success');
          this.results.passed++;
        }
        this.results.total++;
      }
    } catch (error) {
      this.log(`Error running npm audit: ${error.message}`, 'error');
      this.results.failed++;
    }
  }

  async checkBundleSize() {
    this.log('Checking bundle size...', 'info');
    
    try {
      // This would need to be run after a build
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        const stats = fs.statSync(distPath);
        const sizeInMB = stats.size / (1024 * 1024);
        
        if (sizeInMB < 5) {
          this.log(`  ✓ Bundle size reasonable: ${sizeInMB.toFixed(2)}MB`, 'success');
          this.results.passed++;
        } else {
          this.log(`  ⚠ Bundle size large: ${sizeInMB.toFixed(2)}MB`, 'warning');
          this.results.warnings++;
        }
        this.results.total++;
      } else {
        this.log('  ⚠ Build directory not found (run build first)', 'warning');
        this.results.warnings++;
        this.results.total++;
      }
    } catch (error) {
      this.log(`Error checking bundle size: ${error.message}`, 'error');
      this.results.failed++;
    }
  }

  async generateReport() {
    this.log('\n' + '='.repeat(60), 'info');
    this.log('PRODUCTION READINESS REPORT', 'info');
    this.log('='.repeat(60), 'info');
    
    const total = this.results.total;
    const passed = this.results.passed;
    const failed = this.results.failed;
    const warnings = this.results.warnings;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    this.log(`\n📊 SUMMARY:`, 'info');
    this.log(`  Total Checks: ${total}`, 'info');
    this.log(`  Passed: ${colors.green}${passed}${colors.reset}`, 'info');
    this.log(`  Failed: ${colors.red}${failed}${colors.reset}`, 'info');
    this.log(`  Warnings: ${colors.yellow}${warnings}${colors.reset}`, 'info');
    this.log(`  Success Rate: ${colors.cyan}${successRate}%${colors.reset}`, 'info');
    
    if (failed > 0) {
      this.log(`\n❌ CRITICAL ISSUES:`, 'error');
      this.issues.forEach(issue => {
        this.log(`  • ${issue}`, 'error');
      });
    }
    
    if (warnings > 0) {
      this.log(`\n⚠️  WARNINGS:`, 'warning');
      this.log(`  • Some checks produced warnings that should be reviewed`, 'warning');
    }
    
    // Production readiness assessment
    let readiness = 'NOT READY';
    let readinessColor = colors.red;
    
    if (successRate >= 90 && failed === 0) {
      readiness = 'PRODUCTION READY';
      readinessColor = colors.green;
    } else if (successRate >= 80 && failed <= 2) {
      readiness = 'NEARLY READY';
      readinessColor = colors.yellow;
    } else if (successRate >= 60) {
      readiness = 'NEEDS WORK';
      readinessColor = colors.yellow;
    }
    
    this.log(`\n🎯 PRODUCTION READINESS: ${readinessColor}${readiness}${colors.reset}`, 'info');
    
    if (readiness !== 'PRODUCTION READY') {
      this.log(`\n📋 NEXT STEPS:`, 'info');
      if (failed > 0) {
        this.log(`  1. Fix critical issues listed above`, 'info');
      }
      if (warnings > 0) {
        this.log(`  2. Review and address warnings`, 'info');
      }
      this.log(`  3. Run manual testing with real wallets`, 'info');
      this.log(`  4. Perform security assessment`, 'info');
      this.log(`  5. Test performance under load`, 'info');
    } else {
      this.log(`\n✅ RECOMMENDATIONS:`, 'info');
      this.log(`  1. Perform final manual testing`, 'info');
      this.log(`  2. Set up monitoring and alerting`, 'info');
      this.log(`  3. Prepare deployment documentation`, 'info');
      this.log(`  4. Train support team`, 'info');
    }
  }

  async runAllChecks() {
    this.log('Starting production readiness verification...', 'info');
    
    await this.checkPackageJson();
    await this.checkSecurity();
    await this.checkTesting();
    await this.checkDocumentation();
    await this.checkBuildProcess();
    await this.runNpmAudit();
    await this.checkBundleSize();
    
    await this.generateReport();
  }
}

// Run the verification
async function main() {
  const verifier = new ProductionVerifier();
  await verifier.runAllChecks();
}

main().catch(console.error); 