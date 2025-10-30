import { NavigationSidebar } from '@/components/workspace/NavigationSidebar';
import { CardViewport } from '@/components/workspace/CardViewport';
import { getDocuments } from '@/app/actions/document';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

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
