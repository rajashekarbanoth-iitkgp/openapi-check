const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { 
    YouTubeVideoSchema, 
    YouTubeVideoListResponseSchema,
    YouTubeChannelSchema,
    YouTubeChannelListResponseSchema,
    YouTubeSearchListResponseSchema
} = require('./schemas');

class YouTubeAPITester {
    constructor() {
        this.baseUrl = 'https://youtube.googleapis.com/youtube/v3';
        this.accessToken = process.env.GOOGLE_ACCESS_TOKEN;
        this.apiKey = process.env.YOUTUBE_API_KEY;
        this.testVideoId = process.env.TEST_VIDEO_ID;
        this.testChannelId = process.env.TEST_CHANNEL_ID;
        this.results = {
            VIDEOS: { status: 'PENDING', details: '' },
            CHANNELS: { status: 'PENDING', details: '' },
            SEARCH: { status: 'PENDING', details: '' },
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

        const logFile = path.join(this.logsDir, `youtube-api-${testName.toLowerCase()}-${this.timestamp}.json`);
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

            // Add API key if available
            if (this.apiKey) {
                params.key = this.apiKey;
            }

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

    async testVideos() {
        this.log('\n🧪 Testing VIDEOS endpoint...');
        
        try {
            let response;
            
            if (this.testVideoId) {
                // Test getting specific video
                response = await this.makeRequest('/videos', {
                    part: 'snippet,contentDetails,statistics,status',
                    id: this.testVideoId
                });
                this.log('✅ Successfully retrieved specific video');
            } else {
                // Test getting popular videos
                response = await this.makeRequest('/videos', {
                    part: 'snippet,contentDetails,statistics',
                    chart: 'mostPopular',
                    regionCode: 'US',
                    maxResults: 5
                });
                this.log('✅ Successfully retrieved popular videos');
            }

            // Save response to log
            this.saveResponseToLog('VIDEOS', { status: 200, data: response, headers: {} });

            // Validate response schema
            const validationResult = YouTubeVideoListResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('VIDEOS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('VIDEOS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.saveResponseToLog('VIDEOS', null, error);
            this.logTestResult('VIDEOS', 'FAILED', error.message);
        }
    }

    async testChannels() {
        this.log('\n🧪 Testing CHANNELS endpoint...');
        
        try {
            let response;
            
            if (this.testChannelId) {
                // Test getting specific channel
                response = await this.makeRequest('/channels', {
                    part: 'snippet,contentDetails,statistics,status',
                    id: this.testChannelId
                });
                this.log('✅ Successfully retrieved specific channel');
            } else {
                // Test getting channels by username (using a known channel)
                response = await this.makeRequest('/channels', {
                    part: 'snippet,contentDetails,statistics',
                    forUsername: 'GoogleDevelopers',
                    maxResults: 5
                });
                this.log('✅ Successfully retrieved channel by username');
            }

            // Save response to log
            this.saveResponseToLog('CHANNELS', { status: 200, data: response, headers: {} });

            // Validate response schema
            const validationResult = YouTubeChannelListResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('CHANNELS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('CHANNELS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.saveResponseToLog('CHANNELS', null, error);
            this.logTestResult('CHANNELS', 'FAILED', error.message);
        }
    }

    async testSearch() {
        this.log('\n🧪 Testing SEARCH endpoint...');
        
        try {
            // Test search functionality
            const response = await this.makeRequest('/search', {
                part: 'snippet',
                q: 'programming tutorial',
                type: 'video',
                maxResults: 5
            });
            
            this.log('✅ Successfully performed search');

            // Save response to log
            this.saveResponseToLog('SEARCH', { status: 200, data: response, headers: {} });

            // Validate response schema
            const validationResult = YouTubeSearchListResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('SEARCH', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('SEARCH', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.saveResponseToLog('SEARCH', null, error);
            this.logTestResult('SEARCH', 'FAILED', error.message);
        }
    }

    async testMockData() {
        this.log('\n🧪 Testing MOCKDATA generation...');
        
        try {
            // Test mock data generation for various schemas
            const mockVideo = {
                id: 'test-video-id',
                kind: 'youtube#video',
                etag: 'test-etag',
                snippet: {
                    publishedAt: '2023-01-01T00:00:00Z',
                    channelId: 'test-channel-id',
                    title: 'Test Video Title',
                    description: 'This is a test video description',
                    thumbnails: {
                        default: {
                            url: 'https://example.com/thumbnail.jpg',
                            width: 120,
                            height: 90
                        },
                        medium: {
                            url: 'https://example.com/thumbnail-medium.jpg',
                            width: 320,
                            height: 180
                        },
                        high: {
                            url: 'https://example.com/thumbnail-high.jpg',
                            width: 480,
                            height: 360
                        }
                    },
                    channelTitle: 'Test Channel',
                    tags: ['test', 'video', 'youtube'],
                    categoryId: '22',
                    liveBroadcastContent: 'none',
                    defaultLanguage: 'en',
                    localized: {
                        title: 'Test Video Title',
                        description: 'This is a test video description'
                    },
                    defaultAudioLanguage: 'en'
                },
                contentDetails: {
                    duration: 'PT5M30S',
                    dimension: '1920x1080',
                    definition: 'hd',
                    caption: 'false',
                    licensedContent: true,
                    projection: 'rectangular',
                    hasCustomThumbnail: false
                },
                statistics: {
                    viewCount: '1000',
                    likeCount: '100',
                    dislikeCount: '5',
                    favoriteCount: '50',
                    commentCount: '25'
                },
                status: {
                    uploadStatus: 'processed',
                    privacyStatus: 'public',
                    license: 'youtube',
                    embeddable: true,
                    publicStatsViewable: true,
                    madeForKids: false,
                    selfDeclaredMadeForKids: false
                }
            };

            const mockVideoListResponse = {
                kind: 'youtube#videoListResponse',
                etag: 'test-etag',
                nextPageToken: 'test-next-page-token',
                pageInfo: {
                    totalResults: 1,
                    resultsPerPage: 1
                },
                items: [mockVideo]
            };

            const mockChannel = {
                id: 'test-channel-id',
                kind: 'youtube#channel',
                etag: 'test-etag',
                snippet: {
                    title: 'Test Channel',
                    description: 'This is a test channel description',
                    customUrl: 'testchannel',
                    publishedAt: '2023-01-01T00:00:00Z',
                    thumbnails: {
                        default: {
                            url: 'https://example.com/channel-thumbnail.jpg',
                            width: 88,
                            height: 88
                        },
                        medium: {
                            url: 'https://example.com/channel-thumbnail-medium.jpg',
                            width: 240,
                            height: 240
                        },
                        high: {
                            url: 'https://example.com/channel-thumbnail-high.jpg',
                            width: 800,
                            height: 800
                        }
                    },
                    defaultLanguage: 'en',
                    country: 'US'
                },
                contentDetails: {
                    relatedPlaylists: {
                        likes: 'test-likes-playlist',
                        uploads: 'test-uploads-playlist'
                    }
                },
                statistics: {
                    viewCount: '10000',
                    subscriberCount: '1000',
                    hiddenSubscriberCount: false,
                    videoCount: '50'
                },
                status: {
                    privacyStatus: 'public',
                    isLinked: true,
                    longUploadsStatus: 'allowed',
                    madeForKids: false,
                    selfDeclaredMadeForKids: false
                }
            };

            // Save mock data to log
            this.saveResponseToLog('MOCKDATA', { 
                status: 200, 
                data: { mockVideo, mockVideoListResponse, mockChannel }, 
                headers: {} 
            });

            // Validate mock data against schemas
            const videoValidation = YouTubeVideoSchema.safeParse(mockVideo);
            const videoListValidation = YouTubeVideoListResponseSchema.safeParse(mockVideoListResponse);
            const channelValidation = YouTubeChannelSchema.safeParse(mockChannel);

            if (videoValidation.success && videoListValidation.success && channelValidation.success) {
                this.logTestResult('MOCKDATA', 'PASSED', 'All mock data schemas validated successfully');
            } else {
                const errors = [];
                if (!videoValidation.success) errors.push(`Video: ${videoValidation.error.message}`);
                if (!videoListValidation.success) errors.push(`VideoList: ${videoListValidation.error.message}`);
                if (!channelValidation.success) errors.push(`Channel: ${channelValidation.error.message}`);
                this.logTestResult('MOCKDATA', 'FAILED', `Schema validation failed: ${errors.join(', ')}`);
            }

        } catch (error) {
            this.saveResponseToLog('MOCKDATA', null, error);
            this.logTestResult('MOCKDATA', 'FAILED', error.message);
        }
    }

    async runTests() {
        this.log('🚀 Starting YouTube Data API v3 Tests...');
        this.log(`📊 Base URL: ${this.baseUrl}`);
        this.log(`🔑 Access Token: ${this.accessToken ? '✅ Present' : '❌ Missing'}`);
        this.log(`🔑 API Key: ${this.apiKey ? '✅ Present' : '❌ Missing'}`);
        this.log(`📹 Test Video ID: ${this.testVideoId || 'Not provided'}`);
        this.log(`📺 Test Channel ID: ${this.testChannelId || 'Not provided'}`);

        await this.testVideos();
        await this.testChannels();
        await this.testSearch();
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
            this.log('🎉 All tests passed! YouTube Data API v3 is working perfectly!');
        } else if (successRate >= 80) {
            this.log('✅ Most tests passed! YouTube Data API v3 is mostly working.');
        } else {
            this.log('⚠️ Some tests failed. Check the details above.');
        }
    }
}

// Main execution
async function main() {
    const tester = new YouTubeAPITester();
    
    if (!tester.accessToken && !tester.apiKey) {
        console.error('❌ Either GOOGLE_ACCESS_TOKEN or YOUTUBE_API_KEY environment variable is required');
        console.log('💡 Run: bun run auth (for OAuth) or set YOUTUBE_API_KEY');
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

module.exports = YouTubeAPITester; 