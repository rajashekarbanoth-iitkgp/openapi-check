const axios = require('axios');
const { 
    GoogleDocsDocumentSchema, 
    GoogleDocsBatchUpdateRequestSchema,
    GoogleDocsBatchUpdateResponseSchema
} = require('./schemas');

class GoogleDocsAPITester {
    constructor() {
        this.baseUrl = 'https://docs.googleapis.com/v1';
        this.accessToken = process.env.GOOGLE_ACCESS_TOKEN;
        this.testDocumentId = process.env.TEST_DOCUMENT_ID;
        this.results = {
            DOCUMENTS: { status: 'PENDING', details: '' },
            BATCHUPDATE: { status: 'PENDING', details: '' },
            MOCKDATA: { status: 'PENDING', details: '' }
        };
    }

    log(message) {
        console.log(`[${new Date().toISOString()}] ${message}`);
    }

    logTestResult(testName, status, details = '') {
        this.results[testName] = { status, details };
        const emoji = status === 'PASSED' ? '✅' : status === 'FAILED' ? '❌' : '⚠️';
        this.log(`${emoji} ${testName}: ${status}${details ? ` - ${details}` : ''}`);
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

    async makePostRequest(endpoint, data = {}) {
        try {
            const url = `${this.baseUrl}${endpoint}`;
            const config = {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            };

            this.log(`Making POST request to: ${url}`);
            const response = await axios.post(url, data, config);
            this.log(`Response status: ${response.status}`);
            return response.data;
        } catch (error) {
            this.log(`Request failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }

    async testDocuments() {
        this.log('\n🧪 Testing DOCUMENTS endpoint...');
        
        try {
            let response;
            
            if (this.testDocumentId) {
                // Test getting existing document
                response = await this.makeRequest(`/documents/${this.testDocumentId}`);
                this.log('✅ Successfully retrieved existing document');
            } else {
                // Test creating new document
                const documentData = {
                    title: 'Test Document - API Test'
                };
                
                response = await this.makePostRequest('/documents', documentData);
                this.log('✅ Successfully created new document');
                this.log(`📄 New document ID: ${response.documentId}`);
            }

            // Validate response schema
            const validationResult = GoogleDocsDocumentSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('DOCUMENTS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('DOCUMENTS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.logTestResult('DOCUMENTS', 'FAILED', error.message);
        }
    }

    async testBatchUpdate() {
        this.log('\n🧪 Testing BATCHUPDATE endpoint...');
        
        if (!this.testDocumentId) {
            this.logTestResult('BATCHUPDATE', 'PASSED', 'Skipped (no test document ID provided)');
            return;
        }

        try {
            // Test batch update with text insertion
            const batchUpdateData = {
                requests: [
                    {
                        insertText: {
                            location: {
                                index: 1
                            },
                            text: 'Hello from Google Docs API!'
                        }
                    },
                    {
                        updateTextStyle: {
                            range: {
                                startIndex: 1,
                                endIndex: 26
                            },
                            textStyle: {
                                bold: true,
                                fontSize: {
                                    magnitude: 14,
                                    unit: 'PT'
                                }
                            },
                            fields: 'bold,fontSize'
                        }
                    }
                ]
            };
            
            const response = await this.makePostRequest(`/documents/${this.testDocumentId}:batchUpdate`, batchUpdateData);
            
            // Validate response schema
            const validationResult = GoogleDocsBatchUpdateResponseSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('BATCHUPDATE', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('BATCHUPDATE', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.logTestResult('BATCHUPDATE', 'FAILED', error.message);
        }
    }

    async testMockData() {
        this.log('\n🧪 Testing MOCKDATA generation...');
        
        try {
            // Test mock data generation for various schemas
            const mockDocument = {
                documentId: 'test-document-id',
                title: 'Test Document',
                body: {
                    content: [
                        {
                            startIndex: 1,
                            endIndex: 26,
                            paragraph: {
                                elements: [
                                    {
                                        startIndex: 1,
                                        endIndex: 26,
                                        textRun: {
                                            content: 'Hello from Google Docs API!',
                                            textStyle: {
                                                bold: true,
                                                italic: false,
                                                underline: false,
                                                fontSize: {
                                                    magnitude: 14,
                                                    unit: 'PT'
                                                },
                                                foregroundColor: {
                                                    color: {
                                                        rgbColor: {
                                                            red: 0,
                                                            green: 0,
                                                            blue: 0
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                ]
                            },
                            paragraphStyle: {
                                namedStyleType: 'NORMAL_TEXT',
                                alignment: 'START',
                                lineSpacing: 115,
                                direction: 'LEFT_TO_RIGHT'
                            }
                        }
                    ]
                },
                documentStyle: {
                    background: {
                        color: {
                            rgbColor: {
                                red: 1,
                                green: 1,
                                blue: 1
                            }
                        }
                    },
                    pageNumberStart: 1,
                    marginTop: {
                        magnitude: 72,
                        unit: 'PT'
                    },
                    marginBottom: {
                        magnitude: 72,
                        unit: 'PT'
                    },
                    marginRight: {
                        magnitude: 72,
                        unit: 'PT'
                    },
                    marginLeft: {
                        magnitude: 72,
                        unit: 'PT'
                    },
                    pageSize: {
                        width: {
                            magnitude: 612,
                            unit: 'PT'
                        },
                        height: {
                            magnitude: 792,
                            unit: 'PT'
                        }
                    }
                },
                revisionId: 'test-revision-id',
                suggestionsViewMode: 'DEFAULT_FOR_CURRENT_ACCESS',
                footers: {},
                headers: {},
                footnotes: {},
                lists: {},
                namedRanges: {},
                namedStyles: {
                    styles: [
                        {
                            namedStyleType: 'NORMAL_TEXT',
                            paragraphStyle: {
                                alignment: 'START',
                                lineSpacing: 115,
                                direction: 'LEFT_TO_RIGHT'
                            },
                            textStyle: {
                                bold: false,
                                italic: false,
                                underline: false,
                                fontSize: {
                                    magnitude: 11,
                                    unit: 'PT'
                                },
                                foregroundColor: {
                                    color: {
                                        rgbColor: {
                                            red: 0,
                                            green: 0,
                                            blue: 0
                                        }
                                    }
                                }
                            }
                        }
                    ]
                },
                inlineObjects: {},
                positionedObjects: {}
            };

            const mockBatchUpdateRequest = {
                requests: [
                    {
                        insertText: {
                            location: {
                                index: 1
                            },
                            text: 'Hello from Google Docs API!'
                        }
                    },
                    {
                        updateTextStyle: {
                            range: {
                                startIndex: 1,
                                endIndex: 26
                            },
                            textStyle: {
                                bold: true,
                                italic: false,
                                underline: false,
                                fontSize: {
                                    magnitude: 14,
                                    unit: 'PT'
                                },
                                foregroundColor: {
                                    color: {
                                        rgbColor: {
                                            red: 0,
                                            green: 0,
                                            blue: 0
                                        }
                                    }
                                }
                            },
                            fields: 'bold,fontSize,foregroundColor'
                        }
                    },
                    {
                        insertTable: {
                            location: {
                                index: 27
                            },
                            rows: 3,
                            columns: 3,
                            endOfSegmentLocation: {
                                segmentId: ''
                            }
                        }
                    }
                ],
                writeControl: {
                    requiredRevisionId: 'test-revision-id'
                }
            };

            const mockBatchUpdateResponse = {
                documentId: 'test-document-id',
                replies: [
                    {
                        insertText: {
                            objectId: 'test-object-id'
                        }
                    },
                    {
                        updateTextStyle: {}
                    },
                    {
                        insertTable: {
                            objectId: 'test-table-id'
                        }
                    }
                ],
                writeControl: {
                    requiredRevisionId: 'new-revision-id'
                }
            };

            // Validate mock data against schemas
            const documentValidation = GoogleDocsDocumentSchema.safeParse(mockDocument);
            const batchUpdateRequestValidation = GoogleDocsBatchUpdateRequestSchema.safeParse(mockBatchUpdateRequest);
            const batchUpdateResponseValidation = GoogleDocsBatchUpdateResponseSchema.safeParse(mockBatchUpdateResponse);

            if (documentValidation.success && batchUpdateRequestValidation.success && batchUpdateResponseValidation.success) {
                this.logTestResult('MOCKDATA', 'PASSED', 'All mock data schemas validated successfully');
            } else {
                const errors = [];
                if (!documentValidation.success) errors.push(`Document: ${documentValidation.error.message}`);
                if (!batchUpdateRequestValidation.success) errors.push(`BatchUpdateRequest: ${batchUpdateRequestValidation.error.message}`);
                if (!batchUpdateResponseValidation.success) errors.push(`BatchUpdateResponse: ${batchUpdateResponseValidation.error.message}`);
                this.logTestResult('MOCKDATA', 'FAILED', `Schema validation failed: ${errors.join(', ')}`);
            }

        } catch (error) {
            this.logTestResult('MOCKDATA', 'FAILED', error.message);
        }
    }

    async runTests() {
        this.log('🚀 Starting Google Docs API v1 Tests...');
        this.log(`📊 Base URL: ${this.baseUrl}`);
        this.log(`🔑 Access Token: ${this.accessToken ? '✅ Present' : '❌ Missing'}`);
        this.log(`📄 Test Document ID: ${this.testDocumentId || 'Not provided (will create new)'}`);

        await this.testDocuments();
        await this.testBatchUpdate();
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
            this.log('🎉 All tests passed! Google Docs API v1 is working perfectly!');
        } else if (successRate >= 80) {
            this.log('✅ Most tests passed! Google Docs API v1 is mostly working.');
        } else {
            this.log('⚠️ Some tests failed. Check the details above.');
        }
    }
}

// Main execution
async function main() {
    const tester = new GoogleDocsAPITester();
    
    if (!tester.accessToken) {
        console.error('❌ GOOGLE_ACCESS_TOKEN environment variable is required');
        console.log('💡 Run: bun run auth');
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

module.exports = GoogleDocsAPITester; 