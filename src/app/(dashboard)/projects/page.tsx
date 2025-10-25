import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function ProjectsPage() {
  const { userId } = await auth();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Projects</h1>
      <p className="text-gray-600 mb-8">Welcome! User ID: {userId}</p>

      {/* Demo Project Card */}
      <div className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
          <h2 className="text-xl font-semibold mb-2">Demo Project</h2>
          <p className="text-gray-600 mb-4">
            Sample construction project with multi-card workspace
          </p>
          <Link
            href="/projects/demo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open Workspace
          </Link>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Story 1.3 Complete:</strong> The multi-card workspace with side navigation is now functional.
          </p>
          <ul className="mt-2 text-sm text-blue-700 list-disc list-inside space-y-1">
            <li>Click cards in navigation to open them</li>
            <li>Ctrl/Cmd+Click to open multiple cards (max 3)</li>
            <li>Collapse/expand navigation with chevron button</li>
            <li>State persists between page refreshes</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
