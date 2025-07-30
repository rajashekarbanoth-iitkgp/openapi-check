#!/usr/bin/env node

import { install, fake, seed } from 'zod-schema-faker';
import { z } from 'zod';
import axios from 'axios';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

// Install zod-schema-faker
install();
seed(42);

const TOKEN = process.env.GOOGLE_ACCESS_TOKEN;
const BASE_URL = 'https://people.googleapis.com/v1';

class AdvancedContactsAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testContactId = null;
    this.testContactGroupId = null;
    this.createdContacts = [];
    this.startTime = new Date();
    
    // Setup logging
    this.setupLogging();
  }

  setupLogging() {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Create timestamped log files
    const timestamp = this.startTime.toISOString().replace(/[:.]/g, '-');
    this.logFiles = {
      main: path.join(logsDir, `contacts-test-${timestamp}.log`),
      api: path.join(logsDir, `contacts-api-calls-${timestamp}.log`),
      results: path.join(logsDir, `contacts-results-${timestamp}.json`)
    };

    // Initialize log files
    this.writeToFile(this.logFiles.main, `👥 Google Contacts API Test Started: ${this.startTime.toISOString()}\n`);
    this.writeToFile(this.logFiles.api, `API Calls Log - Started: ${this.startTime.toISOString()}\n`);
    
    console.log(chalk.blue(`📝 Logging to files:`));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
    console.log('');
  }

  writeToFile(filepath, content) {
    try {
      fs.appendFileSync(filepath, content);
    } catch (error) {
      console.error(chalk.red(`Failed to write to log file: ${error.message}`));
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      test: chalk.cyan
    };
    
    // Console output with colors
    const coloredOutput = `${chalk.gray(timestamp)} ${colors[type](`[${type.toUpperCase()}]`)} ${message}`;
    console.log(coloredOutput);
    
    // File output without colors
    const fileOutput = `${timestamp} [${type.toUpperCase()}] ${message}\n`;
    this.writeToFile(this.logFiles.main, fileOutput);
  }

  logAPICall(method, url, requestData, response, duration) {
    const timestamp = new Date().toISOString();
    const apiLogEntry = {
      timestamp,
      method,
      url,
      requestData,
      response: {
        status: response.status,
        success: response.success,
        message: response.message,
        dataSize: response.data ? JSON.stringify(response.data).length : 0
      },
      duration
    };

    // Write detailed API log
    const apiLogLine = `${timestamp} ${method} ${url} - Status: ${response.status} - Duration: ${duration}ms\n`;
    this.writeToFile(this.logFiles.api, apiLogLine);
    
    // Store detailed JSON for analysis
    this.writeToFile(this.logFiles.api, `${JSON.stringify(apiLogEntry, null, 2)}\n---\n`);
  }

  logTestResult(test, success, error = null) {
    if (success) {
      this.results.passed++;
      this.log(`✅ ${test}`, 'success');
    } else {
      this.results.failed++;
      this.results.errors.push({ test, error: error?.message || 'Unknown error', timestamp: new Date().toISOString() });
      this.log(`❌ ${test} - ${error?.message || 'Failed'}`, 'error');
    }
  }

  async makeRequest(url, options = {}) {
    const startTime = Date.now();
    const method = options.method || 'GET';
    
    const defaultOptions = {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      },
      timeout: 15000,
      ...options
    };

    try {
      this.log(`🔄 ${method} ${url}`, 'test');
      const response = await axios(url, defaultOptions);
      const duration = Date.now() - startTime;
      
      const result = { success: true, data: response.data, status: response.status };
      
      // Log API call details
      this.logAPICall(method, url, options.data, result, duration);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result = {
        success: false,
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        details: error.response?.data
      };
      
      // Log failed API call
      this.logAPICall(method, url, options.data, result, duration);
      
      return result;
    }
  }

  // ============ CONTACT OPERATIONS ============

  async testListContacts() {
    this.log('📋 Testing List Contacts...', 'info');
    
    const personFields = 'names,emailAddresses,phoneNumbers,organizations,metadata';
    const url = `${BASE_URL}/people/me/connections?personFields=${personFields}&pageSize=20`;
    const result = await this.makeRequest(url);
    
    if (result.success) {
      const contacts = result.data.connections || [];
      this.logTestResult(`List Contacts (${contacts.length} contacts found)`, true);
      
      // Log contact details
      this.log(`Contacts found:`, 'info');
      contacts.slice(0, 5).forEach((contact, index) => {
        const name = contact.names?.[0]?.displayName || 'No name';
        const email = contact.emailAddresses?.[0]?.value || 'No email';
        this.log(`   ${index + 1}. ${name} (${email})`, 'test');
      });
      
      if (contacts.length > 5) {
        this.log(`   ... and ${contacts.length - 5} more contacts`, 'test');
      }
      
      return contacts;
    } else {
      this.logTestResult('List Contacts', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testCreateContact() {
    this.log('👤 Testing Create Contact...', 'info');
    
    const contactData = {
      names: [{
        givenName: `Test`,
        familyName: `Contact-${Date.now()}`,
        displayName: `Test Contact-${Date.now()}`
      }],
      emailAddresses: [{
        value: `test.contact.${Date.now()}@example.com`,
        type: 'work'
      }],
      phoneNumbers: [{
        value: '+1-555-0123-' + Math.floor(Math.random() * 1000),
        type: 'mobile'
      }],
      organizations: [{
        name: 'Test Company',
        title: 'Software Tester'
      }],
      biographies: [{
        value: 'This contact was created by the API tester for testing purposes.',
        contentType: 'TEXT_PLAIN'
      }]
    };

    const personFields = 'names,emailAddresses,phoneNumbers,organizations,biographies,metadata';
    const url = `${BASE_URL}/people:createContact?personFields=${personFields}`;
    
    const result = await this.makeRequest(url, {
      method: 'POST',
      data: contactData
    });

    if (result.success) {
      this.testContactId = result.data.resourceName;
      this.createdContacts.push(this.testContactId);
      
      const name = result.data.names?.[0]?.displayName || 'Unknown';
      this.logTestResult(`Create Contact (${name})`, true);
      
      this.log(`Contact created:`, 'info');
      this.log(`   Resource Name: ${this.testContactId}`, 'test');
      this.log(`   Display Name: ${name}`, 'test');
      this.log(`   Email: ${result.data.emailAddresses?.[0]?.value}`, 'test');
      this.log(`   Phone: ${result.data.phoneNumbers?.[0]?.value}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Create Contact', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  async testGetContact() {
    if (!this.testContactId) {
      this.logTestResult('Get Contact', false, new Error('No test contact available'));
      return;
    }

    this.log('📄 Testing Get Contact...', 'info');
    
    const personFields = 'names,emailAddresses,phoneNumbers,organizations,biographies,metadata,addresses';
    const url = `${BASE_URL}/${this.testContactId}?personFields=${personFields}`;
    const result = await this.makeRequest(url);

    if (result.success) {
      const name = result.data.names?.[0]?.displayName || 'Unknown';
      this.logTestResult(`Get Contact (${name})`, true);
      
      // Log detailed contact info
      this.log(`Contact details:`, 'info');
      this.log(`   Name: ${name}`, 'test');
      this.log(`   Resource Name: ${result.data.resourceName}`, 'test');
      
      if (result.data.emailAddresses) {
        result.data.emailAddresses.forEach((email, index) => {
          this.log(`   Email ${index + 1}: ${email.value} (${email.type || 'unknown'})`, 'test');
        });
      }
      
      if (result.data.phoneNumbers) {
        result.data.phoneNumbers.forEach((phone, index) => {
          this.log(`   Phone ${index + 1}: ${phone.value} (${phone.type || 'unknown'})`, 'test');
        });
      }
      
      return result.data;
    } else {
      this.logTestResult('Get Contact', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testUpdateContact() {
    if (!this.testContactId) {
      this.logTestResult('Update Contact', false, new Error('No test contact available'));
      return;
    }

    this.log('✏️ Testing Update Contact...', 'info');
    
    // First get the current contact to get the etag
    const personFields = 'names,emailAddresses,phoneNumbers,organizations,biographies,metadata';
    const getCurrentUrl = `${BASE_URL}/${this.testContactId}?personFields=${personFields}`;
    const currentResult = await this.makeRequest(getCurrentUrl);
    
    if (!currentResult.success) {
      this.logTestResult('Update Contact', false, new Error(`Failed to get current contact: ${currentResult.status}: ${currentResult.message}`));
      return;
    }
    
    // Get the etag from metadata
    const etag = currentResult.data.etag;
    if (!etag) {
      this.logTestResult('Update Contact', false, new Error('No etag found in contact metadata'));
      return;
    }
    
    const updateData = {
      resourceName: this.testContactId,
      etag: etag,  // Required for updates
      names: [{
        givenName: 'Updated Test',
        familyName: `Contact-${Date.now()}`,
        displayName: `Updated Test Contact-${Date.now()}`
      }],
      emailAddresses: [{
        value: `updated.test.contact.${Date.now()}@example.com`,
        type: 'work'
      }],
      organizations: [{
        name: 'Updated Test Company',
        title: 'Senior Software Tester'
      }]
    };

    const updateMask = 'names,emailAddresses,organizations';
    const url = `${BASE_URL}/${this.testContactId}:updateContact?personFields=${personFields}&updatePersonFields=${updateMask}`;
    
    const result = await this.makeRequest(url, {
      method: 'PATCH',
      data: updateData
    });

    if (result.success) {
      const newName = result.data.names?.[0]?.displayName || 'Unknown';
      this.logTestResult(`Update Contact (${newName})`, true);
      
      this.log(`Contact updated:`, 'info');
      this.log(`   New Name: ${newName}`, 'test');
      this.log(`   New Email: ${result.data.emailAddresses?.[0]?.value}`, 'test');
      this.log(`   New Organization: ${result.data.organizations?.[0]?.name}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Update Contact', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testSearchContacts() {
    this.log('🔍 Testing Search Contacts...', 'info');
    
    const searchQueries = [
      'Test',
      'example.com',
      'Software',
      'Company'
    ];

    let totalResults = 0;
    for (const query of searchQueries) {
      const personFields = 'names,emailAddresses,organizations';
      const url = `${BASE_URL}/people:searchContacts?query=${encodeURIComponent(query)}&pageSize=10&readMask=${personFields}`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        const count = result.data.results?.length || 0;
        totalResults += count;
        this.log(`   Query: "${query}" → ${count} results`, 'test');
        
        // Log some results
        if (count > 0) {
          result.data.results.slice(0, 2).forEach((item, index) => {
            const name = item.person?.names?.[0]?.displayName || 'No name';
            this.log(`     ${index + 1}. ${name}`, 'test');
          });
        }
      }
    }

    if (totalResults >= 0) {
      this.logTestResult(`Search Contacts (${searchQueries.length} queries, ${totalResults} total results)`, true);
    } else {
      this.logTestResult('Search Contacts', false, new Error('Search failed'));
    }
  }

  // ============ CONTACT GROUP OPERATIONS ============

  async testListContactGroups() {
    this.log('📁 Testing List Contact Groups...', 'info');
    
    const url = `${BASE_URL}/contactGroups?pageSize=20`;
    const result = await this.makeRequest(url);
    
    if (result.success) {
      const groups = result.data.contactGroups || [];
      this.logTestResult(`List Contact Groups (${groups.length} groups found)`, true);
      
      // Log group details
      this.log(`Contact groups found:`, 'info');
      groups.forEach((group, index) => {
        this.log(`   ${index + 1}. ${group.name} (${group.memberCount || 0} members) - ${group.groupType}`, 'test');
      });
      
      return groups;
    } else {
      this.logTestResult('List Contact Groups', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testCreateContactGroup() {
    this.log('📂 Testing Create Contact Group...', 'info');
    
    const groupData = {
      contactGroup: {
        name: `Test Group ${Date.now()}`
      }
    };

    const url = `${BASE_URL}/contactGroups`;
    const result = await this.makeRequest(url, {
      method: 'POST',
      data: groupData
    });

    if (result.success) {
      this.testContactGroupId = result.data.resourceName;
      this.logTestResult(`Create Contact Group (${result.data.name})`, true);
      
      this.log(`Contact group created:`, 'info');
      this.log(`   Name: ${result.data.name}`, 'test');
      this.log(`   Resource Name: ${this.testContactGroupId}`, 'test');
      this.log(`   Group Type: ${result.data.groupType}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Create Contact Group', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testUpdateContactGroup() {
    if (!this.testContactGroupId) {
      this.logTestResult('Update Contact Group', false, new Error('No test contact group available'));
      return;
    }

    this.log('✏️ Testing Update Contact Group...', 'info');
    
    // First get the current contact group to get the etag/fingerprint
    const getCurrentUrl = `${BASE_URL}/${this.testContactGroupId}`;
    const currentResult = await this.makeRequest(getCurrentUrl);
    
    if (!currentResult.success) {
      this.logTestResult('Update Contact Group', false, new Error(`Failed to get current group: ${currentResult.status}: ${currentResult.message}`));
      return;
    }
    
    // Get the etag from metadata
    const etag = currentResult.data.etag;
    if (!etag) {
      this.logTestResult('Update Contact Group', false, new Error('No etag/fingerprint found in contact group metadata'));
      return;
    }
    
    const updateData = {
      contactGroup: {
        resourceName: this.testContactGroupId,
        etag: etag,  // Required for updates
        name: `Updated Test Group ${Date.now()}`
      }
    };

    const url = `${BASE_URL}/${this.testContactGroupId}`;
    const result = await this.makeRequest(url, {
      method: 'PUT',
      data: updateData
    });

    if (result.success) {
      this.logTestResult(`Update Contact Group (${result.data.name})`, true);
      
      this.log(`Contact group updated:`, 'info');
      this.log(`   New Name: ${result.data.name}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Update Contact Group', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ BATCH OPERATIONS ============

  async testBatchCreateContacts() {
    this.log('👥 Testing Batch Create Contacts...', 'info');
    
    const batchData = {
      contacts: [
        {
          contactPerson: {
            names: [{
              givenName: 'Batch',
              familyName: `Contact1-${Date.now()}`,
              displayName: `Batch Contact 1-${Date.now()}`
            }],
            emailAddresses: [{
              value: `batch.contact1.${Date.now()}@example.com`
            }]
          }
        },
        {
          contactPerson: {
            names: [{
              givenName: 'Batch',
              familyName: `Contact2-${Date.now()}`,
              displayName: `Batch Contact 2-${Date.now()}`
            }],
            emailAddresses: [{
              value: `batch.contact2.${Date.now()}@example.com`
            }]
          }
        }
      ],
      readMask: 'names,emailAddresses,metadata'
    };

    const url = `${BASE_URL}/people:batchCreateContacts`;
    const result = await this.makeRequest(url, {
      method: 'POST',
      data: batchData
    });

    if (result.success) {
      const createdContacts = result.data.createdPeople || [];
      this.logTestResult(`Batch Create Contacts (${createdContacts.length} contacts created)`, true);
      
      // Store created contact IDs for cleanup
      createdContacts.forEach(contact => {
        if (contact.person?.resourceName) {
          this.createdContacts.push(contact.person.resourceName);
        }
      });
      
      this.log(`Batch contacts created:`, 'info');
      createdContacts.forEach((contact, index) => {
        const name = contact.person?.names?.[0]?.displayName || 'Unknown';
        this.log(`   ${index + 1}. ${name}`, 'test');
      });
      
      return createdContacts;
    } else {
      this.logTestResult('Batch Create Contacts', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ CLEANUP OPERATIONS ============

  async cleanup() {
    this.log('🧹 Cleaning up test contacts and groups...', 'info');
    
    // Delete test contacts
    for (const contactId of this.createdContacts) {
      try {
        const url = `${BASE_URL}/${contactId}:deleteContact`;
        await this.makeRequest(url, {
          method: 'DELETE'
        });
        this.log(`   Deleted contact: ${contactId}`, 'test');
      } catch (error) {
        this.log(`   Failed to delete contact: ${contactId}`, 'warning');
      }
    }

    // Delete test contact group
    if (this.testContactGroupId) {
      try {
        const url = `${BASE_URL}/${this.testContactGroupId}`;
        await this.makeRequest(url, {
          method: 'DELETE'
        });
        this.log(`   Deleted contact group: ${this.testContactGroupId}`, 'test');
      } catch (error) {
        this.log(`   Failed to delete contact group: ${this.testContactGroupId}`, 'warning');
      }
    }
  }

  // ============ SAVE RESULTS ============

  saveResults() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const finalResults = {
      testRun: {
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.round(duration / 1000)}s`,
        durationMs: duration
      },
      summary: {
        totalTests: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: `${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`
      },
      errors: this.results.errors,
      testData: {
        createdContactId: this.testContactId,
        createdContactGroupId: this.testContactGroupId,
        totalCreatedContacts: this.createdContacts.length
      },
      environment: {
        tokenAvailable: !!TOKEN,
        nodeVersion: process.version,
        timestamp: endTime.toISOString()
      }
    };

    // Save results as JSON
    this.writeToFile(this.logFiles.results, JSON.stringify(finalResults, null, 2));
    
    // Add summary to main log
    this.writeToFile(this.logFiles.main, `\n🏁 Test completed: ${endTime.toISOString()}\n`);
    this.writeToFile(this.logFiles.main, `Duration: ${Math.round(duration / 1000)}s\n`);
    this.writeToFile(this.logFiles.main, `Results: ${this.results.passed} passed, ${this.results.failed} failed\n`);
  }

  // ============ MAIN TEST RUNNER ============

  async runAdvancedTests() {
    console.log(chalk.cyan.bold('👥 ADVANCED GOOGLE CONTACTS API TESTER'));
    console.log(chalk.cyan('============================================='));
    console.log(chalk.yellow(`🔑 Auth Token: ${TOKEN ? 'Available' : 'Missing'}`));
    console.log('');

    if (!TOKEN || TOKEN === 'your_access_token_here') {
      console.log(chalk.red('❌ No valid access token found'));
      process.exit(1);
    }

    try {
      // Basic Contact Operations
      await this.testListContacts();
      await this.testCreateContact();
      await this.testGetContact();
      await this.testUpdateContact();
      await this.testSearchContacts();

      // Contact Group Operations
      await this.testListContactGroups();
      await this.testCreateContactGroup();
      await this.testUpdateContactGroup();

      // Batch Operations
      await this.testBatchCreateContacts();

      // Cleanup
      await this.cleanup();

    } catch (error) {
      this.log(`Fatal error: ${error.message}`, 'error');
    }

    this.saveResults();
    this.printSummary();
  }

  printSummary() {
    console.log('');
    console.log(chalk.cyan.bold('📊 ADVANCED CONTACTS TESTS SUMMARY'));
    console.log(chalk.cyan('============================================='));
    
    if (this.results.failed === 0) {
      console.log(chalk.green.bold('🎉 ALL ADVANCED TESTS PASSED!'));
      console.log(chalk.green(`✅ ${this.results.passed} operations successful`));
    } else {
      console.log(chalk.yellow(`⚠️  ${this.results.passed} passed, ${this.results.failed} failed`));
      
      if (this.results.errors.length > 0) {
        console.log('');
        console.log(chalk.red('❌ Failed operations:'));
        this.results.errors.forEach(error => {
          console.log(chalk.red(`  └─ ${error.test}: ${error.error}`));
        });
      }
    }

    console.log('');
    console.log(chalk.blue('🔧 Operations tested:'));
    console.log('• Contact Management: List, Create, Get, Update, Search');
    console.log('• Contact Groups: List, Create, Update');
    console.log('• Batch Operations: Batch create contacts');
    console.log('• Cleanup: Delete test contacts and groups');
    
    console.log('');
    console.log(chalk.blue('📝 Log files saved:'));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
  }
}

// Run the advanced tests
const tester = new AdvancedContactsAPITester();
tester.runAdvancedTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
}); 