import { z } from 'zod';

// ============ GOOGLE DRIVE SCHEMAS ============
export const DriveFileSchema = z.object({
  id: z.string(),
  name: z.string(),
  mimeType: z.string().optional(),
  parents: z.array(z.string()).optional(),
  size: z.string().optional(),
  createdTime: z.string().optional(),
  modifiedTime: z.string().optional(),
  webViewLink: z.string().optional(),
  webContentLink: z.string().optional(),
  owners: z.array(z.object({
    displayName: z.string(),
    emailAddress: z.string().email(),
    photoLink: z.string().optional()
  })).optional()
});

export const DriveFileListSchema = z.object({
  kind: z.literal('drive#fileList'),
  files: z.array(DriveFileSchema),
  nextPageToken: z.string().optional(),
  incompleteSearch: z.boolean().optional()
});

export const DriveCreateFileSchema = z.object({
  name: z.string(),
  parents: z.array(z.string()).optional(),
  mimeType: z.string().optional()
});

// ============ GOOGLE CALENDAR SCHEMAS ============
export const CalendarEventSchema = z.object({
  id: z.string(),
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional()
  }),
  end: z.object({
    dateTime: z.string().optional(),
    date: z.string().optional(),
    timeZone: z.string().optional()
  }),
  attendees: z.array(z.object({
    email: z.string().email(),
    displayName: z.string().optional(),
    responseStatus: z.enum(['needsAction', 'declined', 'tentative', 'accepted']).optional()
  })).optional(),
  location: z.string().optional(),
  status: z.enum(['tentative', 'confirmed', 'cancelled']).optional()
});

export const CalendarEventListSchema = z.object({
  kind: z.literal('calendar#events'),
  items: z.array(CalendarEventSchema),
  nextPageToken: z.string().optional(),
  summary: z.string(),
  timeZone: z.string()
});

export const CalendarCreateEventSchema = z.object({
  summary: z.string(),
  description: z.string().optional(),
  start: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional()
  }),
  end: z.object({
    dateTime: z.string(),
    timeZone: z.string().optional()
  }),
  attendees: z.array(z.object({
    email: z.string().email()
  })).optional()
});

// ============ GMAIL SCHEMAS ============
export const GmailMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  labelIds: z.array(z.string()).optional(),
  snippet: z.string(),
  historyId: z.string(),
  internalDate: z.string(),
  payload: z.object({
    partId: z.string().optional(),
    mimeType: z.string(),
    filename: z.string().optional(),
    headers: z.array(z.object({
      name: z.string(),
      value: z.string()
    })),
    body: z.object({
      attachmentId: z.string().optional(),
      size: z.number(),
      data: z.string().optional()
    }).optional()
  }).optional(),
  sizeEstimate: z.number().optional()
});

export const GmailMessageListSchema = z.object({
  messages: z.array(z.object({
    id: z.string(),
    threadId: z.string()
  })),
  nextPageToken: z.string().optional(),
  resultSizeEstimate: z.number()
});

export const GmailSendMessageSchema = z.object({
  raw: z.string() // Base64 encoded email
});

// ============ GOOGLE CONTACTS (PEOPLE API) SCHEMAS ============
export const ContactPersonSchema = z.object({
  resourceName: z.string(),
  etag: z.string(),
  names: z.array(z.object({
    displayName: z.string(),
    familyName: z.string().optional(),
    givenName: z.string().optional(),
    middleName: z.string().optional()
  })).optional(),
  emailAddresses: z.array(z.object({
    value: z.string().email(),
    type: z.string().optional(),
    formattedType: z.string().optional()
  })).optional(),
  phoneNumbers: z.array(z.object({
    value: z.string(),
    type: z.string().optional(),
    formattedType: z.string().optional()
  })).optional(),
  addresses: z.array(z.object({
    formattedValue: z.string(),
    type: z.string().optional(),
    streetAddress: z.string().optional(),
    city: z.string().optional(),
    region: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  })).optional(),
  organizations: z.array(z.object({
    name: z.string(),
    title: z.string().optional(),
    department: z.string().optional()
  })).optional()
});

export const ContactListSchema = z.object({
  connections: z.array(ContactPersonSchema),
  nextPageToken: z.string().optional(),
  totalPeople: z.number(),
  totalItems: z.number()
});

export const ContactCreateSchema = z.object({
  names: z.array(z.object({
    givenName: z.string(),
    familyName: z.string().optional()
  })),
  emailAddresses: z.array(z.object({
    value: z.string().email()
  })).optional(),
  phoneNumbers: z.array(z.object({
    value: z.string()
  })).optional()
});

// ============ ERROR SCHEMAS ============
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
    status: z.string().optional(),
    details: z.array(z.any()).optional()
  })
});

// ============ 1FORGE FINANCE API SCHEMAS ============
export const ForgeSymbolSchema = z.string().regex(/^[A-Z]{6}$/, 'Symbol should be 6 uppercase letters like EURUSD');

export const ForgeSymbolListSchema = z.array(ForgeSymbolSchema);

export const ForgeQuoteSchema = z.object({
  symbol: ForgeSymbolSchema,
  price: z.number().positive(),
  bid: z.number().positive(),
  ask: z.number().positive(),
  timestamp: z.number().int().positive()
});

export const ForgeQuoteListSchema = z.array(ForgeQuoteSchema);

export const ForgeQuotesRequestSchema = z.object({
  pairs: z.string(),
  api_key: z.string()
});

export const ForgeSymbolsRequestSchema = z.object({
  api_key: z.string()
});

export const ForgeConvertRequestSchema = z.object({
  from: z.string().length(3),
  to: z.string().length(3),
  quantity: z.number().positive(),
  api_key: z.string()
});

export const ForgeConvertResponseSchema = z.object({
  from: z.string(),
  to: z.string(),
  quantity: z.number(),
  value: z.number(),
  text: z.string()
});

export const ForgeErrorResponseSchema = z.object({
  error: z.boolean(),
  message: z.string()
});

export const ForgeSuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.any()
});

// ============ GOOGLE ADSENSE API SCHEMAS ============
export const AdSenseAccountSchema = z.object({
  name: z.string(), // Format: accounts/pub-[0-9]+
  displayName: z.string().optional(),
  pendingTasks: z.array(z.string()).optional(),
  timeZone: z.object({
    id: z.string(),
    version: z.string().optional() // Made optional since real API doesn't always include it
  }).optional(),
  createTime: z.string().optional(),
  state: z.enum(['STATE_UNSPECIFIED', 'READY', 'NEEDS_ATTENTION', 'CLOSED']).optional(),
  premium: z.boolean().optional()
});

