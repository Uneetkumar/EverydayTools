import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";
import { constructToolMetadata } from "@/lib/seo/metadata";
import { generateToolJsonLd } from "@/lib/seo/jsonld";
import ToolShell from "@/components/ToolShell";

// Interactive Tool Components
import PercentageCalculator from "@/components/tools/PercentageCalculator";
import ProfitMarginCalculator from "@/components/tools/ProfitMarginCalculator";
import CaseConverter from "@/components/tools/CaseConverter";
import JsonFormatter from "@/components/tools/JsonFormatter";
import DateDifferenceCalculator from "@/components/tools/DateDifferenceCalculator";
import WordCounter from "@/components/tools/WordCounter";
import PasswordGenerator from "@/components/tools/PasswordGenerator";
import Base64Converter from "@/components/tools/Base64Converter";
import JwtDecoder from "@/components/tools/JwtDecoder";
import UuidGenerator from "@/components/tools/UuidGenerator";
import UrlEncoderDecoder from "@/components/tools/UrlEncoderDecoder";
import QrCodeGenerator from "@/components/tools/QrCodeGenerator";
import ImageCompressor from "@/components/tools/ImageCompressor";
import PdfMerge from "@/components/tools/PdfMerge";
import PdfCompressor from "@/components/tools/PdfCompressor";
import AgeCalculator from "@/components/tools/AgeCalculator";
import GstCalculator from "@/components/tools/GstCalculator";
import EmiCalculator from "@/components/tools/EmiCalculator";
import DiscountCalculator from "@/components/tools/DiscountCalculator";
import HashGenerator from "@/components/tools/HashGenerator";
import TextDiffChecker from "@/components/tools/TextDiffChecker";
import AiExplainer from "@/components/tools/AiExplainer";

// New High Priority Tools
import ImageToPdf from "@/components/tools/ImageToPdf";
import PdfToWord from "@/components/tools/PdfToWord";
import WatermarkRemover from "@/components/tools/WatermarkRemover";
import PngToJpg from "@/components/tools/PngToJpg";
import UnlockPdf from "@/components/tools/UnlockPdf";
import CropImage from "@/components/tools/CropImage";

interface ToolPageProps {
  params: Promise<{ slug: string }>;
}

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
  if (!tool) {
    return {
      title: "Tool Not Found | EverydayTools",
    };
  }
  return constructToolMetadata(tool);
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const { webAppSchema, breadcrumbSchema, faqSchema } = generateToolJsonLd(tool);

  const renderToolComponent = () => {
    switch (tool.slug) {
      case "image-compressor":
        return <ImageCompressor />;
      case "image-to-pdf":
        return <ImageToPdf />;
      case "pdf-to-word":
        return <PdfToWord />;
      case "watermark-remover":
        return <WatermarkRemover />;
      case "png-to-jpg":
        return <PngToJpg />;
      case "unlock-pdf":
        return <UnlockPdf />;
      case "crop-image":
        return <CropImage />;
      case "percentage-calculator":
        return <PercentageCalculator />;
      case "profit-margin-calculator":
        return <ProfitMarginCalculator />;
      case "case-converter":
        return <CaseConverter />;
      case "json-formatter":
        return <JsonFormatter />;
      case "date-difference-calculator":
        return <DateDifferenceCalculator />;
      case "word-counter":
        return <WordCounter />;
      case "password-generator":
        return <PasswordGenerator />;
      case "base64-converter":
        return <Base64Converter />;
      case "jwt-decoder":
        return <JwtDecoder />;
      case "uuid-generator":
        return <UuidGenerator />;
      case "url-encoder-decoder":
        return <UrlEncoderDecoder />;
      case "qr-code-generator":
        return <QrCodeGenerator />;
      case "pdf-merge":
        return <PdfMerge />;
      case "pdf-compressor":
        return <PdfCompressor />;
      case "age-calculator":
        return <AgeCalculator />;
      case "gst-calculator":
        return <GstCalculator />;
      case "emi-calculator":
        return <EmiCalculator />;
      case "discount-calculator":
        return <DiscountCalculator />;
      case "hash-generator":
        return <HashGenerator />;
      case "text-diff-checker":
        return <TextDiffChecker />;
      case "ai-explainer":
        return <AiExplainer />;
      default:
        return <PercentageCalculator />;
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}

      <ToolShell tool={tool}>{renderToolComponent()}</ToolShell>
    </>
  );
}
