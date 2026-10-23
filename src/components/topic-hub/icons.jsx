// Inline stroke icons (24px grid, currentColor) so the hub ships no icon font.
const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  focusable: false,
};

export const SigmaIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M18 5H6l6 7-6 7h12" />
  </svg>
);

export const BoltIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" />
  </svg>
);

export const AlertIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

export const ChevronIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRightIcon = (p) => (
  <svg {...base} width={14} height={14} {...p}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const FlameIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 22c4 0 7-2.7 7-6.8 0-3-1.7-5.4-3.6-7.2-.4 1.7-1.3 2.8-2.4 3.3.3-3.5-1.2-6.6-4-9.3-.2 3.4-2 5.6-3.6 7.6C4.3 11.1 5 13 5 15.2 5 19.3 8 22 12 22Z" />
  </svg>
);

export const TargetIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="5" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

export const TimerIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="13" r="8" />
    <path d="M12 9v4l2.5 2.5M9 2h6" />
  </svg>
);

export const ArrowRightIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const CheckIcon = (p) => (
  <svg {...base} {...p}>
    <path d="m5 12 5 5 9-10" />
  </svg>
);

export const XIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

export const BookmarkIcon = ({ filled = false, ...p }) => (
  <svg {...base} {...p}>
    <path d="M6 3h12v18l-6-4-6 4V3Z" fill={filled ? 'currentColor' : 'none'} />
  </svg>
);

export const FlagIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M5 21V4m0 0h11l-2 4 2 4H5" />
  </svg>
);

export const TrophyIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" />
  </svg>
);