export const AdSenseAccountsSchema = z.object({
  accounts: z.array(AdSenseAccountSchema).optional(),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAdClientSchema = z.object({
  name: z.string(), // Format: accounts/{account}/adclients/{adclient}
  productCode: z.string().optional(),
  reportingDimensionId: z.string().optional(),
  state: z.enum(['STATE_UNSPECIFIED', 'READY', 'GETTING_READY', 'REQUIRES_REVIEW']).optional()
});

export const AdSenseAdClientsSchema = z.object({
  adClients: z.array(AdSenseAdClientSchema).optional(),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAdStyleSchema = z.object({
  kind: z.literal('adsense#adStyle'),
  colors: z.object({
    background: z.string().optional(),
    border: z.string().optional(),
    text: z.string().optional(),
    title: z.string().optional(),
    url: z.string().optional()
  }).optional(),
  font: z.object({
    family: z.string().optional(),
    size: z.string().optional()
  }).optional(),
  corners: z.string().optional()
});

export const AdSenseAdUnitSchema = z.object({
  name: z.string(), // Format: accounts/{account}/adclients/{adclient}/adunits/{adunit}
  displayName: z.string().optional(),
  reportingDimensionId: z.string().optional(),
  state: z.enum(['STATE_UNSPECIFIED', 'ACTIVE', 'ARCHIVED']).optional(),
  contentAdsSettings: z.object({
    size: z.string().optional(),
    type: z.enum(['TYPE_UNSPECIFIED', 'DISPLAY', 'FEED', 'ARTICLE', 'MATCHED_CONTENT', 'LINK']).optional()
  }).optional()
});

export const AdSenseAdUnitsSchema = z.object({
  adUnits: z.array(AdSenseAdUnitSchema).optional(),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAdCodeSchema = z.object({
  kind: z.literal('adsense#adCode'),
  adCode: z.string().optional(),
  ampBody: z.string().optional(),
  ampHead: z.string().optional()
});

export const AdSenseCustomChannelSchema = z.object({
  name: z.string(), // Format: accounts/{account}/adclients/{adclient}/customchannels/{customchannel}
  displayName: z.string().optional(),
  reportingDimensionId: z.string().optional(),
  active: z.boolean().optional()
});

export const AdSenseCustomChannelsSchema = z.object({
  customChannels: z.array(AdSenseCustomChannelSchema).optional(),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseUrlChannelSchema = z.object({
  name: z.string(), // Format: accounts/{account}/adclients/{adclient}/urlchannels/{urlchannel}
  reportingDimensionId: z.string().optional(),
  uriPattern: z.string().optional()
});

export const AdSenseUrlChannelsSchema = z.object({
  urlChannels: z.array(AdSenseUrlChannelSchema).optional(),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAlertSchema = z.object({
  name: z.string(), // Format: accounts/{account}/alerts/{alert}
  message: z.string().optional(),
  severity: z.enum(['SEVERITY_UNSPECIFIED', 'INFO', 'WARNING', 'SEVERE']).optional(),
  type: z.string().optional()
});

export const AdSenseAlertsSchema = z.object({
  alerts: z.array(AdSenseAlertSchema).optional()
});

export const AdSensePaymentSchema = z.object({
  name: z.string(), // Format: accounts/{account}/payments/...
  amount: z.string().optional(),
  date: z.object({
    year: z.number().optional(),
    month: z.number().optional(),
    day: z.number().optional()
  }).optional()
});

export const AdSensePaymentsSchema = z.object({
  payments: z.array(AdSensePaymentSchema).optional()
});

export const AdSenseSavedAdStyleSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.literal('adsense#savedAdStyle'),
  adStyle: AdSenseAdStyleSchema.optional()
});

export const AdSenseSavedAdStylesSchema = z.object({
  kind: z.literal('adsense#savedAdStyles'),
  etag: z.string().optional(),
  items: z.array(AdSenseSavedAdStyleSchema),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseSavedReportSchema = z.object({
  name: z.string(), // Format: accounts/{account}/reports/{report}
  title: z.string().optional()
});

export const AdSenseSavedReportsSchema = z.object({
  savedReports: z.array(AdSenseSavedReportSchema).optional(),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseReportHeaderSchema = z.object({
  name: z.string(),
  type: z.enum(['HEADER_TYPE_UNSPECIFIED', 'DIMENSION', 'METRIC_TALLY', 'METRIC_RATIO', 'METRIC_CURRENCY', 'METRIC_MILLISECONDS', 'METRIC_DECIMAL']),
  currencyCode: z.string().optional()
});

export const AdSenseReportSchema = z.object({
  startDate: z.object({
    year: z.number(),
    month: z.number(),
    day: z.number()
  }),
  endDate: z.object({
    year: z.number(),
    month: z.number(),
    day: z.number()
  }),
  totalMatchedRows: z.string().optional(),
  headers: z.array(AdSenseReportHeaderSchema).optional(),
  rows: z.array(z.object({
    cells: z.array(z.object({
      value: z.string()
    }))
  })).optional(),
  totals: z.object({
    cells: z.array(z.object({
      value: z.string()
    }))
  }).optional(),
  averages: z.object({
    cells: z.array(z.object({
      value: z.string()
    }))
  }).optional(),
  warnings: z.array(z.string()).optional()
});

export const AdSenseMetadataEntrySchema = z.object({
  id: z.string(),
  kind: z.literal('adsense#reportingMetadataEntry'),
  compatibleDimensions: z.array(z.string()).optional(),
  compatibleMetrics: z.array(z.string()).optional(),
  requiredDimensions: z.array(z.string()).optional(),
  requiredMetrics: z.array(z.string()).optional(),
  supportedProducts: z.array(z.string()).optional()
});

export const AdSenseMetadataSchema = z.object({
  kind: z.literal('adsense#metadata'),
  items: z.array(AdSenseMetadataEntrySchema)
});

// ============ AUTH SCHEMAS ============
export const AuthTokenSchema = z.object({
  access_token: z.string(),
  token_type: z.literal('Bearer'),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string()
}); 

// ============ 1PASSWORD EVENTS API SCHEMAS ============
export const OnePasswordUUIDSchema = z.string().uuid();
export const OnePasswordDateTimeSchema = z.string().datetime();
export const OnePasswordLocationSchema = z.object({
  country: z.string().optional(),
  region: z.string().optional(),
  city: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional()
});

export const OnePasswordClientSchema = z.object({
  app_name: z.string().optional(),
  app_version: z.string().optional(),
  platform: z.string().optional(),
  device_name: z.string().optional(),
  os_version: z.string().optional(),
  os_name: z.string().optional(),
  ip_address: z.string().optional(),
  location: OnePasswordLocationSchema.optional()
});

export const OnePasswordUserSchema = z.object({
  uuid: OnePasswordUUIDSchema,
  name: z.string().optional(),
  email: z.string().email().optional()
});

export const OnePasswordSessionSchema = z.object({
  uuid: OnePasswordUUIDSchema,
  user_uuid: OnePasswordUUIDSchema.optional(),
  created_at: OnePasswordDateTimeSchema,
  expires_at: OnePasswordDateTimeSchema.optional()
});

export const OnePasswordDetailsSchema = z.object({
  location: OnePasswordLocationSchema.optional(),
  user: OnePasswordUserSchema.optional(),
  client: OnePasswordClientSchema.optional(),
  session: OnePasswordSessionSchema.optional()
});

export const OnePasswordAuditEventActionsSchema = z.enum([
  'item.created', 'item.updated', 'item.deleted', 'item.viewed', 'item.copied',
  'vault.created', 'vault.updated', 'vault.deleted', 'vault.viewed',
  'user.created', 'user.updated', 'user.deleted', 'user.viewed',
  'group.created', 'group.updated', 'group.deleted', 'group.viewed'
]);

export const OnePasswordAuditEventObjectTypesSchema = z.enum([
  'item', 'vault', 'user', 'group', 'service_account'
]);

export const OnePasswordAuditEventSchema = z.object({
  uuid: OnePasswordUUIDSchema,
  timestamp: OnePasswordDateTimeSchema,
  action: OnePasswordAuditEventActionsSchema,
  object_type: OnePasswordAuditEventObjectTypesSchema,
  object_uuid: OnePasswordUUIDSchema,
  actor_uuid: OnePasswordUUIDSchema.optional(),
  details: OnePasswordDetailsSchema.optional()
});

export const OnePasswordAuditEventsResponseSchema = z.object({
  items: z.array(OnePasswordAuditEventSchema),
  cursor: z.string().optional(),
  has_more: z.boolean()
});

export const OnePasswordItemUsageActionsSchema = z.enum([
  'reveal', 'copy', 'view', 'edit', 'delete'
]);

export const OnePasswordItemUsageSchema = z.object({
  uuid: OnePasswordUUIDSchema,
  timestamp: OnePasswordDateTimeSchema,
  action: OnePasswordItemUsageActionsSchema,
  item_uuid: OnePasswordUUIDSchema,
  vault_uuid: OnePasswordUUIDSchema,
  user_uuid: OnePasswordUUIDSchema.optional(),
  session_uuid: OnePasswordUUIDSchema.optional()
});

export const OnePasswordItemUsagesResponseSchema = z.object({
  items: z.array(OnePasswordItemUsageSchema),
  cursor: z.string().optional(),
  has_more: z.boolean()
});

export const OnePasswordSignInAttemptCategorySchema = z.enum([
  'success', 'failure', 'blocked'
]);

export const OnePasswordSignInAttemptTypeSchema = z.enum([
  'credentials_ok', 'credentials_bad', 'two_factor_ok', 'two_factor_bad',
  'two_factor_timeout', 'two_factor_duo_timeout', 'two_factor_duo_error',
  'two_factor_duo_unavailable', 'two_factor_duo_bypass', 'two_factor_remember_me',
  'two_factor_reset', 'two_factor_reset_timeout', 'two_factor_reset_error',
  'two_factor_reset_unavailable', 'two_factor_reset_bypass', 'two_factor_reset_remember_me'
]);

export const OnePasswordSignInAttemptSchema = z.object({
  uuid: OnePasswordUUIDSchema,
  timestamp: OnePasswordDateTimeSchema,
  type: OnePasswordSignInAttemptTypeSchema,
  category: OnePasswordSignInAttemptCategorySchema,
  user_uuid: OnePasswordUUIDSchema.optional(),
  session_uuid: OnePasswordUUIDSchema.optional(),
  details: OnePasswordDetailsSchema.optional()
});

export const OnePasswordSignInAttemptsResponseSchema = z.object({
  items: z.array(OnePasswordSignInAttemptSchema),
  cursor: z.string().optional(),
  has_more: z.boolean()
});

export const OnePasswordCursorSchema = z.object({
  cursor: z.string().optional(),
  has_more: z.boolean()
});

export const OnePasswordResetCursorSchema = z.object({
  cursor: z.string().optional()
});

export const OnePasswordRequestSchema = z.object({
  limit: z.number().min(1).max(100).optional(),
  start_time: OnePasswordDateTimeSchema.optional(),
  end_time: OnePasswordDateTimeSchema.optional(),
  cursor: z.string().optional()
});

export const OnePasswordIntrospectionSchema = z.object({
  features: z.array(z.string()),
  issued_at: OnePasswordDateTimeSchema,
  uuid: z.string()
});

export const OnePasswordIntrospectionV2Schema = z.object({
  features: z.array(z.string()),
  issued_at: OnePasswordDateTimeSchema,
  uuid: z.string()
});

export const OnePasswordErrorSchema = z.object({
  Error: z.object({
    Message: z.string(),
    Code: z.number().optional()
  })
});

// ============ GOOGLE SHEETS SCHEMAS ============
export const SpreadsheetPropertiesSchema = z.object({
  title: z.string().optional(),
  locale: z.string().optional(),
  timeZone: z.string().optional(),
  autoRecalc: z.enum(['ON_CHANGE', 'ON_CHANGE_AND_AT_TIME', 'AT_TIME']).optional(),
  defaultFormat: z.object({
    backgroundColor: z.object({
      red: z.number().min(0).max(1).optional(),
      green: z.number().min(0).max(1).optional(),
      blue: z.number().min(0).max(1).optional(),
      alpha: z.number().min(0).max(1).optional()
    }).optional(),
    padding: z.object({
      top: z.number().optional(),
      right: z.number().optional(),
      bottom: z.number().optional(),
      left: z.number().optional()
    }).optional(),
    verticalAlignment: z.enum(['TOP', 'MIDDLE', 'BOTTOM']).optional(),
    wrapStrategy: z.enum(['OVERFLOW_CELL', 'CLIP', 'WRAP']).optional(),
    textDirection: z.enum(['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT']).optional()
  }).optional()
});

export const SheetPropertiesSchema = z.object({
  sheetId: z.number().optional(),
  title: z.string().optional(),
  index: z.number().optional(),
  sheetType: z.enum(['GRID', 'OBJECT']).optional(),
  gridProperties: z.object({
    rowCount: z.number().optional(),
    columnCount: z.number().optional(),
    frozenRowCount: z.number().optional(),
    frozenColumnCount: z.number().optional(),
    hideGridlines: z.boolean().optional(),
    rowGroupControlAfter: z.boolean().optional(),
    columnGroupControlAfter: z.boolean().optional()
  }).optional(),
  hidden: z.boolean().optional(),
  tabColor: z.object({
    red: z.number().min(0).max(1).optional(),
    green: z.number().min(0).max(1).optional(),
    blue: z.number().min(0).max(1).optional(),
    alpha: z.number().min(0).max(1).optional()
  }).optional(),
  rightToLeft: z.boolean().optional()
});

export const SheetSchema = z.object({
  properties: SheetPropertiesSchema.optional(),
  data: z.array(z.object({
    rowData: z.array(z.object({
      values: z.array(z.object({
        userEnteredValue: z.object({
          stringValue: z.string().optional(),
          numberValue: z.number().optional(),
          boolValue: z.boolean().optional(),
          formulaValue: z.string().optional()
        }).optional(),
        effectiveValue: z.object({
          stringValue: z.string().optional(),
          numberValue: z.number().optional(),
          boolValue: z.boolean().optional(),
          formulaValue: z.string().optional()
        }).optional(),
        formattedValue: z.string().optional(),
        userEnteredFormat: z.object({
          backgroundColor: z.object({
            red: z.number().min(0).max(1).optional(),
            green: z.number().min(0).max(1).optional(),
            blue: z.number().min(0).max(1).optional(),
            alpha: z.number().min(0).max(1).optional()
          }).optional(),
          textFormat: z.object({
            foregroundColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional(),
              alpha: z.number().min(0).max(1).optional()
            }).optional(),
            fontFamily: z.string().optional(),
            fontSize: z.number().optional(),
            bold: z.boolean().optional(),
            italic: z.boolean().optional(),
            strikethrough: z.boolean().optional(),
            underline: z.boolean().optional()
          }).optional()
        }).optional()
      })).optional()
    })).optional()
  })).optional()
});

export const SpreadsheetSchema = z.object({
  spreadsheetId: z.string(),
  properties: SpreadsheetPropertiesSchema.optional(),
  sheets: z.array(SheetSchema).optional(),
  namedRanges: z.array(z.object({
    namedRangeId: z.string().optional(),
    name: z.string().optional(),
    range: z.object({
      sheetId: z.number().optional(),
      startRowIndex: z.number().optional(),
      endRowIndex: z.number().optional(),
      startColumnIndex: z.number().optional(),
      endColumnIndex: z.number().optional()
    }).optional()
  })).optional(),
  developerMetadata: z.array(z.object({
    metadataId: z.number().optional(),
    metadataKey: z.string().optional(),
    metadataValue: z.string().optional(),
    location: z.object({
      locationType: z.enum(['ROW', 'COLUMN', 'SHEET', 'SPREADSHEET']).optional(),
      spreadsheet: z.boolean().optional(),
      sheetId: z.number().optional(),
      dimensionRange: z.object({
        sheetId: z.number().optional(),
        dimension: z.enum(['ROWS', 'COLUMNS']).optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional()
      }).optional()
    }).optional(),
    visibility: z.enum(['DOCUMENT', 'PROJECT']).optional()
  })).optional(),
  spreadsheetUrl: z.string().optional()
});

export const ValueRangeSchema = z.object({
  range: z.string(),
  majorDimension: z.enum(['ROWS', 'COLUMNS']).optional(),
  values: z.array(z.array(z.any())).optional()
});

export const UpdateValuesResponseSchema = z.object({
  spreadsheetId: z.string(),
  updatedRange: z.string(),
  updatedRows: z.number().optional(),
  updatedColumns: z.number().optional(),
  updatedCells: z.number().optional(),
  updatedData: ValueRangeSchema.optional()
});

export const BatchGetValuesResponseSchema = z.object({
  spreadsheetId: z.string(),
  valueRanges: z.array(ValueRangeSchema),
  valueRanges: z.array(z.object({
    range: z.string(),
    majorDimension: z.enum(['ROWS', 'COLUMNS']).optional(),
    values: z.array(z.array(z.any())).optional()
  }))
});

export const BatchUpdateValuesResponseSchema = z.object({
  spreadsheetId: z.string(),
  totalUpdatedRows: z.number().optional(),
  totalUpdatedColumns: z.number().optional(),
  totalUpdatedCells: z.number().optional(),
  totalUpdatedSheets: z.number().optional(),
  responses: z.array(UpdateValuesResponseSchema)
});

export const ClearValuesResponseSchema = z.object({
  spreadsheetId: z.string(),
  clearedRange: z.string()
});

export const DeveloperMetadataSchema = z.object({
  metadataId: z.number().optional(),
  metadataKey: z.string().optional(),
  metadataValue: z.string().optional(),
  location: z.object({
    locationType: z.enum(['ROW', 'COLUMN', 'SHEET', 'SPREADSHEET']).optional(),
    spreadsheet: z.boolean().optional(),
    sheetId: z.number().optional(),
    dimensionRange: z.object({
      sheetId: z.number().optional(),
      dimension: z.enum(['ROWS', 'COLUMNS']).optional(),
      startIndex: z.number().optional(),
      endIndex: z.number().optional()
    }).optional()
  }).optional(),
  visibility: z.enum(['DOCUMENT', 'PROJECT']).optional()
});

export const SearchDeveloperMetadataResponseSchema = z.object({
  matchedDeveloperMetadata: z.array(z.object({
    developerMetadata: DeveloperMetadataSchema.optional(),
    dataFilters: z.array(z.object({
      a1Range: z.string().optional(),
      gridRange: z.object({
        sheetId: z.number().optional(),
        startRowIndex: z.number().optional(),
        endRowIndex: z.number().optional(),
        startColumnIndex: z.number().optional(),
        endColumnIndex: z.number().optional()
      }).optional(),
      developerMetadataLookup: z.object({
        locationMatchingStrategy: z.enum(['EXACT_LOCATION', 'INTERSECTING_LOCATION']).optional(),
        locationType: z.enum(['ROW', 'COLUMN', 'SHEET', 'SPREADSHEET']).optional(),
        metadataId: z.number().optional(),
        metadataKey: z.string().optional(),
        metadataValue: z.string().optional(),
        visibility: z.enum(['DOCUMENT', 'PROJECT']).optional()
      }).optional()
    })).optional()
  })).optional()
}); 

// ============ YOUTUBE API SCHEMAS ============
export const YouTubeVideoSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#video').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    publishedAt: z.string().optional(),
    channelId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      standard: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      maxres: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional(),
    channelTitle: z.string().optional(),
    tags: z.array(z.string()).optional(),
    categoryId: z.string().optional(),
    liveBroadcastContent: z.enum(['none', 'upcoming', 'live']).optional(),
    defaultLanguage: z.string().optional(),
    localized: z.object({
      title: z.string().optional(),
      description: z.string().optional()
    }).optional(),
    defaultAudioLanguage: z.string().optional()
  }).optional(),
  contentDetails: z.object({
    duration: z.string().optional(),
    dimension: z.string().optional(),
    definition: z.enum(['sd', 'hd']).optional(),
    caption: z.enum(['true', 'false']).optional(),
    licensedContent: z.boolean().optional(),
    contentRating: z.object({
      acbRating: z.string().optional(),
      agcomRating: z.string().optional(),
      anatelRating: z.string().optional(),
      bbfcRating: z.string().optional(),
      bfvcRating: z.string().optional(),
      bmukkRating: z.string().optional(),
      catvRating: z.string().optional(),
      catvfrRating: z.string().optional(),
      cbfRating: z.string().optional(),
      cccRating: z.string().optional(),
      cceRating: z.string().optional(),
      chfilmRating: z.string().optional(),
      chvrsRating: z.string().optional(),
      cicfRating: z.string().optional(),
      cnaRating: z.string().optional(),
      cncRating: z.string().optional(),
      csaRating: z.string().optional(),
      cscfRating: z.string().optional(),
      czfilmRating: z.string().optional(),
      djctqRating: z.string().optional(),
      djctqRatingReasons: z.array(z.string()).optional(),
      ecbmctRating: z.string().optional(),
      eefilmRating: z.string().optional(),
      egfilmRating: z.string().optional(),
      eirinRating: z.string().optional(),
      fcbmRating: z.string().optional(),
      fcoRating: z.string().optional(),
      fmocRating: z.string().optional(),
      fpbRating: z.string().optional(),
      fpbRatingReasons: z.array(z.string()).optional(),
      fskRating: z.string().optional(),
      grfilmRating: z.string().optional(),
      icaaRating: z.string().optional(),
      ifcoRating: z.string().optional(),
      ilfilmRating: z.string().optional(),
      incaaRating: z.string().optional(),
      kfcbRating: z.string().optional(),
      kijkwijzerRating: z.string().optional(),
      kmrbRating: z.string().optional(),
      lsfRating: z.string().optional(),
      mccaaRating: z.string().optional(),
      mccypRating: z.string().optional(),
      mcstRating: z.string().optional(),
      mdaRating: z.string().optional(),
      medietilsynetRating: z.string().optional(),
      mekuRating: z.string().optional(),
      menaMpaaRating: z.string().optional(),
      mibacRating: z.string().optional(),
      mocRating: z.string().optional(),
      moctwRating: z.string().optional(),
      mpaaRating: z.string().optional(),
      mpaatRating: z.string().optional(),
      mtrcbRating: z.string().optional(),
      nbcRating: z.string().optional(),
      nbcplRating: z.string().optional(),
      nfrcRating: z.string().optional(),
      nfvcbRating: z.string().optional(),
      nkclvRating: z.string().optional(),
      oflcRating: z.string().optional(),
      pefilmRating: z.string().optional(),
      rcnofRating: z.string().optional(),
      resorteviolenciaRating: z.string().optional(),
      rtcRating: z.string().optional(),
      rteRating: z.string().optional(),
      russiaRating: z.string().optional(),
      skfilmRating: z.string().optional(),
      smaisRating: z.string().optional(),
      smsaRating: z.string().optional(),
      tvpgRating: z.string().optional(),
      ytRating: z.string().optional()
    }).optional(),
    projection: z.enum(['rectangular', '360']).optional(),
    hasCustomThumbnail: z.boolean().optional()
  }).optional(),
  statistics: z.object({
    viewCount: z.string().optional(),
    likeCount: z.string().optional(),
    dislikeCount: z.string().optional(),
    favoriteCount: z.string().optional(),
    commentCount: z.string().optional()
  }).optional(),
  status: z.object({
    uploadStatus: z.enum(['uploaded', 'processed', 'failed']).optional(),
    privacyStatus: z.enum(['public', 'unlisted', 'private']).optional(),
    license: z.enum(['youtube', 'creativeCommon']).optional(),
    embeddable: z.boolean().optional(),
    publicStatsViewable: z.boolean().optional(),
    madeForKids: z.boolean().optional(),
    selfDeclaredMadeForKids: z.boolean().optional()
  }).optional()
});

export const YouTubeVideoListResponseSchema = z.object({
  kind: z.literal('youtube#videoListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubeVideoSchema).optional()
});

export const YouTubeChannelSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#channel').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    customUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional(),
    defaultLanguage: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  contentDetails: z.object({
    relatedPlaylists: z.object({
      likes: z.string().optional(),
      uploads: z.string().optional()
    }).optional()
  }).optional(),
  statistics: z.object({
    viewCount: z.string().optional(),
    subscriberCount: z.string().optional(),
    hiddenSubscriberCount: z.boolean().optional(),
    videoCount: z.string().optional()
  }).optional(),
  status: z.object({
    privacyStatus: z.enum(['public', 'unlisted', 'private']).optional(),
    isLinked: z.boolean().optional(),
    longUploadsStatus: z.enum(['allowed', 'disallowed', 'eligible', 'longer', 'short']).optional(),
    madeForKids: z.boolean().optional(),
    selfDeclaredMadeForKids: z.boolean().optional()
  }).optional()
});

export const YouTubeChannelListResponseSchema = z.object({
  kind: z.literal('youtube#channelListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubeChannelSchema).optional()
});

export const YouTubePlaylistSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#playlist').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    publishedAt: z.string().optional(),
    channelId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      standard: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      maxres: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional(),
    channelTitle: z.string().optional(),
    defaultLanguage: z.string().optional(),
    localized: z.object({
      title: z.string().optional(),
      description: z.string().optional()
    }).optional()
  }).optional(),
  status: z.object({
    privacyStatus: z.enum(['public', 'unlisted', 'private']).optional()
  }).optional(),
  contentDetails: z.object({
    itemCount: z.number().optional()
  }).optional()
});

export const YouTubePlaylistListResponseSchema = z.object({
  kind: z.literal('youtube#playlistListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubePlaylistSchema).optional()
});

export const YouTubePlaylistItemSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#playlistItem').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    publishedAt: z.string().optional(),
    channelId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      standard: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      maxres: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional(),
    channelTitle: z.string().optional(),
    playlistId: z.string().optional(),
    position: z.number().optional(),
    resourceId: z.object({
      kind: z.string().optional(),
      videoId: z.string().optional()
    }).optional(),
    videoOwnerChannelTitle: z.string().optional(),
    videoOwnerChannelId: z.string().optional()
  }).optional(),
  contentDetails: z.object({
    videoId: z.string().optional(),
    startAt: z.string().optional(),
    endAt: z.string().optional(),
    note: z.string().optional(),
    videoPublishedAt: z.string().optional()
  }).optional(),
  status: z.object({
    privacyStatus: z.enum(['public', 'unlisted', 'private']).optional()
  }).optional()
});

