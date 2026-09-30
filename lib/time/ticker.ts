/**
 * A steady tick that keeps running in a background tab.
 *
 * Browsers slow `setInterval` on hidden pages to once a second, and after a
 * few minutes to once a minute, so a timer that only listens to the main
 * thread notices it is finished late. Timers in a Web Worker are not slowed
 * the same way, so the worker does the ticking and the page only reacts. If
 * workers are unavailable it quietly falls back to setInterval; the timers
 * that use this always compute elapsed time from timestamps, so a late tick
 * is delayed, never wrong.
 */
export function startTicker(callback: () => void, ms: number): () => void {
  try {
    const src = "let t;self.onmessage=(e)=>{clearInterval(t);if(e.data>0)t=setInterval(()=>self.postMessage(0),e.data);};";
    const url = URL.createObjectURL(new Blob([src], { type: "text/javascript" }));
    const worker = new Worker(url);
    URL.revokeObjectURL(url);
    worker.onmessage = () => callback();
    worker.onerror = () => undefined;
    worker.postMessage(ms);
    return () => {
      worker.postMessage(0);
      worker.terminate();
    };
  } catch {
    const id = setInterval(callback, ms);
    return () => clearInterval(id);
  }
}
