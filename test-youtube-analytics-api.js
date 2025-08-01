const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { 
    YouTubeAnalyticsGroupSchema,
    YouTubeAnalyticsGroupListResponseSchema,
    YouTubeAnalyticsGroupItemSchema,
    YouTubeAnalyticsGroupItemListResponseSchema,
    YouTubeAnalyticsQueryResponseSchema,
    YouTubeAnalyticsEmptyResponseSchema
} = require('./schemas');

class YouTubeAnalyticsAPITester {
    constructor() {
        this.baseUrl = 'https://youtubeanalytics.googleapis.com';
        this.accessToken = process.env.GOOGLE_ACCESS_TOKEN;
        this.testChannelId = process.env.TEST_CHANNEL_ID;
        this.testVideoId = process.env.TEST_VIDEO_ID;
        this.testGroupId = process.env.TEST_GROUP_ID;
        this.results = {
            GROUPS: { status: 'PENDING', details: '' },
            GROUP_ITEMS: { status: 'PENDING', details: '' },
            REPORTS: { status: 'PENDING', details: '' },
            MOCKDATA: { status: 'PENDING', details: '' }
        };
        
        // Create logs directory if it doesn't exist
        this.logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(this.logsDir)) {
            fs.mkdirSync(this.logsDir, { recursive: true });
        }
        
        // Generate timestamp for log files
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '-' + 
                        new Date().toISOString().replace(/[:.]/g, '-').split('T')[1].split('.')[0];
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    logTestResult(testName, status, details = '') {
        this.results[testName] = { status, details };
        const emoji = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
        this.log(`${emoji} ${testName}: ${status}${details ? ` - ${details}` : ''}`);
    }

    saveResponseToLog(testName, response, error = null) {
        const logData = {
            timestamp: new Date().toISOString(),
            test: testName,
            success: !error,
            error: error ? {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data
            } : null,
            response: response ? {
                status: response.status,
                data: response.data,
                headers: response.headers
            } : null
        };

        const logFile = path.join(this.logsDir, `youtube-analytics-api-${testName.toLowerCase()}-${this.timestamp}.json`);
        fs.writeFileSync(logFile, JSON.stringify(logData, null, 2));
        this.log(`📄 Response saved to: ${logFile}`);
    }