export const YouTubePlaylistItemListResponseSchema = z.object({
  kind: z.literal('youtube#playlistItemListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubePlaylistItemSchema).optional()
});

export const YouTubeSearchResultSchema = z.object({
  kind: z.literal('youtube#searchResult').optional(),
  etag: z.string().optional(),
  id: z.object({
    kind: z.string().optional(),
    videoId: z.string().optional(),
    channelId: z.string().optional(),
    playlistId: z.string().optional()
  }).optional(),
  snippet: z.object({
    publishedAt: z.string().optional(),
    channelId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional(),
    channelTitle: z.string().optional(),
    liveBroadcastContent: z.enum(['none', 'upcoming', 'live']).optional(),
    publishTime: z.string().optional()
  }).optional()
});

export const YouTubeSearchListResponseSchema = z.object({
  kind: z.literal('youtube#searchListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubeSearchResultSchema).optional()
});

export const YouTubeCommentSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#comment').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    authorDisplayName: z.string().optional(),
    authorProfileImageUrl: z.string().optional(),
    authorChannelUrl: z.string().optional(),
    authorChannelId: z.object({
      value: z.string().optional()
    }).optional(),
    videoId: z.string().optional(),
    textDisplay: z.string().optional(),
    textOriginal: z.string().optional(),
    parentId: z.string().optional(),
    canRate: z.boolean().optional(),
    viewerRating: z.enum(['like', 'dislike', 'none']).optional(),
    likeCount: z.number().optional(),
    moderationStatus: z.enum(['published', 'heldForReview', 'likelySpam', 'rejected']).optional(),
    publishedAt: z.string().optional(),
    updatedAt: z.string().optional(),
    totalReplyCount: z.number().optional(),
    canReply: z.boolean().optional(),
    isPublic: z.boolean().optional()
  }).optional()
});

