import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProjectionFeed } from "@/lib/actions/socialPortal";
import { ProjectionViewer } from "@/components/social/ProjectionViewer";

export default async function SocialProjectionPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const event = await prisma.event.findUnique({ where: { socialToken: token }, select: { id: true, title: true } });
  if (!event) {
    notFound();
  }

  const items = await getProjectionFeed(token);

  return <ProjectionViewer token={token} eventTitle={event.title} initialItems={items} />;
}
