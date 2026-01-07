// Type declarations for @radix-ui packages
// Workaround for TypeScript module resolution issues with pnpm
declare module '@radix-ui/react-dialog' {
  import * as React from 'react';

  export interface DialogProps extends React.ComponentPropsWithoutRef<'div'> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
    modal?: boolean;
  }

  export const Root: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDivElement>>;
  export const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDivElement>>;
  export const Trigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>>;
  export const DialogTrigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>>;
  export const Portal: React.ComponentType<{ children?: React.ReactNode }>;
  export const Overlay: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const Content: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const DialogContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const Close: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>>;
  export const DialogClose: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>>;
  export const Title: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'h2'> & React.RefAttributes<HTMLHeadingElement>>;
  export const DialogTitle: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'h2'> & React.RefAttributes<HTMLHeadingElement>>;
  export const Description: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'p'> & React.RefAttributes<HTMLParagraphElement>>;
  export const DialogDescription: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'p'> & React.RefAttributes<HTMLParagraphElement>>;
  export const DialogHeader: React.ComponentType<{ children?: React.ReactNode; className?: string }>;
  export const DialogFooter: React.ComponentType<{ children?: React.ReactNode; className?: string }>;
}

declare module '@radix-ui/react-tabs' {
  import * as React from 'react';

  export interface TabsProps extends React.ComponentPropsWithoutRef<'div'> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }

  export const Root: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
  export const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
  export const List: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const TabsList: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const Trigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & { value: string } & React.RefAttributes<HTMLButtonElement>>;
  export const TabsTrigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & { value: string } & React.RefAttributes<HTMLButtonElement>>;
  export const Content: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & { value: string } & React.RefAttributes<HTMLDivElement>>;
  export const TabsContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & { value: string } & React.RefAttributes<HTMLDivElement>>;
}

declare module '@radix-ui/react-toast' {
  import * as React from 'react';

  export interface ToastProps extends React.ComponentPropsWithoutRef<'div'> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    defaultOpen?: boolean;
    duration?: number;
  }

  export const Root: React.ForwardRefExoticComponent<ToastProps & React.RefAttributes<HTMLDivElement>>;
  export const Provider: React.ComponentType<{ children?: React.ReactNode; duration?: number; swipeDirection?: 'up' | 'down' | 'left' | 'right'; swipeThreshold?: number }>;
  export const Viewport: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLOListElement>>;
  export const Title: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const Description: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const Action: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & { altText?: string } & React.RefAttributes<HTMLButtonElement>>;
  export const Close: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>>;
}

