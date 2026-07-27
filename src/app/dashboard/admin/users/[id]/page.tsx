import {
  AdminUserDetails,
} from "@/features/admin-users/admin-user-details";

interface AdminUserDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function AdminUserDetailsPage({
  params,
}: AdminUserDetailsPageProps) {
  const { id } = await params;

  return (
    <AdminUserDetails
      userId={id}
    />
  );
}