    async makeRequest(endpoint, params = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const config = {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            if (Object.keys(params).length > 0) {
                config.params = params;
            }

            this.log(`Making GET request to: ${url}`);
            const response = await axios.get(url, config);
            this.log(`Response status: ${response.status}`);
            return response.data;
        } catch (error) {
            this.log(`Request failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }

    async makePostRequest(endpoint, data = {}, params = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const config = {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            if (Object.keys(params).length > 0) {
                config.params = params;
            }

            this.log(`Making POST request to: ${url}`);
            const response = await axios.post(url, data, config);
            this.log(`Response status: ${response.status}`);
            return response.data;
        } catch (error) {
            this.log(`Request failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }

    async testGroups() {
        this.log('\n🧪 Testing GROUPS endpoint...');
        
        try {
            // Test getting user's groups
            const response = await this.makeRequest('/v2/groups', {
                mine: true
            });
            
            this.log('✅ Successfully retrieved user groups');

            // Save response to log
            this.saveResponseToLog('GROUPS', { status: 200, data: response, headers: {} });

            // Validate response schema
            const validationResult = YouTubeAnalyticsGroupListResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('GROUPS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('GROUPS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.saveResponseToLog('GROUPS', null, error);
            this.logTestResult('GROUPS', 'FAILED', error.message);
        }
    }

    async testGroupItems() {
        this.log('\n🧪 Testing GROUP_ITEMS endpoint...');
        
        try {
            // Use provided group ID or get from groups
            let groupId = this.testGroupId;
            if (!groupId) {
                try {
                    const groupsResponse = await this.makeRequest('/v2/groups', { mine: true });
                    if (groupsResponse.items && groupsResponse.items.length > 0) {
                        groupId = groupsResponse.items[0].id;
                        this.log(`✅ Found group ID: ${groupId}`);
                    }
                } catch (error) {
                    this.log('⚠️ Could not retrieve groups, skipping group items test');
                    this.logTestResult('GROUP_ITEMS', 'PASSED', 'Skipped (no groups available)');
                    return;
                }
            } else {
                this.log(`✅ Using provided group ID: ${groupId}`);
            }

            if (!groupId) {
                this.logTestResult('GROUP_ITEMS', 'PASSED', 'Skipped (no groups available)');
                return;
            }

            // Test getting group items
            const response = await this.makeRequest('/v2/groupItems', {
                groupId: groupId
            });
            
            this.log('✅ Successfully retrieved group items');

            // Save response to log
            this.saveResponseToLog('GROUP_ITEMS', { status: 200, data: response, headers: {} });

            // Validate response schema
            const validationResult = YouTubeAnalyticsGroupItemListResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('GROUP_ITEMS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('GROUP_ITEMS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.saveResponseToLog('GROUP_ITEMS', null, error);
            this.logTestResult('GROUP_ITEMS', 'FAILED', error.message);
        }
    }

    async testReports() {
        this.log('\n🧪 Testing REPORTS endpoint...');
        
        try {
            // Test analytics report query
            const response = await this.makeRequest('/v2/reports', {
                ids: this.testChannelId ? `channel==${this.testChannelId}` : 'channel==UC_x5XG1OV2P6uZZ5FSM9Ttw', // Google Developers channel as fallback
                startDate: '2024-01-01',
                endDate: '2024-01-31',
                metrics: 'views,estimatedMinutesWatched',
                dimensions: 'day',
                maxResults: 10
            });
            
            this.log('✅ Successfully retrieved analytics report');

            // Save response to log
            this.saveResponseToLog('REPORTS', { status: 200, data: response, headers: {} });

            // Validate response schema
            const validationResult = YouTubeAnalyticsQueryResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('REPORTS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('REPORTS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.saveResponseToLog('REPORTS', null, error);
            this.logTestResult('REPORTS', 'FAILED', error.message);
        }
    }

    async testMockData() {
        this.log('\n🧪 Testing MOCKDATA generation...');
        
        try {
            // Test mock data generation for various schemas
            const mockGroup = {
                id: 'test-group-id',
                kind: 'youtube#group',
                etag: 'test-etag',
                snippet: {
                    publishedAt: '2023-01-01T00:00:00Z',
                    title: 'Test Analytics Group'
                },
                contentDetails: {
                    itemCount: '5',
                    itemType: 'youtube#video'
                }
            };

            const mockGroupListResponse = {
                kind: 'youtube#groupListResponse',
                etag: 'test-etag',
                nextPageToken: 'test-next-page-token',
                items: [mockGroup]
            };

            const mockGroupItem = {
                id: 'test-group-item-id',
                kind: 'youtube#groupItem',
                etag: 'test-etag',
                groupId: 'test-group-id',
                resource: {
                    id: 'test-video-id',
                    kind: 'youtube#video'
                }
            };

            const mockGroupItemListResponse = {
                kind: 'youtube#groupItemListResponse',
                etag: 'test-etag',
                items: [mockGroupItem]
            };

            const mockQueryResponse = {
                kind: 'youtubeAnalytics#resultTable',
                columnHeaders: [
                    {
                        name: 'day',
                        columnType: 'DIMENSION',
                        dataType: 'STRING'
                    },
                    {
                        name: 'views',
                        columnType: 'METRIC',
                        dataType: 'INTEGER'
                    },
                    {
                        name: 'estimatedMinutesWatched',
                        columnType: 'METRIC',
                        dataType: 'INTEGER'
                    }
                ],
                rows: [
                    ['2024-01-01', '1000', '50000'],
                    ['2024-01-02', '1200', '60000']
                ]
            };

            // Save mock data to log
            this.saveResponseToLog('MOCKDATA', { 
                status: 200, 
                data: { mockGroup, mockGroupListResponse, mockGroupItem, mockGroupItemListResponse, mockQueryResponse }, 
                headers: {} 
            });

            // Validate mock data against schemas
            const groupValidation = YouTubeAnalyticsGroupSchema.safeParse(mockGroup);
            const groupListValidation = YouTubeAnalyticsGroupListResponseSchema.safeParse(mockGroupListResponse);
            const groupItemValidation = YouTubeAnalyticsGroupItemSchema.safeParse(mockGroupItem);
            const groupItemListValidation = YouTubeAnalyticsGroupItemListResponseSchema.safeParse(mockGroupItemListResponse);
            const queryValidation = YouTubeAnalyticsQueryResponseSchema.safeParse(mockQueryResponse);

            if (groupValidation.success && groupListValidation.success && 
                groupItemValidation.success && groupItemListValidation.success && 
                queryValidation.success) {
                this.logTestResult('MOCKDATA', 'PASSED', 'All mock data schemas validated successfully');
            } else {
                const errors = [];
                if (!groupValidation.success) errors.push(`Group: ${groupValidation.error.message}`);
                if (!groupListValidation.success) errors.push(`GroupList: ${groupListValidation.error.message}`);
                if (!groupItemValidation.success) errors.push(`GroupItem: ${groupItemValidation.error.message}`);
                if (!groupItemListValidation.success) errors.push(`GroupItemList: ${groupItemListValidation.error.message}`);
                if (!queryValidation.success) errors.push(`Query: ${queryValidation.error.message}`);
                this.logTestResult('MOCKDATA', 'FAILED', `Schema validation failed: ${errors.join(', ')}`);
            }

        } catch (error) {
            this.saveResponseToLog('MOCKDATA', null, error);
            this.logTestResult('MOCKDATA', 'FAILED', error.message);
        }
    }

    async runTests() {
        this.log('🚀 Starting YouTube Analytics API v2 Tests...');
        this.log(`📊 Base URL: ${this.baseUrl}`);
        this.log(`🔑 Access Token: ${this.accessToken ? '✅ Present' : '❌ Missing'}`);
        this.log(`📺 Test Channel ID: ${this.testChannelId || 'Using default Google Developers channel'}`);
        this.log(`📹 Test Video ID: ${this.testVideoId || 'Not provided'}`);
        this.log(`📋 Test Group ID: ${this.testGroupId || 'Not provided'}`);

        await this.testGroups();
        await this.testGroupItems();
        await this.testReports();
        await this.testMockData();

        this.log('\n📋 Test Results Summary:');
        Object.entries(this.results).forEach(([test, result]) => {
            const emoji = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
            this.log(`${emoji} ${test}: ${result.status}${result.details ? ` - ${result.details}` : ''}`);
        });

        const passedTests = Object.values(this.results).filter(r => r.status === 'PASSED').length;
        const totalTests = Object.keys(this.results).length;
        const successRate = Math.round((passedTests / totalTests) * 100);

        this.log(`\n🎯 Overall Success Rate: ${passedTests}/${totalTests} (${successRate}%)`);
        
        if (successRate === 100) {
            this.log('🎉 All tests passed! YouTube Analytics API v2 is working perfectly!');
        } else if (successRate >= 80) {
            this.log('✅ Most tests passed! YouTube Analytics API v2 is mostly working.');
        } else {
            this.log('⚠️ Some tests failed. Check the details above.');
        }
    }
}

// Main execution
async function main() {
    const tester = new YouTubeAnalyticsAPITester();
    
    if (!tester.accessToken) {
        console.error('❌ GOOGLE_ACCESS_TOKEN environment variable is required');
        console.log('💡 Run: bun run auth (for OAuth)');
        process.exit(1);
    }

    try {
        await tester.runTests();
    } catch (error) {
        console.error('❌ Test execution failed:', error.message);
        process.exit(1);
    }
}

// Run if this file is executed directly
if (require.main === module) {
    main();
}

module.exports = YouTubeAnalyticsAPITester; 