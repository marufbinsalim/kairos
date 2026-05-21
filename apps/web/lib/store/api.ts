import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from './store';
import type {
  AuthResponse, Device, Project, Environment, Secret, SyncPayload,
  RegisterDeviceArgs, DeviceResponse, CompleteRegArgs, ApprovalArgs,
  UpsertSecretArgs,
  ChangePasswordArgs, UpdateMnemonicArgs, RecoveryInitResponse, ResetWithMnemonicArgs,
  DeployToken, CreateDeployTokenArgs,
  RenameProjectArgs, RenameEnvironmentArgs,
} from '@kairos/types';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: `${process.env.NEXT_PUBLIC_API_URL}/api`,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      headers.set('ngrok-skip-browser-warning', 'true');
      return headers;
    },
  }),
  tagTypes: ['Device', 'Project', 'Environment', 'Secret', 'DeployToken'],
  endpoints: (build) => ({
    register: build.mutation<AuthResponse, { email: string; password: string; encryptedPrivateKey?: string; mnemonicEncryptedPrivateKey?: string; publicKey?: string }>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
    }),
    login: build.mutation<AuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: '/auth/login', method: 'POST', body }),
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    registerDevice: build.mutation<DeviceResponse, RegisterDeviceArgs>({
      query: (body) => ({ url: '/devices/register', method: 'POST', body }),
      invalidatesTags: ['Device'],
    }),
    completeRegistration: build.mutation<void, CompleteRegArgs>({
      query: (body) => ({ url: '/devices/complete-registration', method: 'POST', body }),
      invalidatesTags: ['Device'],
    }),
    listPendingDevices: build.query<Device[], void>({
      query: () => '/devices/pending',
      providesTags: ['Device'],
    }),
    completeApproval: build.mutation<void, ApprovalArgs>({
      query: (body) => ({ url: '/devices/complete-approval', method: 'POST', body }),
      invalidatesTags: ['Device'],
    }),
    listDevices: build.query<Device[], void>({
      query: () => '/devices',
      providesTags: ['Device'],
    }),
    revokeDevice: build.mutation<void, string>({
      query: (id) => ({ url: `/devices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Device'],
    }),
    createProject: build.mutation<Project, { name: string }>({
      query: (body) => ({ url: '/projects', method: 'POST', body }),
      invalidatesTags: ['Project'],
    }),
    listProjects: build.query<Project[], void>({
      query: () => '/projects',
      providesTags: ['Project'],
    }),
    deleteProject: build.mutation<void, string>({
      query: (id) => ({ url: `/projects/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Project', 'Environment'],
    }),
    createEnvironment: build.mutation<Environment, { projectId: string; name: string }>({
      query: ({ projectId, ...body }) => ({
        url: `/projects/${projectId}/environments`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Environment'],
    }),
    deleteEnvironment: build.mutation<void, { projectId: string; envId: string }>({
      query: ({ projectId, envId }) => ({
        url: `/projects/${projectId}/environments/${envId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Environment'],
    }),
    listEnvironments: build.query<Environment[], string>({
      query: (projectId) => `/projects/${projectId}/environments`,
      providesTags: ['Environment'],
    }),
    listAllEnvironments: build.query<Environment[], void>({
      query: () => '/environments',
      providesTags: ['Environment'],
    }),
    listSecrets: build.query<Secret[], string>({
      query: (envId) => `/environments/${envId}/secrets`,
      providesTags: ['Secret'],
    }),
    upsertSecret: build.mutation<void, UpsertSecretArgs>({
      query: ({ envId, ...body }) => ({
        url: `/environments/${envId}/secrets`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Secret'],
    }),
    deleteSecret: build.mutation<void, { envId: string; key: string }>({
      query: ({ envId, key }) => ({
        url: `/environments/${envId}/secrets/${key}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Secret'],
    }),
    syncEnvironment: build.query<SyncPayload, { environmentId: string; deviceId: string }>({
      query: ({ environmentId, deviceId }) =>
        `/sync/${environmentId}?deviceId=${deviceId}`,
    }),
    changePassword: build.mutation<{ message: string }, ChangePasswordArgs>({
      query: (body) => ({ url: '/auth/change-password', method: 'PATCH', body }),
    }),
    updateMnemonic: build.mutation<{ message: string }, UpdateMnemonicArgs>({
      query: (body) => ({ url: '/auth/update-mnemonic', method: 'PATCH', body }),
    }),
    recoveryInit: build.mutation<RecoveryInitResponse, { email: string }>({
      query: (body) => ({ url: '/auth/recovery-init', method: 'POST', body }),
    }),
    resetWithMnemonic: build.mutation<{ message: string }, ResetWithMnemonicArgs>({
      query: (body) => ({ url: '/auth/reset-with-mnemonic', method: 'POST', body }),
    }),
    getDeployToken: build.query<DeployToken | null, string>({
      query: (environmentId) => `/deploy-tokens?environmentId=${environmentId}`,
      providesTags: ['DeployToken'],
    }),
    createDeployToken: build.mutation<DeployToken, CreateDeployTokenArgs>({
      query: (body) => ({ url: '/deploy-tokens', method: 'POST', body }),
      invalidatesTags: ['DeployToken'],
    }),
    revokeDeployToken: build.mutation<{ success: boolean }, string>({
      query: (id) => ({ url: `/deploy-tokens/${id}`, method: 'DELETE' }),
      invalidatesTags: ['DeployToken'],
    }),
    renameProject: build.mutation<Project, RenameProjectArgs>({
      query: ({ id, name }) => ({ url: `/projects/${id}`, method: 'PATCH', body: { name } }),
      invalidatesTags: ['Project', 'Environment'],
    }),
    renameEnvironment: build.mutation<Environment, RenameEnvironmentArgs>({
      query: ({ projectId, envId, name }) => ({ url: `/projects/${projectId}/environments/${envId}`, method: 'PATCH', body: { name } }),
      invalidatesTags: ['Environment'],
    }),
  }),
});

export const {
  useRegisterMutation, useLoginMutation, useLogoutMutation,
  useRegisterDeviceMutation, useCompleteRegistrationMutation,
  useListPendingDevicesQuery, useCompleteApprovalMutation,
  useListDevicesQuery, useRevokeDeviceMutation,
  useCreateProjectMutation, useListProjectsQuery, useDeleteProjectMutation,
  useCreateEnvironmentMutation, useListEnvironmentsQuery, useListAllEnvironmentsQuery, useDeleteEnvironmentMutation,
  useListSecretsQuery, useUpsertSecretMutation, useDeleteSecretMutation,
  useSyncEnvironmentQuery,
  useChangePasswordMutation, useUpdateMnemonicMutation,
  useRecoveryInitMutation, useResetWithMnemonicMutation,
  useGetDeployTokenQuery, useCreateDeployTokenMutation,
  useRevokeDeployTokenMutation,
  useRenameProjectMutation, useRenameEnvironmentMutation,
} = api;
