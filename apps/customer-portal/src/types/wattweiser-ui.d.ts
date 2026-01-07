// Type declarations for @wattweiser/ui
// Workaround for TypeScript module resolution issues with pnpm
declare module '@wattweiser/ui' {
  import * as React from 'react';

  export function cn(...classes: (string | undefined | null | false)[]): string;

  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    asChild?: boolean;
  }

  export const Button: React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>;

  export interface LoadingProps {
    className?: string;
  }

  export const Loading: React.ComponentType<LoadingProps>;

  export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'destructive';
  }

  export const Alert: React.ForwardRefExoticComponent<AlertProps & React.RefAttributes<HTMLDivElement>>;
  export const AlertTitle: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLHeadingElement> & React.RefAttributes<HTMLHeadingElement>>;
  export const AlertDescription: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLParagraphElement> & React.RefAttributes<HTMLParagraphElement>>;

  export interface DialogProps extends React.ComponentPropsWithoutRef<'div'> {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  export const Dialog: React.ForwardRefExoticComponent<DialogProps & React.RefAttributes<HTMLDivElement>>;
  export const DialogTrigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & React.RefAttributes<HTMLButtonElement>>;
  export const DialogContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const DialogHeader: React.ComponentType<{ children?: React.ReactNode; className?: string }>;
  export const DialogTitle: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'h2'> & React.RefAttributes<HTMLHeadingElement>>;
  export const DialogDescription: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'p'> & React.RefAttributes<HTMLParagraphElement>>;
  export const DialogFooter: React.ComponentType<{ children?: React.ReactNode; className?: string }>;

  export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
  export const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;

  export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}
  export const Label: React.ForwardRefExoticComponent<LabelProps & React.RefAttributes<HTMLLabelElement>>;

  export interface TabsProps extends React.ComponentPropsWithoutRef<'div'> {
    defaultValue?: string;
    value?: string;
    onValueChange?: (value: string) => void;
  }

  export const Tabs: React.ForwardRefExoticComponent<TabsProps & React.RefAttributes<HTMLDivElement>>;
  export const TabsList: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  export const TabsTrigger: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'button'> & { value: string } & React.RefAttributes<HTMLButtonElement>>;
  export const TabsContent: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & { value: string } & React.RefAttributes<HTMLDivElement>>;

  export const AppleCard: React.ComponentType<any>;
  export const AppleButton: React.ComponentType<any>;
  export const Logo: React.ComponentType<any>;
}


