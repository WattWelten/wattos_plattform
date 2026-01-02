import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Logo } from '../logo';

describe('Logo', () => {
  it('renders full logo by default', () => {
    render(<Logo />);
    expect(screen.getByText('WattWeiser')).toBeInTheDocument();
  });

  it('renders icon only when variant is icon', () => {
    const { container } = render(<Logo variant="icon" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(screen.queryByText('WattWeiser')).not.toBeInTheDocument();
  });

  it('renders text only when variant is text', () => {
    render(<Logo variant="text" />);
    expect(screen.getByText('WattWeiser')).toBeInTheDocument();
  });

  it('applies size classes correctly', () => {
    const { container } = render(<Logo size="lg" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('h-12', 'w-12');
  });
});



