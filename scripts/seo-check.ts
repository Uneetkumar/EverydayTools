import { runSeoAudit } from "../lib/seo/validator";

const report = runSeoAudit();

console.log("=========================================");
console.log("        TABBENCH TECHNICAL SEO AUDIT      ");
console.log("=========================================");
console.log(`Domain:                 ${report.domain}`);
console.log(`Total Tools:            ${report.totalTools}`);
console.log(`Total Categories:       ${report.totalCategories}`);
console.log(`Total Guides:           ${report.totalGuides}`);
console.log(`Total Currency Pairs:   ${report.totalCurrencyPairs}`);
console.log(`Total Indexable URLs:   ${report.totalIndexableUrls}`);
console.log(`Audit Errors:           ${report.errorsCount}`);
console.log(`Audit Warnings:         ${report.warningsCount}`);
console.log("=========================================");

if (report.issues.length > 0) {
  console.log("\nIssues / Notes:");
  report.issues.forEach((iss) => {
    console.log(`[${iss.type.toUpperCase()}] [${iss.category}] ${iss.target}: ${iss.message}`);
  });
}

if (report.errorsCount === 0) {
  console.log("\n✅ ALL TECHNICAL SEO VALIDATION CHECKS PASSED!");
  process.exit(0);
} else {
  console.error("\n❌ SEO AUDIT FAILED WITH ERRORS!");
  process.exit(1);
}
