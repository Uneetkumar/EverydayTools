import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";
import { getToolContent } from "@/lib/tools/content";
import { constructToolMetadata } from "@/lib/seo/metadata";
import { generateToolJsonLd } from "@/lib/seo/jsonld";
import ToolShell from "@/components/ToolShell";

import dynamic from "next/dynamic";

const ToolLoading = () => (
  <div className="flex min-h-[280px] items-center justify-center rounded-2xl border border-slate-200/80 bg-white/50 p-8 dark:border-slate-800/80 dark:bg-slate-900/50">
    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span>Loading tool...</span>
    </div>
  </div>
);

// Interactive Tool Components (Dynamic lazy-loaded for maximum mobile performance)
const PercentageCalculator = dynamic(() => import("@/components/tools/PercentageCalculator"), { loading: ToolLoading });
const ProfitMarginCalculator = dynamic(() => import("@/components/tools/ProfitMarginCalculator"), { loading: ToolLoading });
const CaseConverter = dynamic(() => import("@/components/tools/CaseConverter"), { loading: ToolLoading });
const JsonFormatter = dynamic(() => import("@/components/tools/JsonFormatter"), { loading: ToolLoading });
const DateDifferenceCalculator = dynamic(() => import("@/components/tools/DateDifferenceCalculator"), { loading: ToolLoading });
const WordCounter = dynamic(() => import("@/components/tools/WordCounter"), { loading: ToolLoading });
const PasswordGenerator = dynamic(() => import("@/components/tools/PasswordGenerator"), { loading: ToolLoading });
const Base64Converter = dynamic(() => import("@/components/tools/Base64Converter"), { loading: ToolLoading });
const JwtDecoder = dynamic(() => import("@/components/tools/JwtDecoder"), { loading: ToolLoading });
const UuidGenerator = dynamic(() => import("@/components/tools/UuidGenerator"), { loading: ToolLoading });
const UrlEncoderDecoder = dynamic(() => import("@/components/tools/UrlEncoderDecoder"), { loading: ToolLoading });
const QrCodeGenerator = dynamic(() => import("@/components/tools/QrCodeGenerator"), { loading: ToolLoading });
const QrCodeScanner = dynamic(() => import("@/components/tools/QrCodeScanner"), { loading: ToolLoading });
const BarcodeGenerator = dynamic(() => import("@/components/tools/BarcodeGenerator"), { loading: ToolLoading });
const BarcodeScanner = dynamic(() => import("@/components/tools/BarcodeScanner"), { loading: ToolLoading });
const ImageCompressor = dynamic(() => import("@/components/tools/ImageCompressor"), { loading: ToolLoading });
const PdfMerge = dynamic(() => import("@/components/tools/PdfMerge"), { loading: ToolLoading });
const PdfCompressor = dynamic(() => import("@/components/tools/PdfCompressor"), { loading: ToolLoading });
const AgeCalculator = dynamic(() => import("@/components/tools/AgeCalculator"), { loading: ToolLoading });
const GstCalculator = dynamic(() => import("@/components/tools/GstCalculator"), { loading: ToolLoading });
const EmiCalculator = dynamic(() => import("@/components/tools/EmiCalculator"), { loading: ToolLoading });
const DiscountCalculator = dynamic(() => import("@/components/tools/DiscountCalculator"), { loading: ToolLoading });
const HashGenerator = dynamic(() => import("@/components/tools/HashGenerator"), { loading: ToolLoading });
const TextDiffChecker = dynamic(() => import("@/components/tools/TextDiffChecker"), { loading: ToolLoading });
const AiExplainer = dynamic(() => import("@/components/tools/AiExplainer"), { loading: ToolLoading });
const ImageToPdf = dynamic(() => import("@/components/tools/ImageToPdf"), { loading: ToolLoading });
const PdfToWord = dynamic(() => import("@/components/tools/PdfToWord"), { loading: ToolLoading });
const WatermarkRemover = dynamic(() => import("@/components/tools/WatermarkRemover"), { loading: ToolLoading });
const PngToJpg = dynamic(() => import("@/components/tools/PngToJpg"), { loading: ToolLoading });
const UnlockPdf = dynamic(() => import("@/components/tools/UnlockPdf"), { loading: ToolLoading });
const CropImage = dynamic(() => import("@/components/tools/CropImage"), { loading: ToolLoading });
const SplitPdf = dynamic(() => import("@/components/tools/SplitPdf"), { loading: ToolLoading });
const PdfToJpg = dynamic(() => import("@/components/tools/PdfToJpg"), { loading: ToolLoading });
const RotatePdf = dynamic(() => import("@/components/tools/RotatePdf"), { loading: ToolLoading });
const AddPageNumbers = dynamic(() => import("@/components/tools/AddPageNumbers"), { loading: ToolLoading });
const ImageResizer = dynamic(() => import("@/components/tools/ImageResizer"), { loading: ToolLoading });
const FaviconGenerator = dynamic(() => import("@/components/tools/FaviconGenerator"), { loading: ToolLoading });
const CurrencyConverter = dynamic(() => import("@/components/tools/CurrencyConverter"), { loading: ToolLoading });
const SampleFileGenerator = dynamic(() => import("@/components/tools/SampleFileGenerator"), { loading: ToolLoading });
const NotePad = dynamic(() => import("@/components/tools/NotePad"), { loading: ToolLoading });
const TextToSpeech = dynamic(() => import("@/components/tools/TextToSpeech"), { loading: ToolLoading });
const SpeechToText = dynamic(() => import("@/components/tools/SpeechToText"), { loading: ToolLoading });
const MediaPlayer = dynamic(() => import("@/components/tools/MediaPlayer"), { loading: ToolLoading });
const PdfEditor = dynamic(() => import("@/components/tools/PdfEditor"), { loading: ToolLoading });
const ImageToText = dynamic(() => import("@/components/tools/ImageToText"), { loading: ToolLoading });
const VideoCutter = dynamic(() => import("@/components/tools/VideoCutter"), { loading: ToolLoading });
const AudioRemover = dynamic(() => import("@/components/tools/AudioRemover"), { loading: ToolLoading });
const VideoDownloader = dynamic(() => import("@/components/tools/VideoDownloader"), { loading: ToolLoading });

