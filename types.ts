
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member'
}

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired'
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  REVIEW = 'review',
  DONE = 'done'
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export interface Company {
  id: string;
  name: string;
  ownerId: string;
  plan: 'basic' | 'pro' | 'enterprise';
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  companyId: string;
  role: UserRole;
  photoURL?: string;
  status: 'active' | 'invited' | 'disabled';
}

export interface Invite {
  id: string;
  email: string;
  companyId: string;
  role: UserRole;
  invitedBy: string;
  token: string;
  status: InviteStatus;
  createdAt: any;
}

export interface Project {
  id: string;
  companyId: string;
  name: string;
  description: string;
  status: ProjectStatus;
  createdBy: string;
  createdAt: any;
  members: string[]; // User UIDs
}

export interface Task {
  id: string;
  companyId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string; // User UID
  createdBy: string;
  dueDate: any;
  createdAt: any;
  attachments?: string[]; // URLs from Storage
}

export interface ActivityLog {
  id: string;
  companyId: string;
  projectId?: string;
  userId: string;
  action: string;
  details: string;
  timestamp: any;
}
