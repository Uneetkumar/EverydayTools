"use client";

import dynamic from "next/dynamic";
import { ToolErrorState, ToolLoadingState } from "./tool-states";

/**
 * slug → lazily loaded tool component.
 *
 * This map lives in a Client Component on purpose. It used to be a switch of
 * `next/dynamic` imports inside the server page, and Next cannot code-split
 * Client Components imported dynamically from a Server Component — every tool
 * page shipped the JavaScript for all 28 tool chunks (3.7 MB, ~1 MB gzipped).
 * From a Client Component each import() is a real split point, so a page
 * downloads only the tool it renders. Tools are still server-rendered.
 */
const loading = () => <ToolLoadingState />;

const ImageCompressor = dynamic(() => import("@/components/tools/ImageCompressor"), { loading });
const ImageToPdf = dynamic(() => import("@/components/tools/ImageToPdf"), { loading });
const PdfToWord = dynamic(() => import("@/components/tools/PdfToWord"), { loading });
const PngToJpg = dynamic(() => import("@/components/tools/PngToJpg"), { loading });
const WatermarkRemover = dynamic(() => import("@/components/tools/WatermarkRemover"), { loading });
const UnlockPdf = dynamic(() => import("@/components/tools/UnlockPdf"), { loading });
const CropImage = dynamic(() => import("@/components/tools/CropImage"), { loading });
const SplitPdf = dynamic(() => import("@/components/tools/SplitPdf"), { loading });
const PdfToJpg = dynamic(() => import("@/components/tools/PdfToJpg"), { loading });
const RotatePdf = dynamic(() => import("@/components/tools/RotatePdf"), { loading });
const AddPageNumbers = dynamic(() => import("@/components/tools/AddPageNumbers"), { loading });
const ImageResizer = dynamic(() => import("@/components/tools/ImageResizer"), { loading });
const FaviconGenerator = dynamic(() => import("@/components/tools/FaviconGenerator"), { loading });
const CurrencyConverter = dynamic(() => import("@/components/tools/CurrencyConverter"), { loading });
const MediaPlayer = dynamic(() => import("@/components/tools/MediaPlayer"), { loading });
const VideoCutter = dynamic(() => import("@/components/tools/VideoCutter"), { loading });
const AudioRemover = dynamic(() => import("@/components/tools/AudioRemover"), { loading });
const ImageToText = dynamic(() => import("@/components/tools/ImageToText"), { loading });
const PdfEditor = dynamic(() => import("@/components/tools/PdfEditor"), { loading });
const NotePad = dynamic(() => import("@/components/tools/NotePad"), { loading });
const TextToSpeech = dynamic(() => import("@/components/tools/TextToSpeech"), { loading });
const SpeechToText = dynamic(() => import("@/components/tools/SpeechToText"), { loading });
const SampleFileGenerator = dynamic(() => import("@/components/tools/SampleFileGenerator"), { loading });
const PercentageCalculator = dynamic(() => import("@/components/tools/PercentageCalculator"), { loading });
const ProfitMarginCalculator = dynamic(() => import("@/components/tools/ProfitMarginCalculator"), { loading });
const CaseConverter = dynamic(() => import("@/components/tools/CaseConverter"), { loading });
const JsonFormatter = dynamic(() => import("@/components/tools/JsonFormatter"), { loading });
const DateDifferenceCalculator = dynamic(() => import("@/components/tools/DateDifferenceCalculator"), { loading });
const WordCounter = dynamic(() => import("@/components/tools/WordCounter"), { loading });
const PasswordGenerator = dynamic(() => import("@/components/tools/PasswordGenerator"), { loading });
const Base64Converter = dynamic(() => import("@/components/tools/Base64Converter"), { loading });
const JwtDecoder = dynamic(() => import("@/components/tools/JwtDecoder"), { loading });
const UuidGenerator = dynamic(() => import("@/components/tools/UuidGenerator"), { loading });
const UrlEncoderDecoder = dynamic(() => import("@/components/tools/UrlEncoderDecoder"), { loading });
const QrCodeGenerator = dynamic(() => import("@/components/tools/QrCodeGenerator"), { loading });
const QrCodeScanner = dynamic(() => import("@/components/tools/QrCodeScanner"), { loading });
const BarcodeGenerator = dynamic(() => import("@/components/tools/BarcodeGenerator"), { loading });
const BarcodeScanner = dynamic(() => import("@/components/tools/BarcodeScanner"), { loading });
const PdfMerge = dynamic(() => import("@/components/tools/PdfMerge"), { loading });
const PdfCompressor = dynamic(() => import("@/components/tools/PdfCompressor"), { loading });
const AgeCalculator = dynamic(() => import("@/components/tools/AgeCalculator"), { loading });
const GstCalculator = dynamic(() => import("@/components/tools/GstCalculator"), { loading });
const EmiCalculator = dynamic(() => import("@/components/tools/EmiCalculator"), { loading });
const DiscountCalculator = dynamic(() => import("@/components/tools/DiscountCalculator"), { loading });
const HashGenerator = dynamic(() => import("@/components/tools/HashGenerator"), { loading });
const TextDiffChecker = dynamic(() => import("@/components/tools/TextDiffChecker"), { loading });
const AiExplainer = dynamic(() => import("@/components/tools/AiExplainer"), { loading });
const SipCalculator = dynamic(() => import("@/components/tools/SipCalculator"), { loading });
const CompoundInterestCalculator = dynamic(() => import("@/components/tools/CompoundInterestCalculator"), { loading });
const BmiCalculator = dynamic(() => import("@/components/tools/BmiCalculator"), { loading });
const LoremIpsumGenerator = dynamic(() => import("@/components/tools/LoremIpsumGenerator"), { loading });
const SlugGenerator = dynamic(() => import("@/components/tools/SlugGenerator"), { loading });
const JsonCsvConverter = dynamic(() => import("@/components/tools/JsonCsvConverter"), { loading });
const RegexTester = dynamic(() => import("@/components/tools/RegexTester"), { loading });
const HtmlEntityConverter = dynamic(() => import("@/components/tools/HtmlEntityConverter"), { loading });
const ColorConverter = dynamic(() => import("@/components/tools/ColorConverter"), { loading });
const SalaryCalculator = dynamic(() => import("@/components/tools/SalaryCalculator"), { loading });
const WorkingDaysCalculator = dynamic(() => import("@/components/tools/WorkingDaysCalculator"), { loading });
const UnixTimestampConverter = dynamic(() => import("@/components/tools/UnixTimestampConverter"), { loading });
const JsonToTypeScript = dynamic(() => import("@/components/tools/JsonToTypeScript"), { loading });
const CronExplainer = dynamic(() => import("@/components/tools/CronExplainer"), { loading });
const UtmBuilder = dynamic(() => import("@/components/tools/UtmBuilder"), { loading });
const BreakEvenCalculator = dynamic(() => import("@/components/tools/BreakEvenCalculator"), { loading });
const ContrastChecker = dynamic(() => import("@/components/tools/ContrastChecker"), { loading });
const AspectRatioCalculator = dynamic(() => import("@/components/tools/AspectRatioCalculator"), { loading });
const ExifViewer = dynamic(() => import("@/components/tools/ExifViewer"), { loading });
const MarkdownTableGenerator = dynamic(() => import("@/components/tools/MarkdownTableGenerator"), { loading });
const AiTextSummarizer = dynamic(() => import("@/components/tools/AiTextSummarizer"), { loading });
const AiTextRewriter = dynamic(() => import("@/components/tools/AiTextRewriter"), { loading });
const AiTextSimplifier = dynamic(() => import("@/components/tools/AiTextSimplifier"), { loading });
const AiKeywordExtractor = dynamic(() => import("@/components/tools/AiKeywordExtractor"), { loading });
const AiJsonExplainer = dynamic(() => import("@/components/tools/AiJsonExplainer"), { loading });
const Calculator = dynamic(() => import("@/components/tools/Calculator"), { loading });
const UnitConverter = dynamic(() => import("@/components/tools/UnitConverter"), { loading });
const StopwatchTimer = dynamic(() => import("@/components/tools/StopwatchTimer"), { loading });
const TextSorter = dynamic(() => import("@/components/tools/TextSorter"), { loading });
const PngToSvg = dynamic(() => import("@/components/tools/PngToSvg"), { loading });

export function ToolRenderer({ slug }: { slug: string }) {
  switch (slug) {
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
    case "calculator":
      return <Calculator />;
    case "unit-converter":
      return <UnitConverter />;
    case "stopwatch-timer":
      return <StopwatchTimer />;
    case "text-sorter":
      return <TextSorter />;
    case "png-to-svg":
      return <PngToSvg />;
    default:
      // A registry entry with no loader. Previously this fell through to the
      // Percentage Calculator, silently rendering the wrong tool.
      return (
        <ToolErrorState
          title="This tool could not be loaded"
          description="Reload the page, or pick another tool from the menu."
        />
      );
  }
}
