import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Header from '../Header';

// Mock useTheme hook
vi.mock('@/providers', () => ({
  useTheme: () => ({
    isDark: false,
    setTheme: vi.fn(),
    theme: 'light',
  }),
}));

// Mock Next.js Link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe('Header Component', () => {
  it('should render header with title', () => {
    render(<Header />);
    const heading = screen.getByText('MetroFlow');
    expect(heading).toBeInTheDocument();
  });

  it('should have navigation links', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  it('should render main navigation items', () => {
    render(<Header />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Stations')).toBeInTheDocument();
  });
});
