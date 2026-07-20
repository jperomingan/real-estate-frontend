import Link from "next/link";

import { PropertiesList } from "@/features/properties/properties-list";

export default function PropertiesPage() {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/dashboard/properties/new"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Add Property
        </Link>
      </div>

      <PropertiesList />
    </div>
  );
}
