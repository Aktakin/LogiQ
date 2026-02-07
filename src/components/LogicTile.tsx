import type { CSSProperties } from 'react';

export type LogicShape = 'circle' | 'square' | 'triangle' | 'diamond' | 'hex';

interface LogicTileProps {
  shape: LogicShape;
  color: string;
  size?: number;
  withShadow?: boolean;
  className?: string;
  label?: string;
}

const shapeStyles: Record<LogicShape, CSSProperties> = {
  circle: {
    borderRadius: '9999px',
  },
  square: {
    borderRadius: '12px',
  },
  triangle: {
    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  },
  diamond: {
    clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
  },
  hex: {
    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  },
};

export default function LogicTile({
  shape,
  color,
  size = 48,
  withShadow = true,
  className,
  label,
}: LogicTileProps) {
  const baseStyle: CSSProperties = {
    width: size,
    height: size,
    backgroundColor: color,
    ...shapeStyles[shape],
  };

  return (
    <div
      className={`flex items-center justify-center ${className || ''}`}
      style={{ width: size, height: size }}
    >
      <div
        className={withShadow ? 'shadow-md' : ''}
        style={baseStyle}
      />
      {label ? (
        <span className="sr-only">{label}</span>
      ) : null}
    </div>
  );
}
