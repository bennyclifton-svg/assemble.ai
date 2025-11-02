import { auth } from '@clerk/nextjs/server';
import { getUserProjects } from '@/app/actions/project';
import { CreateProjectButton } from '@/components/project/CreateProjectButton';
import { ProjectCard } from '@/components/project/ProjectCard';
import { redirect } from 'next/navigation';

export default async function ProjectsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const result = await getUserProjects();
  const projects = result.success ? result.data : [];

  // Empty state - no projects yet
  if (projects.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Welcome to assemble.ai</h1>
          <p className="text-gray-600 mb-8">
            Get started by creating your first project
          </p>
          <CreateProjectButton variant="primary" />
        </div>
      </div>
    );
  }

  // Project list for returning users
  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Your Projects</h1>
        <CreateProjectButton variant="secondary" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
