import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";
import { getToolContent } from "@/lib/tools/content";
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

// PDF & image workspace tools
import SplitPdf from "@/components/tools/SplitPdf";
import PdfToJpg from "@/components/tools/PdfToJpg";
import RotatePdf from "@/components/tools/RotatePdf";
import AddPageNumbers from "@/components/tools/AddPageNumbers";
import ImageResizer from "@/components/tools/ImageResizer";
import FaviconGenerator from "@/components/tools/FaviconGenerator";
import CurrencyConverter from "@/components/tools/CurrencyConverter";
import SampleFileGenerator from "@/components/tools/SampleFileGenerator";
import NotePad from "@/components/tools/NotePad";
import TextToSpeech from "@/components/tools/TextToSpeech";
import SpeechToText from "@/components/tools/SpeechToText";
import VideoDownloader from "@/components/tools/VideoDownloader";

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
      title: "Tool Not Found | TabBench",
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

  const content = getToolContent(tool.slug);
  const { webAppSchema, breadcrumbSchema, faqSchema } = generateToolJsonLd(
    tool,
    content
  );

  const renderToolComponent = () => {
    switch (tool.slug) {
      case "image-compressor":
        return <ImageCompressor />;
      case "image-to-pdf":
        return <ImageToPdf />;
      case "pdf-to-word":
        return <PdfToWord />;
      case "png-to-jpg":
        return <PngToJpg initialMode="png_to_jpg" />;
      case "jpg-to-png":
        return <PngToJpg initialMode="jpg_to_png" />;
      case "image-to-webp":
        return <PngToJpg initialMode="img_to_webp" />;
      case "webp-to-jpg":
        return <PngToJpg initialMode="webp_to_jpg" />;
      case "watermark-remover":
        return <WatermarkRemover />;
      case "unlock-pdf":
        return <UnlockPdf />;
      case "crop-image":
        return <CropImage />;
      case "split-pdf":
        return <SplitPdf />;
      case "pdf-to-jpg":
        return <PdfToJpg />;
      case "rotate-pdf":
        return <RotatePdf />;
      case "add-page-numbers":
        return <AddPageNumbers />;
      case "image-resizer":
        return <ImageResizer />;
      case "favicon-generator":
        return <FaviconGenerator />;
      case "currency-converter":
        return <CurrencyConverter />;
      case "notepad":
        return <NotePad />;
      case "text-to-speech":
        return <TextToSpeech />;
      case "speech-to-text":
        return <SpeechToText />;
      case "sample-file-generator":
        return <SampleFileGenerator />;
      case "sample-image-generator":
        return <SampleFileGenerator allowedKinds={["image"]} />;
      case "sample-pdf-generator":
        return <SampleFileGenerator allowedKinds={["pdf"]} />;
      case "sample-video-generator":
        return <SampleFileGenerator allowedKinds={["video"]} />;
      case "sample-data-generator":
        return <SampleFileGenerator allowedKinds={["csv", "json", "text"]} />;
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
      case "video-downloader":
        return <VideoDownloader />;
      case "youtube-video-downloader":
        return <VideoDownloader platform="youtube" />;
      case "instagram-video-downloader":
        return <VideoDownloader platform="instagram" />;
      case "facebook-video-downloader":
        return <VideoDownloader platform="facebook" />;
      case "tiktok-video-downloader":
        return <VideoDownloader platform="tiktok" />;
      case "twitter-video-downloader":
        return <VideoDownloader platform="twitter" />;
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
