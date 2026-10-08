"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaDownload, FaRedo, FaUndo } from "react-icons/fa";
import Button from "@/components/ui/Button";
import FileUploader from "@/components/pdf/file/FileUploader";
import usePDFJS from "@/hooks/usePDFJS";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import {
  addPageRotation,
  createPageEntries,
  exportPdfRotations,
  getPdfLoadErrorMessage,
  MAX_PDF_FILE_SIZE_BYTES,
  rotatePages,
} from "@/components/utils/pdfPageUtils";

function PageThumbnail({
  page,
  originalRotation,
  pdfDoc,
  lazy,
  onRenderState,
  onRenderError,
}) {
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(!lazy);
  const [rendered, setRendered] = useState(false);
  const visibleRotation = addPageRotation(originalRotation, page.rotation);

  useEffect(() => {
    if (!lazy || shouldRender || !containerRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px" }
    );
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [lazy, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !pdfDoc || !containerRef.current) return undefined;

    let isActive = true;
    let renderTask;
    const canvas = containerRef.current.querySelector("canvas");
    onRenderState(page.id, true);
    setRendered(false);

    (async () => {
      try {
        const pdfPage = await pdfDoc.getPage(page.sourceIndex + 1);
        if (!isActive || !canvas) return;
        const viewport = pdfPage.getViewport({
          scale: 0.28,
          rotation: visibleRotation,
        });
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas rendering is unavailable.");
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (isActive) setRendered(true);
      } catch (error) {
        if (isActive && error?.name !== "RenderingCancelledException") {
          onRenderError(page.sourceIndex + 1, error);
        }
      } finally {
        if (isActive) onRenderState(page.id, false);
      }
    })();

    return () => {
      isActive = false;
      renderTask?.cancel();
      onRenderState(page.id, false);
    };
  }, [
    onRenderError,
    onRenderState,
    page.id,
    page.rotation,
    page.sourceIndex,
    pdfDoc,
    shouldRender,
    visibleRotation,
  ]);

  return (
    <div
      ref={containerRef}
      className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-[#f4f7f5] p-2"
    >
      <canvas
        aria-label={`Preview of page ${page.sourceIndex + 1}`}
        className="max-h-full max-w-full object-contain"
        width={0}
        height={0}
      />
      {!rendered && (
        <span
          className="absolute text-xs text-[#708079]"
          role="status"
          aria-label={
            shouldRender
              ? `Loading preview for page ${page.sourceIndex + 1}`
              : `Preview for page ${page.sourceIndex + 1} will load when needed`
          }
        >
          {shouldRender ? "Rendering preview..." : "Preview loads on scroll"}
        </span>
      )}
    </div>
  );
}

function PageCard({
  page,
  index,
  originalRotation,
  pdfDoc,
  lazy,
  selected,
  onSelect,
  onRenderState,
  onRenderError,
  onRotate,
  isBusy,
}) {
  const visibleRotation = addPageRotation(originalRotation, page.rotation);

  return (
    <article
      data-page-source={page.sourceIndex + 1}
      data-page-rotation={visibleRotation}
      className={`relative min-w-0 border bg-white p-2 sm:p-3 ${
        selected ? "border-[#235c4f] ring-1 ring-[#235c4f]" : "border-[#dce5e0]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={`Select page ${index + 1}`}
          aria-pressed={selected}
          onClick={(event) => onSelect(page.id, index, event.shiftKey)}
          className="inline-flex min-h-9 min-w-9 items-center gap-1 text-xs font-semibold text-[#263e36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f]"
        >
          <span aria-hidden="true">{selected ? "☑" : "□"}</span>
          Page {index + 1}
        </button>
        <span
          className="shrink-0 border border-[#dce5e0] bg-[#f4f7f5] px-1.5 py-1 text-[11px] font-semibold text-[#52675e]"
          aria-label={`Page ${index + 1} rotation ${visibleRotation} degrees`}
        >
          {visibleRotation}°
        </span>
      </div>

      <div className="relative">
        <PageThumbnail
          page={page}
          originalRotation={originalRotation}
          pdfDoc={pdfDoc}
          lazy={lazy}
          onRenderState={onRenderState}
          onRenderError={onRenderError}
        />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onRotate([page.id], -90)}
          disabled={isBusy}
          aria-label={`Rotate page ${index + 1} left`}
          className="min-h-10 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          <FaUndo className="mr-1 inline" aria-hidden="true" />
          Left
        </button>
        <button
          type="button"
          onClick={() => onRotate([page.id], 90)}
          disabled={isBusy}
          aria-label={`Rotate page ${index + 1} right`}
          className="min-h-10 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          <FaRedo className="mr-1 inline" aria-hidden="true" />
          Right
        </button>
      </div>
    </article>
  );
}

export default function RotatePDFTool() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pages, setPages] = useState([]);
  const [originalRotations, setOriginalRotations] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renderingPages, setRenderingPages] = useState(() => new Set());
  const anchorIndexRef = useRef(null);
  const activeLoadingTaskRef = useRef(null);
  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();

  const hasDocument = Boolean(file && pdfDoc);
  const isBusy = isLoadingDocument || isExporting;
  const hasChanges = pages.some((page) => page.rotation !== 0);
  const lazyThumbnails = pages.length >= 100;

  useAdPauseWhile("rotate-pdf-processing", isBusy || renderingPages.size > 0);
  useAdPauseWhile("rotate-pdf-error", Boolean(error));
  useAdPauseWhile("rotate-pdf-empty", !hasDocument);

  useEffect(() => {
    if (!file || !pdfjs) return undefined;

    let isActive = true;
    setIsLoadingDocument(true);
    setError("");
    setNotice("");

    (async () => {
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const loadingTask = pdfjs.getDocument({ data: bytes.slice() });
        activeLoadingTaskRef.current = loadingTask;
        const documentProxy = await loadingTask.promise;
        if (!isActive) {
          await documentProxy.destroy();
          return;
        }

        const rotations = await Promise.all(
          Array.from({ length: documentProxy.numPages }, async (_, index) => {
            const pdfPage = await documentProxy.getPage(index + 1);
            return pdfPage.rotate;
          })
        );
        if (!isActive) {
          await documentProxy.destroy();
          return;
        }

        activeLoadingTaskRef.current = null;
        setSourceBytes(bytes);
        setPdfDoc(documentProxy);
        setOriginalRotations(rotations);
        setPages(createPageEntries(documentProxy.numPages));
        setSelectedIds([]);
      } catch (loadError) {
        if (isActive) {
          setError(getPdfLoadErrorMessage(loadError));
          setPdfDoc(null);
          setSourceBytes(null);
          setPages([]);
          setOriginalRotations([]);
        }
      } finally {
        if (isActive) setIsLoadingDocument(false);
      }
    })();

    return () => {
      isActive = false;
      const task = activeLoadingTaskRef.current;
      activeLoadingTaskRef.current = null;
      if (task?.destroy) task.destroy();
    };
  }, [file, pdfjs]);

  useEffect(
    () => () => {
      if (pdfDoc?.destroy) pdfDoc.destroy();
    },
    [pdfDoc]
  );

  const recordRenderingState = useCallback((pageId, isRendering) => {
    setRenderingPages((current) => {
      const next = new Set(current);
      if (isRendering) next.add(pageId);
      else next.delete(pageId);
      return next;
    });
  }, []);

  const handleThumbnailError = useCallback((pageNumber, renderError) => {
    console.error(`Could not render PDF page ${pageNumber}:`, renderError);
    setError(`Page ${pageNumber} preview could not be rendered.`);
  }, []);

  const rotatePageIds = (pageIds, rotation) => {
    setPages((current) => rotatePages(current, pageIds, rotation));
    setNotice("");
    setError("");
  };

  const selectPage = (pageId, index, shiftKey) => {
    if (shiftKey && anchorIndexRef.current !== null) {
      const start = Math.min(anchorIndexRef.current, index);
      const end = Math.max(anchorIndexRef.current, index);
      const rangeIds = pages.slice(start, end + 1).map((page) => page.id);
      setSelectedIds((current) => [...new Set([...current, ...rangeIds])]);
    } else {
      setSelectedIds((current) =>
        current.includes(pageId)
          ? current.filter((id) => id !== pageId)
          : [...current, pageId]
      );
      anchorIndexRef.current = index;
    }
  };

  const selectAll = () => {
    setSelectedIds(
      selectedIds.length > 0 ? [] : pages.map((page) => page.id)
    );
    anchorIndexRef.current = null;
  };

  const selectParity = (parity) => {
    setSelectedIds(
      pages
        .filter((page, index) => index % 2 === parity)
        .map((page) => page.id)
    );
    anchorIndexRef.current = null;
  };

  const handleUpload = useCallback((files) => {
    const pdfFile = files.find(
      (candidate) =>
        candidate.type === "application/pdf" ||
        candidate.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      setError("Choose a PDF file to rotate.");
      return;
    }

    setFile(pdfFile);
    setPdfDoc(null);
    setSourceBytes(null);
    setPages([]);
    setOriginalRotations([]);
    setSelectedIds([]);
    setError("");
    setNotice("");
  }, []);

  const handleChooseAnother = () => {
    activeLoadingTaskRef.current?.destroy?.();
    setFile(null);
    setPdfDoc(null);
    setSourceBytes(null);
    setPages([]);
    setOriginalRotations([]);
    setSelectedIds([]);
    setError("");
    setNotice("");
  };

  const handleReset = () => {
    setPages((current) =>
      current.map((page) => ({ ...page, rotation: 0 }))
    );
    setNotice("");
    setError("");
  };

  const handleExport = async () => {
    if (!sourceBytes || isExporting || !hasChanges) return;

    setIsExporting(true);
    setError("");
    setNotice("");
    try {
      const rotations = pages.map((page) => page.rotation);
      const bytes = await exportPdfRotations(sourceBytes, rotations);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.replace(/\.pdf$/i, "") + "-rotated.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Rotated PDF downloaded.");
    } catch (exportError) {
      console.error("PDF rotation export failed:", exportError);
      setError(getPdfLoadErrorMessage(exportError));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      {error && (
        <div
          className="mb-4 border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]"
          role="alert"
        >
          {error}
        </div>
      )}

      {!file ? (
        <FileUploader
          onUpload={handleUpload}
          accept="application/pdf,.pdf"
          multiple={false}
          fileTypeLabel="PDF file"
          titleText="Drop PDF file here"
          maxFileSizeBytes={MAX_PDF_FILE_SIZE_BYTES}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-[#e5ece8] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[#1a3328]" title={file.name}>
                {file.name}
              </p>
              <p className="text-xs text-[#708079]">
                {pages.length} {pages.length === 1 ? "page" : "pages"} · Up to 50 MB
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleChooseAnother}
              disabled={isBusy}
            >
              Choose another PDF
            </Button>
          </div>

          {isLoadingDocument && (
            <p className="py-8 text-center text-sm text-[#527268]" role="status">
              Loading PDF pages...
            </p>
          )}
          {isPDFJSLoading && !isLoadingDocument && !pdfDoc && (
            <p className="py-8 text-center text-sm text-[#527268]" role="status">
              Loading PDF engine...
            </p>
          )}
          {!pdfjs && !isPDFJSLoading && !pdfDoc && !isLoadingDocument && (
            <p className="py-8 text-center text-sm text-[#a13c2f]" role="alert">
              The PDF engine could not be loaded. Refresh the page and try again.
            </p>
          )}

          {hasDocument && (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-[#e5ece8] pb-4">
                <Button variant="outline" size="sm" onClick={() => rotatePageIds(pages.map((page) => page.id), -90)} disabled={isBusy}>
                  <FaUndo className="mr-2" aria-hidden="true" />
                  Rotate all left
                </Button>
                <Button variant="outline" size="sm" onClick={() => rotatePageIds(pages.map((page) => page.id), 90)} disabled={isBusy}>
                  <FaRedo className="mr-2" aria-hidden="true" />
                  Rotate all right
                </Button>
                <Button variant="outline" size="sm" onClick={() => rotatePageIds(pages.map((page) => page.id), 180)} disabled={isBusy}>
                  Rotate all 180°
                </Button>
                <Button variant="outline" size="sm" onClick={handleReset} disabled={isBusy || !hasChanges}>
                  Reset
                </Button>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-[#e5ece8] pb-4">
                <Button variant="outline" size="sm" onClick={selectAll} disabled={isBusy}>
                  {selectedIds.length > 0 ? "Select none" : "Select all"}
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectParity(0)} disabled={isBusy}>
                  Odd pages
                </Button>
                <Button variant="outline" size="sm" onClick={() => selectParity(1)} disabled={isBusy}>
                  Even pages
                </Button>
                <span className="text-xs text-[#708079]" aria-live="polite">
                  {selectedIds.length} selected
                </span>
                {selectedIds.length > 0 && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => rotatePageIds(selectedIds, -90)} disabled={isBusy}>
                      Rotate selected left
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => rotatePageIds(selectedIds, 90)} disabled={isBusy}>
                      Rotate selected right
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => rotatePageIds(selectedIds, 180)} disabled={isBusy}>
                      Rotate selected 180°
                    </Button>
                  </>
                )}
              </div>

              {notice && (
                <p className="text-sm text-[#235c4f]" role="status">
                  {notice}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {pages.map((page, index) => (
                  <PageCard
                    key={page.id}
                    page={page}
                    index={index}
                    originalRotation={originalRotations[index] || 0}
                    pdfDoc={pdfDoc}
                    lazy={lazyThumbnails}
                    selected={selectedIds.includes(page.id)}
                    onSelect={selectPage}
                    onRenderState={recordRenderingState}
                    onRenderError={handleThumbnailError}
                    onRotate={rotatePageIds}
                    isBusy={isBusy}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-[#e5ece8] pt-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-xs text-[#708079]">
                  {hasChanges
                    ? "Export preserves the original page content and applies only the selected rotations."
                    : "Rotate at least one page before exporting."}
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExport}
                  disabled={isBusy || !hasChanges}
                  isLoading={isExporting}
                  icon={<FaDownload />}
                >
                  {isExporting ? "Creating PDF..." : "Download rotated PDF"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
