import { type HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  name: string;
  size?: AvatarSize;
  status?: 'online' | 'offline' | 'busy';
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

const statusColors: Record<string, string> = {
  online: 'bg-emerald-500',
  offline: 'bg-surface-400',
  busy: 'bg-red-500',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    'bg-primary-100 text-primary-700',
    'bg-blue-100 text-blue-700',
    'bg-purple-100 text-purple-700',
    'bg-amber-100 text-amber-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
    'bg-emerald-100 text-emerald-700',
    'bg-orange-100 text-orange-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  name,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={cn(
            'rounded-full object-cover ring-2 ring-white',
            sizeStyles[size],
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-semibold ring-2 ring-white',
            sizeStyles[size],
            getAvatarColor(name),
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full ring-2 ring-white',
            size === 'xs' || size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
            statusColors[status],
          )}
        />
      )}
    </div>
  );
}

interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  names: string[];
  size?: AvatarSize;
  max?: number;
}

export function AvatarGroup({ names, size = 'sm', max = 4, className, ...props }: AvatarGroupProps) {
  const shown = names.slice(0, max);
  const remaining = names.length - max;

  return (
    <div className={cn('flex -space-x-2', className)} {...props}>
      {shown.map((name) => (
        <Avatar key={name} name={name} size={size} />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'rounded-full flex items-center justify-center font-medium bg-surface-100 text-surface-600 ring-2 ring-white',
            sizeStyles[size],
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
