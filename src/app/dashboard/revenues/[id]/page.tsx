import {
  RevenueDetails,
} from "@/features/revenues/revenue-details";

interface RevenueDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function RevenueDetailsPage({
  params,
}: RevenueDetailsPageProps) {
  const { id } = await params;

  return (
    <RevenueDetails
      revenueId={id}
    />
  );
}
