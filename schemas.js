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
  id: z.string(),
  name: z.string(),
  kind: z.literal('adsense#account'),
  creation_time: z.string().optional(),
  premium: z.boolean().optional(),
  timezone: z.string().optional(),
  subAccounts: z.array(z.lazy(() => AdSenseAccountSchema)).optional()
});

export const AdSenseAccountsSchema = z.object({
  kind: z.literal('adsense#accounts'),
  etag: z.string().optional(),
  items: z.array(AdSenseAccountSchema),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAdClientSchema = z.object({
  id: z.string(),
  kind: z.literal('adsense#adClient'),
  arcOptIn: z.boolean().optional(),
  productCode: z.string().optional(),
  supportsReporting: z.boolean().optional()
});

export const AdSenseAdClientsSchema = z.object({
  kind: z.literal('adsense#adClients'),
  etag: z.string().optional(),
  items: z.array(AdSenseAdClientSchema),
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
  id: z.string(),
  name: z.string(),
  code: z.string().optional(),
  kind: z.literal('adsense#adUnit'),
  status: z.enum(['NEW', 'ACTIVE', 'INACTIVE']).optional(),
  savedStyleId: z.string().optional(),
  customStyle: AdSenseAdStyleSchema.optional(),
  contentAdsSettings: z.object({
    type: z.string().optional(),
    size: z.string().optional(),
    backupOption: z.object({
      type: z.string().optional(),
      color: z.string().optional(),
      url: z.string().optional()
    }).optional()
  }).optional()
});

export const AdSenseAdUnitsSchema = z.object({
  kind: z.literal('adsense#adUnits'),
  etag: z.string().optional(),
  items: z.array(AdSenseAdUnitSchema),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAdCodeSchema = z.object({
  kind: z.literal('adsense#adCode'),
  adCode: z.string().optional(),
  ampBody: z.string().optional(),
  ampHead: z.string().optional()
});

export const AdSenseCustomChannelSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string().optional(),
  kind: z.literal('adsense#customChannel'),
  targetingInfo: z.object({
    adsAppearOn: z.string().optional(),
    description: z.string().optional(),
    location: z.string().optional(),
    siteLanguage: z.string().optional()
  }).optional()
});

export const AdSenseCustomChannelsSchema = z.object({
  kind: z.literal('adsense#customChannels'),
  etag: z.string().optional(),
  items: z.array(AdSenseCustomChannelSchema),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseUrlChannelSchema = z.object({
  id: z.string(),
  kind: z.literal('adsense#urlChannel'),
  urlPattern: z.string().optional()
});

export const AdSenseUrlChannelsSchema = z.object({
  kind: z.literal('adsense#urlChannels'),
  etag: z.string().optional(),
  items: z.array(AdSenseUrlChannelSchema),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseAlertSchema = z.object({
  id: z.string(),
  kind: z.literal('adsense#alert'),
  message: z.string().optional(),
  severity: z.enum(['INFO', 'WARNING', 'SEVERE']).optional(),
  type: z.string().optional(),
  isDismissible: z.boolean().optional()
});

export const AdSenseAlertsSchema = z.object({
  kind: z.literal('adsense#alerts'),
  items: z.array(AdSenseAlertSchema)
});

export const AdSensePaymentSchema = z.object({
  id: z.string(),
  kind: z.literal('adsense#payment'),
  paymentAmount: z.string().optional(),
  paymentAmountCurrencyCode: z.string().optional(),
  paymentDate: z.string().optional()
});

export const AdSensePaymentsSchema = z.object({
  kind: z.literal('adsense#payments'),
  items: z.array(AdSensePaymentSchema)
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
  id: z.string(),
  name: z.string(),
  kind: z.literal('adsense#savedReport')
});

export const AdSenseSavedReportsSchema = z.object({
  kind: z.literal('adsense#savedReports'),
  etag: z.string().optional(),
  items: z.array(AdSenseSavedReportSchema),
  nextPageToken: z.string().optional().nullable()
});

export const AdSenseReportHeaderSchema = z.object({
  name: z.string(),
  type: z.string(),
  currency: z.string().optional()
});

export const AdSenseReportSchema = z.object({
  kind: z.literal('adsense#report'),
  startDate: z.string(),
  endDate: z.string(),
  totalMatchedRows: z.string().optional(),
  headers: z.array(AdSenseReportHeaderSchema).optional(),
  rows: z.array(z.array(z.string())).optional(),
  totals: z.array(z.string()).optional(),
  averages: z.array(z.string()).optional(),
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