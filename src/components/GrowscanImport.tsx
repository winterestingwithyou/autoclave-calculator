/**
 * Growscan Import Component
 * OCR-based tool quantity import from Growscan screenshots
 */

import { useState, useRef } from "react";
import { createWorker } from "tesseract.js";
import { TOOL_NAMES, TOOL_METADATA, type ToolType } from "../lib/tools";

interface DetectedTool {
  tool: ToolType;
  quantity: number;
  confidence: number;
}

interface GrowscanImportProps {
  onImport: (tools: Map<ToolType, number>) => void;
  currentQuantities: Map<ToolType, number>;
}

type ScanStatus = "idle" | "selecting" | "scanning" | "results" | "error";

export function GrowscanImport({
  onImport,
  currentQuantities,
}: GrowscanImportProps) {
  const [status, setStatus] = useState<ScanStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [detectedTools, setDetectedTools] = useState<DetectedTool[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseGrowscanText = (text: string): DetectedTool[] => {
    const results: DetectedTool[] = [];
    const lines = text.split("\n");

    for (const line of lines) {
      // Match pattern: "Surgical ToolName : Number" or "Surgical ToolName: Number"
      // Also handle OCR errors like "Surgical ToolName ; Number" or extra spaces
      const match = line.match(/Surgical\s+(\w+(?:\s+\w+)?)\s*[:;]\s*(\d+)/i);

      if (match) {
        const toolNamePart = match[1].trim();
        const quantity = parseInt(match[2], 10);

        // Find matching tool
        for (const toolName of TOOL_NAMES) {
          const shortName = TOOL_METADATA[toolName].shortName.toLowerCase();
          const searchName = toolNamePart.toLowerCase();

          // Match by short name or partial match
          if (
            shortName === searchName ||
            toolName.toLowerCase().includes(searchName) ||
            searchName.includes(shortName)
          ) {
            // Check if we already have this tool (avoid duplicates)
            const existing = results.find((r) => r.tool === toolName);
            if (!existing) {
              results.push({
                tool: toolName,
                quantity,
                confidence: 0.9, // Base confidence
              });
            }
            break;
          }
        }
      }
    }

    return results;
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStatus("scanning");
    setProgress(0);
    setErrorMessage("");

    try {
      const worker = await createWorker("eng", 1, {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const {
        data: { text },
      } = await worker.recognize(file);
      await worker.terminate();

      // Parse the OCR text
      const detected = parseGrowscanText(text);

      if (detected.length === 0) {
        setStatus("error");
        setErrorMessage(
          "Tidak ada Surgical Tools yang terdeteksi dalam gambar. Pastikan gambar adalah hasil Growscan yang menampilkan daftar Surgical Tools.",
        );
      } else {
        setDetectedTools(detected);
        setStatus("results");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      setStatus("error");
      setErrorMessage(
        "Gagal memproses gambar. Silakan coba lagi dengan gambar yang berbeda.",
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirm = () => {
    const newQuantities = new Map(currentQuantities);

    for (const detected of detectedTools) {
      newQuantities.set(detected.tool, detected.quantity);
    }

    onImport(newQuantities);
    handleClose();
  };

  const handleClose = () => {
    setStatus("idle");
    setDetectedTools([]);
    setErrorMessage("");
    setProgress(0);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Calculate changes
  const getQuantityChange = (tool: ToolType, newQty: number) => {
    const current = currentQuantities.get(tool) || 0;
    return newQty - current;
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Trigger Button */}
      <button
        onClick={handleOpenFileDialog}
        className="flex items-center gap-2 rounded-xl border border-cyan-500/20 bg-linear-to-r from-cyan-500/10 to-blue-500/10 px-3 py-2 text-xs font-medium text-cyan-400 transition-all hover:border-cyan-500/40 active:scale-[0.98] sm:px-4 sm:py-2.5 sm:text-sm"
      >
        <svg
          className="h-4 w-4 sm:h-5 sm:w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span className="hidden sm:inline">Import dari Growscan</span>
        <span className="sm:hidden">Growscan</span>
      </button>

      {/* Modal Overlay */}
      {status !== "idle" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
            {/* Scanning State */}
            {status === "scanning" && (
              <div className="p-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/10">
                  <svg
                    className="h-8 w-8 animate-pulse text-cyan-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  Memindai Gambar...
                </h3>
                <p className="mb-4 text-sm text-neutral-400">
                  Menggunakan OCR untuk mendeteksi Surgical Tools
                </p>

                {/* Progress Bar */}
                <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-neutral-800">
                  <div
                    className="h-full bg-linear-to-r from-cyan-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-neutral-500">{progress}%</p>
              </div>
            )}

            {/* Error State */}
            {status === "error" && (
              <div className="p-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <svg
                    className="h-8 w-8 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-2 text-center text-lg font-semibold text-white">
                  Tidak Terdeteksi
                </h3>
                <p className="mb-6 text-center text-sm text-neutral-400">
                  {errorMessage}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-xl bg-neutral-800 py-2.5 font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                  >
                    Tutup
                  </button>
                  <button
                    onClick={handleOpenFileDialog}
                    className="flex-1 rounded-xl bg-cyan-500 py-2.5 font-medium text-white transition-colors hover:bg-cyan-400"
                  >
                    Coba Lagi
                  </button>
                </div>
              </div>
            )}

            {/* Results State */}
            {status === "results" && (
              <div className="flex max-h-[80vh] flex-col">
                {/* Header */}
                <div className="border-b border-neutral-800 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <svg
                        className="h-5 w-5 text-emerald-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        Hasil Scan Growscan
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {detectedTools.length} tools terdeteksi
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tool List */}
                <div className="flex-1 space-y-2 overflow-y-auto p-4">
                  {detectedTools.map((detected) => {
                    const metadata = TOOL_METADATA[detected.tool];
                    const change = getQuantityChange(
                      detected.tool,
                      detected.quantity,
                    );
                    const currentQty =
                      currentQuantities.get(detected.tool) || 0;

                    return (
                      <div
                        key={detected.tool}
                        className="flex items-center gap-3 rounded-xl border border-neutral-700/50 bg-neutral-800/50 p-3"
                      >
                        <img
                          src={metadata.image}
                          alt={metadata.shortName}
                          className="h-8 w-8 object-contain"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-white">
                            {metadata.shortName}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {currentQty} → {detected.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white">
                            {detected.quantity}
                          </p>
                          {change !== 0 && (
                            <p
                              className={`text-xs font-medium ${change > 0 ? "text-emerald-400" : "text-red-400"}`}
                            >
                              {change > 0 ? "+" : ""}
                              {change}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Actions */}
                <div className="border-t border-neutral-800 bg-neutral-900/50 p-4">
                  <p className="mb-3 text-center text-xs text-neutral-500">
                    Terapkan hasil scan untuk memperbarui jumlah tools?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 rounded-xl bg-neutral-800 py-2.5 font-medium text-neutral-300 transition-colors hover:bg-neutral-700"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleConfirm}
                      className="flex-1 rounded-xl bg-linear-to-r from-emerald-500 to-green-500 py-2.5 font-medium text-white transition-all hover:from-emerald-400 hover:to-green-400"
                    >
                      Terapkan
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
