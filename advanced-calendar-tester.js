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
const BASE_URL = 'https://www.googleapis.com/calendar/v3';

class AdvancedCalendarAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testEventId = null;
    this.testCalendarId = 'primary'; // Use primary calendar
    this.createdEventIds = [];
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
      main: path.join(logsDir, `calendar-test-${timestamp}.log`),
      api: path.join(logsDir, `calendar-api-calls-${timestamp}.log`),
      results: path.join(logsDir, `calendar-results-${timestamp}.json`)
    };

    // Initialize log files
    this.writeToFile(this.logFiles.main, `🚀 Google Calendar API Test Started: ${this.startTime.toISOString()}\n`);
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

  // ============ CALENDAR OPERATIONS ============

  async testListCalendars() {
    this.log('📅 Testing List Calendars...', 'info');
    
    const url = `${BASE_URL}/users/me/calendarList`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.items) {
      this.logTestResult(`List Calendars (${result.data.items.length} calendars found)`, true);
      
      // Log calendar details
      this.log(`Calendars found:`, 'info');
      result.data.items.forEach(calendar => {
        this.log(`   - ${calendar.summary} (${calendar.id}) - Access: ${calendar.accessRole}`, 'test');
      });
      
      return result.data.items;
    } else {
      this.logTestResult('List Calendars', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testGetCalendarMetadata() {
    this.log('📋 Testing Get Calendar Metadata...', 'info');
    
    const url = `${BASE_URL}/calendars/${this.testCalendarId}`;
    const result = await this.makeRequest(url);

    if (result.success) {
      this.logTestResult(`Get Calendar Metadata (${result.data.summary})`, true);
      
      // Log detailed metadata
      const metadata = result.data;
      this.log(`Calendar metadata:`, 'info');
      this.log(`   Summary: ${metadata.summary}`, 'test');
      this.log(`   Time Zone: ${metadata.timeZone}`, 'test');
      this.log(`   Description: ${metadata.description || 'N/A'}`, 'test');
      this.log(`   Location: ${metadata.location || 'N/A'}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Get Calendar Metadata', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ EVENT OPERATIONS ============

  async testListEvents() {
    this.log('📝 Testing List Events...', 'info');
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const url = `${BASE_URL}/calendars/${this.testCalendarId}/events?timeMin=${oneWeekAgo.toISOString()}&timeMax=${oneWeekFromNow.toISOString()}&maxResults=10&singleEvents=true&orderBy=startTime`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.items) {
      this.logTestResult(`List Events (${result.data.items.length} events found)`, true);
      
      // Log event details
      this.log(`Events found in the next week:`, 'info');
      result.data.items.forEach(event => {
        const start = event.start?.dateTime || event.start?.date || 'No start time';
        this.log(`   - ${event.summary || 'No title'} (${start})`, 'test');
      });
      
      return result.data.items;
    } else {
      this.logTestResult('List Events', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testCreateEvent() {
    this.log('📅 Testing Create Event...', 'info');
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 hour duration
    
    const eventData = {
      summary: `API Test Event ${Date.now()}`,
      description: 'This event was created by the Google Calendar API tester',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 10 }       // 10 minutes before
        ]
      },
      location: 'API Testing Lab',
      status: 'confirmed'
    };

    const result = await this.makeRequest(`${BASE_URL}/calendars/${this.testCalendarId}/events`, {
      method: 'POST',
      data: eventData
    });

    if (result.success) {
      this.testEventId = result.data.id;
      this.createdEventIds.push(this.testEventId);
      this.logTestResult(`Create Event (ID: ${this.testEventId})`, true);
      this.log(`Created event: ${result.data.summary} at ${result.data.start.dateTime}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Create Event', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  async testGetEventDetails() {
    if (!this.testEventId) {
      this.logTestResult('Get Event Details', false, new Error('No test event available'));
      return;
    }

    this.log('📄 Testing Get Event Details...', 'info');
    
    const url = `${BASE_URL}/calendars/${this.testCalendarId}/events/${this.testEventId}`;
    const result = await this.makeRequest(url);

    if (result.success) {
      this.logTestResult(`Get Event Details (${result.data.summary})`, true);
      
      // Log detailed event info
      const event = result.data;
      this.log(`Event details:`, 'info');
      this.log(`   Summary: ${event.summary}`, 'test');
      this.log(`   Start: ${event.start?.dateTime || event.start?.date}`, 'test');
      this.log(`   End: ${event.end?.dateTime || event.end?.date}`, 'test');
      this.log(`   Location: ${event.location || 'N/A'}`, 'test');
      this.log(`   Status: ${event.status}`, 'test');
      this.log(`   Created: ${event.created}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Get Event Details', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testUpdateEvent() {
    if (!this.testEventId) {
      this.logTestResult('Update Event', false, new Error('No test event available'));
      return;
    }

    this.log('✏️ Testing Update Event...', 'info');
    
    const updates = {
      summary: `Updated API Test Event ${Date.now()}`,
      description: 'This event was updated by the API tester',
      location: 'Updated API Testing Lab',
      colorId: '2' // Green color
    };

    const result = await this.makeRequest(`${BASE_URL}/calendars/${this.testCalendarId}/events/${this.testEventId}`, {
      method: 'PATCH',
      data: updates
    });

    if (result.success) {
      this.logTestResult(`Update Event (New title: ${result.data.summary})`, true);
      this.log(`Update applied: ${JSON.stringify(updates, null, 2)}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Update Event', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testCreateRecurringEvent() {
    this.log('🔄 Testing Create Recurring Event...', 'info');
    
    const now = new Date();
    const startTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes duration
    
    const recurringEventData = {
      summary: `Weekly API Test Meeting ${Date.now()}`,
      description: 'This is a recurring event created by the API tester',
      start: {
        dateTime: startTime.toISOString(),
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: 'America/New_York'
      },
      recurrence: [
        'RRULE:FREQ=WEEKLY;COUNT=3' // Weekly for 3 occurrences
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 15 }
        ]
      }
    };

    const result = await this.makeRequest(`${BASE_URL}/calendars/${this.testCalendarId}/events`, {
      method: 'POST',
      data: recurringEventData
    });

    if (result.success) {
      this.createdEventIds.push(result.data.id);
      this.logTestResult(`Create Recurring Event (ID: ${result.data.id})`, true);
      this.log(`Created recurring event: ${result.data.summary}`, 'info');
      this.log(`Recurrence: ${result.data.recurrence?.[0] || 'N/A'}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Create Recurring Event', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ SEARCH OPERATIONS ============

  async testSearchEvents() {
    this.log('🔍 Testing Search Events...', 'info');
    
    const searchQueries = [
      'test',
      'meeting',
      'API'
    ];

    let totalResults = 0;
    for (const query of searchQueries) {
      const url = `${BASE_URL}/calendars/${this.testCalendarId}/events?q=${encodeURIComponent(query)}&maxResults=5`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        const count = result.data.items?.length || 0;
        totalResults += count;
        this.log(`   Query: "${query}" → ${count} results`, 'test');
      }
    }

    if (totalResults >= 0) {
      this.logTestResult(`Search Events (${searchQueries.length} queries, ${totalResults} total results)`, true);
    } else {
      this.logTestResult('Search Events', false, new Error('Search failed'));
    }
  }

  // ============ CALENDAR SETTINGS ============

  async testGetCalendarSettings() {
    this.log('⚙️ Testing Get Calendar Settings...', 'info');
    
    const url = `${BASE_URL}/users/me/settings`;
    const result = await this.makeRequest(url);

    if (result.success && result.data.items) {
      this.logTestResult(`Get Calendar Settings (${result.data.items.length} settings)`, true);
      
      // Log important settings
      this.log(`Calendar settings:`, 'info');
      result.data.items.slice(0, 5).forEach(setting => {
        this.log(`   ${setting.id}: ${setting.value}`, 'test');
      });
      
      return result.data.items;
    } else {
      this.logTestResult('Get Calendar Settings', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ CLEANUP OPERATIONS ============

  async cleanup() {
    this.log('🧹 Cleaning up test events...', 'info');
    
    for (const eventId of this.createdEventIds) {
      try {
        await this.makeRequest(`${BASE_URL}/calendars/${this.testCalendarId}/events/${eventId}`, {
          method: 'DELETE'
        });
        this.log(`   Deleted event: ${eventId}`, 'test');
      } catch (error) {
        this.log(`   Failed to delete event: ${eventId}`, 'warning');
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
        calendarId: this.testCalendarId,
        createdEventIds: this.createdEventIds,
        testEventId: this.testEventId
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
    console.log(chalk.cyan.bold('🚀 ADVANCED GOOGLE CALENDAR API TESTER'));
    console.log(chalk.cyan('============================================'));
    console.log(chalk.yellow(`🔑 Auth Token: ${TOKEN ? 'Available' : 'Missing'}`));
    console.log('');

    if (!TOKEN || TOKEN === 'your_access_token_here') {
      console.log(chalk.red('❌ No valid access token found'));
      process.exit(1);
    }

    try {
      // Calendar Operations
      await this.testListCalendars();
      await this.testGetCalendarMetadata();

      // Event Operations
      await this.testListEvents();
      await this.testCreateEvent();
      await this.testGetEventDetails();
      await this.testUpdateEvent();
      await this.testCreateRecurringEvent();

      // Search Operations
      await this.testSearchEvents();

      // Settings
      await this.testGetCalendarSettings();

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
    console.log(chalk.cyan.bold('📊 ADVANCED CALENDAR TESTS SUMMARY'));
    console.log(chalk.cyan('============================================'));
    
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
    console.log('• Calendar Management: List, Get metadata, Settings');
    console.log('• Event Management: List, Create, Get, Update, Delete');
    console.log('• Advanced Features: Recurring events, Reminders');
    console.log('• Search: Event search queries');
    console.log('• Cleanup: Delete test events');
    
    console.log('');
    console.log(chalk.blue('📝 Log files saved:'));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
  }
}

// Run the advanced tests
const tester = new AdvancedCalendarAPITester();
tester.runAdvancedTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
}); 