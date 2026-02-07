'use client';

import Link from 'next/link';
import { useTheme } from '@/providers';

export default function Header() {
  const { isDark, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-black">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              MetroFlow
            </Link>
          </div>

          <nav className="hidden md:flex gap-8">
            <Link
              href="/"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Home
            </Link>
            <Link
              href="/stations"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Stations
            </Link>
            <Link
              href="/map"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Map
            </Link>
            <Link
              href="/departures"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Departures
            </Link>
            <Link
              href="/charts"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Charts
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Dashboard
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition"
            >
              Contact
            </Link>
          </nav>

          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="rounded-lg bg-gray-200 p-2 dark:bg-gray-800 transition"
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </div>
    </header>
  );
}
