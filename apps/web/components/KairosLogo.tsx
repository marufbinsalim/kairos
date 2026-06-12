export function KairosLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="rounded-lg flex-shrink-0"
    >
      <defs>
        <linearGradient id="kairosGradient" x1="80" y1="64" x2="420" y2="448" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C3AED" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>

      <rect width="512" height="512" rx="120" className="fill-gray-100 dark:fill-[#0B1020]" />

      <path
        d="M256 72L384 128V224C384 319.2 327.2 403.2 256 440C184.8 403.2 128 319.2 128 224V128L256 72Z"
        stroke="url(#kairosGradient)"
        strokeWidth="24"
        fill="rgba(255,255,255,0.02)"
      />
      <path
        d="M198 158V354"
        stroke="url(#kairosGradient)"
        strokeWidth="28"
        strokeLinecap="round"
      />
      <path
        d="M314 158L222 256L320 354"
        stroke="url(#kairosGradient)"
        strokeWidth="28"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
