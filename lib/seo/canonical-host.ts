/**
 * Inline guard that keeps only tabbench.com indexable.
 *
 * Firebase Hosting always serves a project on BOTH `<project>.web.app` and
 * `<project>.firebaseapp.com`, and neither can be switched off. Both were
 * returning 200 with `<meta name="robots" content="index, follow">`, so the
 * whole site was reachable — and indexable — on three hostnames.
 *
 * Why this is client-side: `firebase.json` redirects match on *path*, not host,
 * and with `output: "export"` there is no server to branch on the Host header.
 * A Cloud Function rewrite could do it, but routing every request through a
 * function to fix a canonicalisation issue is a bad trade.
 *
 * Why NOT robots.txt `Disallow` on the duplicate: blocking crawl prevents Google
 * from ever seeing the canonical or the noindex, which strands whatever is
 * already indexed. Disallow is the wrong tool for removing pages.
 *
 * Order matters. `noindex` is applied BEFORE the redirect so a crawler that
 * renders the page but does not follow a JS navigation still gets the signal.
 * `follow` is kept so link equity flows on to the canonical host instead of
 * being stranded on a dead end.
 *
 * SAFETY — this is the part worth being careful about. The test is a *suffix*
 * match on the two Firebase domains, so it cannot fire on `tabbench.com`,
 * `localhost`, or a preview IP. A hostname check that is wrong in this
 * direction is harmless; wrong in the other direction it would deindex
 * production, which is exactly the failure mode of the "add noindex" advice
 * that circulates for this problem.
 */
export const CANONICAL_HOST = "https://tabbench.com";

export const CANONICAL_HOST_SCRIPT = [
  "(function(){try{",
  "var h=location.hostname;",
  "if(!/\\.web\\.app$|\\.firebaseapp\\.com$/.test(h))return;",
  'var m=document.querySelector(\'meta[name="robots"]\');',
  "if(!m){m=document.createElement('meta');m.setAttribute('name','robots');document.head.appendChild(m);}",
  "m.setAttribute('content','noindex, follow');",
  "location.replace('" + CANONICAL_HOST + "'+location.pathname+location.search+location.hash);",
  "}catch(e){}})();",
].join("");
