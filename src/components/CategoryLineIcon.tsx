export type CategoryIconId =
  | 'favourite'
  | 'code-quest'
  | 'logic-builders'
  | 'games'
  | 'game-dev'
  | 'programming'
  | 'game-room';

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CategoryLineIcon({
  id,
  size = 28,
  className = 'text-white',
}: {
  id: CategoryIconId;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden
    >
      {id === 'favourite' && (
        <path
          {...iconProps}
          d="M12 3.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.7l5-.7L12 3.5z"
        />
      )}
      {id === 'code-quest' && (
        <>
          <rect {...iconProps} x="3" y="4" width="18" height="14" rx="2" />
          <path {...iconProps} d="M8 9l-2 3 2 3M16 9l2 3-2 3M13.5 8.5l-3 7" />
        </>
      )}
      {id === 'logic-builders' && (
        <>
          <path {...iconProps} d="M8 4h3l1 3 3 1v3l-3 1-1 3H8l-1-3-3-1V8l3-1 1-3z" />
          <circle {...iconProps} cx="17.5" cy="17.5" r="2.5" />
          <path {...iconProps} d="M15.5 15.5L13 13" />
        </>
      )}
      {id === 'games' && (
        <>
          <path
            {...iconProps}
            d="M8 14h2v2H8zM14 13h2v2h-2zM6 10h12a3 3 0 013 3v1a3 3 0 01-3 3H6a3 3 0 01-3-3v-1a3 3 0 013-3z"
          />
          <path {...iconProps} d="M8.5 10V8a3.5 3.5 0 017 0v2" />
        </>
      )}
      {id === 'game-dev' && (
        <>
          <path {...iconProps} d="M4 7h16v10H4z" />
          <path {...iconProps} d="M8 11h.01M11 11h.01M14 11h.01" />
          <path {...iconProps} d="M7 17l2-2 2 2 2-2 2 2" />
        </>
      )}
      {id === 'programming' && (
        <>
          <path {...iconProps} d="M8 6L4 12l4 6M16 6l4 6-4 6" />
          <path {...iconProps} d="M13 5l-2 14" />
        </>
      )}
      {id === 'game-room' && (
        <>
          <circle {...iconProps} cx="9" cy="10" r="3.5" />
          <circle {...iconProps} cx="15" cy="14" r="3.5" />
          <path {...iconProps} d="M12 11.5l1.5 1" />
        </>
      )}
    </svg>
  );
}

export function LineStarIcon({ size = 18, className = 'text-yellow-400' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        {...iconProps}
        d="M12 3.5l2.2 4.5 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5L4.8 8.7l5-.7L12 3.5z"
      />
    </svg>
  );
}

export function LineSettingsIcon({ size = 20, className = 'text-gray-300' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <circle {...iconProps} cx="12" cy="12" r="3" />
      <path
        {...iconProps}
        d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"
      />
    </svg>
  );
}

export function LineGridIcon({ size = 40, className = 'text-white' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden>
      <rect {...iconProps} x="3" y="3" width="7" height="7" rx="1.5" />
      <rect {...iconProps} x="14" y="3" width="7" height="7" rx="1.5" />
      <rect {...iconProps} x="3" y="14" width="7" height="7" rx="1.5" />
      <rect {...iconProps} x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
