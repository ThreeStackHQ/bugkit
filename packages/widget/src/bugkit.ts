/**
 * BugKit Reporter Widget
 * Vanilla JS (<10KB gzipped)
 * Usage: BugKit.init({ projectId, apiKey, position, color })
 */

// ─── Types ────────────────────────────────────────────────────────────────────

interface BugKitConfig {
  projectId: string;
  apiKey: string;
  position?: "bottom-right" | "bottom-left";
  color?: string;
  endpoint?: string;
}

interface ConsoleEntry {
  level: string;
  message: string;
  timestamp: number;
}

interface DrawRect {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
}

interface DrawArrow {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

type Tool = "rectangle" | "arrow" | "blur";

// ─── State ────────────────────────────────────────────────────────────────────

const MAX_LOGS = 50;
const consoleLogs: ConsoleEntry[] = [];

let cfg: BugKitConfig | null = null;

// ─── Console capture ──────────────────────────────────────────────────────────

function patchConsole(): void {
  const levels = ["log", "warn", "error", "info", "debug"] as const;
  for (const level of levels) {
    const original = console[level].bind(console);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (console as any)[level] = (...args: unknown[]): void => {
      consoleLogs.push({
        level,
        message: args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "),
        timestamp: Date.now(),
      });
      if (consoleLogs.length > MAX_LOGS) consoleLogs.shift();
      original(...args);
    };
  }
}

// ─── Auto-capture errors ──────────────────────────────────────────────────────

function setupErrorCapture(): void {
  window.addEventListener("error", (e) => {
    consoleLogs.push({ level: "error", message: `Uncaught: ${e.message}`, timestamp: Date.now() });
    if (consoleLogs.length > MAX_LOGS) consoleLogs.shift();
  });
  window.addEventListener("unhandledrejection", (e) => {
    consoleLogs.push({ level: "error", message: `UnhandledRejection: ${String(e.reason)}`, timestamp: Date.now() });
    if (consoleLogs.length > MAX_LOGS) consoleLogs.shift();
  });
}

// ─── html2canvas loader ───────────────────────────────────────────────────────

declare const html2canvas: (el: HTMLElement) => Promise<HTMLCanvasElement>;

function loadHtml2Canvas(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof html2canvas !== "undefined") { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

// ─── Drawing overlay ──────────────────────────────────────────────────────────

function showDrawingOverlay(
  screenshot: HTMLCanvasElement,
  onDone: (canvas: HTMLCanvasElement) => void,
  onCancel: () => void
): void {
  const W = screenshot.width;
  const H = screenshot.height;

  // Overlay container
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed", inset: "0", zIndex: "2147483646",
    display: "flex", flexDirection: "column",
    background: "#000",
  });

  // Toolbar
  const toolbar = document.createElement("div");
  Object.assign(toolbar.style, {
    display: "flex", gap: "8px", padding: "8px 12px",
    background: "#1e1e1e", alignItems: "center",
  });

  let activeTool: Tool = "rectangle";

  const makeBtn = (label: string, tool: Tool): HTMLButtonElement => {
    const btn = document.createElement("button");
    btn.textContent = label;
    Object.assign(btn.style, {
      padding: "4px 10px", borderRadius: "4px", border: "none",
      cursor: "pointer", fontSize: "13px", fontFamily: "sans-serif",
      background: tool === activeTool ? "#ef4444" : "#333", color: "#fff",
    });
    btn.addEventListener("click", () => {
      activeTool = tool;
      [rectBtn, arrowBtn, blurBtn].forEach((b) => { b.style.background = "#333"; });
      btn.style.background = "#ef4444";
    });
    return btn;
  };

  const rectBtn = makeBtn("▭ Rect", "rectangle");
  const arrowBtn = makeBtn("→ Arrow", "arrow");
  const blurBtn = makeBtn("⬜ Blur", "blur");

  const doneBtn = document.createElement("button");
  doneBtn.textContent = "✓ Done";
  Object.assign(doneBtn.style, {
    marginLeft: "auto", padding: "4px 12px", borderRadius: "4px", border: "none",
    cursor: "pointer", fontSize: "13px", fontFamily: "sans-serif",
    background: "#22c55e", color: "#fff",
  });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "✕ Cancel";
  Object.assign(cancelBtn.style, {
    padding: "4px 10px", borderRadius: "4px", border: "none",
    cursor: "pointer", fontSize: "13px", fontFamily: "sans-serif",
    background: "#555", color: "#fff",
  });

  toolbar.append(rectBtn, arrowBtn, blurBtn, doneBtn, cancelBtn);

