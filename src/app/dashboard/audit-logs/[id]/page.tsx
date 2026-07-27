import {
  AuditLogDetails,
} from "@/features/audit-logs/audit-log-details";

interface AuditLogDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AuditLogDetailsPage({
  params,
}: AuditLogDetailsPageProps) {
  const { id } = await params;

  return (
    <AuditLogDetails
      auditLogId={id}
    />
  );
}
