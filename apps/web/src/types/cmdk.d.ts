// Type declarations for cmdk
// Workaround for TypeScript module resolution issues with pnpm
declare module 'cmdk' {
  import * as React from 'react';

  export interface CommandProps extends React.ComponentPropsWithoutRef<'div'> {
    children?: React.ReactNode;
    className?: string;
  }

  export interface CommandGroupProps extends React.ComponentPropsWithoutRef<'div'> {
    heading?: string;
  }

  export const Command: React.ForwardRefExoticComponent<CommandProps & React.RefAttributes<HTMLDivElement>> & {
    Input: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'input'> & React.RefAttributes<HTMLInputElement>>;
    List: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
    Empty: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
    Group: React.ForwardRefExoticComponent<CommandGroupProps & React.RefAttributes<HTMLDivElement>>;
    Item: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
    Separator: React.ForwardRefExoticComponent<React.ComponentPropsWithoutRef<'div'> & React.RefAttributes<HTMLDivElement>>;
  };
}

