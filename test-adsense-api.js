#!/usr/bin/env node

import { fake } from 'zod-schema-faker';
import { z } from 'zod';
import axios from 'axios';
import chalk from 'chalk';
import { 
  AdSenseAccountSchema,
  AdSenseAccountsSchema,
  AdSenseAdClientSchema,
  AdSenseAdClientsSchema,
  AdSenseAdUnitSchema,
  AdSenseAdUnitsSchema,
  AdSenseAdCodeSchema,
  AdSenseCustomChannelSchema,
  AdSenseCustomChannelsSchema,
  AdSenseUrlChannelSchema,
  AdSenseUrlChannelsSchema,
  AdSenseAlertSchema,
  AdSenseAlertsSchema,
  AdSensePaymentSchema,
  AdSensePaymentsSchema,
  AdSenseSavedAdStyleSchema,
  AdSenseSavedAdStylesSchema,
  AdSenseSavedReportSchema,
  AdSenseSavedReportsSchema,
  AdSenseReportSchema,
  AdSenseMetadataSchema,
  ApiErrorSchema
} from './schemas.js';

// Install zod-schema-faker
import { install, seed } from 'zod-schema-faker';
install();
seed(42); // For consistent test data

class AdSenseAPITester {
  constructor() {
    this.baseUrl = 'https://adsense.googleapis.com';
    this.accessToken = process.env.GOOGLE_ACCESS_TOKEN || '';
    this.results = {
      accounts: { passed: 0, failed: 0, errors: [] },
      adclients: { passed: 0, failed: 0, errors: [] },
      adunits: { passed: 0, failed: 0, errors: [] },
      customchannels: { passed: 0, failed: 0, errors: [] },
      urlchannels: { passed: 0, failed: 0, errors: [] },
      alerts: { passed: 0, failed: 0, errors: [] },
      payments: { passed: 0, failed: 0, errors: [] },
      reports: { passed: 0, failed: 0, errors: [] },
      savedreports: { passed: 0, failed: 0, errors: [] }
    };
    this.testAccountId = null;
    this.testAdClientId = null;
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
  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Handle arrays for explode: true parameters (like metrics, dimensions)
    const requestParams = {};
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        // For arrays, we need to pass them as separate parameters with the same key
        // This will be handled by axios paramsSerializer
        requestParams[key] = value;
      } else {
        requestParams[key] = value;
      }
    }
    
    requestParams.access_token = this.accessToken;

    try {
      this.log(`🔄 Making request to: ${endpoint}`, 'test');
      this.log(`📋 Parameters: ${JSON.stringify(requestParams)}`, 'test');
      
      const response = await axios.get(url, {
        params: requestParams,
        paramsSerializer: {
          serialize: (params) => {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
              if (Array.isArray(value)) {
                // For arrays, add each item as a separate parameter with the same key
                value.forEach(item => searchParams.append(key, item));
              } else {
                searchParams.append(key, value);
              }
            }
            return searchParams.toString();
          }
        },
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'AdSense-API-Tester/1.0'
        }
      });

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
        message: error.response?.data?.error?.message || error.message,
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

  // ============ ACCOUNTS TESTS ============
  async testAccounts() {
    this.log('📊 Testing AdSense Accounts API...', 'info');
    
    try {
      const result = await this.makeRequest('/v2/accounts');
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('accounts', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseAccountsSchema, 'accounts response');
        
        if (isValid && result.data.accounts && result.data.accounts.length > 0) {
          // Store first account ID for other tests
          this.testAccountId = result.data.accounts[0].name.split('/').pop(); // Extract account ID from name
          this.log(`📋 Using test account ID: ${this.testAccountId}`, 'info');
        }
        
        this.logTestResult('accounts', isValid);
      } else {
        this.logTestResult('accounts', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('accounts', false, error);
    }
  }

  // ============ AD CLIENTS TESTS ============
  async testAdClients() {
    this.log('📋 Testing AdSense Ad Clients API...', 'info');
    
    try {
      // In AdSense API v2, we need to get accounts first, then adclients
      const accountsResult = await this.makeRequest('/v2/accounts');
      
      if (accountsResult.success && accountsResult.data.accounts && accountsResult.data.accounts.length > 0) {
        const accountId = accountsResult.data.accounts[0].name.split('/').pop(); // Extract account ID from name
        const result = await this.makeRequest(`/v2/accounts/${accountId}/adclients`);
        
        if (result.success) {
          // Check if it's an error response (no access token)
          if (result.data.error) {
            this.logTestResult('adclients', false, new Error(`API Error: ${result.data.error.message}`));
            return;
          }
          
          // Validate response schema
          const isValid = this.validateSchema(result.data, AdSenseAdClientsSchema, 'adclients response');
          
          if (isValid && result.data.adClients && result.data.adClients.length > 0) {
            // Store first ad client ID for other tests
            this.testAdClientId = result.data.adClients[0].name.split('/').pop(); // Extract ad client ID from name
            this.log(`📋 Using test ad client ID: ${this.testAdClientId}`, 'info');
          }
          
          this.logTestResult('adclients', isValid);
        } else {
          this.logTestResult('adclients', false, new Error(`${result.status}: ${result.message}`));
        }
      } else {
        this.logTestResult('adclients', false, new Error('No accounts found'));
      }
    } catch (error) {
      this.logTestResult('adclients', false, error);
    }
  }

  // ============ AD UNITS TESTS ============
  async testAdUnits() {
    this.log('📦 Testing AdSense Ad Units API...', 'info');
    
    if (!this.testAdClientId) {
      this.logTestResult('adunits', false, new Error('No ad client ID available for testing'));
      return;
    }
    
    try {
      // In AdSense API v2, we need account ID and ad client ID
              if (!this.testAccountId) {
          const accountsResult = await this.makeRequest('/v2/accounts');
        if (accountsResult.success && accountsResult.data.accounts && accountsResult.data.accounts.length > 0) {
          this.testAccountId = accountsResult.data.accounts[0].name.split('/').pop();
        }
      }
      
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/adclients/${this.testAdClientId}/adunits`);
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('adunits', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseAdUnitsSchema, 'adunits response');
        this.logTestResult('adunits', isValid);
      } else {
        this.logTestResult('adunits', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('adunits', false, error);
    }
  }

  // ============ CUSTOM CHANNELS TESTS ============
  async testCustomChannels() {
    this.log('🎯 Testing AdSense Custom Channels API...', 'info');
    
    if (!this.testAdClientId) {
      this.logTestResult('customchannels', false, new Error('No ad client ID available for testing'));
      return;
    }
    
    try {
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/adclients/${this.testAdClientId}/customchannels`);
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('customchannels', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseCustomChannelsSchema, 'customchannels response');
        this.logTestResult('customchannels', isValid);
      } else {
        this.logTestResult('customchannels', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('customchannels', false, error);
    }
  }

  // ============ URL CHANNELS TESTS ============
  async testUrlChannels() {
    this.log('🔗 Testing AdSense URL Channels API...', 'info');
    
    if (!this.testAdClientId) {
      this.logTestResult('urlchannels', false, new Error('No ad client ID available for testing'));
      return;
    }
    
    try {
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/adclients/${this.testAdClientId}/urlchannels`);
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('urlchannels', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseUrlChannelsSchema, 'urlchannels response');
        this.logTestResult('urlchannels', isValid);
      } else {
        this.logTestResult('urlchannels', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('urlchannels', false, error);
    }
  }

  // ============ ALERTS TESTS ============
  async testAlerts() {
    this.log('⚠️ Testing AdSense Alerts API...', 'info');
    
    try {
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/alerts`);
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('alerts', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseAlertsSchema, 'alerts response');
        this.logTestResult('alerts', isValid);
      } else {
        this.logTestResult('alerts', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('alerts', false, error);
    }
  }

  // ============ PAYMENTS TESTS ============
  async testPayments() {
    this.log('💰 Testing AdSense Payments API...', 'info');
    
    try {
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/payments`);
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('payments', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSensePaymentsSchema, 'payments response');
        this.logTestResult('payments', isValid);
      } else {
        this.logTestResult('payments', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('payments', false, error);
    }
  }

  // ============ REPORTS TESTS ============
  async testReports() {
    this.log('📈 Testing AdSense Reports API...', 'info');
    
    try {
      // Test basic report generation
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/reports:generate`, {
        'startDate.year': new Date(startDate).getFullYear(),
        'startDate.month': new Date(startDate).getMonth() + 1,
        'startDate.day': new Date(startDate).getDate(),
        'endDate.year': new Date(endDate).getFullYear(),
        'endDate.month': new Date(endDate).getMonth() + 1,
        'endDate.day': new Date(endDate).getDate(),
        metrics: ['PAGE_VIEWS', 'CLICKS'],
        dimensions: ['DATE']
      });
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('reports', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseReportSchema, 'reports response');
        this.logTestResult('reports', isValid);
      } else {
        this.logTestResult('reports', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('reports', false, error);
    }
  }



  // ============ SAVED REPORTS TESTS ============
  async testSavedReports() {
    this.log('📋 Testing AdSense Saved Reports API...', 'info');
    
    try {
      const result = await this.makeRequest(`/v2/accounts/${this.testAccountId}/reports/saved`);
      
      if (result.success) {
        // Check if it's an error response (no access token)
        if (result.data.error) {
          this.logTestResult('savedreports', false, new Error(`API Error: ${result.data.error.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, AdSenseSavedReportsSchema, 'savedreports response');
        this.logTestResult('savedreports', isValid);
      } else {
        this.logTestResult('savedreports', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('savedreports', false, error);
    }
  }

  // ============ MOCK DATA TESTS ============
  async testMockData() {
    this.log('🎭 Testing Mock Data Generation...', 'info');
    
    try {
      // Test mock account generation with shorter strings
      const mockAccount = fake(AdSenseAccountSchema, {
        string: { length: { min: 5, max: 20 } }
      });
      this.log(`Generated mock account: ${JSON.stringify(mockAccount, null, 2)}`, 'test');
      
      // Test mock ad client generation
      const mockAdClient = fake(AdSenseAdClientSchema, {
        string: { length: { min: 5, max: 20 } }
      });
      this.log(`Generated mock ad client: ${JSON.stringify(mockAdClient, null, 2)}`, 'test');
      
      // Test mock ad unit generation
      const mockAdUnit = fake(AdSenseAdUnitSchema, {
        string: { length: { min: 5, max: 20 } }
      });
      this.log(`Generated mock ad unit: ${JSON.stringify(mockAdUnit, null, 2)}`, 'test');
      
      // Test mock custom channel generation
      const mockCustomChannel = fake(AdSenseCustomChannelSchema, {
        string: { length: { min: 5, max: 20 } }
      });
      this.log(`Generated mock custom channel: ${JSON.stringify(mockCustomChannel, null, 2)}`, 'test');
      
      // Test mock alert generation
      const mockAlert = fake(AdSenseAlertSchema, {
        string: { length: { min: 5, max: 50 } }
      });
      this.log(`Generated mock alert: ${JSON.stringify(mockAlert, null, 2)}`, 'test');
      
      // Test mock payment generation
      const mockPayment = fake(AdSensePaymentSchema, {
        string: { length: { min: 5, max: 20 } }
      });
      this.log(`Generated mock payment: ${JSON.stringify(mockPayment, null, 2)}`, 'test');
      
      // Test mock report generation
      const mockReport = fake(AdSenseReportSchema, {
        string: { length: { min: 5, max: 20 } }
      });
      this.log(`Generated mock report: ${JSON.stringify(mockReport, null, 2)}`, 'test');
      
      this.log('✅ Mock data generation tests passed', 'success');
    } catch (error) {
      this.log(`❌ Mock data generation failed: ${error.message}`, 'error');
    }
  }

  // ============ MOCK SUCCESSFUL RESPONSE TESTS ============
  async testMockSuccessfulResponses() {
    this.log('🎭 Testing Mock Successful Responses...', 'info');
    
    try {
      // Mock successful accounts response
      const mockAccountsResponse = {
        kind: 'adsense#accounts',
        etag: 'test-etag',
        items: [
          {
            id: 'pub-1234567890123456',
            name: 'Test Publisher Account',
            kind: 'adsense#account',
            creation_time: '2023-01-01T00:00:00Z',
            premium: false,
            timezone: 'America/New_York'
          }
        ],
        nextPageToken: null
      };
      
      const accountsValid = this.validateSchema(mockAccountsResponse, AdSenseAccountsSchema, 'mock accounts response');
      this.log(`✅ Mock accounts response validation: ${accountsValid ? 'PASSED' : 'FAILED'}`, accountsValid ? 'success' : 'error');
      
      // Mock successful ad clients response
      const mockAdClientsResponse = {
        kind: 'adsense#adClients',
        etag: 'test-etag',
        items: [
          {
            id: 'ca-pub-1234567890123456',
            kind: 'adsense#adClient',
            arcOptIn: true,
            productCode: 'AFC',
            supportsReporting: true
          }
        ],
        nextPageToken: null
      };
      
      const adClientsValid = this.validateSchema(mockAdClientsResponse, AdSenseAdClientsSchema, 'mock adclients response');
      this.log(`✅ Mock adclients response validation: ${adClientsValid ? 'PASSED' : 'FAILED'}`, adClientsValid ? 'success' : 'error');
      
      // Mock successful ad units response
      const mockAdUnitsResponse = {
        kind: 'adsense#adUnits',
        etag: 'test-etag',
        items: [
          {
            id: 'ca-pub-1234567890123456:1234567890',
            name: 'Test Ad Unit',
            code: 'test-ad-unit',
            kind: 'adsense#adUnit',
            status: 'ACTIVE',
            contentAdsSettings: {
              type: 'text',
              size: '728x90'
            }
          }
        ],
        nextPageToken: null
      };
      
      const adUnitsValid = this.validateSchema(mockAdUnitsResponse, AdSenseAdUnitsSchema, 'mock adunits response');
      this.log(`✅ Mock adunits response validation: ${adUnitsValid ? 'PASSED' : 'FAILED'}`, adUnitsValid ? 'success' : 'error');
      
      // Mock successful report response
      const mockReportResponse = {
        startDate: {
          year: 2023,
          month: 1,
          day: 1
        },
        endDate: {
          year: 2023,
          month: 1,
          day: 7
        },
        totalMatchedRows: '7',
        headers: [
          { name: 'DATE', type: 'DIMENSION' },
          { name: 'PAGE_VIEWS', type: 'METRIC_TALLY' },
          { name: 'CLICKS', type: 'METRIC_TALLY' }
        ],
        rows: [
          {
            cells: [
              { value: '2023-01-01' },
              { value: '1000' },
              { value: '50' }
            ]
          },
          {
            cells: [
              { value: '2023-01-02' },
              { value: '1200' },
              { value: '60' }
            ]
          }
        ],
        totals: {
          cells: [
            { value: '' },
            { value: '2200' },
            { value: '110' }
          ]
        },
        averages: {
          cells: [
            { value: '' },
            { value: '1100' },
            { value: '55' }
          ]
        },
        warnings: []
      };
      
      const reportValid = this.validateSchema(mockReportResponse, AdSenseReportSchema, 'mock report response');
      this.log(`✅ Mock report response validation: ${reportValid ? 'PASSED' : 'FAILED'}`, reportValid ? 'success' : 'error');
      
      const allValid = accountsValid && adClientsValid && adUnitsValid && reportValid;
      this.log(`🎯 Mock response validation summary: ${allValid ? 'ALL PASSED' : 'SOME FAILED'}`, allValid ? 'success' : 'error');
      
    } catch (error) {
      this.log(`❌ Mock response testing failed: ${error.message}`, 'error');
    }
  }

  // ============ RUN ALL TESTS ============
  async runTests() {
    console.log(chalk.cyan.bold('🚀 GOOGLE ADSENSE API TESTER'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Test mock data generation first
    await this.testMockData();
    
    // Test mock successful responses
    await this.testMockSuccessfulResponses();
    
    // Test actual API endpoints
    await this.testAccounts();
    await this.testAdClients();
    await this.testAdUnits();
    await this.testCustomChannels();
    await this.testUrlChannels();
    await this.testAlerts();
    await this.testPayments();
    await this.testReports();
    await this.testSavedReports();
    
    this.printSummary();
  }

  // ============ PRINT SUMMARY ============
  printSummary() {
    console.log(chalk.cyan.bold('\n📊 GOOGLE ADSENSE API TESTS SUMMARY'));
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
      console.log(chalk.yellow('\n⚠️  Note: Some tests failed due to missing access token.'));
      console.log(chalk.yellow('   Set GOOGLE_ACCESS_TOKEN environment variable with a valid token to test live endpoints.'));
      console.log(chalk.yellow('   Get your access token from: https://developers.google.com/oauthplayground/'));
    }
    
    console.log(chalk.blue('\n📋 API Documentation: https://developers.google.com/adsense/management/'));
    console.log(chalk.blue('🔑 OAuth Playground: https://developers.google.com/oauthplayground/'));
  }
}

// ============ MAIN EXECUTION ============
async function main() {
  const tester = new AdSenseAPITester();
  await tester.runTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default AdSenseAPITester; 