export const YouTubeCommentListResponseSchema = z.object({
  kind: z.literal('youtube#commentListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubeCommentSchema).optional()
});

export const YouTubeCommentThreadSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#commentThread').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    channelId: z.string().optional(),
    videoId: z.string().optional(),
    topLevelComment: YouTubeCommentSchema.optional(),
    canReply: z.boolean().optional(),
    totalReplyCount: z.number().optional(),
    isPublic: z.boolean().optional()
  }).optional(),
  replies: z.object({
    comments: z.array(YouTubeCommentSchema).optional()
  }).optional()
});

export const YouTubeCommentThreadListResponseSchema = z.object({
  kind: z.literal('youtube#commentThreadListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubeCommentThreadSchema).optional()
});

export const YouTubeSubscriptionSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#subscription').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    resourceId: z.object({
      kind: z.string().optional(),
      channelId: z.string().optional()
    }).optional(),
    channelId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional(),
    publishedAt: z.string().optional()
  }).optional(),
  contentDetails: z.object({
    totalItemCount: z.number().optional(),
    newItemCount: z.number().optional(),
    activityType: z.enum(['all', 'uploads', 'likes', 'favorites']).optional()
  }).optional(),
  subscriberSnippet: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    channelId: z.string().optional(),
    thumbnails: z.object({
      default: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      medium: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional(),
      high: z.object({
        url: z.string().optional(),
        width: z.number().optional(),
        height: z.number().optional()
      }).optional()
    }).optional()
  }).optional()
});

