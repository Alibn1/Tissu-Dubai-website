import Image from 'next/image';
import {cn} from '@/lib/utils';

type LogoProps = {
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeClasses = {
  sm: 'h-8 w-auto',
  md: 'h-10 w-auto',
  lg: 'h-14 w-auto'
};

export function Logo({variant = 'full', size = 'md', className}: LogoProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Image
        src="/Logo tissudubai.png"
        alt="Tissu Dubai"
        width={variant === 'mark' ? 40 : 160}
        height={variant === 'mark' ? 40 : 40}
        className={sizeClasses[size]}
        priority
      />
    </div>
  );
}
