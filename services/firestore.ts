
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';
import { Project, Task, UserProfile, ActivityLog, UserRole, Invite, InviteStatus, Company } from '../types';

// Generic real-time listener for multi-tenant data
export const subscribeToCollection = <T,>(
  collectionName: string,
  companyId: string,
  callback: (data: T[]) => void,
  extraQueries: any[] = []
) => {
  const q = query(
    collection(db, collectionName),
    where('companyId', '==', companyId),
    ...extraQueries
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
};

// Global listener for Super Admins
export const subscribeToGlobalCollection = <T,>(
  collectionName: string,
  callback: (data: T[]) => void,
  extraQueries: any[] = []
) => {
  const q = query(
    collection(db, collectionName),
    ...extraQueries
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
    callback(data);
  });
};

export const logActivity = async (
  companyId: string,
  userId: string,
  action: string,
  details: string,
  projectId?: string
) => {
  await addDoc(collection(db, 'activityLogs'), {
    companyId,
    userId,
    action,
    details,
    projectId: projectId || null,
    timestamp: serverTimestamp(),
  });
};

// Invite System
export const createInvite = async (companyId: string, email: string, role: UserRole, invitedBy: string) => {
  const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const docRef = await addDoc(collection(db, 'invites'), {
    companyId,
    email: email.toLowerCase().trim(),
    role,
    invitedBy,
    token,
    status: InviteStatus.PENDING,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, token };
};

export const validateInviteToken = async (token: string, email: string): Promise<Invite | null> => {
  const q = query(
    collection(db, 'invites'),
    where('token', '==', token),
    where('email', '==', email.toLowerCase().trim()),
    where('status', '==', InviteStatus.PENDING),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Invite;
};

export const acceptInvite = async (inviteId: string) => {
  await updateDoc(doc(db, 'invites', inviteId), {
    status: InviteStatus.ACCEPTED,
    acceptedAt: serverTimestamp()
  });
};

export const createProject = async (data: Partial<Project>, userId: string) => {
  const docRef = await addDoc(collection(db, 'projects'), {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });
  return docRef.id;
};

export const updateProject = async (projectId: string, data: Partial<Project>, companyId: string, userId: string) => {
  await updateDoc(doc(db, 'projects', projectId), data);
};

export const createTask = async (data: Partial<Task>, userId: string) => {
  const docRef = await addDoc(collection(db, 'tasks'), {
    ...data,
    createdAt: serverTimestamp(),
    createdBy: userId,
  });
  return docRef.id;
};

export const updateTask = async (taskId: string, data: Partial<Task>, companyId: string, userId: string) => {
  await updateDoc(doc(db, 'tasks', taskId), data);
};

export const updateTaskStatus = async (taskId: string, status: string, companyId: string, userId: string) => {
  await updateDoc(doc(db, 'tasks', taskId), { status });
};

export const getCompanyUsers = async (companyId: string): Promise<UserProfile[]> => {
  const q = query(collection(db, 'users'), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as unknown as UserProfile));
};
