// Must be first — before zone.js loads
(window as any).__Zone_disable_customElements = true;
(window as any).__Zone_disable_requestAnimationFrame = true;
(window as any).__Zone_disable_on_property = true;

// Tell Zone.js not to patch ReadableStream
(window as any).__zone_symbol__UNPATCHED_EVENTS = ['readablestream'];


if (typeof (Promise as any).try !== 'function') {
  (Promise as any).try = function <T>(
    fn: () => T | Promise<T>
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      try {
        resolve(fn());
      } catch (err) {
        reject(err);
      }
    });
  };
}


// Fix Zone.js breaking ReadableStream for pdfjs-dist
const OriginalReadableStream = (window as any).ReadableStream;
if (OriginalReadableStream) {
  (window as any).ReadableStream = function(...args: any[]) {
    const stream = new OriginalReadableStream(...args);
    return stream;
  };
  Object.assign((window as any).ReadableStream, OriginalReadableStream);
  (window as any).ReadableStream.prototype = OriginalReadableStream.prototype;
}