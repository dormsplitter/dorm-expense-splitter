import { avatarColor, initials } from '@/lib/format';

interface AvatarProps {
  slot: number;
  name: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export function Avatar({ slot, name, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizeMap[size]} flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${avatarColor(
        slot
      )} font-bold text-white shadow-lg shadow-black/20 ring-2 ring-white/10`}
    >
      {initials(name, slot)}
    </div>
  );
}
