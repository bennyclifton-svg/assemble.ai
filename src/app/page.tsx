import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect('/projects');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">assemble.ai</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered tender package generation for construction projects
        </p>
        <p className="text-gray-500 mb-8">
          Reduce tender package creation from days to hours
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/sign-in"
            className="rounded-lg bg-blue-600 text-white px-6 py-3 font-medium hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="rounded-lg border border-gray-300 px-6 py-3 font-medium hover:bg-gray-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
