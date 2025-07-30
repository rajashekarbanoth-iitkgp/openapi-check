#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import 'dotenv/config';

const TOKEN = process.env.GOOGLE_ACCESS_TOKEN;

async function testToken() {
  console.log(chalk.cyan.bold('🔍 GOOGLE TOKEN TESTER'));
  console.log(chalk.cyan('========================'));
  
  if (!TOKEN || TOKEN === 'your_access_token_here') {
    console.log(chalk.red('❌ No valid access token found in .env file'));
    console.log(chalk.yellow('📋 Please add your token to .env file:'));
    console.log(chalk.gray('GOOGLE_ACCESS_TOKEN=ya29.a0AWY7Ckn...'));
    process.exit(1);
  }
  
  console.log(chalk.yellow(`🔑 Testing token: ${TOKEN.substring(0, 20)}...`));
  console.log('');
  
  const tests = [
    {
      name: 'Google Drive API',
      url: 'https://www.googleapis.com/drive/v3/about',
      icon: '🚀'
    },
    {
      name: 'Google Calendar API', 
      url: 'https://www.googleapis.com/calendar/v3/calendars/primary',
      icon: '📅'
    },
    {
      name: 'Gmail API',
      url: 'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      icon: '📧'
    },
    {
      name: 'Google People API (Contacts)',
      url: 'https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses',
      icon: '👥'
    }
  ];
  
  let passedTests = 0;
  
  for (const test of tests) {
    try {
      console.log(chalk.blue(`${test.icon} Testing ${test.name}...`));
      
      const response = await axios.get(test.url, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Accept': 'application/json'
        },
        timeout: 10000
      });
      
      console.log(chalk.green(`✅ ${test.name}: Working! (Status: ${response.status})`));
      passedTests++;
      
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.error?.message || error.message;
      
      if (status === 401) {
        console.log(chalk.red(`❌ ${test.name}: Token expired or invalid`));
      } else if (status === 403) {
        console.log(chalk.red(`❌ ${test.name}: Permission denied (check scopes)`));
      } else {
        console.log(chalk.red(`❌ ${test.name}: ${status} - ${message}`));
      }
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('');
  console.log(chalk.cyan('========================'));
  
  if (passedTests === tests.length) {
    console.log(chalk.green.bold('🎉 ALL TESTS PASSED!'));
    console.log(chalk.green('Your token is working perfectly!'));
    console.log('');
    console.log(chalk.blue('Now run: bun run test-google-apis.js'));
  } else {
    console.log(chalk.yellow(`⚠️  ${passedTests}/${tests.length} tests passed`));
    console.log('');
    console.log(chalk.yellow('Common issues:'));
    console.log('• Token expired (get new one from OAuth Playground)');
    console.log('• Missing scopes (check OAuth consent screen)');  
    console.log('• APIs not enabled (check Google Cloud Console)');
  }
}

testToken().catch(error => {
  console.error(chalk.red('Fatal error:'), error.message);
  process.exit(1);
}); 