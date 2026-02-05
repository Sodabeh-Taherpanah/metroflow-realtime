'use client';

import { useEffect } from 'react';

export default function ShortcutListener() {
  useEffect(() => {
    // Initialize any client-only shortcut listeners here.
    // This runs only on the client to avoid SSR/client markup mismatch.

    const onKey = (e: KeyboardEvent) => {
      // example: press "h" to focus search (customize as needed)
      if (e.key === 'h' && !(e.target as HTMLElement).matches('input,textarea')) {
        // add custom behavior or dispatch an event
        // console.log('shortcut h pressed');
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
