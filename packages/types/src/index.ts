export enum DeviceType {
  web = 'web',
  cli = 'cli',
  recovery_device = 'recovery_device',
}

export enum DeviceStatus {
  pending = 'pending',
  active = 'active',
  revoked = 'revoked',
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  type: DeviceType;
  status: DeviceStatus;
  publicKey: string;
  label?: string;
  createdAt: string;
  requestedEnvironmentIds?: string[];
  requestedEnvInfo?: Array<{ id: string; name: string }>;
  environments?: Array<{ id: string; name: string; projectName: string }>;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
}

export interface Environment {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  projectName?: string;
}

export interface WrappedDEK {
  id: string;
  environmentId: string;
  deviceId?: string;
  wrappedDEK: string;
  isRecovery: boolean;
  createdAt: string;
}

export interface Secret {
  id: string;
  environmentId: string;
  key: string;
  encryptedValue: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
  encryptedPrivateKey?: string;
}

export interface RegisterDeviceArgs {
  publicKey: string;
  type: DeviceType;
  label?: string;
  environmentIds?: string[];
}

export interface DeviceResponse {
  deviceId: string;
  status: DeviceStatus;
}

export interface CompleteRegArgs {
  deviceId: string;
  environmentId: string;
  wrappedDEK: string;
}

export interface ApprovalArgs {
  deviceId: string;
  environments: Array<{
    environmentId: string;
    wrappedDEK: string;
    wrappedByPublicKey: string;
  }>;
}

export interface SyncPayload {
  wrappedDEK: string;
  wrappedByPublicKey: string | null;
  secrets: Secret[];
}

export interface UpsertSecretArgs {
  envId: string;
  key: string;
  encryptedValue: string;
  iv: string;
}

export interface ChangePasswordArgs {
  currentPassword: string;
  newPassword: string;
  newEncryptedPrivateKey: string;
}

export interface UpdateMnemonicArgs {
  mnemonicEncryptedPrivateKey: string;
}

export interface RecoveryInitResponse {
  mnemonicEncryptedPrivateKey: string | null;
}

export interface ResetWithMnemonicArgs {
  email: string;
  newPassword: string;
  newEncryptedPrivateKey: string;
}