// New Tool Suite Imports
const SipCalculator = dynamic(() => import("@/components/tools/SipCalculator"), { loading: ToolLoading });
const CompoundInterestCalculator = dynamic(() => import("@/components/tools/CompoundInterestCalculator"), { loading: ToolLoading });
const BmiCalculator = dynamic(() => import("@/components/tools/BmiCalculator"), { loading: ToolLoading });
const LoremIpsumGenerator = dynamic(() => import("@/components/tools/LoremIpsumGenerator"), { loading: ToolLoading });
const SlugGenerator = dynamic(() => import("@/components/tools/SlugGenerator"), { loading: ToolLoading });
const JsonCsvConverter = dynamic(() => import("@/components/tools/JsonCsvConverter"), { loading: ToolLoading });
const RegexTester = dynamic(() => import("@/components/tools/RegexTester"), { loading: ToolLoading });
const HtmlEntityConverter = dynamic(() => import("@/components/tools/HtmlEntityConverter"), { loading: ToolLoading });
const ColorConverter = dynamic(() => import("@/components/tools/ColorConverter"), { loading: ToolLoading });
const SalaryCalculator = dynamic(() => import("@/components/tools/SalaryCalculator"), { loading: ToolLoading });
const WorkingDaysCalculator = dynamic(() => import("@/components/tools/WorkingDaysCalculator"), { loading: ToolLoading });
const UnixTimestampConverter = dynamic(() => import("@/components/tools/UnixTimestampConverter"), { loading: ToolLoading });
const JsonToTypeScript = dynamic(() => import("@/components/tools/JsonToTypeScript"), { loading: ToolLoading });
const CronExplainer = dynamic(() => import("@/components/tools/CronExplainer"), { loading: ToolLoading });
const UtmBuilder = dynamic(() => import("@/components/tools/UtmBuilder"), { loading: ToolLoading });
const BreakEvenCalculator = dynamic(() => import("@/components/tools/BreakEvenCalculator"), { loading: ToolLoading });
const ContrastChecker = dynamic(() => import("@/components/tools/ContrastChecker"), { loading: ToolLoading });
const AspectRatioCalculator = dynamic(() => import("@/components/tools/AspectRatioCalculator"), { loading: ToolLoading });
const ExifViewer = dynamic(() => import("@/components/tools/ExifViewer"), { loading: ToolLoading });
const MarkdownTableGenerator = dynamic(() => import("@/components/tools/MarkdownTableGenerator"), { loading: ToolLoading });

