#!/usr/bin/env node

import { install, fake, seed } from 'zod-schema-faker';
import { z } from 'zod';
import axios from 'axios';
import chalk from 'chalk';
import { 
  DriveFileSchema, 
  DriveCreateFileSchema,
  CalendarEventSchema,
  CalendarCreateEventSchema,
  GmailMessageSchema,
  GmailSendMessageSchema,
  ContactPersonSchema,
  ContactCreateSchema,
  ApiErrorSchema
} from './schemas.js';
import { 
  API_CONFIG, 
  ENV, 
  DEFAULT_HEADERS, 
  ERROR_CODES, 
  TEST_CONFIG 
} from './config.js';

// Install zod-schema-faker
install();
seed(42); // For consistent test data

class GoogleAPITester {
  constructor() {
    this.results = {
      drive: { passed: 0, failed: 0, errors: [] },
      calendar: { passed: 0, failed: 0, errors: [] },
      gmail: { passed: 0, failed: 0, errors: [] },
      contacts: { passed: 0, failed: 0, errors: [] }
    };
    // Only use access token if it's not a placeholder value
    this.accessToken = (ENV.ACCESS_TOKEN && 
                       ENV.ACCESS_TOKEN !== 'your_access_token_here' && 
                       ENV.ACCESS_TOKEN.length > 10) ? ENV.ACCESS_TOKEN : null;
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

  logTestResult(api, test, success, error = null) {
    if (success) {
      this.results[api].passed++;
      this.log(`✅ ${api.toUpperCase()}: ${test}`, 'success');
    } else {
      this.results[api].failed++;
      this.results[api].errors.push({ test, error: error?.message || 'Unknown error' });
      this.log(`❌ ${api.toUpperCase()}: ${test} - ${error?.message || 'Failed'}`, 'error');
    }
  }

  // ============ API REQUEST HELPER ============
  async makeRequest(url, options = {}) {
    // If no access token and in mock mode, skip actual API calls
    if (!this.accessToken && ENV.TEST_MODE === 'mock') {
      this.log(`🔄 Skipping API call (no token): ${url}`, 'test');
      return { 
        success: true, 
        data: this.generateMockResponse(url), 
        status: 200,
        isMocked: true 
      };
    }

    const defaultOptions = {
      headers: {
        ...DEFAULT_HEADERS,
        ...(this.accessToken && { 'Authorization': `Bearer ${this.accessToken}` })
      },
      timeout: TEST_CONFIG.timeout,
      ...options
    };

    try {
      this.log(`🔄 Making request to: ${url}`, 'test');
      const response = await axios(url, defaultOptions);
      return { success: true, data: response.data, status: response.status };
    } catch (error) {
      const errorData = {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        details: error.response?.data
      };
      return errorData;
    }
  }

  // ============ MOCK RESPONSE GENERATOR ============
  generateMockResponse(url) {
    if (url.includes('/drive/v3/files')) {
      return {
        kind: 'drive#fileList',
        files: [
          fake(DriveFileSchema),
          fake(DriveFileSchema)
        ],
        nextPageToken: fake(z.string().optional()),
        incompleteSearch: false
      };
    }
    
    if (url.includes('/calendar/v3/calendars')) {
      return {
        kind: 'calendar#events',
        items: [
          fake(CalendarEventSchema),
          fake(CalendarEventSchema)
        ],
        summary: 'Test Calendar',
        timeZone: 'Asia/Kolkata'
      };
    }
    
    if (url.includes('/gmail/v1/users')) {
      return {
        messages: [
          { id: fake(z.string()), threadId: fake(z.string()) },
          { id: fake(z.string()), threadId: fake(z.string()) }
        ],
        resultSizeEstimate: 2
      };
    }
    
    if (url.includes('/people/v1/people')) {
      return {
        connections: [
          fake(ContactPersonSchema),
          fake(ContactPersonSchema)
        ],
        totalPeople: 2,
        totalItems: 2
      };
    }
    
    return { success: true, message: 'Mock response' };
  }

  // ============ GOOGLE DRIVE TESTS ============
  async testGoogleDrive() {
    this.log('🚀 Testing Google Drive API...', 'info');
    
    // Test 1: List files with mock data validation
    try {
      const mockFile = fake(DriveFileSchema);
      this.log(`Generated mock file: ${JSON.stringify(mockFile, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.DRIVE.baseUrl}${API_CONFIG.DRIVE.endpoints.files}`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        // Validate response structure
        try {
          if (result.data.files) {
            result.data.files.forEach(file => DriveFileSchema.parse(file));
          }
          const testName = result.isMocked ? 'List files + Schema validation (MOCK)' : 'List files + Schema validation';
          this.logTestResult('drive', testName, true);
        } catch (validationError) {
          this.logTestResult('drive', 'Response schema validation', false, validationError);
        }
      } else {
        this.logTestResult('drive', 'List files', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('drive', 'Drive API connection', false, error);
    }

    // Test 2: Create file with mock data
    try {
      const mockCreateFile = fake(DriveCreateFileSchema);
      this.log(`Mock create file data: ${JSON.stringify(mockCreateFile, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.DRIVE.baseUrl}${API_CONFIG.DRIVE.endpoints.files}`;
      const result = await this.makeRequest(url, {
        method: 'POST',
        data: mockCreateFile
      });
      
      const testName = result.isMocked ? 'Create file (MOCK data test)' : 'Create file (mock data)';
      this.logTestResult('drive', testName, result.success, 
        result.success ? null : new Error(`${result.status}: ${result.message}`)
      );
    } catch (error) {
      this.logTestResult('drive', 'Create file test', false, error);
    }
  }

  // ============ GOOGLE CALENDAR TESTS ============
  async testGoogleCalendar() {
    this.log('📅 Testing Google Calendar API...', 'info');
    
    // Test 1: List events
    try {
      const mockEvent = fake(CalendarEventSchema);
      this.log(`Generated mock event: ${JSON.stringify(mockEvent, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.CALENDAR.baseUrl}${API_CONFIG.CALENDAR.endpoints.events()}`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        try {
          if (result.data.items) {
            result.data.items.forEach(event => CalendarEventSchema.parse(event));
          }
          const testName = result.isMocked ? 'List events + Schema validation (MOCK)' : 'List events + Schema validation';
          this.logTestResult('calendar', testName, true);
        } catch (validationError) {
          this.logTestResult('calendar', 'Event schema validation', false, validationError);
        }
      } else {
        this.logTestResult('calendar', 'List events', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('calendar', 'Calendar API connection', false, error);
    }

    // Test 2: Create event with mock data
    try {
      const mockCreateEvent = fake(CalendarCreateEventSchema);
      // Ensure proper date format
      const now = new Date();
      const futureDate = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
      
      mockCreateEvent.start.dateTime = now.toISOString();
      mockCreateEvent.end.dateTime = futureDate.toISOString();
      
      this.log(`Mock create event: ${JSON.stringify(mockCreateEvent, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.CALENDAR.baseUrl}${API_CONFIG.CALENDAR.endpoints.events()}`;
      const result = await this.makeRequest(url, {
        method: 'POST',
        data: mockCreateEvent
      });
      
      const testName = result.isMocked ? 'Create event (MOCK data test)' : 'Create event (mock data)';
      this.logTestResult('calendar', testName, result.success,
        result.success ? null : new Error(`${result.status}: ${result.message}`)
      );
    } catch (error) {
      this.logTestResult('calendar', 'Create event test', false, error);
    }
  }

  // ============ GMAIL TESTS ============
  async testGmail() {
    this.log('📧 Testing Gmail API...', 'info');
    
    // Test 1: List messages
    try {
      const mockMessage = fake(GmailMessageSchema);
      this.log(`Generated mock message: ${JSON.stringify(mockMessage, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.GMAIL.baseUrl}${API_CONFIG.GMAIL.endpoints.messages()}`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        try {
          if (result.data.messages) {
            // Basic structure validation since full message needs individual fetch
            const testName = result.isMocked ? 'List messages (MOCK)' : 'List messages';
            this.logTestResult('gmail', testName, true);
          } else {
            this.logTestResult('gmail', 'List messages structure', false, new Error('No messages array'));
          }
        } catch (validationError) {
          this.logTestResult('gmail', 'Message schema validation', false, validationError);
        }
      } else {
        this.logTestResult('gmail', 'List messages', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('gmail', 'Gmail API connection', false, error);
    }

    // Test 2: Send email with mock data
    try {
      const mockSendMessage = fake(GmailSendMessageSchema);
      
      // Create a proper base64 encoded email
      const emailContent = `To: test@example.com\r\nSubject: Test Email\r\n\r\nThis is a test email from API tester.`;
      mockSendMessage.raw = Buffer.from(emailContent).toString('base64');
      
      this.log(`Mock send message: ${JSON.stringify(mockSendMessage, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.GMAIL.baseUrl}${API_CONFIG.GMAIL.endpoints.send()}`;
      const result = await this.makeRequest(url, {
        method: 'POST',
        data: mockSendMessage
      });
      
      const testName = result.isMocked ? 'Send email (MOCK data test)' : 'Send email (mock data)';
      this.logTestResult('gmail', testName, result.success,
        result.success ? null : new Error(`${result.status}: ${result.message}`)
      );
    } catch (error) {
      this.logTestResult('gmail', 'Send email test', false, error);
    }
  }

  // ============ GOOGLE CONTACTS TESTS ============
  async testGoogleContacts() {
    this.log('👥 Testing Google Contacts (People API)...', 'info');
    
    // Test 1: List contacts
    try {
      const mockPerson = fake(ContactPersonSchema);
      this.log(`Generated mock contact: ${JSON.stringify(mockPerson, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.CONTACTS.baseUrl}${API_CONFIG.CONTACTS.endpoints.people}`;
      const result = await this.makeRequest(url, {
        params: {
          personFields: 'names,emailAddresses,phoneNumbers'
        }
      });
      
      if (result.success) {
        try {
          if (result.data.connections) {
            result.data.connections.forEach(contact => ContactPersonSchema.parse(contact));
          }
          const testName = result.isMocked ? 'List contacts + Schema validation (MOCK)' : 'List contacts + Schema validation';
          this.logTestResult('contacts', testName, true);
        } catch (validationError) {
          this.logTestResult('contacts', 'Contact schema validation', false, validationError);
        }
      } else {
        this.logTestResult('contacts', 'List contacts', false, new Error(`${result.status}: ${result.message}`));
      }
    } catch (error) {
      this.logTestResult('contacts', 'Contacts API connection', false, error);
    }

    // Test 2: Create contact with mock data
    try {
      const mockCreateContact = fake(ContactCreateSchema);
      this.log(`Mock create contact: ${JSON.stringify(mockCreateContact, null, 2)}`, 'test');
      
      const url = `${API_CONFIG.CONTACTS.baseUrl}${API_CONFIG.CONTACTS.endpoints.createContact}`;
      const result = await this.makeRequest(url, {
        method: 'POST',
        data: mockCreateContact
      });
      
      const testName = result.isMocked ? 'Create contact (MOCK data test)' : 'Create contact (mock data)';
      this.logTestResult('contacts', testName, result.success,
        result.success ? null : new Error(`${result.status}: ${result.message}`)
      );
    } catch (error) {
      this.logTestResult('contacts', 'Create contact test', false, error);
    }
  }

  // ============ MAIN TEST RUNNER ============
  async runTests(specificAPI = null) {
    console.log(chalk.cyan.bold('🧪 GOOGLE APIS TESTER'));
    console.log(chalk.cyan('====================================='));
    console.log(chalk.yellow(`🔑 Auth Token: ${this.accessToken ? 'Available' : 'Missing'}`));
    console.log(chalk.yellow(`🧪 Test Mode: ${ENV.TEST_MODE}`));
    if (!this.accessToken && ENV.TEST_MODE === 'mock') {
      console.log(chalk.blue('📋 Running in MOCK mode (no auth needed) - Testing schemas only'));
    }
    console.log(chalk.yellow(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms`));
    console.log('');

    const apis = specificAPI ? [specificAPI] : ['drive', 'calendar', 'gmail', 'contacts'];
    
    for (const api of apis) {
      try {
        switch (api) {
          case 'drive':
            await this.testGoogleDrive();
            break;
          case 'calendar':
            await this.testGoogleCalendar();
            break;
          case 'gmail':
            await this.testGmail();
            break;
          case 'contacts':
            await this.testGoogleContacts();
            break;
          default:
            this.log(`Unknown API: ${api}`, 'error');
        }
        console.log(''); // Add spacing between APIs
      } catch (error) {
        this.log(`Fatal error testing ${api}: ${error.message}`, 'error');
      }
    }

    this.printSummary();
  }

  // ============ RESULTS SUMMARY ============
  printSummary() {
    console.log(chalk.cyan.bold('\n📊 TEST RESULTS SUMMARY'));
    console.log(chalk.cyan('====================================='));
    
    let totalPassed = 0;
    let totalFailed = 0;
    
    Object.entries(this.results).forEach(([api, result]) => {
      const status = result.failed === 0 ? chalk.green('✅ PASS') : chalk.red('❌ FAIL');
      console.log(`${api.toUpperCase().padEnd(10)} ${status} (${result.passed} passed, ${result.failed} failed)`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(chalk.red(`  └─ ${error.test}: ${error.error}`));
        });
      }
      
      totalPassed += result.passed;
      totalFailed += result.failed;
    });
    
    console.log('\n' + chalk.cyan('====================================='));
    console.log(`${chalk.green('Total Passed:')} ${totalPassed}`);
    console.log(`${chalk.red('Total Failed:')} ${totalFailed}`);
    
    if (totalFailed === 0) {
      console.log(chalk.green.bold('\n🎉 ALL TESTS PASSED!'));
    } else {
      console.log(chalk.red.bold('\n⚠️  SOME TESTS FAILED'));
      console.log(chalk.yellow('\nCommon issues:'));
      console.log('• Missing or invalid access token (401 errors)');
      console.log('• Insufficient OAuth scopes (403 errors)');
      console.log('• Rate limiting (429 errors)');
      console.log('• Network connectivity issues');
    }
  }
}

// ============ COMMAND LINE INTERFACE ============
async function main() {
  const args = process.argv.slice(2);
  const apiFlag = args.find(arg => arg.startsWith('--api='));
  const specificAPI = apiFlag ? apiFlag.split('=')[1] : null;
  
  const tester = new GoogleAPITester();
  await tester.runTests(specificAPI);
  
  // Exit with error code if tests failed
  const totalFailed = Object.values(tester.results).reduce((sum, result) => sum + result.failed, 0);
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
} 