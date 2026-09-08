import { ADSTERRA } from "@/config/ads";

/**
 * Fixed-size Adsterra iframe banner.
 * Rendered inside a sandboxed iframe so the network's document.write is isolated.
 */
const AdsterraIframe = ({ className = "" }: { className?: string }) => {
  const { key, width, height, invokeSrc } = ADSTERRA.iframe;
  if (!key || !invokeSrc) return null;

  const srcDoc = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;overflow:hidden;background:transparent}</style></head><body>
<script type="text/javascript">
  atOptions = { 'key': '${key}', 'format': 'iframe', 'height': ${height}, 'width': ${width}, 'params': {} };
<\/script>
<script type="text/javascript" src="${invokeSrc}"><\/script>
</body></html>`;

  return (
    <div className={`w-full flex flex-col items-center ${className}`}>
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 text-center mb-1">
        Advertisement
      </p>
      <iframe
        title="Sponsored"
        srcDoc={srcDoc}
        width={width}
        height={height}
        scrolling="no"
        style={{ border: 0, width, height }}
        sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox allow-same-origin"
      />
    </div>
  );
};

export default AdsterraIframe;
