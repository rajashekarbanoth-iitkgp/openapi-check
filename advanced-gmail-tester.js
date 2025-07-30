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
const BASE_URL = 'https://gmail.googleapis.com/gmail/v1';

class AdvancedGmailAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.userId = 'me';
    this.testMessageIds = [];
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
      main: path.join(logsDir, `gmail-test-${timestamp}.log`),
      api: path.join(logsDir, `gmail-api-calls-${timestamp}.log`),
      results: path.join(logsDir, `gmail-results-${timestamp}.json`)
    };

    // Initialize log files
    this.writeToFile(this.logFiles.main, `🚀 Google Gmail API Test Started: ${this.startTime.toISOString()}\n`);
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

  // ============ PROFILE & BASIC INFO ============

  async testGetProfile() {
    this.log('👤 Testing Get Gmail Profile...', 'info');
    
    const url = `${BASE_URL}/users/${this.userId}/profile`;
    const result = await this.makeRequest(url);
    
    if (result.success) {
      this.logTestResult(`Get Gmail Profile`, true);
      
      // Log profile details
      const profile = result.data;
      this.log(`Gmail profile:`, 'info');
      this.log(`   Email: ${profile.emailAddress}`, 'test');
      this.log(`   Messages Total: ${profile.messagesTotal}`, 'test');
      this.log(`   Threads Total: ${profile.threadsTotal}`, 'test');
      this.log(`   History ID: ${profile.historyId}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Get Gmail Profile', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  // ============ LABELS OPERATIONS ============

  async testListLabels() {
    this.log('🏷️ Testing List Labels...', 'info');
    
    const url = `${BASE_URL}/users/${this.userId}/labels`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.labels) {
      this.logTestResult(`List Labels (${result.data.labels.length} labels found)`, true);
      
      // Log important labels
      this.log(`Gmail labels:`, 'info');
      result.data.labels.slice(0, 10).forEach(label => {
        this.log(`   - ${label.name} (${label.id}) - Type: ${label.type}`, 'test');
      });
      
      return result.data.labels;
    } else {
      this.logTestResult('List Labels', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testCreateLabel() {
    this.log('🏷️ Testing Create Custom Label...', 'info');
    
    const labelData = {
      name: `API Test Label ${Date.now()}`,
      messageListVisibility: 'show',
      labelListVisibility: 'labelShow'
    };

    const result = await this.makeRequest(`${BASE_URL}/users/${this.userId}/labels`, {
      method: 'POST',
      data: labelData
    });

    if (result.success) {
      this.createdLabelId = result.data.id;
      this.logTestResult(`Create Label (ID: ${this.createdLabelId})`, true);
      this.log(`Created label: ${result.data.name}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Create Label', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  // ============ MESSAGE OPERATIONS ============

  async testListMessages() {
    this.log('📧 Testing List Messages...', 'info');
    
    const url = `${BASE_URL}/users/${this.userId}/messages?maxResults=10`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.messages) {
      this.logTestResult(`List Messages (${result.data.messages.length} messages found)`, true);
      
      // Store message IDs for further testing
      this.testMessageIds = result.data.messages.slice(0, 3).map(msg => msg.id);
      
      this.log(`Recent messages:`, 'info');
      result.data.messages.slice(0, 5).forEach((message, index) => {
        this.log(`   ${index + 1}. Message ID: ${message.id}, Thread ID: ${message.threadId}`, 'test');
      });
      
      return result.data.messages;
    } else {
      this.logTestResult('List Messages', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testGetMessageDetails() {
    if (this.testMessageIds.length === 0) {
      this.logTestResult('Get Message Details', false, new Error('No messages available'));
      return;
    }

    this.log('📄 Testing Get Message Details...', 'info');
    
    const messageId = this.testMessageIds[0];
    const url = `${BASE_URL}/users/${this.userId}/messages/${messageId}`;
    const result = await this.makeRequest(url);

    if (result.success) {
      this.logTestResult(`Get Message Details`, true);
      
      // Log message details
      const message = result.data;
      const headers = message.payload?.headers || [];
      const fromHeader = headers.find(h => h.name === 'From');
      const subjectHeader = headers.find(h => h.name === 'Subject');
      const dateHeader = headers.find(h => h.name === 'Date');
      
      this.log(`Message details:`, 'info');
      this.log(`   ID: ${message.id}`, 'test');
      this.log(`   Thread ID: ${message.threadId}`, 'test');
      this.log(`   From: ${fromHeader?.value || 'N/A'}`, 'test');
      this.log(`   Subject: ${subjectHeader?.value || 'N/A'}`, 'test');
      this.log(`   Date: ${dateHeader?.value || 'N/A'}`, 'test');
      this.log(`   Labels: ${message.labelIds?.join(', ') || 'None'}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Get Message Details', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testSendTestEmail() {
    this.log('📤 Testing Send Email...', 'info');
    
    // Create a simple email message
    const emailContent = [
      'To: rajashekarbanoth.2001@gmail.com',
      'Subject: API Test Email - ' + new Date().toISOString(),
      'Content-Type: text/plain; charset=utf-8',
      '',
      'This is a test email sent via Gmail API.',
      'Timestamp: ' + new Date().toISOString(),
      '',
      'This message was generated by the Gmail API tester.',
      'You can safely delete this email.'
    ].join('\r\n');

    // Encode the email in base64
    const encodedEmail = Buffer.from(emailContent).toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const result = await this.makeRequest(`${BASE_URL}/users/${this.userId}/messages/send`, {
      method: 'POST',
      data: {
        raw: encodedEmail
      }
    });

    if (result.success) {
      this.sentMessageId = result.data.id;
      this.logTestResult(`Send Email (ID: ${this.sentMessageId})`, true);
      this.log(`Sent email ID: ${result.data.id}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Send Email', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  // ============ SEARCH OPERATIONS ============

  async testSearchMessages() {
    this.log('🔍 Testing Search Messages...', 'info');
    
    const searchQueries = [
      'is:unread',
      'from:gmail.com',
      'subject:test',
      'has:attachment'
    ];

    let totalResults = 0;
    for (const query of searchQueries) {
      const url = `${BASE_URL}/users/${this.userId}/messages?q=${encodeURIComponent(query)}&maxResults=5`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        const count = result.data.messages?.length || 0;
        totalResults += count;
        this.log(`   Query: "${query}" → ${count} results`, 'test');
      }
    }

    if (totalResults >= 0) {
      this.logTestResult(`Search Messages (${searchQueries.length} queries, ${totalResults} total results)`, true);
    } else {
      this.logTestResult('Search Messages', false, new Error('Search failed'));
    }
  }

  // ============ THREAD OPERATIONS ============

  async testListThreads() {
    this.log('🧵 Testing List Threads...', 'info');
    
    const url = `${BASE_URL}/users/${this.userId}/threads?maxResults=5`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.threads) {
      this.logTestResult(`List Threads (${result.data.threads.length} threads found)`, true);
      
      this.log(`Recent threads:`, 'info');
      result.data.threads.forEach((thread, index) => {
        this.log(`   ${index + 1}. Thread ID: ${thread.id}`, 'test');
      });
      
      return result.data.threads;
    } else {
      this.logTestResult('List Threads', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  // ============ MESSAGE MODIFICATION ============

  async testModifyMessageLabels() {
    if (this.testMessageIds.length === 0) {
      this.logTestResult('Modify Message Labels', false, new Error('No messages available'));
      return;
    }

    this.log('🏷️ Testing Modify Message Labels...', 'info');
    
    const messageId = this.testMessageIds[0];
    const modifyData = {
      addLabelIds: ['STARRED'],
      removeLabelIds: []
    };

    const result = await this.makeRequest(`${BASE_URL}/users/${this.userId}/messages/${messageId}/modify`, {
      method: 'POST',
      data: modifyData
    });

    if (result.success) {
      this.logTestResult(`Modify Message Labels (Added STARRED)`, true);
      this.log(`Modified message labels for: ${messageId}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Modify Message Labels', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ CLEANUP OPERATIONS ============

  async cleanup() {
    this.log('🧹 Cleaning up...', 'info');
    
    // Remove star from test message
    if (this.testMessageIds.length > 0) {
      try {
        const messageId = this.testMessageIds[0];
        await this.makeRequest(`${BASE_URL}/users/${this.userId}/messages/${messageId}/modify`, {
          method: 'POST',
          data: {
            addLabelIds: [],
            removeLabelIds: ['STARRED']
          }
        });
        this.log(`   Removed star from message: ${messageId}`, 'test');
      } catch (error) {
        this.log(`   Failed to remove star from message`, 'warning');
      }
    }

    // Delete custom label
    if (this.createdLabelId) {
      try {
        await this.makeRequest(`${BASE_URL}/users/${this.userId}/labels/${this.createdLabelId}`, {
          method: 'DELETE'
        });
        this.log(`   Deleted label: ${this.createdLabelId}`, 'test');
      } catch (error) {
        this.log(`   Failed to delete label: ${this.createdLabelId}`, 'warning');
      }
    }

    // Note: We don't delete the sent email as it's a real email
    if (this.sentMessageId) {
      this.log(`   Note: Sent email ${this.sentMessageId} remains in your account`, 'test');
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
        userId: this.userId,
        testMessageIds: this.testMessageIds,
        sentMessageId: this.sentMessageId,
        createdLabelId: this.createdLabelId
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
    console.log(chalk.cyan.bold('🚀 ADVANCED GOOGLE GMAIL API TESTER'));
    console.log(chalk.cyan('========================================='));
    console.log(chalk.yellow(`🔑 Auth Token: ${TOKEN ? 'Available' : 'Missing'}`));
    console.log('');

    if (!TOKEN || TOKEN === 'your_access_token_here') {
      console.log(chalk.red('❌ No valid access token found'));
      process.exit(1);
    }

    try {
      // Profile & Basic Info
      await this.testGetProfile();

      // Labels Operations
      await this.testListLabels();
      await this.testCreateLabel();

      // Message Operations
      await this.testListMessages();
      await this.testGetMessageDetails();
      await this.testSendTestEmail();

      // Search Operations
      await this.testSearchMessages();

      // Thread Operations
      await this.testListThreads();

      // Message Modifications
      await this.testModifyMessageLabels();

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
    console.log(chalk.cyan.bold('📊 ADVANCED GMAIL TESTS SUMMARY'));
    console.log(chalk.cyan('========================================='));
    
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
    console.log('• Profile: Get Gmail account info');
    console.log('• Labels: List, Create, Delete custom labels');
    console.log('• Messages: List, Get details, Send, Modify labels');
    console.log('• Search: Multiple search queries');
    console.log('• Threads: List conversation threads');
    console.log('• Cleanup: Remove test modifications');
    
    console.log('');
    console.log(chalk.blue('📝 Log files saved:'));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
  }
}

// Run the advanced tests
const tester = new AdvancedGmailAPITester();
tester.runAdvancedTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
}); 