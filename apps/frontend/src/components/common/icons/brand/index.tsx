// Brand icons — sourced from the Claude Design handoff
// Source: docs/design/zonite-game/project/components/{Icons,Shell}.jsx + assets/
// These components are brand-specific and NOT interchangeable with Lucide equivalents.

interface IconProps {
  size?: number;
  className?: string;
}

interface LogoProps extends IconProps {
  alt?: string;
}

/**
 * Host indicator — filled crown SVG from handoff Icons.jsx (IconCrown path).
 * Used on PlayerRow / LobbyList to mark the room host.
 */
export function IconCrownHost({ size = 16, className }: IconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M2 20h20M3 17l3-10 4 6 2-8 2 8 4-6 3 10" />
    </svg>
  );
}

/**
 * Zonite game wordmark logo.
 * Source: docs/design/zonite-game/project/assets/zonite-logo.png
 */
export function ZoniteLogo({ size = 36, className, alt = 'Zonite' }: LogoProps): JSX.Element {
  return (
    <img
      src="/brand/zonite-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}

/**
 * Yalgamers publisher logo.
 * Source: docs/design/zonite-game/project/assets/yalgamers-logo.png
 */
export function YalgamersLogo({ size = 24, className, alt = 'Yalgamers' }: LogoProps): JSX.Element {
  return (
    <img
      src="/brand/yalgamers-logo.png"
      alt={alt}
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
}
