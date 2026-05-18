'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectAuth } from '@/lib/store/authSlice';
import { selectCrypto, setKeypair } from '@/lib/store/cryptoSlice';
import { loadPrivateKey } from '@/lib/storage/indexeddb';
import { x25519 } from '@noble/curves/ed25519';

export function AppInitializer() {
  const dispatch = useDispatch();
  const { accessToken } = useSelector(selectAuth);
  const { privateKey } = useSelector(selectCrypto);

  useEffect(() => {
    if (!accessToken || privateKey) return;
    const password = sessionStorage.getItem('kairos_pw');
    if (!password) return;

    loadPrivateKey(password).then((key) => {
      if (!key) return;
      const publicKey = x25519.getPublicKey(key);
      dispatch(setKeypair({ privateKey: key, publicKey }));
    });
  }, [accessToken, privateKey, dispatch]);

  return null;
}
