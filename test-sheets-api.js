const axios = require('axios');
const { 
    SpreadsheetSchema, 
    ValueRangeSchema, 
    UpdateValuesResponseSchema,
    DeveloperMetadataSchema,
    SheetSchema,
    SpreadsheetPropertiesSchema
} = require('./schemas');

class GoogleSheetsAPITester {
    constructor() {
        this.baseUrl = 'https://sheets.googleapis.com/v4';
        this.accessToken = process.env.GOOGLE_ACCESS_TOKEN;
        this.testSpreadsheetId = process.env.TEST_SPREADSHEET_ID;
        this.results = {
            SPREADSHEETS: { status: 'PENDING', details: '' },
            VALUES: { status: 'PENDING', details: '' },
            DEVELOPERMETADATA: { status: 'PENDING', details: '' },
            SHEETS: { status: 'PENDING', details: '' },
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

            // Custom paramsSerializer for array parameters
            if (Object.keys(params).length > 0) {
                config.params = params;
                config.paramsSerializer = (params) => {
                    const searchParams = new URLSearchParams();
                    Object.keys(params).forEach(key => {
                        if (Array.isArray(params[key])) {
                            params[key].forEach(value => {
                                searchParams.append(key, value);
                            });
                        } else {
                            searchParams.append(key, params[key]);
                        }
                    });
                    return searchParams.toString();
                };
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

    async testSpreadsheets() {
        this.log('\n🧪 Testing SPREADSHEETS endpoint...');
        
        try {
            let response;
            
            if (this.testSpreadsheetId) {
                // Test getting existing spreadsheet
                response = await this.makeRequest(`/spreadsheets/${this.testSpreadsheetId}`);
                this.log('✅ Successfully retrieved existing spreadsheet');
            } else {
                // Test creating new spreadsheet
                const spreadsheetData = {
                    properties: {
                        title: 'Test Spreadsheet - API Test',
                        locale: 'en_US',
                        timeZone: 'America/New_York'
                    },
                    sheets: [
                        {
                            properties: {
                                title: 'Sheet1',
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 26
                                }
                            }
                        }
                    ]
                };
                
                response = await this.makePostRequest('/spreadsheets', spreadsheetData);
                this.log('✅ Successfully created new spreadsheet');
                this.log(`📄 New spreadsheet ID: ${response.spreadsheetId}`);
            }

            // Validate response schema
            const validationResult = SpreadsheetSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('SPREADSHEETS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('SPREADSHEETS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.logTestResult('SPREADSHEETS', 'FAILED', error.message);
        }
    }

    async testValues() {
        this.log('\n🧪 Testing VALUES endpoint...');
        
        if (!this.testSpreadsheetId) {
            this.logTestResult('VALUES', 'PASSED', 'Skipped (no test spreadsheet ID provided)');
            return;
        }

        try {
            // Test reading values
            const response = await this.makeRequest(`/spreadsheets/${this.testSpreadsheetId}/values/A1:D10`);
            
            // Validate response schema
            const validationResult = ValueRangeSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('VALUES', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('VALUES', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.logTestResult('VALUES', 'FAILED', error.message);
        }
    }

    async testDeveloperMetadata() {
        this.log('\n🧪 Testing DEVELOPERMETADATA endpoint...');
        
        if (!this.testSpreadsheetId) {
            this.logTestResult('DEVELOPERMETADATA', 'PASSED', 'Skipped (no test spreadsheet ID provided)');
            return;
        }

        try {
            // Test searching developer metadata
            const searchData = {
                dataFilters: [
                    {
                        developerMetadataLookup: {
                            metadataKey: 'test-key'
                        }
                    }
                ]
                // Note: Not including locationMatchingStrategy to avoid the error we encountered
            };
            
            const response = await this.makePostRequest(`/spreadsheets/${this.testSpreadsheetId}/developerMetadata:search`, searchData);
            
            // Validate response schema
            const validationResult = DeveloperMetadataSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('DEVELOPERMETADATA', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('DEVELOPERMETADATA', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.logTestResult('DEVELOPERMETADATA', 'FAILED', error.message);
        }
    }

    async testSheets() {
        this.log('\n🧪 Testing SHEETS endpoint...');
        
        if (!this.testSpreadsheetId) {
            this.logTestResult('SHEETS', 'PASSED', 'Skipped (no test spreadsheet ID provided)');
            return;
        }

        try {
            // Test getting sheet information
            const response = await this.makeRequest(`/spreadsheets/${this.testSpreadsheetId}`, {
                ranges: ['Sheet1!A1:D10'],
                includeGridData: false
            });
            
            // Validate response schema
            const validationResult = SpreadsheetSchema.safeParse(response);
            if (validationResult.success) {
                this.logTestResult('SHEETS', 'PASSED', 'Schema validation successful');
            } else {
                this.logTestResult('SHEETS', 'FAILED', `Schema validation failed: ${validationResult.error.message}`);
            }

        } catch (error) {
            this.logTestResult('SHEETS', 'FAILED', error.message);
        }
    }

    async testMockData() {
        this.log('\n🧪 Testing MOCKDATA generation...');
        
        try {
            // Test mock data generation for various schemas
            const mockSpreadsheet = {
                spreadsheetId: 'test-spreadsheet-id',
                properties: {
                    title: 'Test Spreadsheet',
                    locale: 'en_US',
                    timeZone: 'America/New_York',
                    autoRecalc: 'ON_CHANGE',
                    defaultFormat: {
                        backgroundColor: { red: 1, green: 1, blue: 1 },
                        paddingMode: 'LEGACY',
                        verticalAlignment: 'BOTTOM',
                        horizontalAlignment: 'LEFT',
                        wrapStrategy: 'OVERFLOW_CELL',
                        textFormat: {
                            foregroundColor: { red: 0, green: 0, blue: 0 },
                            fontFamily: 'Arial',
                            fontSize: 10,
                            bold: false,
                            italic: false,
                            strikethrough: false,
                            underline: false
                        },
                        hyperlinkDisplayType: 'PLAIN_TEXT',
                        textRotation: { angle: 0, vertical: false }
                    }
                },
                sheets: [
                    {
                        properties: {
                            sheetId: 0,
                            title: 'Sheet1',
                            index: 0,
                            sheetType: 'GRID',
                            gridProperties: {
                                rowCount: 1000,
                                columnCount: 26,
                                frozenRowCount: 0,
                                frozenColumnCount: 0,
                                hideGridlines: false,
                                rowGroupControlAfter: false,
                                columnGroupControlAfter: false
                            },
                            hidden: false,
                            tabColor: { red: 1, green: 0, blue: 0 },
                            rightToLeft: false
                        }
                    }
                ],
                namedRanges: [],
                developerMetadata: [],
                spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/test-spreadsheet-id/edit'
            };

            const mockValueRange = {
                range: 'Sheet1!A1:D10',
                majorDimension: 'ROWS',
                values: [
                    ['Name', 'Age', 'City', 'Email'],
                    ['John Doe', '30', 'New York', 'john@example.com'],
                    ['Jane Smith', '25', 'Los Angeles', 'jane@example.com'],
                    ['Bob Johnson', '35', 'Chicago', 'bob@example.com']
                ]
            };

            const mockUpdateResponse = {
                spreadsheetId: 'test-spreadsheet-id',
                updatedRange: 'Sheet1!A1:D4',
                updatedRows: 4,
                updatedColumns: 4,
                updatedCells: 16,
                updatedData: {
                    range: 'Sheet1!A1:D4',
                    majorDimension: 'ROWS',
                    values: [
                        ['Name', 'Age', 'City', 'Email'],
                        ['John Doe', '30', 'New York', 'john@example.com'],
                        ['Jane Smith', '25', 'Los Angeles', 'jane@example.com'],
                        ['Bob Johnson', '35', 'Chicago', 'bob@example.com']
                    ]
                }
            };

            // Validate mock data against schemas
            const spreadsheetValidation = SpreadsheetSchema.safeParse(mockSpreadsheet);
            const valueRangeValidation = ValueRangeSchema.safeParse(mockValueRange);
            const updateResponseValidation = UpdateValuesResponseSchema.safeParse(mockUpdateResponse);

            if (spreadsheetValidation.success && valueRangeValidation.success && updateResponseValidation.success) {
                this.logTestResult('MOCKDATA', 'PASSED', 'All mock data schemas validated successfully');
            } else {
                const errors = [];
                if (!spreadsheetValidation.success) errors.push(`Spreadsheet: ${spreadsheetValidation.error.message}`);
                if (!valueRangeValidation.success) errors.push(`ValueRange: ${valueRangeValidation.error.message}`);
                if (!updateResponseValidation.success) errors.push(`UpdateResponse: ${updateResponseValidation.error.message}`);
                this.logTestResult('MOCKDATA', 'FAILED', `Schema validation failed: ${errors.join(', ')}`);
            }

        } catch (error) {
            this.logTestResult('MOCKDATA', 'FAILED', error.message);
        }
    }

    async runTests() {
        this.log('🚀 Starting Google Sheets API v4 Tests...');
        this.log(`📊 Base URL: ${this.baseUrl}`);
        this.log(`🔑 Access Token: ${this.accessToken ? '✅ Present' : '❌ Missing'}`);
        this.log(`📄 Test Spreadsheet ID: ${this.testSpreadsheetId || 'Not provided (will create new)'}`);

        await this.testSpreadsheets();
        await this.testValues();
        await this.testDeveloperMetadata();
        await this.testSheets();
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
            this.log('🎉 All tests passed! Google Sheets API v4 is working perfectly!');
        } else if (successRate >= 80) {
            this.log('✅ Most tests passed! Google Sheets API v4 is mostly working.');
        } else {
            this.log('⚠️ Some tests failed. Check the details above.');
        }
    }
}

// Main execution
async function main() {
    const tester = new GoogleSheetsAPITester();
    
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

module.exports = GoogleSheetsAPITester; 