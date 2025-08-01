#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EnvironmentSetup {
    constructor() {
        this.envPath = path.join(__dirname, '.env');
        this.envTemplate = `# Google API Configuration
# Get these from Google Cloud Console: https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Test IDs for API Testing
# YouTube Data API v3
TEST_VIDEO_ID=your_youtube_video_id_here
TEST_CHANNEL_ID=your_youtube_channel_id_here

# YouTube Analytics API v2
TEST_GROUP_ID=your_youtube_analytics_group_id_here

# Google Sheets API v4
TEST_SPREADSHEET_ID=your_google_spreadsheet_id_here

# Google Docs API v1
TEST_DOCUMENT_ID=your_google_document_id_here

# AdSense API v2
TEST_ADSENSE_ACCOUNT_ID=your_adsense_account_id_here

# API Keys (optional - OAuth is preferred)
YOUTUBE_API_KEY=your_youtube_api_key_here
GOOGLE_SHEETS_API_KEY=your_sheets_api_key_here
GOOGLE_DOCS_API_KEY=your_docs_api_key_here

# Generated tokens (don't edit manually)
GOOGLE_ACCESS_TOKEN=
GOOGLE_REFRESH_TOKEN=
TOKEN_EXPIRY=
`;
    }

    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',    // Cyan
            success: '\x1b[32m', // Green
            warning: '\x1b[33m', // Yellow
            error: '\x1b[31m',   // Red
            reset: '\x1b[0m'     // Reset
        };
        console.log(`${colors[type]}${message}${colors.reset}`);
    }

    checkEnvFile() {
        if (!fs.existsSync(this.envPath)) {
            this.log('❌ .env file not found!', 'error');
            this.createEnvFile();
            return false;
        }
        return true;
    }

    createEnvFile() {
        try {
            fs.writeFileSync(this.envPath, this.envTemplate);
            this.log('✅ Created .env file with template', 'success');
            this.log('📝 Please edit .env file with your actual values', 'warning');
        } catch (error) {
            this.log(`❌ Failed to create .env file: ${error.message}`, 'error');
        }
    }

    updateEnvVariable(key, value) {
        if (!this.checkEnvFile()) {
            return false;
        }

        try {
            let envContent = fs.readFileSync(this.envPath, 'utf8');
            const lines = envContent.split('\n');
            let found = false;

            for (let i = 0; i < lines.length; i++) {
                if (lines[i].startsWith(`${key}=`)) {
                    lines[i] = `${key}=${value}`;
                    found = true;
                    break;
                }
            }

            if (!found) {
                // Add new variable at the end
                lines.push(`${key}=${value}`);
            }

            fs.writeFileSync(this.envPath, lines.join('\n'));
            this.log(`✅ Updated ${key}=${value}`, 'success');
            return true;
        } catch (error) {
            this.log(`❌ Failed to update ${key}: ${error.message}`, 'error');
            return false;
        }
    }

    showCurrentValues() {
        if (!this.checkEnvFile()) {
            return;
        }

        try {
            const envContent = fs.readFileSync(this.envPath, 'utf8');
            const lines = envContent.split('\n');
            
            this.log('\n📋 Current Environment Variables:', 'info');
            this.log('=====================================', 'info');
            
            const testVars = [
                'TEST_VIDEO_ID',
                'TEST_CHANNEL_ID', 
                'TEST_GROUP_ID',
                'TEST_SPREADSHEET_ID',
                'TEST_DOCUMENT_ID',
                'TEST_ADSENSE_ACCOUNT_ID'
            ];

            testVars.forEach(varName => {
                const line = lines.find(l => l.startsWith(`${varName}=`));
                const value = line ? line.split('=')[1] : 'Not set';
                const status = value && value !== 'your_youtube_video_id_here' ? '✅' : '❌';
                this.log(`${status} ${varName}: ${value}`, value && value !== 'your_youtube_video_id_here' ? 'success' : 'warning');
            });

            this.log('\n🔑 Authentication Status:', 'info');
            this.log('========================', 'info');
            
            const authVars = ['GOOGLE_ACCESS_TOKEN', 'GOOGLE_REFRESH_TOKEN'];
            authVars.forEach(varName => {
                const line = lines.find(l => l.startsWith(`${varName}=`));
                const value = line ? line.split('=')[1] : 'Not set';
                const status = value ? '✅' : '❌';
                this.log(`${status} ${varName}: ${value ? 'Present' : 'Missing'}`, value ? 'success' : 'error');
            });

        } catch (error) {
            this.log(`❌ Failed to read .env file: ${error.message}`, 'error');
        }
    }

    interactiveSetup() {
        this.log('\n🎯 Interactive Environment Setup', 'info');
        this.log('================================', 'info');
        
        const readline = require('readline');
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const questions = [
            {
                key: 'TEST_VIDEO_ID',
                question: 'Enter YouTube Video ID (or press Enter to skip): ',
                description: 'YouTube video ID for testing (e.g., dQw4w9WgXcQ)'
            },
            {
                key: 'TEST_CHANNEL_ID',
                question: 'Enter YouTube Channel ID (or press Enter to skip): ',
                description: 'YouTube channel ID for testing (e.g., UC_x5XG1OV2P6uZZ5FSM9Ttw)'
            },
            {
                key: 'TEST_GROUP_ID',
                question: 'Enter YouTube Analytics Group ID (or press Enter to skip): ',
                description: 'YouTube Analytics group ID for testing'
            },
            {
                key: 'TEST_SPREADSHEET_ID',
                question: 'Enter Google Sheets ID (or press Enter to skip): ',
                description: 'Google Sheets ID for testing (from URL)'
            },
            {
                key: 'TEST_DOCUMENT_ID',
                question: 'Enter Google Docs ID (or press Enter to skip): ',
                description: 'Google Docs ID for testing (from URL)'
            }
        ];

        let currentQuestion = 0;

        const askQuestion = () => {
            if (currentQuestion >= questions.length) {
                this.log('\n✅ Environment setup complete!', 'success');
                this.showCurrentValues();
                rl.close();
                return;
            }

            const q = questions[currentQuestion];
            this.log(`\n${q.description}`, 'info');
            rl.question(q.question, (answer) => {
                if (answer.trim()) {
                    this.updateEnvVariable(q.key, answer.trim());
                }
                currentQuestion++;
                askQuestion();
            });
        };

        askQuestion();
    }

    showHelp() {
        this.log('\n📖 Environment Setup Help', 'info');
        this.log('========================', 'info');
        this.log('This script helps you set up environment variables for API testing.', 'info');
        this.log('\nAvailable commands:', 'info');
        this.log('  node setup-env.js status    - Show current environment variables', 'info');
        this.log('  node setup-env.js setup     - Interactive setup for test IDs', 'info');
        this.log('  node setup-env.js create    - Create .env file with template', 'info');
        this.log('  node setup-env.js help      - Show this help message', 'info');
        this.log('\nHow to get test IDs:', 'info');
        this.log('  • YouTube Video ID: From video URL (youtube.com/watch?v=VIDEO_ID)', 'info');
        this.log('  • YouTube Channel ID: From channel URL or API response', 'info');
        this.log('  • Google Sheets ID: From sheets URL (docs.google.com/spreadsheets/d/SHEET_ID)', 'info');
        this.log('  • Google Docs ID: From docs URL (docs.google.com/document/d/DOC_ID)', 'info');
        this.log('\nAfter setting up IDs, run: bun run auth', 'warning');
    }
}

// Main execution
const setup = new EnvironmentSetup();
const command = process.argv[2] || 'help';

switch (command) {
    case 'status':
        setup.showCurrentValues();
        break;
    case 'setup':
        setup.interactiveSetup();
        break;
    case 'create':
        setup.createEnvFile();
        break;
    case 'help':
    default:
        setup.showHelp();
        break;
} 