import { SITE_NAME } from '@/core';
import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className='border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950'>
      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-8 mb-8'>
          <div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
              {SITE_NAME}
            </h3>
            <p className='text-gray-600 dark:text-gray-400'>
              Real-time transport intelligence platform
            </p>
          </div>

          <div>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
              Product
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/'
                  className='text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href='/about'
                  className='text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                >
                  About
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
              Company
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='/contact'
                  className='text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className='font-semibold text-gray-900 dark:text-white mb-4'>
              Legal
            </h4>
            <ul className='space-y-2'>
              <li>
                <Link
                  href='#'
                  className='text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  href='#'
                  className='text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400'
                >
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className='border-t border-gray-200 dark:border-gray-800 pt-8'>
          <p className='text-center text-gray-600 dark:text-gray-400'>
            &copy; {currentYear} {SITE_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
