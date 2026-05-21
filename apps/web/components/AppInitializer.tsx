'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth } from '@/lib/store/authSlice';
import { selectCrypto, setKeypair, setDeviceId } from '@/lib/store/cryptoSlice';
import { base64ToBytes } from '@/lib/crypto/keypair';
import { x25519 } from '@noble/curves/ed25519';

export function AppInitializer() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector(selectAuth);
  const { privateKey, deviceId } = useSelector(selectCrypto);

  useEffect(() => {
    if (!accessToken) return;

    if (!privateKey) {
      const stored = sessionStorage.getItem('kairos_privkey');
      if (stored) {
        const key = base64ToBytes(stored);
        const publicKey = x25519.getPublicKey(key);
        dispatch(setKeypair({ privateKey: key, publicKey }));
      }
    }

    if (!deviceId) {
      const stored = sessionStorage.getItem('kairos_deviceId');
      if (stored) dispatch(setDeviceId(stored));
    }
  }, [accessToken, privateKey, deviceId, dispatch]);

  return null;
}
