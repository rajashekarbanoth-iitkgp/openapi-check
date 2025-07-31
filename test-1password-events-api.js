#!/usr/bin/env node

import { fake } from 'zod-schema-faker';
import { z } from 'zod';
import axios from 'axios';
import chalk from 'chalk';
import { 
  OnePasswordRequestSchema,
  OnePasswordAuditEventsResponseSchema,
  OnePasswordItemUsagesResponseSchema,
  OnePasswordSignInAttemptsResponseSchema,
  OnePasswordIntrospectionSchema,
  OnePasswordIntrospectionV2Schema,
  OnePasswordErrorSchema,
  OnePasswordAuditEventSchema,
  OnePasswordItemUsageSchema,
  OnePasswordSignInAttemptSchema,
  OnePasswordUserSchema,
  OnePasswordClientSchema,
  OnePasswordLocationSchema
} from './schemas.js';

// Install zod-schema-faker
import { install, seed } from 'zod-schema-faker';
install();
seed(42); // For consistent test data

class OnePasswordEventsAPITester {
  constructor() {
    this.baseUrl = 'https://events.1password.com';
    this.jwtToken = process.env.ONEPASSWORD_JWT_TOKEN || '';
    this.results = {
      introspection: { passed: 0, failed: 0, errors: [] },
      auditevents: { passed: 0, failed: 0, errors: [] },
      itemusages: { passed: 0, failed: 0, errors: [] },
      signinattempts: { passed: 0, failed: 0, errors: [] }
    };
  }

