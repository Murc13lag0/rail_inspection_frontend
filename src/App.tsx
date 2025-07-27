import { createSignal, onCleanup } from "solid-js";

export default function App() {
  const [file, setFile] = createSignal<File | null>(null);
  const [result, setResult] = createSignal<any>(null);
  const [preview, setPreview] = createSignal<string>("");
  const [error, setError] = createSignal<string>("");

  let canvasRef: HTMLCanvasElement | undefined;
  const CLASS_NAMES = ["Defective", "Non‑Defective"];
  const upload = async () => {
    if (!file()) return setError("No file selected");
    setError("");
    const form = new FormData();
    form.append("file", file()!);
    const res = await fetch("http://localhost:8000/inference", {
      method: "POST",
      body: form,
    });
    if (!res.ok) return setError("Failed to process");
    const data = await res.json();
    setResult(data);
    drawBoxes(data.detections);
  };

  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
      if (canvasRef) {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          const ctx = canvasRef!.getContext("2d")!;
          canvasRef!.width = img.width;
          canvasRef!.height = img.height;
          ctx.drawImage(img, 0, 0);
        };
      }
    }
  };

  const drawBoxes = (detections: any[]) => {
    if (!canvasRef || !preview()) return;
    const img = new Image();
    img.src = preview();
    img.onload = () => {
      const ctx = canvasRef!.getContext("2d")!;
      canvasRef!.width = img.width;
      canvasRef!.height = img.height;
      ctx.drawImage(img, 0, 0);
      ctx.strokeStyle = "red";
      ctx.lineWidth = 3;
      detections.forEach((d) => {
        const [x, y, w, h] = [d.x - d.w / 2, d.y - d.h / 2, d.w, d.h];
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = "red";
        ctx.font = "20px Arial";
        ctx.fillText(`${CLASS_NAMES[d.cls] || "Unknown"} (${(d.conf * 100).toFixed(1)}%)`, x, y - 5);
      });
    };
  };

  onCleanup(() => {
    if (preview()) URL.revokeObjectURL(preview());
  });

  return (
    <div class="wrapper">
      <h1 class="title">Rail Fault Detector</h1>
      <div class="upload-box">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.currentTarget.files?.[0] || null)}
        />
        <button class="button" onClick={upload}>Analyze</button>
      </div>
      {error() && <p class="error">{error()}</p>}
      <div class="canvas-box">
        {preview() && <canvas ref={canvasRef!} />}
      </div>
    </div>
  );
}
