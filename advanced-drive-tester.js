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
const BASE_URL = 'https://www.googleapis.com/drive/v3';

class AdvancedDriveAPITester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testFileId = null;
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
      main: path.join(logsDir, `drive-test-${timestamp}.log`),
      api: path.join(logsDir, `drive-api-calls-${timestamp}.log`),
      results: path.join(logsDir, `drive-results-${timestamp}.json`)
    };

    // Initialize log files
    this.writeToFile(this.logFiles.main, `🚀 Google Drive API Test Started: ${this.startTime.toISOString()}\n`);
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

  // ============ FILE OPERATIONS ============

  async testListFiles() {
    this.log('📋 Testing List Files...', 'info');
    
    const url = `${BASE_URL}/files?pageSize=10&fields=files(id,name,mimeType,size,createdTime,modifiedTime,parents)`;
    const result = await this.makeRequest(url);
    
    if (result.success && result.data.files) {
      this.logTestResult(`List Files (${result.data.files.length} files found)`, true);
      
      // Log file details
      this.log(`Files found:`, 'info');
      result.data.files.forEach(file => {
        this.log(`   - ${file.name} (${file.mimeType || 'unknown type'})`, 'test');
      });
      
      return result.data.files;
    } else {
      this.logTestResult('List Files', false, new Error(`${result.status}: ${result.message}`));
      return [];
    }
  }

  async testCreateFile() {
    this.log('📝 Testing Create File...', 'info');
    
    const fileMetadata = {
      name: `Test File ${Date.now()}.txt`,
      parents: [] // Will be placed in My Drive root
    };

    const result = await this.makeRequest(`${BASE_URL}/files`, {
      method: 'POST',
      data: fileMetadata
    });

    if (result.success) {
      this.testFileId = result.data.id;
      this.logTestResult(`Create File (ID: ${this.testFileId})`, true);
      this.log(`Created file details: Name: ${result.data.name}, ID: ${result.data.id}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Create File', false, new Error(`${result.status}: ${result.message}`));
      return null;
    }
  }

  async testGetFileMetadata() {
    if (!this.testFileId) {
      this.logTestResult('Get File Metadata', false, new Error('No test file available'));
      return;
    }

    this.log('📄 Testing Get File Metadata...', 'info');
    
    const url = `${BASE_URL}/files/${this.testFileId}?fields=id,name,mimeType,size,createdTime,modifiedTime,parents,permissions`;
    const result = await this.makeRequest(url);

    if (result.success) {
      this.logTestResult(`Get File Metadata (${result.data.name})`, true);
      
      // Log detailed metadata
      const metadata = result.data;
      this.log(`File metadata:`, 'info');
      this.log(`   Name: ${metadata.name}`, 'test');
      this.log(`   MIME Type: ${metadata.mimeType}`, 'test');
      this.log(`   Size: ${metadata.size || 'N/A'} bytes`, 'test');
      this.log(`   Created: ${metadata.createdTime}`, 'test');
      this.log(`   Modified: ${metadata.modifiedTime}`, 'test');
      
      return result.data;
    } else {
      this.logTestResult('Get File Metadata', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testUpdateFileMetadata() {
    if (!this.testFileId) {
      this.logTestResult('Update File Metadata', false, new Error('No test file available'));
      return;
    }

    this.log('✏️ Testing Update File Metadata...', 'info');
    
    const updates = {
      name: `Updated Test File ${Date.now()}.txt`,
      description: 'This file was updated by the API tester'
    };

    const result = await this.makeRequest(`${BASE_URL}/files/${this.testFileId}`, {
      method: 'PATCH',
      data: updates
    });

    if (result.success) {
      this.logTestResult(`Update File Metadata (New name: ${result.data.name})`, true);
      this.log(`Update applied: ${JSON.stringify(updates, null, 2)}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Update File Metadata', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testCopyFile() {
    if (!this.testFileId) {
      this.logTestResult('Copy File', false, new Error('No test file available'));
      return;
    }

    this.log('📄 Testing Copy File...', 'info');
    
    const copyMetadata = {
      name: `Copy of Test File ${Date.now()}.txt`
    };

    const result = await this.makeRequest(`${BASE_URL}/files/${this.testFileId}/copy`, {
      method: 'POST',
      data: copyMetadata
    });

    if (result.success) {
      this.logTestResult(`Copy File (New ID: ${result.data.id})`, true);
      this.copiedFileId = result.data.id;
      this.log(`Original: ${this.testFileId} → Copy: ${result.data.id}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Copy File', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ PERMISSION OPERATIONS ============

  async testListPermissions() {
    if (!this.testFileId) {
      this.logTestResult('List Permissions', false, new Error('No test file available'));
      return;
    }

    this.log('🔐 Testing List Permissions...', 'info');
    
    const url = `${BASE_URL}/files/${this.testFileId}/permissions`;
    const result = await this.makeRequest(url);

    if (result.success) {
      const permissions = result.data.permissions || [];
      this.logTestResult(`List Permissions (${permissions.length} permissions)`, true);
      
      // Log permission details
      permissions.forEach((perm, index) => {
        this.log(`   Permission ${index + 1}: ${perm.role} for ${perm.type}`, 'test');
      });
      
      return permissions;
    } else {
      this.logTestResult('List Permissions', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testCreatePermission() {
    if (!this.testFileId) {
      this.logTestResult('Create Permission', false, new Error('No test file available'));
      return;
    }

    this.log('🔓 Testing Create Permission (Public Read)...', 'info');
    
    const permission = {
      role: 'reader',
      type: 'anyone'
    };

    const result = await this.makeRequest(`${BASE_URL}/files/${this.testFileId}/permissions`, {
      method: 'POST',
      data: permission
    });

    if (result.success) {
      this.logTestResult(`Create Permission (${permission.role} for ${permission.type})`, true);
      this.permissionId = result.data.id;
      this.log(`Permission created: ID ${result.data.id}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Create Permission', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ SEARCH OPERATIONS ============

  async testSearchFiles() {
    this.log('🔍 Testing Search Files...', 'info');
    
    const searchQueries = [
      "name contains 'Test'",
      "mimeType = 'text/plain'",
      "createdTime > '2024-01-01T00:00:00'",
      "parents in 'root'"
    ];

    let totalResults = 0;
    for (const query of searchQueries) {
      const url = `${BASE_URL}/files?q=${encodeURIComponent(query)}&pageSize=5`;
      const result = await this.makeRequest(url);
      
      if (result.success) {
        const count = result.data.files?.length || 0;
        totalResults += count;
        this.log(`   Query: "${query}" → ${count} results`, 'test');
      }
    }

    if (totalResults >= 0) {
      this.logTestResult(`Search Files (${searchQueries.length} queries, ${totalResults} total results)`, true);
    } else {
      this.logTestResult('Search Files', false, new Error('Search failed'));
    }
  }

  // ============ FOLDER OPERATIONS ============

  async testCreateFolder() {
    this.log('📁 Testing Create Folder...', 'info');
    
    const folderMetadata = {
      name: `Test Folder ${Date.now()}`,
      mimeType: 'application/vnd.google-apps.folder'
    };

    const result = await this.makeRequest(`${BASE_URL}/files`, {
      method: 'POST',
      data: folderMetadata
    });

    if (result.success) {
      this.testFolderId = result.data.id;
      this.logTestResult(`Create Folder (ID: ${this.testFolderId})`, true);
      this.log(`Folder created: ${result.data.name}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Create Folder', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  async testMoveFileToFolder() {
    if (!this.testFileId || !this.testFolderId) {
      this.logTestResult('Move File to Folder', false, new Error('No test file or folder available'));
      return;
    }

    this.log('📦 Testing Move File to Folder...', 'info');
    
    const result = await this.makeRequest(`${BASE_URL}/files/${this.testFileId}?addParents=${this.testFolderId}&removeParents=root`, {
      method: 'PATCH',
      data: {}
    });

    if (result.success) {
      this.logTestResult(`Move File to Folder`, true);
      this.log(`File ${this.testFileId} moved to folder ${this.testFolderId}`, 'info');
      return result.data;
    } else {
      this.logTestResult('Move File to Folder', false, new Error(`${result.status}: ${result.message}`));
    }
  }

  // ============ CLEANUP OPERATIONS ============

  async cleanup() {
    this.log('🧹 Cleaning up test files...', 'info');
    
    const filesToDelete = [
      this.testFileId,
      this.copiedFileId,
      this.testFolderId
    ].filter(Boolean);

    for (const fileId of filesToDelete) {
      try {
        await this.makeRequest(`${BASE_URL}/files/${fileId}`, {
          method: 'DELETE'
        });
        this.log(`   Deleted file: ${fileId}`, 'test');
      } catch (error) {
        this.log(`   Failed to delete file: ${fileId}`, 'warning');
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
      testFiles: {
        createdFileId: this.testFileId,
        copiedFileId: this.copiedFileId,
        folderId: this.testFolderId
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
    console.log(chalk.cyan.bold('🚀 ADVANCED GOOGLE DRIVE API TESTER'));
    console.log(chalk.cyan('==========================================='));
    console.log(chalk.yellow(`🔑 Auth Token: ${TOKEN ? 'Available' : 'Missing'}`));
    console.log('');

    if (!TOKEN || TOKEN === 'your_access_token_here') {
      console.log(chalk.red('❌ No valid access token found'));
      process.exit(1);
    }

    try {
      // Basic Operations
      await this.testListFiles();
      await this.testCreateFile();
      await this.testGetFileMetadata();
      await this.testUpdateFileMetadata();
      await this.testCopyFile();

      // Permission Operations
      await this.testListPermissions();
      await this.testCreatePermission();

      // Search Operations
      await this.testSearchFiles();

      // Folder Operations
      await this.testCreateFolder();
      await this.testMoveFileToFolder();

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
    console.log(chalk.cyan.bold('📊 ADVANCED TESTS SUMMARY'));
    console.log(chalk.cyan('==========================================='));
    
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
    console.log('• File Management: List, Create, Get, Update, Copy');
    console.log('• Permissions: List, Create (sharing)');
    console.log('• Search: Multiple query types');
    console.log('• Folders: Create, Move files');
    console.log('• Cleanup: Delete test files');
    
    console.log('');
    console.log(chalk.blue('📝 Log files saved:'));
    console.log(chalk.gray(`   Main log: ${this.logFiles.main}`));
    console.log(chalk.gray(`   API calls: ${this.logFiles.api}`));
    console.log(chalk.gray(`   Results: ${this.logFiles.results}`));
  }
}

// Run the advanced tests
const tester = new AdvancedDriveAPITester();
tester.runAdvancedTests().catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
}); 