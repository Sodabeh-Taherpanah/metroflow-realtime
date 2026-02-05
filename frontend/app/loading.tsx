export default function Loading() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-white dark:bg-black'>
      <div className='space-y-4'>
        <div className='flex justify-center'>
          <div className='h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 dark:border-gray-800 dark:border-t-blue-400'></div>
        </div>
        <p className='text-center text-gray-600 dark:text-gray-400'>
          Loading...
        </p>
      </div>
    </div>
  );
}
