import Image from 'next/image';

export function KairosLogo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/kairos-logo.svg"
      alt="Kairos"
      width={size}
      height={size}
      className="rounded-xl"
      priority
    />
  );
}
