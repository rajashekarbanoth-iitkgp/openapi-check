#!/usr/bin/env node

import { fake } from 'zod-schema-faker';
import { z } from 'zod';
import axios from 'axios';
import chalk from 'chalk';
import { 
  ForgeQuotesRequestSchema,
  ForgeSymbolsRequestSchema,
  ForgeConvertRequestSchema,
  ForgeQuoteSchema,
  ForgeSymbolListSchema,
  ForgeConvertResponseSchema,
  ForgeErrorResponseSchema
} from './schemas.js';

// Install zod-schema-faker
import { install, seed } from 'zod-schema-faker';
install();
seed(42); // For consistent test data

class ForgeAPITester {
  constructor() {
    this.baseUrl = 'https://api.1forge.com';
    this.apiKey = process.env.FORGE_API_KEY || '';
    this.results = {
      quotes: { passed: 0, failed: 0, errors: [] },
      symbols: { passed: 0, failed: 0, errors: [] },
      convert: { passed: 0, failed: 0, errors: [] }
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
  async makeRequest(endpoint, params = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const requestParams = {
      ...params,
      api_key: this.apiKey
    };

    try {
      this.log(`🔄 Making request to: ${endpoint}`, 'test');
      this.log(`📋 Parameters: ${JSON.stringify(requestParams)}`, 'test');
      
      const response = await axios.get(url, {
        params: requestParams,
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Forge-API-Tester/1.0'
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
        message: error.response?.data?.message || error.message,
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

  // ============ QUOTES TESTS ============
  async testQuotes() {
    this.log('📊 Testing 1Forge Quotes API...', 'info');
    
    // Test 1: Get quotes for EURUSD
    try {
      const requestParams = {
        pairs: 'EURUSD'
      };
      
      // Validate request parameters
      const validRequest = ForgeQuotesRequestSchema.safeParse({
        ...requestParams,
        api_key: this.apiKey
      });
      
      if (!validRequest.success) {
        this.logTestResult('quotes', false, new Error(`Invalid request: ${validRequest.error.message}`));
        return;
      }

      const result = await this.makeRequest('/quotes', requestParams);
      
      if (result.success) {
        // Check if it's an error response (API key invalid)
        if (result.data.error) {
          this.logTestResult('quotes', false, new Error(`API Error: ${result.data.message}`));
          return;
        }
        
        // Validate response schema
        if (Array.isArray(result.data)) {
          const isValid = this.validateSchema(result.data, z.array(ForgeQuoteSchema), 'quotes response');
          this.logTestResult('quotes', isValid);
        } else {
          this.logTestResult('quotes', false, new Error('Expected array response'));
        }
      } else {
        this.logTestResult('quotes', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('quotes', false, error);
    }
  }

  // ============ SYMBOLS TESTS ============
  async testSymbols() {
    this.log('📋 Testing 1Forge Symbols API...', 'info');
    
    try {
      const result = await this.makeRequest('/symbols');
      
      if (result.success) {
        // Check if it's an error response (API key invalid)
        if (result.data.error) {
          this.logTestResult('symbols', false, new Error(`API Error: ${result.data.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, ForgeSymbolListSchema, 'symbols response');
        this.logTestResult('symbols', isValid);
      } else {
        this.logTestResult('symbols', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('symbols', false, error);
    }
  }

  // ============ CONVERT TESTS ============
  async testConvert() {
    this.log('💱 Testing 1Forge Convert API...', 'info');
    
    try {
      const requestParams = {
        from: 'USD',
        to: 'EUR',
        quantity: 100
      };
      
      // Validate request parameters
      const validRequest = ForgeConvertRequestSchema.safeParse({
        ...requestParams,
        api_key: this.apiKey
      });
      
      if (!validRequest.success) {
        this.logTestResult('convert', false, new Error(`Invalid request: ${validRequest.error.message}`));
        return;
      }

      const result = await this.makeRequest('/convert', requestParams);
      
      if (result.success) {
        // Check if it's an error response (API key invalid)
        if (result.data.error) {
          this.logTestResult('convert', false, new Error(`API Error: ${result.data.message}`));
          return;
        }
        
        // Validate response schema
        const isValid = this.validateSchema(result.data, ForgeConvertResponseSchema, 'convert response');
        this.logTestResult('convert', isValid);
      } else {
        this.logTestResult('convert', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('convert', false, error);
    }
  }

  // ============ MOCK DATA TESTS ============
  async testMockData() {
    this.log('🎭 Testing Mock Data Generation...', 'info');
    
    try {
      // Test mock quote generation
      const mockQuote = fake(ForgeQuoteSchema);
      this.log(`Generated mock quote: ${JSON.stringify(mockQuote, null, 2)}`, 'test');
      
      // Test mock request generation
      const mockQuotesRequest = fake(ForgeQuotesRequestSchema);
      this.log(`Generated mock quotes request: ${JSON.stringify(mockQuotesRequest, null, 2)}`, 'test');
      
      // Test mock convert request generation
      const mockConvertRequest = fake(ForgeConvertRequestSchema);
      this.log(`Generated mock convert request: ${JSON.stringify(mockConvertRequest, null, 2)}`, 'test');
      
      this.log('✅ Mock data generation tests passed', 'success');
    } catch (error) {
      this.log(`❌ Mock data generation failed: ${error.message}`, 'error');
    }
  }

  // ============ RUN ALL TESTS ============
  async runTests() {
    console.log(chalk.cyan.bold('🚀 1FORGE API TESTER'));
    console.log(chalk.gray('='.repeat(50)));
    
    // Test mock data generation first
    await this.testMockData();
    
    // Test actual API endpoints
    await this.testQuotes();
    await this.testSymbols();
    await this.testConvert();
    
    this.printSummary();
  }

  // ============ PRINT SUMMARY ============
  printSummary() {
    console.log(chalk.cyan.bold('\n📊 1FORGE API TESTS SUMMARY'));
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
      console.log(chalk.yellow('\n⚠️  Note: Some tests failed due to invalid API key.'));
      console.log(chalk.yellow('   Set FORGE_API_KEY environment variable with a valid key to test live endpoints.'));
    }
  }
}

// ============ MAIN EXECUTION ============
async function main() {
  const tester = new ForgeAPITester();
  await tester.runTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ForgeAPITester;