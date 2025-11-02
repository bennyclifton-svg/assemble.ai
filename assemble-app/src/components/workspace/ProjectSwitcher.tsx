'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Plus, Check } from 'lucide-react';
import { getUserProjects, renameProject, createProject } from '@/app/actions/project';
import type { Project } from '@prisma/client';

interface ProjectSwitcherProps {
  projectId: string;
  collapsed?: boolean;
}

export function ProjectSwitcher({ projectId, collapsed = false }: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renamingText, setRenamingText] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // Load projects
  useEffect(() => {
    loadProjects();
  }, [projectId]);

  // Focus rename input when entering rename mode
  useEffect(() => {
    if (isRenaming && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [isRenaming]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const loadProjects = async () => {
    const result = await getUserProjects();
    if (result.success) {
      setProjects(result.data);
      const current = result.data.find((p) => p.id === projectId);
      setCurrentProject(current || null);
    }
  };

  const handleProjectSwitch = (newProjectId: string) => {
    setIsOpen(false);
    if (newProjectId !== projectId) {
      router.push(`/projects/${newProjectId}`);
    }
  };

  const handleCreateProject = async () => {
    setIsCreating(true);
    setIsOpen(false);

    try {
      const result = await createProject();
      if (result.success) {
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

  const handleRenameStart = () => {
    if (currentProject) {
      setRenamingText(currentProject.name);
      setIsRenaming(true);
    }
  };

  const handleRenameSave = async () => {
    if (!currentProject || !renamingText.trim()) {
      setIsRenaming(false);
      return;
    }

    if (renamingText.trim() === currentProject.name) {
      setIsRenaming(false);
      return;
    }

    try {
      const result = await renameProject(currentProject.id, renamingText.trim());
      if (result.success) {
        await loadProjects(); // Reload to get updated name
        setIsRenaming(false);
      } else {
        console.error('Failed to rename project:', result.error);
        alert(`Error: ${result.error.message}`);
      }
    } catch (error) {
      console.error('Unexpected error renaming project:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  const handleRenameCancel = () => {
    setIsRenaming(false);
    setRenamingText('');
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRenameSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleRenameCancel();
    }
  };

  if (collapsed) {
    // Show icon-only version when collapsed
    return (
      <div className="p-2 border-b border-gray-800">
        <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white font-semibold">
          {currentProject?.name.charAt(0).toUpperCase() || 'P'}
        </div>
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative p-3 border-b border-gray-800">
      {isRenaming ? (
        <input
          ref={renameInputRef}
          type="text"
          value={renamingText}
          onChange={(e) => setRenamingText(e.target.value)}
          onBlur={handleRenameSave}
          onKeyDown={handleRenameKeyDown}
          className="w-full px-2 py-1.5 bg-gray-800 text-white rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          onDoubleClick={handleRenameStart}
          className="w-full flex items-center justify-between gap-2 px-2 py-1.5 hover:bg-gray-800 rounded transition-colors group"
        >
          <span className="font-medium text-white truncate text-left">
            {currentProject?.name || 'Select Project'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 group-hover:text-white transition-all flex-shrink-0 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="py-1">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectSwitch(project.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-700 transition-colors ${
                  project.id === projectId ? 'bg-gray-700' : ''
                }`}
              >
                <span className="text-sm text-white truncate">{project.name}</span>
                {project.id === projectId && <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-gray-700 py-1">
            <button
              onClick={handleCreateProject}
              disabled={isCreating}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? 'Creating...' : 'Create New Project'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
