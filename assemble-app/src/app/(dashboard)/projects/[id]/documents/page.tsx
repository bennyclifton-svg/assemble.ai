import { getDocuments } from '@/app/actions/document';
import DocumentsClient from './documents-client';

interface PageProps {
  params: {
    id: string;
  };
}

export default async function DocumentsPage({ params }: PageProps) {
  const projectId = params.id;

  // Get existing documents for the project
  const result = await getDocuments(projectId);
  const documents = result.success ? result.data : [];

  return <DocumentsClient projectId={projectId} initialDocuments={documents} />;
}