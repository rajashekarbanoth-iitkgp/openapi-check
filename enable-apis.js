#!/usr/bin/env node

import chalk from 'chalk';
import axios from 'axios';
import 'dotenv/config';

const PROJECT_ID = '258308457067'; // From the error message
const TOKEN = process.env.GOOGLE_ACCESS_TOKEN;

const REQUIRED_APIS = [
  {
    name: 'Google Drive API',
    id: 'drive.googleapis.com',
    console_url: `https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=${PROJECT_ID}`,
    test_url: 'https://www.googleapis.com/drive/v3/about?fields=user',
    icon: '🚀'
  },
  {
    name: 'Google Calendar API', 
    id: 'calendar-json.googleapis.com',
    console_url: `https://console.developers.google.com/apis/api/calendar-json.googleapis.com/overview?project=${PROJECT_ID}`,
    test_url: 'https://www.googleapis.com/calendar/v3/calendars/primary',
    icon: '📅'
  },
  {
    name: 'Gmail API',
    id: 'gmail.googleapis.com', 
    console_url: `https://console.developers.google.com/apis/api/gmail.googleapis.com/overview?project=${PROJECT_ID}`,
    test_url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
    icon: '📧'
  },
  {
    name: 'Google People API (Contacts)',
    id: 'people.googleapis.com',
    console_url: `https://console.developers.google.com/apis/api/people.googleapis.com/overview?project=${PROJECT_ID}`,
    test_url: 'https://people.googleapis.com/v1/people/me/connections?pageSize=1&personFields=names',
    icon: '👥'
  }
];

class GoogleAPIEnabler {
  constructor() {
    this.results = [];
  }

  log(message, type = 'info') {
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      highlight: chalk.cyan.bold
    };
    console.log(colors[type](message));
  }

  async testAPIStatus(api) {
    if (!TOKEN) {
      return { enabled: false, reason: 'No access token' };
    }

    try {
      const response = await axios.get(api.test_url, {
        headers: { 'Authorization': `Bearer ${TOKEN}` },
        timeout: 5000
      });
      return { enabled: true, status: response.status };
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      
      if (message?.includes('has not been used') || message?.includes('is disabled')) {
        return { enabled: false, reason: 'API not enabled' };
      } else if (status === 403) {
        return { enabled: true, reason: 'API enabled but insufficient scopes' };
      } else {
        return { enabled: false, reason: `Error: ${status} - ${message}` };
      }
    }
  }

  async checkAllAPIs() {
    this.log('\n🔍 CHECKING GOOGLE API STATUS\n', 'highlight');
    
    for (const api of REQUIRED_APIS) {
      this.log(`${api.icon} Testing ${api.name}...`, 'info');
      
      const status = await this.testAPIStatus(api);
      this.results.push({ api, status });
      
      if (status.enabled) {
        this.log(`   ✅ Enabled and working`, 'success');
      } else {
        this.log(`   ❌ ${status.reason}`, 'error');
      }
    }
  }

  printEnablementGuide() {
    const disabledAPIs = this.results.filter(r => !r.status.enabled && r.status.reason === 'API not enabled');
    
    if (disabledAPIs.length === 0) {
      this.log('\n🎉 All APIs are enabled!', 'success');
      return;
    }

    this.log('\n📋 ENABLE APIS GUIDE', 'highlight');
    this.log('===================\n', 'highlight');
    
    this.log('🌐 Quick Enable Links:', 'info');
    disabledAPIs.forEach(({ api }) => {
      this.log(`   ${api.icon} ${api.name}:`, 'info');
      this.log(`      ${api.console_url}`, 'warning');
    });

    this.log('\n📖 Step-by-step Instructions:', 'info');
    this.log('1. 🌐 Click the links above (one at a time)', 'info');
    this.log('2. 🔘 Click the "ENABLE" button on each page', 'info'); 
    this.log('3. ⏱️  Wait 1-2 minutes for propagation', 'info');
    this.log('4. 🧪 Re-run tests: bun run test:contacts-advanced', 'info');
    
    this.log('\n🔧 Alternative Method:', 'info');
    this.log('1. 🌐 Go to: https://console.developers.google.com/', 'warning');
    this.log('2. 📂 Select your project (if not already selected)', 'info');
    this.log('3. 🔍 Search for each API in the search box:', 'info');
    disabledAPIs.forEach(({ api }) => {
      this.log(`   • "${api.name}"`, 'info');
    });
    this.log('4. 🔘 Click "ENABLE" for each API', 'info');

    this.log('\n⚠️  Important Notes:', 'warning');
    this.log('• APIs may take 1-5 minutes to propagate after enabling', 'info');
    this.log('• Some APIs may require billing to be enabled', 'info');
    this.log('• If billing prompt appears, you may need to add a payment method', 'info');
    this.log('• Most Google APIs have generous free quotas for testing', 'info');
  }

  printTestCommands() {
    this.log('\n🧪 TEST COMMANDS', 'highlight');
    this.log('===============\n', 'highlight');
    
    this.log('After enabling APIs, test them:', 'info');
    this.log('• bun run test:contacts-advanced  # Full contacts testing', 'success');
    this.log('• bun run test:drive-advanced     # Full drive testing', 'success'); 
    this.log('• bun run test-token.js           # Quick token validation', 'success');
    this.log('• bun run test-google-apis.js     # Basic all-API test', 'success');
  }
}

// Main execution
async function main() {
  const enabler = new GoogleAPIEnabler();
  
  console.log(chalk.cyan.bold('🔧 GOOGLE API ENABLER'));
  console.log(chalk.cyan('======================'));
  
  if (!TOKEN) {
    console.log(chalk.yellow('⚠️  No access token found. Run: bun run auth'));
    console.log('This will check API status after you get tokens.\n');
  }
  
  await enabler.checkAllAPIs();
  enabler.printEnablementGuide();
  enabler.printTestCommands();
  
  console.log('\n');
}

main().catch(error => {
  console.error(chalk.red('Error:'), error.message);
  process.exit(1);
}); 