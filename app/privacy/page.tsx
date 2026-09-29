import React from "react";
import Link from "next/link";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { ProsePage } from "@/components/layout/prose-page";
import ClearLocalData from "@/components/ClearLocalData";
import { getAllTools } from "@/lib/tools/registry";

export const metadata = constructPageMetadata({
  title: "Privacy Policy: What We Store and Never See",
  description: "Your files are processed in your browser and never uploaded. Read exactly what is saved on your own device, for how long, and how to erase it.",
  path: "/privacy",
});

export default function PrivacyPage() {

  const tools = getAllTools();
  const cloud = tools.filter((t) => t.privacy === "cloud-optional");

  return (
    <>
      <ProsePage
        path="/privacy"
        breadcrumb="Privacy Policy"
        title="Privacy Policy"
        updated="September 29, 2026"
        lead="Most TabBench tools never see your data: the file you open or the text you type is processed in your own browser. This page lists the exceptions, everything the site stores on your device, and what the analytics and advertising services receive."
      >
        <h2 id="processing">1. Your files and text</h2>
        <p>
          Calculators, converters, text tools, developer tools, and the image, PDF and media tools run in your web
          browser using JavaScript and WebAssembly. What you enter or open is processed on your device. It is not
          uploaded to TabBench, and we have no server that could receive it.
        </p>
        <p>These features are the exceptions, and each says so on its own page:</p>
        <ul>
          <li>
            <strong>Cloud AI mode ({cloud.length} tools).</strong> {cloud.map((t) => t.name).join(", ")} run on
            your device by default. If you switch to the cloud mode, the text or image you submit is sent to
            Google&apos;s Gemini service through Firebase to generate the result. To protect that service from
            abuse, Firebase App Check with Google reCAPTCHA Enterprise runs when cloud mode is used; reCAPTCHA
            collects hardware and software information and is subject to Google&apos;s{" "}
            <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">
              Privacy Policy
            </a>{" "}
            and{" "}
            <a href="https://policies.google.com/terms" rel="noopener noreferrer" target="_blank">
              Terms
            </a>
            .
          </li>
          <li>
            <strong>Currency converter.</strong> Fetches current exchange rates from public rate services
            (open.er-api.com, with api.frankfurter.dev as a fallback). The request names the base currency. The
            amounts you type are never sent.
          </li>
          <li>
            <strong>Speech to text.</strong> Uses your browser&apos;s built-in speech recognition. Some browsers,
            including Chrome, send the audio to the browser vendor&apos;s servers to transcribe it.
          </li>
        </ul>

        <h2 id="device">2. What is stored on your device</h2>
        <p>
          Some features save data in your own browser so the site remembers things between visits. It is written to
          your device and stays there; none of it is sent to us.
        </p>
        <ul>
          <li>
            <strong>Favorites</strong> — the tools you star, up to 50. Kept until you remove them.
          </li>
          <li>
            <strong>Recently used tools</strong> — the last eight tools you opened. Kept until you clear them.
          </li>
          <li>
            <strong>Recent searches</strong> — the last five things you searched for on TabBench, so you can repeat
            a search. They stay in your browser; analytics records only how long a search was, never its words.
          </li>
          <li>
            <strong>Saved tool inputs</strong> — some tools remember what you last entered so a refresh does not
            lose your work. These expire after three days.
          </li>
          <li>
            <strong>Recent output files</strong> — the last three files each tool produced for you, kept in your
            browser&apos;s IndexedDB so you can download them again. <strong>They are deleted automatically after
            seven days</strong>, and files over 25&nbsp;MB are never saved.
          </li>
          <li>
            <strong>Preferences</strong> — your light or dark theme, per-tool settings such as QR code options,
            notes you write in the notepad, cached exchange rates, and whether you dismissed the install prompt.
          </li>
        </ul>
        <p>
          The recent-files item is worth being explicit about: if you crop an identity document or split a bank
          statement, the resulting file sits in this browser&apos;s storage for up to a week. It is never uploaded,
          but it is on your disk. Every tool that saves files shows a &ldquo;Your recent files&rdquo; panel with a
          delete button for each file, and you can erase everything at once below.
        </p>

        <h2 id="analytics">3. Analytics</h2>
        <p>
          We use Google Analytics 4 (through Firebase) to understand which tools are used and where they fail. It
          collects page views, device and browser type, approximate location derived from your IP address, and these
          product events:
        </p>
        <ul>
          <li>which tool was opened, started, completed, or showed an error (as a fixed code);</li>
          <li>that a search was made, with the length of the query and the number of results — not the query;</li>
          <li>which search result or related tool was clicked, and favorites added or removed;</li>
          <li>downloads, recorded as the file type and a size range such as &ldquo;1–10 MB&rdquo;.</li>
        </ul>
        <p>
          Analytics never receives the text you type, the numbers you enter, file names, or file contents. The
          analytics code loads on your first interaction or a few seconds after the page opens, so it never delays a
          tool.
        </p>

        <h2 id="ads">4. Advertising and cookies</h2>
        <p>
          TabBench is free because it shows ads served by Google AdSense. Third-party vendors, including Google,
          use cookies to serve ads based on your prior visits to this website or other websites. Google&apos;s use
          of advertising cookies enables it and its partners to serve ads to you based on those visits.
        </p>
        <ul>
          <li>
            You can opt out of personalised advertising in{" "}
            <a href="https://adssettings.google.com" rel="noopener noreferrer" target="_blank">
              Google&apos;s Ads Settings
            </a>
            , or opt out of some third-party vendors&apos; cookies at{" "}
            <a href="https://www.aboutads.info/choices/" rel="noopener noreferrer" target="_blank">
              aboutads.info
            </a>
            .
          </li>
          <li>
            Where the law requires it — for example in the EEA, the UK and Switzerland — a consent message lets you
            choose whether cookies are used for personalised ads and measurement before they are set.
          </li>
          <li>
            Google explains how it uses information from sites like this one in{" "}
            <a
              href="https://policies.google.com/technologies/partner-sites"
              rel="noopener noreferrer"
              target="_blank"
            >
              How Google uses information from sites or apps that use its services
            </a>
            .
          </li>
        </ul>

        <h2 id="hosting">5. Hosting</h2>
        <p>
          The site is served by Firebase Hosting (Google). Like any web server, it receives the technical details
          of each request — your IP address, browser and the page requested — to deliver the page.
        </p>

        <h2 id="contact-messages">6. Messages you send us</h2>
        <p>
          The <Link href="/contact">contact page</Link> opens a pre-filled email in your own mail app. We receive
          only what you choose to send, and use it only to reply and to fix what you reported.
        </p>

        <h2 id="extension">7. The TabBench browser extension</h2>
        <p>
          The optional TabBench extension for Chrome and other Chromium browsers collects no data and sends
          nothing to us. It reads a page only when you use it:
        </p>
        <ul>
          <li>
            When you open its menu, the current page&apos;s address and title, to make a QR code or a clean link.
            These stay in the extension.
          </li>
          <li>
            When you right-click and choose a tool, the text, link or image you picked — or, for &ldquo;Summarise
            this page&rdquo;, the page&apos;s readable text. It is held in your browser&apos;s memory for a few
            seconds, handed to the tool on tabbench.com and deleted. It is never put in a web address.
          </li>
          <li>
            To read an image from another website, the extension asks for your permission for that site first. You
            can remove it at any time in the extension&apos;s settings.
          </li>
        </ul>
        <p>
          The extension stores your settings (theme, how tools open) and the tools you used recently, in your
          browser only. Tool pages it opens are ordinary TabBench pages, covered by the rest of this policy.
        </p>

        <h2 id="children">8. Children</h2>
        <p>TabBench is a general-audience site and is not directed at children under 13.</p>

        <h2 id="changes">9. Changes to this policy</h2>
        <p>
          When what the site collects changes, this page is updated and the date at the top changes with it.
        </p>

        <h2 id="erase">10. Erasing your local data</h2>
        <ClearLocalData />
      </ProsePage>
    </>
  );
}
