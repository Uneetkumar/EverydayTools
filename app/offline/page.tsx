import React from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import { InstallAppButton } from "@/components/layout/install-app-button";
import { OfflineFrom } from "@/components/offline/offline-from";
import { OfflineManager } from "@/components/offline/offline-manager";
import { constructPageMetadata } from "@/lib/seo/metadata";
import { TOOL_CATEGORIES, getAllTools } from "@/lib/tools/registry";

export const metadata = constructPageMetadata({
  title: "Use TabBench Offline – Tools That Work Without Internet",
  description:
    "Save TabBench's tools on your phone or computer and use them with no connection: PDF, image, text, developer and calculator tools that run on your device.",
  path: "/offline",
});

/** Why each network tool needs a connection, in a phrase. */
const NEEDS_NETWORK: Record<string, string> = {
  "internet-speed-test": "it measures your connection",
  "currency-converter": "exchange rates come from the internet (offline, it shows the last rates it saved, with their date)",
  "api-request-builder": "it sends requests to the APIs you test",
  "speech-to-text": "most browsers recognise speech on a server",
};

export default function OfflinePage() {
  const tools = getAllTools();
  const names = Object.fromEntries(tools.map((t) => [t.slug, t.name]));
  const network = tools.filter((t) => t.privacy === "network");
  const cloud = tools.filter((t) => t.privacy === "cloud-optional");
  const local = tools.filter((t) => t.privacy !== "network");

  return (
    <div className="page-container py-8 md:py-12">
      <Breadcrumbs items={[{ name: "Use offline", url: "/offline" }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="type-h1 text-foreground">Use TabBench offline</h1>
        <p className="mt-4 type-body text-muted-foreground md:text-lg">
          Save the tools on your phone or computer and they keep working with no connection: on a plane, underground, or wherever the signal drops. {local.length} of the {tools.length} tools work without a connection.
        </p>
      </header>

      <div className="mt-8 max-w-3xl">
        <OfflineFrom names={names} />
        <div className="mt-6">
          <OfflineManager toolNames={names} />
        </div>
      </div>

      <div className="prose-body mt-12 max-w-3xl">
        <h2 id="how">How it works</h2>
        <ul>
          <li>Every tool page you open is saved on this device as you use it, so the tools you use most already work offline.</li>
          <li>Saving everything above makes every tool ready, including ones you have not opened yet.</li>
          <li>When TabBench is updated, your saved copy is refreshed the next time you are online. Only what changed is downloaded.</li>
          <li>Your notes, history and settings are kept in your browser, online or not.</li>
        </ul>

        <h2 id="phone">On your phone</h2>
        <p>
          Add TabBench to your home screen so it opens like an app, full screen and without the browser bar. On iPhone and iPad this matters more: Safari can clear saved site data after about a week without a visit, but keeps it for sites added to the Home Screen.
        </p>
        <div className="my-4">
          <InstallAppButton />
        </div>

        <h2 id="needs-internet">Tools that need a connection</h2>
        <ul>
          {network.map((t) => (
            <li key={t.slug}>
              <Link href={`/tools/${t.slug}`}>{t.name}</Link>: {NEEDS_NETWORK[t.slug] ?? "it uses an online service"}.
            </li>
          ))}
        </ul>
        <p>
          The AI tools ({cloud.map((t) => t.name).join(", ")}) work offline in their on-device mode. Only their optional cloud AI mode needs a connection.
        </p>

        <h2 id="works-offline">Tools that work offline</h2>
        {TOOL_CATEGORIES.map((c) => {
          const list = local.filter((t) => t.category === c.id);
          if (list.length === 0) return null;
          return (
            <React.Fragment key={c.id}>
              <h3>{c.name}</h3>
              <p>
                {list.map((t, i) => (
                  <React.Fragment key={t.slug}>
                    {i > 0 && " · "}
                    <Link href={`/tools/${t.slug}`}>{t.name}</Link>
                  </React.Fragment>
                ))}
              </p>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