export const YouTubeSubscriptionListResponseSchema = z.object({
  kind: z.literal('youtube#subscriptionListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  prevPageToken: z.string().optional(),
  pageInfo: z.object({
    totalResults: z.number().optional(),
    resultsPerPage: z.number().optional()
  }).optional(),
  items: z.array(YouTubeSubscriptionSchema).optional()
});

// ============ YOUTUBE ANALYTICS API SCHEMAS ============
export const YouTubeAnalyticsGroupSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#group').optional(),
  etag: z.string().optional(),
  snippet: z.object({
    publishedAt: z.string().optional(),
    title: z.string().optional()
  }).optional(),
  contentDetails: z.object({
    itemCount: z.string().optional(),
    itemType: z.string().optional()
  }).optional(),
  errors: z.object({
    code: z.string().optional(),
    error: z.array(z.object({
      domain: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
      location: z.string().optional(),
      locationType: z.string().optional()
    })).optional(),
    requestId: z.string().optional()
  }).optional()
});

export const YouTubeAnalyticsGroupListResponseSchema = z.object({
  kind: z.literal('youtube#groupListResponse').optional(),
  etag: z.string().optional(),
  nextPageToken: z.string().optional(),
  items: z.array(YouTubeAnalyticsGroupSchema).optional(),
  errors: z.object({
    code: z.string().optional(),
    error: z.array(z.object({
      domain: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
      location: z.string().optional(),
      locationType: z.string().optional()
    })).optional(),
    requestId: z.string().optional()
  }).optional()
});

export const YouTubeAnalyticsGroupItemSchema = z.object({
  id: z.string().optional(),
  kind: z.literal('youtube#groupItem').optional(),
  etag: z.string().optional(),
  groupId: z.string().optional(),
  resource: z.object({
    id: z.string().optional(),
    kind: z.string().optional()
  }).optional(),
  errors: z.object({
    code: z.string().optional(),
    error: z.array(z.object({
      domain: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
      location: z.string().optional(),
      locationType: z.string().optional()
    })).optional(),
    requestId: z.string().optional()
  }).optional()
});

export const YouTubeAnalyticsGroupItemListResponseSchema = z.object({
  kind: z.literal('youtube#groupItemListResponse').optional(),
  etag: z.string().optional(),
  items: z.array(YouTubeAnalyticsGroupItemSchema).optional(),
  errors: z.object({
    code: z.string().optional(),
    error: z.array(z.object({
      domain: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
      location: z.string().optional(),
      locationType: z.string().optional()
    })).optional(),
    requestId: z.string().optional()
  }).optional()
});

export const YouTubeAnalyticsQueryResponseSchema = z.object({
  kind: z.literal('youtubeAnalytics#resultTable').optional(),
  columnHeaders: z.array(z.object({
    name: z.string().optional(),
    columnType: z.string().optional(),
    dataType: z.string().optional()
  })).optional(),
  rows: z.array(z.array(z.any())).optional(),
  errors: z.object({
    code: z.string().optional(),
    error: z.array(z.object({
      domain: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
      location: z.string().optional(),
      locationType: z.string().optional()
    })).optional(),
    requestId: z.string().optional()
  }).optional()
});

export const YouTubeAnalyticsEmptyResponseSchema = z.object({
  errors: z.object({
    code: z.string().optional(),
    error: z.array(z.object({
      domain: z.string().optional(),
      code: z.string().optional(),
      message: z.string().optional(),
      location: z.string().optional(),
      locationType: z.string().optional()
    })).optional(),
    requestId: z.string().optional()
  }).optional()
});

