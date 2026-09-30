"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaColumns,
  FaLayerGroup,
  FaTimes,
} from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";
import Button from "@/components/ui/Button";
import usePDFJS from "@/hooks/usePDFJS";
import { createDifferenceImageData } from "../compareUtils.js";

const MAX_RENDER_DIMENSION = 1400;

async function renderPageToCanvas(page, scale, renderTasks) {
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");

  const renderTask = page.render({ canvasContext: context, viewport });
  renderTasks.push(renderTask);
  await renderTask.promise;
  return canvas;
}

function createAlignedCanvas(sourceCanvas, width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  if (sourceCanvas) {
    context.drawImage(
      sourceCanvas,
      Math.round((width - sourceCanvas.width) / 2),
      Math.round((height - sourceCanvas.height) / 2)
    );
  }

  return canvas;
}

export default function ComparePDFTool() {
  const [files, setFiles] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState("side-by-side");
  const [overlayOpacity, setOverlayOpacity] = useState(50);
  const [error, setError] = useState("");
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [comparisonAvailable, setComparisonAvailable] = useState(false);
  const [comparisonStats, setComparisonStats] = useState(null);
  const leftCanvasRef = useRef(null);
  const rightCanvasRef = useRef(null);
  const resultCanvasRef = useRef(null);
  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();

    const handleUpload = (uploadedFiles) => {
      if (uploadedFiles.length !== 2) {
        setError("Choose exactly two PDF files to compare.");
        return;
      }

      setFiles(Array.from(uploadedFiles));
      setDocuments([]);
      setPageNumber(1);
      setViewMode("side-by-side");
      setError("");
    };

    const clearFiles = () => {
      setFiles([]);
      setDocuments([]);
      setPageNumber(1);
      setViewMode("side-by-side");
      setError("");
    };

    useEffect(() => {
      if (!pdfjs || files.length !== 2) return undefined;

      let isActive = true;
      const loadingTasks = [];
      setIsLoadingDocuments(true);
      setError("");

      const loadDocuments = async () => {
        try {
          const loadedDocuments = await Promise.all(
            files.map(async (file) => {
              const data = await file.arrayBuffer();
              const loadingTask = pdfjs.getDocument({ data });
              loadingTasks.push(loadingTask);
              return loadingTask.promise;
            })
          );

          if (isActive) setDocuments(loadedDocuments);
        } catch (loadError) {
          if (isActive) {
            setError(
              loadError.name === "PasswordException"
                ? "Password-protected PDFs are not supported. Remove the password and try again."
                : "One of these files could not be opened. Check that both PDFs are valid and try again."
            );
          }
        } finally {
          if (isActive) setIsLoadingDocuments(false);
        }
      };

      loadDocuments();

      return () => {
        isActive = false;
        loadingTasks.forEach((task) => task.destroy());
      };
    }, [files, pdfjs]);

    useEffect(() => {
      if (documents.length !== 2) return undefined;

      let isActive = true;
      const renderTasks = [];
      const canvases = [leftCanvasRef.current, rightCanvasRef.current];
      setIsRendering(true);
      setError("");

      const renderComparison = async () => {
        try {
          const pages = await Promise.all(
            documents.map((document) =>
              pageNumber <= document.numPages
                ? document.getPage(pageNumber)
                : Promise.resolve(null)
            )
          );
          const pageSizes = pages
            .filter(Boolean)
            .map((page) => page.getViewport({ scale: 1 }));

          if (pageSizes.length === 0) {
            throw new Error("Neither document has this page.");
          }

          const originalWidth = Math.max(...pageSizes.map((size) => size.width));
          const originalHeight = Math.max(...pageSizes.map((size) => size.height));
          const scale = Math.min(
            1.25,
            MAX_RENDER_DIMENSION / Math.max(originalWidth, originalHeight)
          );
          const width = Math.max(1, Math.ceil(originalWidth * scale));
          const height = Math.max(1, Math.ceil(originalHeight * scale));

          const sourceCanvases = await Promise.all(
            pages.map((page) =>
              page ? renderPageToCanvas(page, scale, renderTasks) : null
            )
          );
          if (!isActive) return;

          const alignedCanvases = sourceCanvases.map((canvas) =>
            createAlignedCanvas(canvas, width, height)
          );

          alignedCanvases.forEach((sourceCanvas, index) => {
            const targetCanvas = canvases[index];
            if (!targetCanvas) return;

            targetCanvas.width = width;
            targetCanvas.height = height;
            const context = targetCanvas.getContext("2d");
            if (!context) throw new Error("Canvas rendering is unavailable.");
            context.drawImage(sourceCanvas, 0, 0);
          });

          const canCompare = pages.every(Boolean);
          setComparisonAvailable(canCompare);
          if (!canCompare) {
            setComparisonStats(null);
            return;
          }

          const resultCanvas = resultCanvasRef.current;
          const resultContext = resultCanvas?.getContext("2d");
          if (!resultCanvas || !resultContext) {
            throw new Error("Canvas rendering is unavailable.");
          }

          resultCanvas.width = width;
          resultCanvas.height = height;
          resultContext.clearRect(0, 0, width, height);

          if (viewMode === "overlay") {
            resultContext.drawImage(alignedCanvases[0], 0, 0);
            resultContext.globalAlpha = overlayOpacity / 100;
            resultContext.drawImage(alignedCanvases[1], 0, 0);
            resultContext.globalAlpha = 1;
            setComparisonStats(null);
          } else if (viewMode === "difference") {
            const originalContext = alignedCanvases[0].getContext("2d");
            const revisedContext = alignedCanvases[1].getContext("2d");
            if (!originalContext || !revisedContext) {
              throw new Error("Canvas comparison is unavailable.");
            }

            const difference = createDifferenceImageData(
              originalContext.getImageData(0, 0, width, height).data,
              revisedContext.getImageData(0, 0, width, height).data
            );
            const imageData = resultContext.createImageData(width, height);
            imageData.data.set(difference.pixels);
            resultContext.putImageData(imageData, 0, 0);
            setComparisonStats(difference);
          } else {
            setComparisonStats(null);
          }
        } catch (renderError) {
          if (isActive) {
            setError(renderError.message || "These pages could not be compared.");
          }
        } finally {
          if (isActive) setIsRendering(false);
        }
      };

      renderComparison();

      return () => {
        isActive = false;
        renderTasks.forEach((task) => task.cancel());
      };
    }, [documents, pageNumber, viewMode, overlayOpacity]);

    const maxPages =
      documents.length === 2
        ? Math.max(documents[0].numPages, documents[1].numPages)
        : 0;

    const viewModes = [
      { id: "side-by-side", label: "Side by side", icon: FaColumns },
      { id: "overlay", label: "Overlay", icon: FaLayerGroup },
      { id: "difference", label: "Difference", icon: FaTimes },
    ];

    return (
      <section className="p-4 sm:p-6">
        {files.length !== 2 ? (
          <div className="mx-auto max-w-3xl">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-[#263e36]">Choose two PDFs</h2>
              <p className="mt-1 text-sm leading-6 text-[#62746d]">
                Select the original first and the revised file second. Compare
                their pages side by side, as an overlay, or with changed areas
                highlighted.
              </p>
            </div>
            <FileUploader
              onUpload={handleUpload}
              accept="application/pdf,.pdf"
              multiple
            />
            {error && (
              <p className="mt-4 text-sm text-[#a13c2f]" role="alert">
                {error}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5ece8] pb-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-[#263e36]">
                  Compare documents
                </p>
                <p className="mt-1 truncate text-xs text-[#708079]">
                  {files[0].name} <span aria-hidden="true">vs</span> {files[1].name}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<FaTimes aria-hidden="true" />}
                onClick={clearFiles}
              >
                Choose different files
              </Button>
            </div>

            {isPDFJSLoading || isLoadingDocuments ? (
              <p className="py-12 text-center text-sm text-[#62746d]" role="status">
                Opening both PDFs...
              </p>
            ) : documents.length === 2 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 py-4">
                  <p className="text-sm font-medium text-[#405950]">
                    Page {pageNumber} of {maxPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<FaArrowLeft aria-hidden="true" />}
                      onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                      disabled={pageNumber <= 1 || isRendering}
                      aria-label="Previous page"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={<FaArrowRight aria-hidden="true" />}
                      iconPosition="right"
                      onClick={() => setPageNumber((page) => Math.min(maxPages, page + 1))}
                      disabled={pageNumber >= maxPages || isRendering}
                      aria-label="Next page"
                    >
                      Next
                    </Button>
                  </div>
                </div>

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div
                    className="grid grid-cols-3 border border-[#dce5e0] bg-[#f4f7f5] p-1"
                    role="group"
                    aria-label="Comparison view"
                  >
                    {viewModes.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={viewMode === id}
                        disabled={id !== "side-by-side" && !comparisonAvailable}
                        onClick={() => setViewMode(id)}
                        className={`inline-flex min-h-10 items-center justify-center gap-2 px-3 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f] disabled:cursor-not-allowed disabled:opacity-40 sm:text-sm ${
                          viewMode === id
                            ? "bg-[#173d34] text-white"
                            : "text-[#52675e] hover:bg-white"
                        }`}
                      >
                        <Icon aria-hidden="true" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {viewMode === "overlay" && comparisonAvailable && (
                    <label className="flex min-w-48 items-center gap-3 text-xs text-[#5d706a] sm:text-sm">
                      <span>Revised opacity</span>
                      <input
                        type="range"
                        min="10"
                        max="90"
                        step="5"
                        value={overlayOpacity}
                        onChange={(event) => setOverlayOpacity(Number(event.target.value))}
                        aria-label="Revised page overlay opacity"
                        className="w-28 accent-[#235c4f]"
                      />
                      <span className="w-9 text-right tabular-nums">
                        {overlayOpacity}%
                      </span>
                    </label>
                  )}
                </div>

                {error && (
                  <p className="mb-4 text-sm text-[#a13c2f]" role="alert">
                    {error}
                  </p>
                )}

                {viewMode === "side-by-side" || !comparisonAvailable ? (
                  <>
                    {!comparisonAvailable && viewMode !== "side-by-side" && (
                      <p className="mb-3 text-sm text-[#708079]" role="status">
                        This page exists in only one document. Choose side by side
                        to review it.
                      </p>
                    )}
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {files.map((file, index) => {
                        const hasPage = pageNumber <= documents[index].numPages;
                        return (
                          <section key={`${file.name}-${index}`} className="min-w-0">
                            <h3 className="mb-2 truncate text-sm font-semibold text-[#405950]">
                              {index === 0 ? "Original" : "Revised"}: {file.name}
                            </h3>
                            <div className="flex min-h-80 items-start justify-center overflow-auto border border-[#dce5e0] bg-[#eef2ef] p-3">
                              <canvas
                                ref={index === 0 ? leftCanvasRef : rightCanvasRef}
                                aria-label={`${index === 0 ? "Original" : "Revised"} document, page ${pageNumber}`}
                                className={`${hasPage ? "" : "hidden"} h-auto max-w-full bg-white shadow-sm`}
                              />
                              {!hasPage && (
                                <p className="py-24 text-center text-sm text-[#708079]">
                                  This document has no page {pageNumber}.
                                </p>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <section className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-[#405950]">
                        {viewMode === "overlay" ? "Page overlay" : "Changed areas"}
                      </h3>
                      {viewMode === "difference" && comparisonStats && (
                        <p className="text-xs tabular-nums text-[#708079]" role="status">
                          {comparisonStats.changedPixels === 0
                            ? "No visible changes on this page"
                            : `${comparisonStats.changedPercent.toFixed(2)}% of page pixels differ`}
                        </p>
                      )}
                    </div>
                    <div className="flex min-h-80 items-start justify-center overflow-auto border border-[#dce5e0] bg-[#eef2ef] p-3">
                      <canvas
                        ref={resultCanvasRef}
                        aria-label={`${viewMode === "overlay" ? "Overlaid" : "Difference map for"} page ${pageNumber}`}
                        className="h-auto max-w-full bg-white shadow-sm"
                      />
                    </div>
                    {viewMode === "difference" && (
                      <p className="mt-2 text-xs leading-5 text-[#708079]">
                        Highlighted pixels show visual changes. Text or font
                        rendering differences may also be marked.
                      </p>
                    )}
                  </section>
                )}

                {isRendering && (
                  <p className="mt-3 text-center text-sm text-[#708079]" role="status">
                    Rendering page comparison...
                  </p>
                )}
              </>
            ) : (
              <div className="py-12 text-center text-sm text-[#62746d]" role="status">
                {error || "Preparing document previews..."}
              </div>
            )}
          </>
        )}
      </section>
    );
  }
