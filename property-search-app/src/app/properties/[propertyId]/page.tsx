import Link from "next/link";
import { notFound } from "next/navigation";

import { PropertyDetailView } from "@/components/property-search/property-detail-view";
import { getPropertySearchProvider } from "@/lib/data-sources/provider-registry";

export default async function PropertyDetailPage(props: PageProps<"/properties/[propertyId]">) {
  const { propertyId } = await props.params;
  const propertyWithLinks = await getPropertySearchProvider("mock").getProperty(propertyId);

  if (!propertyWithLinks) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#1e3a8a,_transparent_36%),linear-gradient(135deg,_#020617_0%,_#0f172a_52%,_#111827_100%)] px-6 py-10 text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <Link href="/search" className="inline-flex w-fit text-sm text-sky-200 underline-offset-4 hover:underline">
          Tilbage til søgeresultater
        </Link>
        <PropertyDetailView propertyWithLinks={propertyWithLinks} />
      </div>
    </main>
  );
}