// ============ GOOGLE DOCS API SCHEMAS ============
export const GoogleDocsDocumentSchema = z.object({
  documentId: z.string().optional(),
  title: z.string().optional(),
  body: z.object({
    content: z.array(z.object({
      startIndex: z.number().optional(),
      endIndex: z.number().optional(),
      paragraph: z.object({
        elements: z.array(z.object({
          startIndex: z.number().optional(),
          endIndex: z.number().optional(),
          textRun: z.object({
            content: z.string().optional(),
            textStyle: z.object({
              bold: z.boolean().optional(),
              italic: z.boolean().optional(),
              underline: z.boolean().optional(),
              fontSize: z.object({
                magnitude: z.number().optional(),
                unit: z.enum(['PT']).optional()
              }).optional(),
              foregroundColor: z.object({
                color: z.object({
                  rgbColor: z.object({
                    red: z.number().min(0).max(1).optional(),
                    green: z.number().min(0).max(1).optional(),
                    blue: z.number().min(0).max(1).optional()
                  }).optional()
                }).optional()
              }).optional()
            }).optional()
          }).optional()
        })).optional(),
        paragraphStyle: z.object({
          namedStyleType: z.enum(['NORMAL_TEXT', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6', 'TITLE', 'SUBTITLE']).optional(),
          alignment: z.enum(['START', 'CENTER', 'END', 'JUSTIFIED']).optional(),
          lineSpacing: z.number().optional(),
          direction: z.enum(['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT']).optional(),
          spacingMode: z.enum(['NEVER', 'ALWAYS', 'ONLY_AFTER_PARAGRAPH']).optional(),
          spaceAbove: z.object({
            magnitude: z.number().optional(),
            unit: z.enum(['PT']).optional()
          }).optional(),
          spaceBelow: z.object({
            magnitude: z.number().optional(),
            unit: z.enum(['PT']).optional()
          }).optional()
        }).optional()
      }).optional()
    })).optional()
  }).optional(),
  documentStyle: z.object({
    background: z.object({
      color: z.object({
        rgbColor: z.object({
          red: z.number().min(0).max(1).optional(),
          green: z.number().min(0).max(1).optional(),
          blue: z.number().min(0).max(1).optional()
        }).optional()
      }).optional()
    }).optional(),
    defaultHeaderId: z.string().optional(),
    defaultFooterId: z.string().optional(),
    firstPageHeaderId: z.string().optional(),
    firstPageFooterId: z.string().optional(),
    evenPageHeaderId: z.string().optional(),
    evenPageFooterId: z.string().optional(),
    useFirstPageHeaderFooter: z.boolean().optional(),
    useEvenPageHeaderFooter: z.boolean().optional(),
    pageNumberStart: z.number().optional(),
    marginTop: z.object({
      magnitude: z.number().optional(),
      unit: z.enum(['PT']).optional()
    }).optional(),
    marginBottom: z.object({
      magnitude: z.number().optional(),
      unit: z.enum(['PT']).optional()
    }).optional(),
    marginRight: z.object({
      magnitude: z.number().optional(),
      unit: z.enum(['PT']).optional()
    }).optional(),
    marginLeft: z.object({
      magnitude: z.number().optional(),
      unit: z.enum(['PT']).optional()
    }).optional(),
    pageSize: z.object({
      width: z.object({
        magnitude: z.number().optional(),
        unit: z.enum(['PT']).optional()
      }).optional(),
      height: z.object({
        magnitude: z.number().optional(),
        unit: z.enum(['PT']).optional()
      }).optional()
    }).optional()
  }).optional(),
  revisionId: z.string().optional(),
  suggestionsViewMode: z.enum(['DEFAULT_FOR_CURRENT_ACCESS', 'SUGGESTIONS_INLINE', 'PREVIEW_SUGGESTIONS_ACCEPTED', 'PREVIEW_WITHOUT_SUGGESTIONS']).optional(),
  footers: z.record(z.string(), z.object({
    footerId: z.string().optional(),
    content: z.array(z.object({
      startIndex: z.number().optional(),
      endIndex: z.number().optional(),
      paragraph: z.object({
        elements: z.array(z.object({
          startIndex: z.number().optional(),
          endIndex: z.number().optional(),
          textRun: z.object({
            content: z.string().optional(),
            textStyle: z.object({
              bold: z.boolean().optional(),
              italic: z.boolean().optional(),
              underline: z.boolean().optional()
            }).optional()
          }).optional()
        })).optional()
      }).optional()
    })).optional()
  })).optional(),
  headers: z.record(z.string(), z.object({
    headerId: z.string().optional(),
    content: z.array(z.object({
      startIndex: z.number().optional(),
      endIndex: z.number().optional(),
      paragraph: z.object({
        elements: z.array(z.object({
          startIndex: z.number().optional(),
          endIndex: z.number().optional(),
          textRun: z.object({
            content: z.string().optional(),
            textStyle: z.object({
              bold: z.boolean().optional(),
              italic: z.boolean().optional(),
              underline: z.boolean().optional()
            }).optional()
          }).optional()
        })).optional()
      }).optional()
    })).optional()
  })).optional(),
  footnotes: z.record(z.string(), z.object({
    footnoteId: z.string().optional(),
    content: z.array(z.object({
      startIndex: z.number().optional(),
      endIndex: z.number().optional(),
      paragraph: z.object({
        elements: z.array(z.object({
          startIndex: z.number().optional(),
          endIndex: z.number().optional(),
          textRun: z.object({
            content: z.string().optional(),
            textStyle: z.object({
              bold: z.boolean().optional(),
              italic: z.boolean().optional(),
              underline: z.boolean().optional()
            }).optional()
          }).optional()
        })).optional()
      }).optional()
    })).optional()
  })).optional(),
  lists: z.record(z.string(), z.object({
    listId: z.string().optional(),
    nestingLevels: z.array(z.object({
      nestingLevel: z.number().optional(),
      bulletAlignment: z.enum(['START', 'CENTER', 'END']).optional(),
      glyphType: z.enum(['GLYPH_TYPE_UNSPECIFIED', 'NONE', 'BULLET_DISC_CIRCLE_SQUARE', 'BULLET_DIAMONDX_ARROW3D_SQUARE', 'BULLET_CHECKBOX', 'BULLET_ARROW_DIAMOND_DISC', 'BULLET_STAR_CIRCLE_SQUARE', 'BULLET_ARROW3D_CIRCLE_SQUARE', 'BULLET_LEFTTRIANGLE_DIAMOND_DISC', 'BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE', 'BULLET_DIAMOND_CIRCLE_SQUARE', 'NUMBERED_DECIMAL_ALPHA_ROMAN', 'NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS', 'NUMBERED_DECIMAL_PARENS', 'NUMBERED_DECIMAL', 'NUMBERED_ALPHA_ALPHA_PARENS', 'NUMBERED_ALPHA_PARENS', 'NUMBERED_ALPHA', 'NUMBERED_ROMAN_UPPER_ROMAN_LOWER_PARENS', 'NUMBERED_ROMAN_UPPER_PARENS', 'NUMBERED_ROMAN_UPPER', 'NUMBERED_ROMAN_LOWER', 'LETTERED_LOWER_GREEK_PARENS', 'LETTERED_LOWER_GREEK', 'LETTERED_UPPER_ALPHA_PARENS', 'LETTERED_UPPER_ALPHA', 'LETTERED_LOWER_ALPHA_PARENS', 'LETTERED_LOWER_ALPHA']).optional(),
      startNumber: z.number().optional(),
      textStyle: z.object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        fontSize: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional()
      }).optional()
    })).optional()
  })).optional(),
  namedRanges: z.record(z.string(), z.object({
    namedRangeId: z.string().optional(),
    name: z.string().optional(),
    ranges: z.array(z.object({
      segmentId: z.string().optional(),
      startIndex: z.number().optional(),
      endIndex: z.number().optional(),
      startSegmentId: z.string().optional(),
      endSegmentId: z.string().optional()
    })).optional()
  })).optional(),
  namedStyles: z.object({
    styles: z.array(z.object({
      namedStyleType: z.enum(['NORMAL_TEXT', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6', 'TITLE', 'SUBTITLE']).optional(),
      paragraphStyle: z.object({
        alignment: z.enum(['START', 'CENTER', 'END', 'JUSTIFIED']).optional(),
        lineSpacing: z.number().optional(),
        direction: z.enum(['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT']).optional()
      }).optional(),
      textStyle: z.object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        fontSize: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        foregroundColor: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional()
        }).optional()
      }).optional()
    })).optional()
  }).optional(),
  inlineObjects: z.record(z.string(), z.object({
    objectId: z.string().optional(),
    inlineObjectProperties: z.object({
      embeddedObject: z.object({
        imageProperties: z.object({
          sourceUri: z.string().optional(),
          contentUri: z.string().optional(),
          size: z.object({
            width: z.object({
              magnitude: z.number().optional(),
              unit: z.enum(['PT']).optional()
            }).optional(),
            height: z.object({
              magnitude: z.number().optional(),
              unit: z.enum(['PT']).optional()
            }).optional()
          }).optional(),
          cropProperties: z.object({
            offsetLeft: z.number().optional(),
            offsetRight: z.number().optional(),
            offsetTop: z.number().optional(),
            offsetBottom: z.number().optional(),
            angle: z.number().optional()
          }).optional()
        }).optional()
      }).optional()
    }).optional()
  })).optional(),
  positionedObjects: z.record(z.string(), z.object({
    objectId: z.string().optional(),
    positionedObjectProperties: z.object({
      positioning: z.object({
        layout: z.enum(['POSITIONED', 'WRAP_TEXT']).optional(),
        left: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        top: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        width: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        height: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional()
      }).optional()
    }).optional()
  })).optional()
});