// Phase 1 AI Tools
const AiTextSummarizer = dynamic(() => import("@/components/tools/AiTextSummarizer"), { loading: ToolLoading });
const AiTextRewriter = dynamic(() => import("@/components/tools/AiTextRewriter"), { loading: ToolLoading });
const AiTextSimplifier = dynamic(() => import("@/components/tools/AiTextSimplifier"), { loading: ToolLoading });
const AiKeywordExtractor = dynamic(() => import("@/components/tools/AiKeywordExtractor"), { loading: ToolLoading });
const AiJsonExplainer = dynamic(() => import("@/components/tools/AiJsonExplainer"), { loading: ToolLoading });

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
      case "video-player":
        return <MediaPlayer mode="video" />;
      case "audio-player":
        return <MediaPlayer mode="audio" />;
      case "video-cutter":
        return <VideoCutter />;
      case "audio-remover":
        return <AudioRemover />;
      case "image-to-text":
        return <ImageToText />;
      case "pdf-editor":
        return <PdfEditor />;
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
      case "qr-code-scanner":
        return <QrCodeScanner />;
      case "barcode-generator":
        return <BarcodeGenerator />;
      case "barcode-scanner":
        return <BarcodeScanner />;
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
      case "sip-calculator":
        return <SipCalculator />;
      case "compound-interest-calculator":
        return <CompoundInterestCalculator />;
      case "bmi-calculator":
        return <BmiCalculator />;
      case "lorem-ipsum-generator":
        return <LoremIpsumGenerator />;
      case "slug-generator":
        return <SlugGenerator />;
      case "json-to-csv":
        return <JsonCsvConverter />;
      case "regex-tester":
        return <RegexTester />;
      case "html-entity-converter":
        return <HtmlEntityConverter />;
      case "color-converter":
        return <ColorConverter />;
      case "salary-calculator":
        return <SalaryCalculator />;
      case "working-days-calculator":
        return <WorkingDaysCalculator />;
      case "unix-timestamp-converter":
        return <UnixTimestampConverter />;
      case "json-to-typescript":
        return <JsonToTypeScript />;
      case "cron-explainer":
        return <CronExplainer />;
      case "utm-builder":
        return <UtmBuilder />;
      case "break-even-calculator":
        return <BreakEvenCalculator />;
      case "contrast-checker":
        return <ContrastChecker />;
      case "aspect-ratio-calculator":
        return <AspectRatioCalculator />;
      case "exif-viewer":
        return <ExifViewer />;
      case "markdown-table-generator":
        return <MarkdownTableGenerator />;
      case "ai-text-summarizer":
        return <AiTextSummarizer />;
      case "ai-text-rewriter":
        return <AiTextRewriter />;
      case "ai-text-simplifier":
        return <AiTextSimplifier />;
      case "ai-keyword-extractor":
        return <AiKeywordExtractor />;
      case "ai-json-explainer":
        return <AiJsonExplainer />;
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
