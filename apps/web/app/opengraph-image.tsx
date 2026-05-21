import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Kairos — E2EE Secrets Manager';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0B1020',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Gradient glow top-left */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            left: -120,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)',
          }}
        />
        {/* Gradient glow bottom-right */}
        <div
          style={{
            position: 'absolute',
            bottom: -120,
            right: -120,
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6,182,212,0.2) 0%, transparent 70%)',
          }}
        />

        {/* Logo mark */}
        <svg
          width="80"
          height="80"
          viewBox="0 0 512 512"
          fill="none"
          style={{ marginBottom: 32 }}
        >
          <defs>
            <linearGradient id="g" x1="80" y1="64" x2="420" y2="448" gradientUnits="userSpaceOnUse">
              <stop stopColor="#7C3AED" />
              <stop offset="1" stopColor="#06B6D4" />
            </linearGradient>
          </defs>
          <rect width="512" height="512" rx="120" fill="#161d35" />
          <path d="M256 72L384 128V224C384 319.2 327.2 403.2 256 440C184.8 403.2 128 319.2 128 224V128L256 72Z" stroke="url(#g)" strokeWidth="24" fill="rgba(255,255,255,0.02)" />
          <path d="M198 158V354" stroke="url(#g)" strokeWidth="28" strokeLinecap="round" />
          <path d="M314 158L222 256L320 354" stroke="url(#g)" strokeWidth="28" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <span style={{ fontSize: 64, fontWeight: 700, color: '#ffffff', letterSpacing: '-1px' }}>
            kairos
          </span>
        </div>

        {/* Tagline */}
        <div style={{ fontSize: 28, color: '#94a3b8', textAlign: 'center', maxWidth: 700 }}>
          E2EE secrets manager — your private key never leaves your device
        </div>
      </div>
    ),
    { ...size },
  );
}
