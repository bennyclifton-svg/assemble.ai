'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/app/actions/project';
import { Plus } from 'lucide-react';

interface CreateProjectButtonProps {
  variant?: 'primary' | 'secondary';
}

export function CreateProjectButton({ variant = 'primary' }: CreateProjectButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const handleCreateProject = async () => {
    setIsCreating(true);

    try {
      const result = await createProject();

      if (result.success) {
        // Redirect to the new project's Plan Card
        router.push(`/projects/${result.data.id}`);
      } else {
        console.error('Failed to create project:', result.error);
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Unexpected error creating project:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  if (variant === 'primary') {
    return (
      <button
        onClick={handleCreateProject}
        disabled={isCreating}
        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus className="w-5 h-5" />
        {isCreating ? 'Creating Project...' : 'Create New Project'}
      </button>
    );
  }

  return (
    <button
      onClick={handleCreateProject}
      disabled={isCreating}
      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Plus className="w-4 h-4" />
      {isCreating ? 'Creating...' : 'New Project'}
    </button>
  );
}