export const GoogleDocsBatchUpdateRequestSchema = z.object({
  requests: z.array(z.object({
    insertText: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      text: z.string().optional()
    }).optional(),
    deleteContentRange: z.object({
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional()
    }).optional(),
    insertParagraphBullets: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      bulletPreset: z.enum(['BULLET_DISC_CIRCLE_SQUARE', 'BULLET_DIAMONDX_ARROW3D_SQUARE', 'BULLET_CHECKBOX', 'BULLET_ARROW_DIAMOND_DISC', 'BULLET_STAR_CIRCLE_SQUARE', 'BULLET_ARROW3D_CIRCLE_SQUARE', 'BULLET_LEFTTRIANGLE_DIAMOND_DISC', 'BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE', 'BULLET_DIAMOND_CIRCLE_SQUARE', 'NUMBERED_DECIMAL_ALPHA_ROMAN', 'NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS', 'NUMBERED_DECIMAL_PARENS', 'NUMBERED_DECIMAL', 'NUMBERED_ALPHA_ALPHA_PARENS', 'NUMBERED_ALPHA_PARENS', 'NUMBERED_ALPHA', 'NUMBERED_ROMAN_UPPER_ROMAN_LOWER_PARENS', 'NUMBERED_ROMAN_UPPER_PARENS', 'NUMBERED_ROMAN_UPPER', 'NUMBERED_ROMAN_LOWER', 'LETTERED_LOWER_GREEK_PARENS', 'LETTERED_LOWER_GREEK', 'LETTERED_UPPER_ALPHA_PARENS', 'LETTERED_UPPER_ALPHA', 'LETTERED_LOWER_ALPHA_PARENS', 'LETTERED_LOWER_ALPHA']).optional()
    }).optional(),
    deleteParagraphBullets: z.object({
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional()
    }).optional(),
    createParagraphBullets: z.object({
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional(),
      bulletPreset: z.enum(['BULLET_DISC_CIRCLE_SQUARE', 'BULLET_DIAMONDX_ARROW3D_SQUARE', 'BULLET_CHECKBOX', 'BULLET_ARROW_DIAMOND_DISC', 'BULLET_STAR_CIRCLE_SQUARE', 'BULLET_ARROW3D_CIRCLE_SQUARE', 'BULLET_LEFTTRIANGLE_DIAMOND_DISC', 'BULLET_DIAMONDX_HOLLOWDIAMOND_SQUARE', 'BULLET_DIAMOND_CIRCLE_SQUARE', 'NUMBERED_DECIMAL_ALPHA_ROMAN', 'NUMBERED_DECIMAL_ALPHA_ROMAN_PARENS', 'NUMBERED_DECIMAL_PARENS', 'NUMBERED_DECIMAL', 'NUMBERED_ALPHA_ALPHA_PARENS', 'NUMBERED_ALPHA_PARENS', 'NUMBERED_ALPHA', 'NUMBERED_ROMAN_UPPER_ROMAN_LOWER_PARENS', 'NUMBERED_ROMAN_UPPER_PARENS', 'NUMBERED_ROMAN_UPPER', 'NUMBERED_ROMAN_LOWER', 'LETTERED_LOWER_GREEK_PARENS', 'LETTERED_LOWER_GREEK', 'LETTERED_UPPER_ALPHA_PARENS', 'LETTERED_UPPER_ALPHA', 'LETTERED_LOWER_ALPHA_PARENS', 'LETTERED_LOWER_ALPHA']).optional()
    }).optional(),
    insertTable: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      rows: z.number().optional(),
      columns: z.number().optional(),
      endOfSegmentLocation: z.object({
        segmentId: z.string().optional()
      }).optional()
    }).optional(),
    insertTableRow: z.object({
      tableCellLocation: z.object({
        tableStartLocation: z.object({
          index: z.number().optional(),
          segmentId: z.string().optional()
        }).optional(),
        rowIndex: z.number().optional(),
        columnIndex: z.number().optional()
      }).optional(),
      insertBelow: z.boolean().optional()
    }).optional(),
    insertTableColumn: z.object({
      tableCellLocation: z.object({
        tableStartLocation: z.object({
          index: z.number().optional(),
          segmentId: z.string().optional()
        }).optional(),
        rowIndex: z.number().optional(),
        columnIndex: z.number().optional()
      }).optional(),
      insertRight: z.boolean().optional()
    }).optional(),
    deleteTableRow: z.object({
      tableCellLocation: z.object({
        tableStartLocation: z.object({
          index: z.number().optional(),
          segmentId: z.string().optional()
        }).optional(),
        rowIndex: z.number().optional(),
        columnIndex: z.number().optional()
      }).optional()
    }).optional(),
    deleteTableColumn: z.object({
      tableCellLocation: z.object({
        tableStartLocation: z.object({
          index: z.number().optional(),
          segmentId: z.string().optional()
        }).optional(),
        rowIndex: z.number().optional(),
        columnIndex: z.number().optional()
      }).optional()
    }).optional(),
    mergeTableCells: z.object({
      tableRange: z.object({
        tableCellLocation: z.object({
          tableStartLocation: z.object({
            index: z.number().optional(),
            segmentId: z.string().optional()
          }).optional(),
          rowIndex: z.number().optional(),
          columnIndex: z.number().optional()
        }).optional(),
        rowSpan: z.number().optional(),
        columnSpan: z.number().optional()
      }).optional()
    }).optional(),
    unmergeTableCells: z.object({
      tableRange: z.object({
        tableCellLocation: z.object({
          tableStartLocation: z.object({
            index: z.number().optional(),
            segmentId: z.string().optional()
          }).optional(),
          rowIndex: z.number().optional(),
          columnIndex: z.number().optional()
        }).optional(),
        rowSpan: z.number().optional(),
        columnSpan: z.number().optional()
      }).optional()
    }).optional(),
    updateParagraphStyle: z.object({
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional(),
      paragraphStyle: z.object({
        namedStyleType: z.enum(['NORMAL_TEXT', 'HEADING_1', 'HEADING_2', 'HEADING_3', 'HEADING_4', 'HEADING_5', 'HEADING_6', 'TITLE', 'SUBTITLE']).optional(),
        alignment: z.enum(['START', 'CENTER', 'END', 'JUSTIFIED']).optional(),
        lineSpacing: z.number().optional(),
        direction: z.enum(['LEFT_TO_RIGHT', 'RIGHT_TO_LEFT']).optional()
      }).optional(),
      fields: z.string().optional()
    }).optional(),
    updateTextStyle: z.object({
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional(),
      textStyle: z.object({
        bold: z.boolean().optional(),
        italic: z.boolean().optional(),
        underline: z.boolean().optional(),
        fontSize: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        foregroundColor: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional()
        }).optional()
      }).optional(),
      fields: z.string().optional()
    }).optional(),
    updateDocumentStyle: z.object({
      documentStyle: z.object({
        background: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional()
        }).optional(),
        pageNumberStart: z.number().optional(),
        marginTop: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        marginBottom: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        marginRight: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        marginLeft: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional()
      }).optional(),
      fields: z.string().optional()
    }).optional(),
    createHeader: z.object({
      type: z.enum(['DEFAULT', 'FIRST_PAGE', 'EVEN_PAGE']).optional(),
      sectionBreakLocation: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional()
    }).optional(),
    createFooter: z.object({
      type: z.enum(['DEFAULT', 'FIRST_PAGE', 'EVEN_PAGE']).optional(),
      sectionBreakLocation: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional()
    }).optional(),
    deleteHeader: z.object({
      headerId: z.string().optional()
    }).optional(),
    deleteFooter: z.object({
      footerId: z.string().optional()
    }).optional(),
    insertPageBreak: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional()
    }).optional(),
    insertSectionBreak: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      sectionType: z.enum(['SECTION_TYPE_UNSPECIFIED', 'CONTINUOUS', 'NEW_PAGE', 'NEW_COLUMN', 'NEXT_PAGE']).optional()
    }).optional(),
    deleteContentRange: z.object({
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional()
    }).optional(),
    insertInlineImage: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      uri: z.string().optional(),
      objectSize: z.object({
        height: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        width: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional()
      }).optional()
    }).optional(),
    insertInlineSheetsChart: z.object({
      location: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      spreadsheetId: z.string().optional(),
      chartId: z.number().optional(),
      linkedContentReference: z.object({
        sheetsChartReference: z.object({
          spreadsheetId: z.string().optional(),
          chartId: z.number().optional()
        }).optional()
      }).optional(),
      objectSize: z.object({
        height: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        width: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional()
      }).optional()
    }).optional(),
    replaceAllText: z.object({
      containsText: z.object({
        text: z.string().optional(),
        matchCase: z.boolean().optional()
      }).optional(),
      replaceText: z.string().optional()
    }).optional(),
    replaceImage: z.object({
      imageObjectId: z.string().optional(),
      uri: z.string().optional(),
      imageReplaceMethod: z.enum(['IMAGE_REPLACE_METHOD_UNSPECIFIED', 'CENTER_CROP']).optional()
    }).optional(),
    replaceNamedRangeContent: z.object({
      namedRangeId: z.string().optional(),
      text: z.string().optional()
    }).optional(),
    pinTableHeaderRows: z.object({
      tableStartLocation: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional(),
      pinnedHeaderRowsCount: z.number().optional()
    }).optional(),
    unpinTableHeaderRows: z.object({
      tableStartLocation: z.object({
        index: z.number().optional(),
        segmentId: z.string().optional()
      }).optional()
    }).optional(),
    updateTableRowStyle: z.object({
      tableRange: z.object({
        tableCellLocation: z.object({
          tableStartLocation: z.object({
            index: z.number().optional(),
            segmentId: z.string().optional()
          }).optional(),
          rowIndex: z.number().optional(),
          columnIndex: z.number().optional()
        }).optional(),
        rowSpan: z.number().optional(),
        columnSpan: z.number().optional()
      }).optional(),
      tableRowStyle: z.object({
        minRowHeight: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        preventOverflow: z.boolean().optional(),
        keepTogether: z.boolean().optional()
      }).optional(),
      fields: z.string().optional()
    }).optional(),
    updateTableCellStyle: z.object({
      tableRange: z.object({
        tableCellLocation: z.object({
          tableStartLocation: z.object({
            index: z.number().optional(),
            segmentId: z.string().optional()
          }).optional(),
          rowIndex: z.number().optional(),
          columnIndex: z.number().optional()
        }).optional(),
        rowSpan: z.number().optional(),
        columnSpan: z.number().optional()
      }).optional(),
      tableCellStyle: z.object({
        backgroundColor: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional()
        }).optional(),
        paddingTop: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        paddingRight: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        paddingBottom: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        paddingLeft: z.object({
          magnitude: z.number().optional(),
          unit: z.enum(['PT']).optional()
        }).optional(),
        borderTop: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional(),
          width: z.object({
            magnitude: z.number().optional(),
            unit: z.enum(['PT']).optional()
          }).optional(),
          dashStyle: z.enum(['DASH_STYLE_UNSPECIFIED', 'SOLID', 'DOT', 'DASH']).optional()
        }).optional(),
        borderRight: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional(),
          width: z.object({
            magnitude: z.number().optional(),
            unit: z.enum(['PT']).optional()
          }).optional(),
          dashStyle: z.enum(['DASH_STYLE_UNSPECIFIED', 'SOLID', 'DOT', 'DASH']).optional()
        }).optional(),
        borderBottom: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional(),
          width: z.object({
            magnitude: z.number().optional(),
            unit: z.enum(['PT']).optional()
          }).optional(),
          dashStyle: z.enum(['DASH_STYLE_UNSPECIFIED', 'SOLID', 'DOT', 'DASH']).optional()
        }).optional(),
        borderLeft: z.object({
          color: z.object({
            rgbColor: z.object({
              red: z.number().min(0).max(1).optional(),
              green: z.number().min(0).max(1).optional(),
              blue: z.number().min(0).max(1).optional()
            }).optional()
          }).optional(),
          width: z.object({
            magnitude: z.number().optional(),
            unit: z.enum(['PT']).optional()
          }).optional(),
          dashStyle: z.enum(['DASH_STYLE_UNSPECIFIED', 'SOLID', 'DOT', 'DASH']).optional()
        }).optional()
      }).optional(),
      fields: z.string().optional()
    }).optional(),
    createNamedRange: z.object({
      name: z.string().optional(),
      range: z.object({
        segmentId: z.string().optional(),
        startIndex: z.number().optional(),
        endIndex: z.number().optional(),
        startSegmentId: z.string().optional(),
        endSegmentId: z.string().optional()
      }).optional()
    }).optional(),
    deleteNamedRange: z.object({
      namedRangeId: z.string().optional()
    }).optional(),
    updateNamedRangeStyle: z.object({
      namedRanges: z.array(z.string()).optional(),
      namedRangeStyle: z.object({
        namedRangeId: z.string().optional(),
        ranges: z.array(z.object({
          segmentId: z.string().optional(),
          startIndex: z.number().optional(),
          endIndex: z.number().optional(),
          startSegmentId: z.string().optional(),
          endSegmentId: z.string().optional()
        })).optional()
      }).optional(),
      fields: z.string().optional()
    }).optional()
  })).optional(),
  writeControl: z.object({
    requiredRevisionId: z.string().optional(),
    targetRevisionId: z.string().optional()
  }).optional()
});

