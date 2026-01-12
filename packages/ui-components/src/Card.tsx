import React from 'react';

/**
 * Card component props
 */
export interface CardProps {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Card title (optional header)
   */
  title?: string;
  /**
   * Card footer content
   */
  footer?: React.ReactNode;
  /**
   * Whether card is clickable
   */
  onClick?: () => void;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Whether to show hover effect
   */
  hoverable?: boolean;
}

/**
 * Card component for displaying content in a container
 *
 * @example
 * ```tsx
 * <Card title="Flight Details" hoverable onClick={handleClick}>
 *   <p>New York to Los Angeles</p>
 * </Card>
 * ```
 */
export function Card({
  children,
  title,
  footer,
  onClick,
  className = '',
  hoverable = false,
}: CardProps) {
  const baseStyles = 'bg-white rounded-lg border border-gray-200 shadow-xs overflow-hidden';
  const interactiveStyles = onClick || hoverable
    ? 'cursor-pointer transition-shadow hover:shadow-md'
    : '';

  return (
    <div
      className={`${baseStyles} ${interactiveStyles} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {title && (
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          {footer}
        </div>
      )}
    </div>
  );
}