  // Canvas area
  const wrap = document.createElement("div");
  Object.assign(wrap.style, {
    flex: "1", overflow: "auto", display: "flex",
    justifyContent: "center", alignItems: "center",
  });

  const canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(screenshot, 0, 0);
  Object.assign(canvas.style, { cursor: "crosshair", display: "block" });

  wrap.appendChild(canvas);
  overlay.append(toolbar, wrap);
  document.body.appendChild(overlay);

  // Drawing logic
  let drawing = false;
  let startX = 0; let startY = 0;
  let snapshot: ImageData | null = null;

  const getPos = (e: MouseEvent): [number, number] => {
    const r = canvas.getBoundingClientRect();
    const scaleX = W / r.width;
    const scaleY = H / r.height;
    return [(e.clientX - r.left) * scaleX, (e.clientY - r.top) * scaleY];
  };

  canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    [startX, startY] = getPos(e);
    snapshot = ctx.getImageData(0, 0, W, H);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing || !snapshot) return;
    const [cx, cy] = getPos(e);
    ctx.putImageData(snapshot, 0, 0);

    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 3;

    if (activeTool === "rectangle") {
      ctx.strokeRect(startX, startY, cx - startX, cy - startY);
    } else if (activeTool === "arrow") {
      drawArrowOnCtx(ctx, startX, startY, cx, cy, "#ef4444");
    } else if (activeTool === "blur") {
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(startX, startY, cx - startX, cy - startY);
      ctx.setLineDash([]);
    }
  });

  canvas.addEventListener("mouseup", (e) => {
    if (!drawing) return;
    drawing = false;
    const [cx, cy] = getPos(e);

    if (activeTool === "blur") {
      // Pixelate the region
      const x = Math.min(startX, cx);
      const y = Math.min(startY, cy);
      const w = Math.abs(cx - startX);
      const h = Math.abs(cy - startY);
      if (w > 4 && h > 4) pixelate(ctx, x, y, w, h);
    }
    snapshot = null;
  });

  doneBtn.addEventListener("click", () => { document.body.removeChild(overlay); onDone(canvas); });
  cancelBtn.addEventListener("click", () => { document.body.removeChild(overlay); onCancel(); });
}

function drawArrowOnCtx(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  color: string
): void {
  const headLen = 16;
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}

function pixelate(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number
): void {
  const pixSize = 12;
  const data = ctx.getImageData(x, y, w, h);
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = w; tempCanvas.height = h;
  const tc = tempCanvas.getContext("2d")!;
  tc.putImageData(data, 0, 0);

  // Scale down then up = pixelate effect
  const smW = Math.max(1, Math.floor(w / pixSize));
  const smH = Math.max(1, Math.floor(h / pixSize));
  tc.drawImage(tempCanvas, 0, 0, smW, smH);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, smW, smH, x, y, w, h);
  ctx.imageSmoothingEnabled = true;
}

// ─── Submit modal ─────────────────────────────────────────────────────────────

function showSubmitModal(
  canvas: HTMLCanvasElement,
  onSubmit: (title: string, description: string) => void,
  onCancel: () => void
): void {
  const modal = document.createElement("div");
  Object.assign(modal.style, {
    position: "fixed", inset: "0", zIndex: "2147483647",
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.6)",
  });

  const card = document.createElement("div");
  Object.assign(card.style, {
    background: "#1e1e1e", color: "#fff", borderRadius: "8px",
    padding: "24px", width: "360px", fontFamily: "sans-serif",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
  });

  const h2 = document.createElement("h2");
  h2.textContent = "Submit Bug Report";
  Object.assign(h2.style, { margin: "0 0 16px", fontSize: "18px" });

  const mkInput = (placeholder: string, tag: "input" | "textarea" = "input"): HTMLInputElement | HTMLTextAreaElement => {
    const el = document.createElement(tag) as HTMLInputElement | HTMLTextAreaElement;
    el.placeholder = placeholder;
    Object.assign(el.style, {
      width: "100%", boxSizing: "border-box", padding: "8px 10px",
      background: "#2a2a2a", border: "1px solid #444", color: "#fff",
      borderRadius: "4px", fontSize: "14px", fontFamily: "sans-serif",
      marginBottom: "12px", display: "block",
    });
    if (tag === "textarea") (el as HTMLTextAreaElement).rows = 4;
    return el;
  };

  const titleInput = mkInput("Title (optional)") as HTMLInputElement;
  const descInput = mkInput("Description (optional)", "textarea") as HTMLTextAreaElement;

  const previewImg = document.createElement("img");
  previewImg.src = canvas.toDataURL("image/png");
  Object.assign(previewImg.style, {
    width: "100%", borderRadius: "4px", marginBottom: "12px",
    maxHeight: "160px", objectFit: "contain",
  });

  const row = document.createElement("div");
  Object.assign(row.style, { display: "flex", gap: "8px", justifyContent: "flex-end" });

  const cancelBtn = document.createElement("button");
  cancelBtn.textContent = "Cancel";
  Object.assign(cancelBtn.style, {
    padding: "8px 16px", borderRadius: "4px", border: "none",
    cursor: "pointer", background: "#444", color: "#fff", fontSize: "14px",
  });

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Submit";
  Object.assign(submitBtn.style, {
    padding: "8px 16px", borderRadius: "4px", border: "none",
    cursor: "pointer", background: "#ef4444", color: "#fff", fontSize: "14px", fontWeight: "bold",
  });

  row.append(cancelBtn, submitBtn);
  card.append(h2, previewImg, titleInput, descInput, row);
  modal.appendChild(card);
  document.body.appendChild(modal);

  submitBtn.addEventListener("click", () => {
    submitBtn.textContent = "Sending…";
    submitBtn.disabled = true;
    onSubmit(titleInput.value, descInput.value);
    document.body.removeChild(modal);
  });
  cancelBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
    onCancel();
  });
}