  // ============ LOGGING UTILITIES ============
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      test: chalk.cyan
    };
    console.log(`${chalk.gray(timestamp)} ${colors[type](`[${type.toUpperCase()}]`)} ${message}`);
  }

  logTestResult(test, success, error = null) {
    if (success) {
      this.results[test].passed++;
      this.log(`✅ ${test.toUpperCase()}: Test passed`, 'success');
    } else {
      this.results[test].failed++;
      this.results[test].errors.push({ test, error: error?.message || 'Unknown error' });
      this.log(`❌ ${test.toUpperCase()}: Test failed - ${error?.message || 'Failed'}`, 'error');
    }
  }

  // ============ API REQUEST HELPER ============
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': '1Password-Events-API-Tester/1.0',
        ...(this.jwtToken && { 'Authorization': `Bearer ${this.jwtToken}` })
      },
      timeout: 10000,
      ...options
    };

    try {
      this.log(`🔄 Making request to: ${endpoint}`, 'test');
      if (options.data) {
        this.log(`📋 Request data: ${JSON.stringify(options.data, null, 2)}`, 'test');
      }
      
      const response = await axios(url, defaultOptions);

      this.log(`📥 Response status: ${response.status}`, 'test');
      this.log(`📥 Response data: ${JSON.stringify(response.data, null, 2)}`, 'test');
      
      return { 
        success: true, 
        data: response.data, 
        status: response.status 
      };
    } catch (error) {
      const errorData = {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.Error?.Message || error.message,
        details: error.response?.data
      };
      
      this.log(`❌ Request failed: ${errorData.message}`, 'error');
      return errorData;
    }
  }

  // ============ SCHEMA VALIDATION ============
  validateSchema(data, schema, testName) {
    try {
      schema.parse(data);
      this.log(`✅ Schema validation passed for ${testName}`, 'success');
      return true;
    } catch (validationError) {
      this.log(`❌ Schema validation failed for ${testName}: ${validationError.message}`, 'error');
      return false;
    }
  }

  // ============ INTROSPECTION TESTS ============
  async testIntrospection() {
    this.log('🔍 Testing 1Password Introspection API...', 'info');
    
    // Test v2 introspection endpoint
    try {
      const result = await this.makeRequest('/api/v2/auth/introspect');
      
      if (result.success) {
        // Check if it's an error response (no JWT token)
        if (result.data.Error) {
          this.logTestResult('introspection', false, new Error(`API Error: ${result.data.Error.Message}`));
          
          // Show how to get a real JWT token
          this.log('📋 To get a real JWT-SA token:', 'info');
          this.log('   1. Go to https://1password.com/events-api/', 'info');
          this.log('   2. Sign in to your 1Password account', 'info');
          this.log('   3. Create a new Service Account', 'info');
          this.log('   4. Generate a JWT-SA token', 'info');
          this.log('   5. Set ONEPASSWORD_JWT_TOKEN environment variable', 'info');
          
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, OnePasswordIntrospectionV2Schema, 'introspection v2 response');
        this.logTestResult('introspection', isValid);
      } else {
        this.logTestResult('introspection', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('introspection', false, error);
    }
  }

  // ============ MOCK SUCCESSFUL RESPONSE TESTS ============
  async testMockSuccessfulResponses() {
    this.log('🎭 Testing Mock Successful Responses...', 'info');
    
    try {
      // Mock successful introspection response
      const mockIntrospectionResponse = {
        features: ['auditevents', 'itemusages', 'signinattempts'],
        issued_at: new Date().toISOString(),
        uuid: 'test-service-account-uuid'
      };
      
      const introspectionValid = this.validateSchema(mockIntrospectionResponse, OnePasswordIntrospectionV2Schema, 'mock introspection response');
      this.log(`✅ Mock introspection response validation: ${introspectionValid ? 'PASSED' : 'FAILED'}`, introspectionValid ? 'success' : 'error');
      
      // Mock successful audit events response
      const mockAuditEventsResponse = {
        items: [
          {
            action: 'view',
            actor_uuid: 'user-uuid-123',
            object_type: 'item',
            object_uuid: 'item-uuid-456',
            timestamp: new Date().toISOString(),
            uuid: 'event-uuid-789'
          }
        ],
        cursor: 'next-page-cursor',
        has_more: false
      };
      
      const auditEventsValid = this.validateSchema(mockAuditEventsResponse, OnePasswordAuditEventsResponseSchema, 'mock audit events response');
      this.log(`✅ Mock audit events response validation: ${auditEventsValid ? 'PASSED' : 'FAILED'}`, auditEventsValid ? 'success' : 'error');
      
      // Mock successful item usages response
      const mockItemUsagesResponse = {
        items: [
          {
            action: 'reveal',
            item_uuid: 'item-uuid-123',
            timestamp: new Date().toISOString(),
            uuid: 'usage-uuid-456',
            vault_uuid: 'vault-uuid-789'
          }
        ],
        cursor: 'next-page-cursor',
        has_more: false
      };
      
      const itemUsagesValid = this.validateSchema(mockItemUsagesResponse, OnePasswordItemUsagesResponseSchema, 'mock item usages response');
      this.log(`✅ Mock item usages response validation: ${itemUsagesValid ? 'PASSED' : 'FAILED'}`, itemUsagesValid ? 'success' : 'error');
      
      // Mock successful sign-in attempts response
      const mockSignInAttemptsResponse = {
        items: [
          {
            category: 'success',
            timestamp: new Date().toISOString(),
            type: 'credentials_ok',
            uuid: 'attempt-uuid-123'
          }
        ],
        cursor: 'next-page-cursor',
        has_more: false
      };
      
      const signInAttemptsValid = this.validateSchema(mockSignInAttemptsResponse, OnePasswordSignInAttemptsResponseSchema, 'mock sign-in attempts response');
      this.log(`✅ Mock sign-in attempts response validation: ${signInAttemptsValid ? 'PASSED' : 'FAILED'}`, signInAttemptsValid ? 'success' : 'error');
      
      const allValid = introspectionValid && auditEventsValid && itemUsagesValid && signInAttemptsValid;
      this.log(`🎯 Mock response validation summary: ${allValid ? 'ALL PASSED' : 'SOME FAILED'}`, allValid ? 'success' : 'error');
      
    } catch (error) {
      this.log(`❌ Mock response testing failed: ${error.message}`, 'error');
    }
  }

  // ============ AUDIT EVENTS TESTS ============
  async testAuditEvents() {
    this.log('📊 Testing 1Password Audit Events API...', 'info');
    
    try {
      // Test with reset cursor (no JWT required for structure validation)
      const requestData = {
        limit: 10,
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      };
      
      // Validate request data
      const validRequest = OnePasswordRequestSchema.safeParse(requestData);
      
      if (!validRequest.success) {
        this.logTestResult('auditevents', false, new Error(`Invalid request: ${validRequest.error.message}`));
        return;
      }

      const result = await this.makeRequest('/api/v1/auditevents', {
        method: 'POST',
        data: requestData
      });
      
      if (result.success) {
        // Check if it's an error response (no JWT token)
        if (result.data.Error) {
          this.logTestResult('auditevents', false, new Error(`API Error: ${result.data.Error.Message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, OnePasswordAuditEventsResponseSchema, 'audit events response');
        this.logTestResult('auditevents', isValid);
      } else {
        this.logTestResult('auditevents', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('auditevents', false, error);
    }
  }

  // ============ ITEM USAGES TESTS ============
  async testItemUsages() {
    this.log('📦 Testing 1Password Item Usages API...', 'info');
    
    try {
      const requestData = {
        limit: 5,
        start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
      };
      
      // Validate request data
      const validRequest = OnePasswordRequestSchema.safeParse(requestData);
      
      if (!validRequest.success) {
        this.logTestResult('itemusages', false, new Error(`Invalid request: ${validRequest.error.message}`));
        return;
      }

      const result = await this.makeRequest('/api/v1/itemusages', {
        method: 'POST',
        data: requestData
      });
      
      if (result.success) {
        // Check if it's an error response (no JWT token)
        if (result.data.Error) {
          this.logTestResult('itemusages', false, new Error(`API Error: ${result.data.Error.Message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, OnePasswordItemUsagesResponseSchema, 'item usages response');
        this.logTestResult('itemusages', isValid);
      } else {
        this.logTestResult('itemusages', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('itemusages', false, error);
    }
  }

  // ============ SIGN-IN ATTEMPTS TESTS ============
  async testSignInAttempts() {
    this.log('🔐 Testing 1Password Sign-In Attempts API...', 'info');
    
    try {
      const requestData = {
        limit: 5,
        start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      };
      
      // Validate request data
      const validRequest = OnePasswordRequestSchema.safeParse(requestData);
      
      if (!validRequest.success) {
        this.logTestResult('signinattempts', false, new Error(`Invalid request: ${validRequest.error.message}`));
        return;
      }

      const result = await this.makeRequest('/api/v1/signinattempts', {
        method: 'POST',
        data: requestData
      });
      
      if (result.success) {
        // Check if it's an error response (no JWT token)
        if (result.data.Error) {
          this.logTestResult('signinattempts', false, new Error(`API Error: ${result.data.Error.Message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, OnePasswordSignInAttemptsResponseSchema, 'sign-in attempts response');
        this.logTestResult('signinattempts', isValid);
      } else {
        this.logTestResult('signinattempts', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('signinattempts', false, error);
    }
  }

  // ============ MOCK DATA TESTS ============
  async testMockData() {
    this.log('🎭 Testing Mock Data Generation...', 'info');
    
    try {
      // Test mock audit event generation
      const mockAuditEvent = fake(OnePasswordAuditEventSchema);
      this.log(`Generated mock audit event: ${JSON.stringify(mockAuditEvent, null, 2)}`, 'test');
      
      // Test mock item usage generation
      const mockItemUsage = fake(OnePasswordItemUsageSchema);
      this.log(`Generated mock item usage: ${JSON.stringify(mockItemUsage, null, 2)}`, 'test');
      
      // Test mock sign-in attempt generation
      const mockSignInAttempt = fake(OnePasswordSignInAttemptSchema);
      this.log(`Generated mock sign-in attempt: ${JSON.stringify(mockSignInAttempt, null, 2)}`, 'test');
      
      // Test mock user generation
      const mockUser = fake(OnePasswordUserSchema);
      this.log(`Generated mock user: ${JSON.stringify(mockUser, null, 2)}`, 'test');
      
      // Test mock client generation
      const mockClient = fake(OnePasswordClientSchema);
      this.log(`Generated mock client: ${JSON.stringify(mockClient, null, 2)}`, 'test');
      
      // Test mock location generation
      const mockLocation = fake(OnePasswordLocationSchema);
      this.log(`Generated mock location: ${JSON.stringify(mockLocation, null, 2)}`, 'test');
      
      this.log('✅ Mock data generation tests passed', 'success');
    } catch (error) {
      this.log(`❌ Mock data generation failed: ${error.message}`, 'error');
    }
  }

  // ============ API STRUCTURE VALIDATION ============
  async testAPIStructure() {
    this.log('🏗️ Testing API Structure...', 'info');
    
    try {
      // Test all available servers
      const servers = [
        'https://events.1password.com',
        'https://events.1password.ca',
        'https://events.1password.eu',
        'https://events.ent.1password.com'
      ];
      
      let workingServers = 0;
      
      for (const server of servers) {
        try {
          const response = await axios.get(`${server}/api/v2/auth/introspect`, {
            timeout: 5000,
            headers: { 'Accept': 'application/json' }
          });
          
          if (response.status === 401) {
            this.log(`✅ Server ${server} is accessible (401 Unauthorized expected)`, 'success');
            workingServers++;
          } else {
            this.log(`⚠️ Server ${server} returned unexpected status: ${response.status}`, 'warning');
          }
        } catch (error) {
          this.log(`❌ Server ${server} is not accessible: ${error.message}`, 'error');
        }
      }
      
      if (workingServers > 0) {
        this.log(`✅ API structure validation passed (${workingServers}/${servers.length} servers accessible)`, 'success');
      } else {
        this.log('❌ API structure validation failed (no servers accessible)', 'error');
      }
    } catch (error) {
      this.log(`❌ API structure validation failed: ${error.message}`, 'error');
    }
  }

  // ============ RUN ALL TESTS ============
  async runTests() {
    console.log(chalk.cyan.bold('🚀 1PASSWORD EVENTS API TESTER'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Test mock data generation first
    await this.testMockData();
    
    // Test mock successful responses
    await this.testMockSuccessfulResponses();
    
    // Test API structure
    await this.testAPIStructure();
    
    // Test actual API endpoints
    await this.testIntrospection();
    await this.testAuditEvents();
    await this.testItemUsages();
    await this.testSignInAttempts();
    
    this.printSummary();
  }

  // ============ PRINT SUMMARY ============
  printSummary() {
    console.log(chalk.cyan.bold('\n📊 1PASSWORD EVENTS API TESTS SUMMARY'));
    console.log(chalk.gray('='.repeat(50)));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([test, result]) => {
      const status = result.failed === 0 ? chalk.green('✅ PASSED') : chalk.red('❌ FAILED');
      console.log(`${chalk.blue(test.toUpperCase())}: ${status} (${result.passed}/${result.passed + result.failed})`);
      
      if (result.errors.length > 0) {
        console.log(chalk.yellow(`   Errors: ${result.errors.map(e => e.error).join(', ')}`));
      }
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    console.log(chalk.gray('-'.repeat(50)));
    console.log(`Total: ${chalk.green(totalPassed)} passed, ${chalk.red(totalFailed)} failed`);
    
    if (totalFailed > 0) {
      console.log(chalk.yellow('\n⚠️  Note: Some tests failed due to missing JWT token.'));
      console.log(chalk.yellow('   Set ONEPASSWORD_JWT_TOKEN environment variable with a valid JWT-SA token to test live endpoints.'));
      console.log(chalk.yellow('   Get your JWT-SA token from: https://1password.com/events-api/'));
    }
    
    console.log(chalk.blue('\n📋 API Documentation: https://1password.com/events-api/'));
    console.log(chalk.blue('🔑 JWT-SA Token Guide: https://1password.com/events-api/getting-started/'));
  }
}

// ============ MAIN EXECUTION ============
async function main() {
  const tester = new OnePasswordEventsAPITester();
  await tester.runTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default OnePasswordEventsAPITester;