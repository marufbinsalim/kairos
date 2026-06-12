import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CryptoState {
  privateKey: Uint8Array | null;
  publicKey: Uint8Array | null;
  dek: Uint8Array | null;
  deviceId: string | null;
}

function loadDeviceId(): string | null {
  if (typeof window === 'undefined') return null;
  const userId = sessionStorage.getItem('kairos_userId');
  return (
    (userId ? localStorage.getItem(`kairos_deviceId:${userId}`) : null) ??
    localStorage.getItem('kairos_deviceId') ??
    sessionStorage.getItem('kairos_deviceId')
  );
}

const initialState: CryptoState = {
  privateKey: null,
  publicKey: null,
  dek: null,
  deviceId: loadDeviceId(),
};

const cryptoSlice = createSlice({
  name: 'crypto',
  initialState,
  reducers: {
    setKeypair(state, action: PayloadAction<{ privateKey: Uint8Array; publicKey: Uint8Array }>) {
      state.privateKey = action.payload.privateKey;
      state.publicKey = action.payload.publicKey;
    },
    setDEK(state, action: PayloadAction<Uint8Array>) {
      state.dek = action.payload;
    },
    // Persistence happens at the call sites via saveDeviceIdLocal (needs userId)
    setDeviceId(state, action: PayloadAction<string>) {
      state.deviceId = action.payload;
    },
    clearCrypto(state) {
      state.privateKey = null;
      state.publicKey = null;
      state.dek = null;
      state.deviceId = null;
    },
  },
});

export const { setKeypair, setDEK, setDeviceId, clearCrypto } = cryptoSlice.actions;
export default cryptoSlice.reducer;
export const selectCrypto = (state: { crypto: CryptoState }) => state.crypto;