// ─── Submit to API ────────────────────────────────────────────────────────────

async function submitReport(
  canvas: HTMLCanvasElement,
  title: string,
  _description: string
): Promise<void> {
  if (!cfg) return;

  const screenshot = canvas.toDataURL("image/png");
  const endpoint = (cfg.endpoint ?? "") || "/api/reports";

  const body = JSON.stringify({
    project_id: cfg.projectId,
    screenshot,
    console_logs: consoleLogs.slice(-50),
    url: window.location.href,
    user_agent: navigator.userAgent,
    title: title || undefined,
    metadata: { description: _description || undefined },
  });

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cfg.apiKey) headers["Authorization"] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(endpoint, { method: "POST", headers, body });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`BugKit API error ${res.status}: ${err}`);
  }
}

// ─── Floating button ──────────────────────────────────────────────────────────

function createTriggerButton(config: BugKitConfig): void {
  const color = config.color ?? "#ef4444";
  const pos = config.position ?? "bottom-right";

  const btn = document.createElement("button");
  btn.textContent = "Report Bug";
  btn.setAttribute("data-bugkit-trigger", "true");
  Object.assign(btn.style, {
    position: "fixed",
    bottom: "20px",
    [pos === "bottom-right" ? "right" : "left"]: "20px",
    background: color,
    color: "#fff",
    border: "none",
    borderRadius: "24px",
    padding: "10px 18px",
    fontSize: "14px",
    fontFamily: "sans-serif",
    fontWeight: "600",
    cursor: "pointer",
    zIndex: "2147483645",
    boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    transition: "transform 0.15s",
  });

  btn.addEventListener("mouseenter", () => { btn.style.transform = "scale(1.05)"; });
  btn.addEventListener("mouseleave", () => { btn.style.transform = "scale(1)"; });

  btn.addEventListener("click", async () => {
    btn.disabled = true;
    btn.textContent = "Loading…";

    try {
      await loadHtml2Canvas();
      const screenshot = await html2canvas(document.body);

      showDrawingOverlay(
        screenshot,
        (annotated) => {
          showSubmitModal(
            annotated,
            async (title, description) => {
              try {
                await submitReport(annotated, title, description);
                showToast("Bug report submitted! ✓", color);
              } catch (e) {
                showToast("Failed to submit report.", "#ef4444");
                console.error("[BugKit]", e);
              }
            },
            () => { /* cancelled */ }
          );
        },
        () => { /* cancelled drawing */ }
      );
    } catch (e) {
      showToast("Screenshot failed.", "#ef4444");
      console.error("[BugKit]", e);
    } finally {
      btn.disabled = false;
      btn.textContent = "Report Bug";
    }
  });

  document.body.appendChild(btn);
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(message: string, _color: string): void {
  const toast = document.createElement("div");
  Object.assign(toast.style, {
    position: "fixed", bottom: "72px", right: "20px",
    background: "#1e1e1e", color: "#fff", padding: "10px 16px",
    borderRadius: "6px", fontSize: "14px", fontFamily: "sans-serif",
    zIndex: "2147483646", boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    transition: "opacity 0.3s",
  });
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; }, 2500);
  setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 3000);
}

// ─── Public API ───────────────────────────────────────────────────────────────

function init(config: BugKitConfig): void {
  cfg = config;
  patchConsole();
  setupErrorCapture();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => createTriggerButton(config));
  } else {
    createTriggerButton(config);
  }
}

export const BugKit = { init };

// Auto-expose global
if (typeof window !== "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).BugKit = BugKit;
}
