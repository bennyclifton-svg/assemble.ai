import { auth } from '@clerk/nextjs/server';

export default async function ProjectsPage() {
  const { userId } = await auth();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">Projects</h1>
      <p className="text-gray-600">Welcome! User ID: {userId}</p>
      <p className="mt-4 text-sm text-gray-500">
        This is the protected projects page. The full workspace will be implemented in subsequent stories.
      </p>
    </div>
  );
}
