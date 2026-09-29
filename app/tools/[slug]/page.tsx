import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";
import { getToolContent } from "@/lib/tools/content";
import { constructToolMetadata } from "@/lib/seo/metadata";
import { generateToolJsonLd } from "@/lib/seo/jsonld";
import { JsonLd } from "@/components/seo/json-ld";
import ToolShell from "@/components/ToolShell";

import { ToolRenderer } from "@/components/tool/tool-loaders";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export async function generateStaticParams() {
  const tools = getAllTools();
  return tools.map((tool) => ({
    slug: tool.slug,
  }));
}

export async function generateMetadata({
  params,
}: ToolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tool = getToolBySlug(slug);
  // Unreachable in practice: dynamicParams is false, so unknown slugs 404.
  if (!tool) return { title: "Tool not found", robots: { index: false } };
  return constructToolMetadata(tool);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const content = getToolContent(tool.slug);
  // The BreadcrumbList is emitted by the visible trail in ToolShell.
  const { webAppSchema, faqSchema } = generateToolJsonLd(tool, content);

  return (
    <>
      <JsonLd data={[webAppSchema, faqSchema]} />

      <ToolShell tool={tool}>
        <ToolRenderer slug={tool.slug} />
      </ToolShell>
    </>
  );
}
