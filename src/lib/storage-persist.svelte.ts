/**
 * Persistent storage (design.md §7.1): ask the browser not to clear the
 * app's offline data (the Firestore cache, the service worker's files) when
 * the device runs low on space. Losing it isn't data loss, since Firestore
 * holds everything, only a slower, online-only start.
 *
 * Safari and Chrome decide on their own without asking the person (an
 * installed Home Screen app is usually granted it), so this runs once at
 * start-up, silently. Settings shows the result.
 */

export type PersistState = 'unknown' | 'unsupported' | 'granted' | 'not-granted';

class StoragePersistence {
	state = $state<PersistState>('unknown');

	async request(): Promise<void> {
		const storage = typeof navigator === 'undefined' ? undefined : navigator.storage;
		if (!storage?.persist || !storage.persisted) {
			this.state = 'unsupported';
			return;
		}
		try {
			const granted = (await storage.persisted()) || (await storage.persist());
			this.state = granted ? 'granted' : 'not-granted';
		} catch {
			this.state = 'unsupported';
		}
	}
}

export const storagePersistence = new StoragePersistence();
