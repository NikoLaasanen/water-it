/**
 * Reads everything under `users/{uid}` for the backup file (`#lib/backup.ts`)
 * and hands it to the person: the share sheet where the browser can share
 * files (iPhone, iPad: "Save to Files", AirDrop, Mail…), a plain download
 * otherwise.
 *
 * `getDocs` asks the server and falls back to the offline cache, so a backup
 * made offline still has whatever this device has seen. Cost: one Firestore
 * read per document (a few hundred for a whole household), well inside the
 * free daily quota.
 */
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from './client';
import { backupFileName, buildBackup, type BackupDoc } from '#lib/backup.js';

async function all(uid: string, name: 'plants' | 'tasks' | 'log'): Promise<BackupDoc[]> {
	const snap = await getDocs(collection(db, 'users', uid, name));
	return snap.docs.map((d) => ({ ...d.data(), id: d.id }));
}

export async function backupFile(uid: string, now = new Date()): Promise<File> {
	const [settings, plants, tasks, log] = await Promise.all([
		getDoc(doc(db, 'users', uid)).then((s) => (s.exists() ? s.data() : null)),
		all(uid, 'plants'),
		all(uid, 'tasks'),
		all(uid, 'log')
	]);
	const backup = buildBackup({ settings, plants, tasks, log }, now);
	return new File([JSON.stringify(backup, null, 2)], backupFileName(now), {
		type: 'application/json'
	});
}

/**
 * - `shared`: the share sheet took it.
 * - `downloaded`: no file sharing here (most desktops), so a plain download.
 * - `cancelled`: the person closed the share sheet (not an error).
 * - `blocked`: the browser refused the share sheet because the tap is too
 *   long ago (reading the data took a while). The caller offers a second
 *   button, whose tap is fresh. A download is no fallback there: in an
 *   installed iPhone app it opens a viewer with no way back.
 */
export async function deliverFile(
	file: File
): Promise<'shared' | 'downloaded' | 'cancelled' | 'blocked'> {
	if (navigator.canShare?.({ files: [file] })) {
		try {
			await navigator.share({ files: [file] });
			return 'shared';
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled';
			if (error instanceof DOMException && error.name === 'NotAllowedError') return 'blocked';
			throw error;
		}
	}
	const url = URL.createObjectURL(file);
	const link = document.createElement('a');
	link.href = url;
	link.download = file.name;
	document.body.append(link);
	link.click();
	link.remove();
	setTimeout(() => URL.revokeObjectURL(url), 10_000);
	return 'downloaded';
}