export const GoogleDocsBatchUpdateResponseSchema = z.object({
  documentId: z.string().optional(),
  replies: z.array(z.object({
    insertText: z.object({
      objectId: z.string().optional()
    }).optional(),
    deleteContentRange: z.object({}).optional(),
    insertParagraphBullets: z.object({}).optional(),
    deleteParagraphBullets: z.object({}).optional(),
    createParagraphBullets: z.object({}).optional(),
    insertTable: z.object({
      objectId: z.string().optional()
    }).optional(),
    insertTableRow: z.object({}).optional(),
    insertTableColumn: z.object({}).optional(),
    deleteTableRow: z.object({}).optional(),
    deleteTableColumn: z.object({}).optional(),
    mergeTableCells: z.object({}).optional(),
    unmergeTableCells: z.object({}).optional(),
    updateParagraphStyle: z.object({}).optional(),
    updateTextStyle: z.object({}).optional(),
    updateDocumentStyle: z.object({}).optional(),
    createHeader: z.object({
      headerId: z.string().optional()
    }).optional(),
    createFooter: z.object({
      footerId: z.string().optional()
    }).optional(),
    deleteHeader: z.object({}).optional(),
    deleteFooter: z.object({}).optional(),
    insertPageBreak: z.object({}).optional(),
    insertSectionBreak: z.object({}).optional(),
    deleteContentRange: z.object({}).optional(),
    insertInlineImage: z.object({
      objectId: z.string().optional()
    }).optional(),
    insertInlineSheetsChart: z.object({
      objectId: z.string().optional()
    }).optional(),
    replaceAllText: z.object({
      occurrencesChanged: z.number().optional()
    }).optional(),
    replaceImage: z.object({}).optional(),
    replaceNamedRangeContent: z.object({}).optional(),
    pinTableHeaderRows: z.object({}).optional(),
    unpinTableHeaderRows: z.object({}).optional(),
    updateTableRowStyle: z.object({}).optional(),
    updateTableCellStyle: z.object({}).optional(),
    createNamedRange: z.object({
      namedRangeId: z.string().optional()
    }).optional(),
    deleteNamedRange: z.object({}).optional(),
    updateNamedRangeStyle: z.object({}).optional()
  })).optional(),
  writeControl: z.object({
    requiredRevisionId: z.string().optional(),
    targetRevisionId: z.string().optional()
  }).optional()
});