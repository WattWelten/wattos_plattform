import * as React from 'react';
import { cn } from '../lib/utils';

export interface ModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

const ModalContext = React.createContext<{
  open: boolean;
  onOpenChange?: ((open: boolean) => void) | undefined;
}>({ open: false });

const Modal = ({ open = false, onOpenChange, children }: ModalProps) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <ModalContext.Provider value={{ open, onOpenChange: onOpenChange || undefined }}>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {children}
      </div>
    </ModalContext.Provider>
  );
};

const ModalOverlay = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const context = React.useContext(ModalContext);
  
  return (
    <div
      ref={ref}
      className={cn(
        'fixed inset-0 bg-black/50 backdrop-blur-sm',
        'animate-in fade-in-0',
        className
      )}
      onClick={() => context.onOpenChange?.(false)}
      {...props}
    />
  );
});
ModalOverlay.displayName = 'ModalOverlay';

const ModalContent = React.forwardRef<HTMLDivElement, ModalContentProps>(
  ({ className, children, onClose, ...props }, ref) => {

    return (
      <>
        <ModalOverlay />
        <div
          ref={ref}
          className={cn(
            'relative z-50 w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl',
            'animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2',
            'focus:outline-none',
            className
          )}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {children}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </>
    );
  }
);
ModalContent.displayName = 'ModalContent';

const ModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 text-center sm:text-left mb-4', className)}
    {...props}
  />
));
ModalHeader.displayName = 'ModalHeader';

const ModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn('text-2xl font-semibold leading-none tracking-tight text-gray-900', className)}
    {...props}
  />
));
ModalTitle.displayName = 'ModalTitle';

const ModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-gray-600', className)} {...props} />
));
ModalDescription.displayName = 'ModalDescription';

const ModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6', className)}
    {...props}
  />
));
ModalFooter.displayName = 'ModalFooter';

export { Modal, ModalOverlay, ModalContent, ModalHeader, ModalTitle, ModalDescription, ModalFooter };
