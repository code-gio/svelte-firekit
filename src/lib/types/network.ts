export enum NetworkErrorCode {
	FIRESTORE_UNAVAILABLE = 'network/firestore-unavailable',
	ENABLE_NETWORK_FAILED = 'network/enable-network-failed',
	DISABLE_NETWORK_FAILED = 'network/disable-network-failed'
}

export class NetworkError extends Error {
	constructor(
		public code: NetworkErrorCode,
		message: string,
		public originalError?: unknown
	) {
		super(message);
		this.name = 'NetworkError';
	}
}
