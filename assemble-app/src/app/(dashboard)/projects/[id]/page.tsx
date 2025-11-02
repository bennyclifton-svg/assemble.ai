import { NavigationSidebar } from '@/components/workspace/NavigationSidebar';
import { CardViewport } from '@/components/workspace/CardViewport';
import { getDocuments } from '@/app/actions/document';
import { updateLastAccessed, getProject } from '@/app/actions/project';
import { redirect } from 'next/navigation';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  // Verify project exists and update last accessed
  const projectResult = await getProject(id);

  if (!projectResult.success) {
    redirect('/projects');
  }

  // Update last accessed timestamp (fire and forget)
  updateLastAccessed(id).catch((err) =>
    console.error('Failed to update last accessed:', err)
  );

  // Fetch documents for folder tree
  const documentsResult = await getDocuments(id);
  const documents = documentsResult.success ? documentsResult.data || [] : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <NavigationSidebar projectId={id} documents={documents} />
      <CardViewport projectId={id} />
    </div>
  );
}
