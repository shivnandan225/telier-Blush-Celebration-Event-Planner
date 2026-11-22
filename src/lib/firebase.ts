import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  FIELD_LIMITS,
  type BudgetItem,
  type CelebrationEvent,
  type GuestRsvp,
} from '../types/planner';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

export async function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function signOutUser() {
  return signOut(auth);
}

export function makeSafeId(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const ts = Date.now().toString(36);
  return `${prefix}_${ts}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 60);
}

function clampStr(val: string, maxLen: number, fallback = ''): string {
  const trimmed = (val ?? '').trim();
  if (!trimmed && fallback) return fallback.slice(0, maxLen);
  return trimmed.slice(0, maxLen);
}

function clampNum(val: number, min: number, max: number): number {
  if (!Number.isFinite(val)) return min;
  return Math.min(max, Math.max(min, val));
}

export function sanitizeEventPayload(event: CelebrationEvent, isCreate: boolean) {
  const cleanTips = (event.costSavingTips || [])
    .filter((t) => typeof t === 'string' && t.trim().length > 0)
    .slice(0, FIELD_LIMITS.TIPS_ARRAY_MAX)
    .map((t) => t.trim().slice(0, FIELD_LIMITS.TIP_MAX));

  const base = {
    title: clampStr(event.title, FIELD_LIMITS.TITLE_MAX, 'Celebration Event'),
    hostName: clampStr(event.hostName, FIELD_LIMITS.HOST_MAX, 'Host'),
    eventType: event.eventType,
    eventDate: clampStr(event.eventDate, 32, '2027-05-15'),
    venueName: clampStr(event.venueName, FIELD_LIMITS.VENUE_MAX, ''),
    dressCode: clampStr(event.dressCode, FIELD_LIMITS.DRESS_CODE_MAX, ''),
    currencyCode: event.currencyCode,
    totalBudget: clampNum(event.totalBudget, 0, 1000000000),
    estimatedGuests: clampNum(Math.round(event.estimatedGuests), 1, 10000),
    selectedThemeId: event.selectedThemeId,
    venueTableStyle: event.venueTableStyle,
    showStage: Boolean(event.showStage),
    showDanceFloor: Boolean(event.showDanceFloor),
    showBuffet: Boolean(event.showBuffet),
    showPhotoBooth: Boolean(event.showPhotoBooth),
    floralDensity: event.floralDensity,
    isPublicRsvp: Boolean(event.isPublicRsvp),
    costSavingTips: cleanTips,
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    return {
      ...base,
      id: event.id,
      ownerId: event.ownerId,
      createdAt: serverTimestamp(),
    };
  }
  return base;
}

export function sanitizeBudgetItemPayload(item: BudgetItem, isCreate: boolean) {
  const base = {
    category: clampStr(item.category, FIELD_LIMITS.CATEGORY_MAX, 'General'),
    title: clampStr(item.title, FIELD_LIMITS.ITEM_TITLE_MAX, 'Line Item'),
    pricingMode: item.pricingMode,
    unitCost: clampNum(item.unitCost, 0, 100000000),
    allocatedAmount: clampNum(item.allocatedAmount, 0, 1000000000),
    actualSpent: clampNum(item.actualSpent, 0, 1000000000),
    notes: clampStr(item.notes, FIELD_LIMITS.NOTES_MAX, ''),
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    return {
      ...base,
      id: item.id,
      eventId: item.eventId,
      ownerId: item.ownerId,
      createdAt: serverTimestamp(),
    };
  }
  return base;
}

export function sanitizeRsvpPayload(rsvp: GuestRsvp, isCreate: boolean) {
  const base = {
    guestName: clampStr(rsvp.guestName, FIELD_LIMITS.GUEST_NAME_MAX, 'Guest'),
    guestEmail: clampStr(rsvp.guestEmail, FIELD_LIMITS.GUEST_EMAIL_MAX, ''),
    status: rsvp.status,
    partySize: clampNum(Math.round(rsvp.partySize), 1, 20),
    mealChoice: clampStr(rsvp.mealChoice, FIELD_LIMITS.MEAL_MAX, 'Standard'),
    dietaryNotes: clampStr(rsvp.dietaryNotes, FIELD_LIMITS.DIETARY_MAX, ''),
    updatedAt: serverTimestamp(),
  };

  if (isCreate) {
    return {
      ...base,
      id: rsvp.id,
      eventId: rsvp.eventId,
      ownerId: rsvp.ownerId,
      source: rsvp.source,
      createdAt: serverTimestamp(),
    };
  }
  return base;
}

export function subscribeOwnerEvents(
  ownerId: string,
  onData: (events: CelebrationEvent[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = 'events';
  const q = query(collection(db, path), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CelebrationEvent);
      onData(list);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeEventBudgetItems(
  eventId: string,
  ownerId: string,
  onData: (items: BudgetItem[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `events/${eventId}/budgetItems`;
  const q = query(collection(db, path), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as BudgetItem);
      onData(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export function subscribeEventRsvps(
  eventId: string,
  ownerId: string,
  onData: (rsvps: GuestRsvp[]) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const path = `events/${eventId}/rsvps`;
  const q = query(collection(db, path), where('ownerId', '==', ownerId));
  return onSnapshot(
    q,
    (snap) => {
      const rsvps = snap.docs.map((d) => d.data() as GuestRsvp);
      onData(rsvps);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (e) {
        onError(e instanceof Error ? e : new Error(String(e)));
      }
    }
  );
}

export async function createEventWithDetails(
  event: CelebrationEvent,
  budgetItems: BudgetItem[],
  rsvps: GuestRsvp[]
): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), sanitizeEventPayload(event, true));
    const batch = writeBatch(db);
    for (const item of budgetItems) {
      batch.set(
        doc(db, `events/${event.id}/budgetItems`, item.id),
        sanitizeBudgetItemPayload(item, true)
      );
    }
    for (const rsvp of rsvps) {
      batch.set(
        doc(db, `events/${event.id}/rsvps`, rsvp.id),
        sanitizeRsvpPayload(rsvp, true)
      );
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateEventFields(event: CelebrationEvent): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await updateDoc(doc(db, 'events', event.id), sanitizeEventPayload(event, false));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function replaceEventBudgetItems(
  eventId: string,
  oldItemIds: string[],
  newItems: BudgetItem[]
): Promise<void> {
  const path = `events/${eventId}/budgetItems`;
  try {
    const batch = writeBatch(db);
    for (const oldId of oldItemIds) {
      batch.delete(doc(db, path, oldId));
    }
    for (const item of newItems) {
      batch.set(doc(db, path, item.id), sanitizeBudgetItemPayload(item, true));
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function upsertBudgetItem(item: BudgetItem, isNew: boolean): Promise<void> {
  const path = `events/${item.eventId}/budgetItems/${item.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, `events/${item.eventId}/budgetItems`, item.id), sanitizeBudgetItemPayload(item, true));
    } else {
      await updateDoc(doc(db, `events/${item.eventId}/budgetItems`, item.id), sanitizeBudgetItemPayload(item, false));
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function removeBudgetItem(eventId: string, itemId: string): Promise<void> {
  const path = `events/${eventId}/budgetItems/${itemId}`;
  try {
    await deleteDoc(doc(db, `events/${eventId}/budgetItems`, itemId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function upsertRsvp(rsvp: GuestRsvp, isNew: boolean): Promise<void> {
  const path = `events/${rsvp.eventId}/rsvps/${rsvp.id}`;
  try {
    if (isNew) {
      await setDoc(doc(db, `events/${rsvp.eventId}/rsvps`, rsvp.id), sanitizeRsvpPayload(rsvp, true));
    } else {
      await updateDoc(doc(db, `events/${rsvp.eventId}/rsvps`, rsvp.id), sanitizeRsvpPayload(rsvp, false));
    }
  } catch (error) {
    handleFirestoreError(error, isNew ? OperationType.CREATE : OperationType.UPDATE, path);
  }
}

export async function removeRsvp(eventId: string, rsvpId: string): Promise<void> {
  const path = `events/${eventId}/rsvps/${rsvpId}`;
  try {
    await deleteDoc(doc(db, `events/${eventId}/rsvps`, rsvpId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function fetchPublicEvent(eventId: string): Promise<CelebrationEvent | null> {
  const path = `events/${eventId}`;
  try {
    const snap = await getDoc(doc(db, 'events', eventId));
    if (!snap.exists()) return null;
    return snap.data() as CelebrationEvent;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function submitPublicGuestRsvp(rsvp: GuestRsvp): Promise<void> {
  const path = `events/${rsvp.eventId}/rsvps/${rsvp.id}`;
  try {
    await setDoc(
      doc(db, `events/${rsvp.eventId}/rsvps`, rsvp.id),
      sanitizeRsvpPayload({ ...rsvp, source: 'public_link' }, true)
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}
