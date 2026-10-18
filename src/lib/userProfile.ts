import { User } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Creates users/{uid} if it does not exist yet. Sign-up and the auth listener both
 * call this concurrently, so it runs in a transaction to avoid one clobbering the
 * other. New accounts always start as employees; only admins change roles.
 */
export async function ensureUserProfile(user: User, fullName?: string): Promise<void> {
  const ref = doc(db, 'users', user.uid);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const name = (fullName ?? user.displayName ?? '').trim().slice(0, 100);

    if (!snap.exists()) {
      tx.set(ref, {
        email: user.email ?? '',
        fullName: name,
        avatarUrl: user.photoURL ?? null,
        role: 'employee',
        managerId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else if (name && !snap.data().fullName) {
      tx.update(ref, { fullName: name, updatedAt: serverTimestamp() });
    }
  });
}

/**
 * Check-ins and goals carry a copy of the owner's managerId so the manager can read
 * them (see firestore.rules). When the reporting line changes, re-tag the owner's
 * existing documents so the new manager sees history and the old one loses access.
 */
export async function syncManagerTags(uid: string, managerId: string | null): Promise<number> {
  let updated = 0;
  for (const name of ['checkIns', 'goals']) {
    const snapshot = await getDocs(query(collection(db, name), where('userId', '==', uid)));
    const stale = snapshot.docs.filter((d) => (d.data().managerId ?? null) !== managerId);

    for (let i = 0; i < stale.length; i += 450) {
      const batch = writeBatch(db);
      stale.slice(i, i + 450).forEach((d) => batch.update(d.ref, { managerId }));
      await batch.commit();
    }
    updated += stale.length;
  }
  return updated;
}
