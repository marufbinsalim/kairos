'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth } from '@/lib/store/authSlice';
import { selectCrypto, setKeypair } from '@/lib/store/cryptoSlice';
import { base64ToBytes } from '@/lib/crypto/keypair';
import { x25519 } from '@noble/curves/ed25519';

export function AppInitializer() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector(selectAuth);
  const { privateKey } = useSelector(selectCrypto);

  useEffect(() => {
    if (!accessToken || privateKey) return;
    const stored = sessionStorage.getItem('kairos_privkey');
    if (!stored) return;
    const key = base64ToBytes(stored);
    const publicKey = x25519.getPublicKey(key);
    dispatch(setKeypair({ privateKey: key, publicKey }));
  }, [accessToken, privateKey, dispatch]);

  return null;
}
