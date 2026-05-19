import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  accessToken: string | null;
  userId: string | null;
  email: string | null;
}

function loadAuthFromSession(): AuthState {
  if (typeof window === 'undefined') return { accessToken: null, userId: null, email: null };
  return {
    accessToken: sessionStorage.getItem('kairos_token'),
    userId: sessionStorage.getItem('kairos_userId'),
    email: sessionStorage.getItem('kairos_email'),
  };
}

const initialState: AuthState = loadAuthFromSession();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth(state, action: PayloadAction<{ accessToken: string; userId: string; email?: string }>) {
      state.accessToken = action.payload.accessToken;
      state.userId = action.payload.userId;
      if (action.payload.email) {
        state.email = action.payload.email;
        sessionStorage.setItem('kairos_email', action.payload.email);
      }
      sessionStorage.setItem('kairos_token', action.payload.accessToken);
      sessionStorage.setItem('kairos_userId', action.payload.userId);
    },
    clearAuth(state) {
      state.accessToken = null;
      state.userId = null;
      state.email = null;
      ['kairos_token', 'kairos_userId', 'kairos_email', 'kairos_deviceId', 'kairos_pw', 'kairos_privkey'].forEach(
        (k) => sessionStorage.removeItem(k),
      );
    },
  },
});

export const { setAuth, clearAuth } = authSlice.actions;
export default authSlice.reducer;
export const selectAuth = (state: { auth: AuthState }) => state.auth;
