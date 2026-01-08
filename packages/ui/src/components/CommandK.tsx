import * as React from 'react';
import { cn } from '../lib/utils';

export interface CommandKProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface CommandKItemProps extends React.HTMLAttributes<HTMLDivElement> {
  onSelect?: () => void;
}

const CommandKContext = React.createContext<{
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}>({ open: false });

const CommandK = ({ open = false, onOpenChange, children }: CommandKProps) => {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange?.(!open);
      }
      if (e.key === 'Escape' && open) {
        onOpenChange?.(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <CommandKContext.Provider value={{ open, onOpenChange }}>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
        <div className="pointer-events-none fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => onOpenChange?.(false)} />
        <div className="relative z-50 w-full max-w-2xl">{children}</div>
      </div>
    </CommandKContext.Provider>
  );
};

const CommandKDialog = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl',
          'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
          className
        )}
        {...props}
      />
    );
  }
);
CommandKDialog.displayName = 'CommandKDialog';

const CommandKInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center border-b border-gray-200 px-4">
        <svg
          className="mr-2 h-4 w-4 shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          ref={ref}
          className={cn(
            'flex h-14 w-full bg-transparent py-3 text-base outline-none placeholder:text-gray-400',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CommandKInput.displayName = 'CommandKInput';

const CommandKList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('max-h-[300px] overflow-y-auto p-2', className)}
        {...props}
      />
    );
  }
);
CommandKList.displayName = 'CommandKList';

const CommandKGroup = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('overflow-hidden p-1 text-gray-600 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold', className)}
        {...props}
      />
    );
  }
);
CommandKGroup.displayName = 'CommandKGroup';

const CommandKItem = React.forwardRef<HTMLDivElement, CommandKItemProps>(
  ({ className, onSelect, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm',
          'outline-none transition-colors',
          'hover:bg-gray-100',
          'data-[selected=true]:bg-primary-50 data-[selected=true]:text-primary-600',
          className
        )}
        onClick={onSelect}
        {...props}
      />
    );
  }
);
CommandKItem.displayName = 'CommandKItem';

const CommandKSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('-mx-1 h-px bg-gray-200', className)} {...props} />;
  }
);
CommandKSeparator.displayName = 'CommandKSeparator';

export {
  CommandK,
  CommandKDialog,
  CommandKInput,
  CommandKList,
  CommandKGroup,
  CommandKItem,
  CommandKSeparator,
};
