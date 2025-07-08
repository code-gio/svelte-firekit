// Auth Types
export * from './auth.js';

// Analytics Types
export * from './analytics.js';

// Firebase Types
export * from './firebase.js';

// Collection Types
export type {
	CollectionState,
	CollectionOptions,
	PaginationConfig,
	CacheConfig,
	ErrorHandlingConfig,
	QueryBuilder,
	FirestoreOperator,
	CollectionChangeType,
	DocumentChange,
	CollectionMetadata,
	CollectionStats,
	CollectionErrorCode,
	CollectionError,
	CollectionSubscription,
	CollectionQueryResult,
	CollectionAggregation,
	ListenerConfig as CollectionListenerConfig,
	CollectionPerformanceMetrics
} from './collection.js';

// Document Types
export type {
	DocumentState,
	DocumentOptions,
	MutationOptions as DocumentMutationOptions,
	MutationResponse as DocumentMutationResponse,
	BatchOperation as DocumentBatchOperation,
	BatchResult as DocumentBatchResult,
	ListenerConfig as DocumentListenerConfig,
	CacheEntry,
	CacheSource,
	DocumentErrorCode,
	DocumentError,
	DocumentFieldValue,
	DocumentUpdateData,
	DocumentMetadata,
	DocumentSnapshot,
	DocumentQueryConstraint,
	DocumentObserver,
	DocumentSubscription,
	DocumentAnalytics,
	DocumentPerformanceMetrics
} from './document.js';

// Mutation Types
export type {
	MutationResponse as MutationMutationResponse,
	MutationMetadata,
	MutationOptions as MutationMutationOptions,
	ValidationResult,
	RetryConfig,
	TransactionOptions,
	BatchOperation as MutationBatchOperation,
	BatchResult as MutationBatchResult,
	BatchOperationResult,
	BatchMetadata,
	MutationOperationType,
	TimestampFields,
	FieldValueOperations,
	ExistenceCheckResult,
	BulkMutationConfig,
	OptimisticUpdateConfig,
	MutationErrorCode,
	MutationError,
	MutationAnalytics
} from './mutations.js';

// Presence Types
export type {
	GeolocationConfig,
	PresenceConfig,
	Location,
	DeviceInfo,
	SessionData,
	UserPresence,
	PresenceStats,
	GeolocationProvider,
	SessionStorage,
	PresenceService,
	ConnectionInfo,
	BrowserCapabilities,
	PresenceFilter,
	BulkPresenceUpdate,
	PresenceQueryOptions,
	CustomPresenceStatus,
	PresenceAnalytics,
	PresenceErrorCode,
	PresenceError
} from './presence.js';
