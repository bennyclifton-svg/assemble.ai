import { NavigationSidebar } from '@/components/workspace/NavigationSidebar';
import { CardViewport } from '@/components/workspace/CardViewport';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params;

  return (
    <div className="flex h-screen overflow-hidden">
      <NavigationSidebar />
      <CardViewport />
    </div>
  );
}
