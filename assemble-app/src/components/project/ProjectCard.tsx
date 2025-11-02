'use client';

import { useRouter } from 'next/navigation';
import type { Project } from '@prisma/client';
import { Folder } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/projects/${project.id}`);
  };

  // Format last accessed date
  const formatDate = (date: Date) => {
    const now = new Date();
    const lastAccessed = new Date(date);
    const diffInHours = Math.floor((now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return lastAccessed.toLocaleDateString();
  };

  return (
    <button
      onClick={handleClick}
      className="w-full bg-white border border-gray-200 rounded-lg p-6 text-left hover:shadow-md hover:border-blue-300 transition-all group"
    >
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
          <Folder className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-semibold mb-1 truncate group-hover:text-blue-600 transition-colors">
            {project.name}
          </h2>
          <p className="text-sm text-gray-500">
            Last accessed {formatDate(project.lastAccessedAt)}
          </p>
        </div>
      </div>
    </button>
  );
}
