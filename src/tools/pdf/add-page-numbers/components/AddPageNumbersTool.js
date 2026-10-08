"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaDownload, FaFilePdf } from "react-icons/fa";
import Button from "@/components/ui/Button";
import FileUploader from "@/components/pdf/file/FileUploader";
import usePDFJS from "@/hooks/usePDFJS";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import {
  createPageEntries,
  exportPdfPageNumbers,
  formatPageNumber,
  getMirroredPageNumberPosition,
  getPageNumberForPage,
  getPageNumberRange,
  getPdfLoadErrorMessage,
  getVisualPageDimensions,
  MAX_PDF_FILE_SIZE_BYTES,
  PAGE_NUMBER_FORMATS,
  PAGE_NUMBER_POSITIONS,
} from "@/components/utils/pdfPageUtils";

const POSITION_LABELS = {
  "top-left": "Top left",
  "top-center": "Top center",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-center": "Bottom center",
  "bottom-right": "Bottom right",
};

const FORMAT_LABELS = {
  number: "1",
  "page-number": "Page 1",
  "number-of-total": "1 of N",
  "page-number-of-total": "Page 1 of N",
};

const EMPTY_OPTIONS = {
  fromPage: "1",
  toPage: "1",
  startNumber: "1",
  position: "bottom-center",
  format: "number",
  font: "Helvetica",
  fontSize: 12,
  color: "#263e36",
  margin: 36,
  skipFirstPage: false,
  mirrorOddEven: false,
};

function PagePreview({
  page,
  pageData,
  pdfDoc,
  options,
  pageCount,
  lazy,
  onRenderState,
  onRenderError,
}) {
  const frameRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(!lazy);
  const [preview, setPreview] = useState(null);
  const pageNumber = getPageNumberForPage(page.sourceIndex + 1, pageCount, options);
  const label =
    pageNumber === null
      ? null
      : formatPageNumber(options.format, pageNumber, pageCount);
  const position =
    label === null
      ? null
      : getMirroredPageNumberPosition(
          options.position,
          page.sourceIndex + 1,
          options.mirrorOddEven
        );

  useEffect(() => {
    if (!lazy || shouldRender || !frameRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "500px" }
    );
    observer.observe(frameRef.current);
    return () => observer.disconnect();
  }, [lazy, shouldRender]);

  useEffect(() => {
    if (!shouldRender || !pdfDoc || !frameRef.current) return undefined;

    let isActive = true;
    let renderTask;
    const canvas = frameRef.current.querySelector("canvas");
    const frame = frameRef.current;
    onRenderState(page.id, true);
    setPreview(null);

    (async () => {
      try {
        const pdfPage = await pdfDoc.getPage(page.sourceIndex + 1);
        if (!isActive || !canvas) return;
        const viewport = pdfPage.getViewport({
          scale: 1,
          rotation: pageData.rotation,
        });
        const maxWidth = Math.max(1, frame.clientWidth - 16);
        const maxHeight = Math.max(1, frame.clientHeight - 16);
        const displayScale = Math.min(
          maxWidth / viewport.width,
          maxHeight / viewport.height
        );
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        canvas.style.width = `${viewport.width * displayScale}px`;
        canvas.style.height = `${viewport.height * displayScale}px`;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas rendering is unavailable.");
        renderTask = pdfPage.render({ canvasContext: context, viewport });
        await renderTask.promise;
        if (isActive) {
          setPreview({
            width: viewport.width * displayScale,
            height: viewport.height * displayScale,
            displayScale,
          });
        }
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
    page.sourceIndex,
    pageData.rotation,
    pdfDoc,
    shouldRender,
  ]);

  const visualDimensions = getVisualPageDimensions(
    pageData.cropBox,
    pageData.rotation
  );
  const vertical = position?.split("-")[0];
  const horizontal = position?.split("-")[1];
  const horizontalMargin = (options.margin / visualDimensions.width) * 100;
  const verticalMargin = (options.margin / visualDimensions.height) * 100;
  const pageStyle =
    preview && position
      ? {
          left:
            horizontal === "left"
              ? `${horizontalMargin}%`
              : horizontal === "right"
                ? undefined
                : "50%",
          right:
            horizontal === "right" ? `${horizontalMargin}%` : undefined,
          top:
            vertical === "top" ? `${verticalMargin}%` : undefined,
          bottom:
            vertical === "bottom" ? `${verticalMargin}%` : undefined,
          transform:
            horizontal === "center"
              ? "translateX(-50%)"
              : horizontal === "right"
                ? undefined
                : undefined,
          color: options.color,
          fontFamily:
            options.font === "Times"
              ? "serif"
              : options.font === "Courier"
                ? "monospace"
                : "Arial, sans-serif",
          fontSize: `${options.fontSize * preview.displayScale}px`,
        }
      : undefined;

  return (
    <article
      data-page-source={page.sourceIndex + 1}
      data-page-number={label || ""}
      className="min-w-0 border border-[#dce5e0] bg-white p-2 sm:p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-1">
        <span className="text-xs font-semibold text-[#263e36]">
          Page {page.sourceIndex + 1}
        </span>
        <span className="truncate text-[11px] text-[#708079]">
          {label ? `Numbered ${label}` : "Not numbered"}
        </span>
      </div>
      <div
        ref={frameRef}
        className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-[#f4f7f5] p-2"
      >
        <div
          className="relative inline-flex shrink-0"
          style={
            preview
              ? {
                  width: `${preview.width}px`,
                  height: `${preview.height}px`,
                }
              : undefined
          }
        >
          <canvas
            aria-label={`Preview of page ${page.sourceIndex + 1}`}
            className="block"
            width={0}
            height={0}
          />
          {label && preview && (
            <span
              data-page-number-preview="true"
              className="absolute whitespace-nowrap leading-none"
              style={pageStyle}
            >
              {label}
            </span>
          )}
        </div>
        {!preview && (
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
    </article>
  );
}

function PositionSelector({ value, onChange, disabled }) {
  return (
    <div
      role="group"
      aria-label="Page number position"
      className="grid max-w-xs grid-cols-3 gap-1"
    >
      {PAGE_NUMBER_POSITIONS.map((position) => (
        <button
          key={position}
          type="button"
          aria-label={POSITION_LABELS[position]}
          aria-pressed={value === position}
          onClick={() => onChange(position)}
          disabled={disabled}
          className={`flex min-h-11 items-center justify-center border text-xs ${
            value === position
              ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34]"
              : "border-[#dce5e0] bg-white text-[#52675e]"
          }`}
        >
          <span className="relative block h-5 w-8 border border-current" aria-hidden="true">
            <span
              className={`absolute h-1 w-1 bg-current ${
                position.startsWith("top") ? "top-0.5" : "bottom-0.5"
              } ${
                position.endsWith("left")
                  ? "left-0.5"
                  : position.endsWith("right")
                    ? "right-0.5"
                    : "left-1/2 -translate-x-1/2"
              }`}
            />
          </span>
        </button>
      ))}
    </div>
  );
}

export default function AddPageNumbersTool() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pages, setPages] = useState([]);
  const [pageData, setPageData] = useState([]);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [renderingPages, setRenderingPages] = useState(() => new Set());
  const activeLoadingTaskRef = useRef(null);
  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();

  const hasDocument = Boolean(file && pdfDoc);
  const isBusy = isLoadingDocument || isExporting;
  const pageRange = getPageNumberRange(pages.length, options);
  const startNumberError =
    !Number.isInteger(Number(options.startNumber)) || Number(options.startNumber) < 1
      ? "Start number must be a positive whole number."
      : "";
  const fontSizeError =
    !Number.isInteger(Number(options.fontSize)) ||
    Number(options.fontSize) < 8 ||
    Number(options.fontSize) > 36
      ? "Font size must be between 8 and 36 points."
      : "";
  const marginError =
    !Number.isFinite(Number(options.margin)) ||
    Number(options.margin) < 0 ||
    Number(options.margin) > 100
      ? "Margin must be between 0 and 100 points."
      : "";
  const validationError =
    pageRange.error || startNumberError || fontSizeError || marginError;
  const lazyPreviews = pages.length >= 100;

  useAdPauseWhile(
    "add-page-numbers-processing",
    isBusy || renderingPages.size > 0
  );
  useAdPauseWhile("add-page-numbers-error", Boolean(error || validationError));
  useAdPauseWhile("add-page-numbers-empty", !hasDocument);

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

        const loadedPages = await Promise.all(
          Array.from({ length: documentProxy.numPages }, async (_, index) => {
            const page = await documentProxy.getPage(index + 1);
            const [x0, y0, x1, y1] = page.view;
            return {
              rotation: page.rotate,
              cropBox: {
                x: x0,
                y: y0,
                width: x1 - x0,
                height: y1 - y0,
              },
            };
          })
        );
        if (!isActive) {
          await documentProxy.destroy();
          return;
        }

        activeLoadingTaskRef.current = null;
        setSourceBytes(bytes);
        setPdfDoc(documentProxy);
        setPages(createPageEntries(documentProxy.numPages));
        setPageData(loadedPages);
        setOptions((current) => ({
          ...current,
          fromPage: "1",
          toPage: String(documentProxy.numPages),
        }));
      } catch (loadError) {
        if (isActive) {
          setError(getPdfLoadErrorMessage(loadError));
          setPdfDoc(null);
          setSourceBytes(null);
          setPages([]);
          setPageData([]);
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

  const updateOption = (key, value) => {
    setOptions((current) => ({ ...current, [key]: value }));
    setNotice("");
    setError("");
  };

  const handleUpload = useCallback((files) => {
    const pdfFile = files.find(
      (candidate) =>
        candidate.type === "application/pdf" ||
        candidate.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      setError("Choose a PDF file to add page numbers.");
      return;
    }

    setFile(pdfFile);
    setPdfDoc(null);
    setSourceBytes(null);
    setPages([]);
    setPageData([]);
    setOptions(EMPTY_OPTIONS);
    setError("");
    setNotice("");
  }, []);

  const handleChooseAnother = () => {
    activeLoadingTaskRef.current?.destroy?.();
    setFile(null);
    setPdfDoc(null);
    setSourceBytes(null);
    setPages([]);
    setPageData([]);
    setOptions(EMPTY_OPTIONS);
    setError("");
    setNotice("");
  };

  const handleExport = async () => {
    if (!sourceBytes || isExporting || validationError) return;

    setIsExporting(true);
    setError("");
    setNotice("");
    try {
      const bytes = await exportPdfPageNumbers(sourceBytes, {
        ...options,
        startNumber: Number(options.startNumber),
        fontSize: Number(options.fontSize),
        margin: Number(options.margin),
      });
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name.replace(/\.pdf$/i, "") + "-numbered.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice("Numbered PDF downloaded.");
    } catch (exportError) {
      console.error("Page number export failed:", exportError);
      setError(
        exportError.message?.includes("valid page range") ||
          exportError.message?.includes("Start number") ||
          exportError.message?.includes("Font size") ||
          exportError.message?.includes("Margin")
          ? exportError.message
          : getPdfLoadErrorMessage(exportError)
      );
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
            <div className="flex min-w-0 items-center gap-3">
              <FaFilePdf className="h-6 w-6 shrink-0 text-[#235c4f]" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a3328]" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-[#708079]">
                  {pages.length} {pages.length === 1 ? "page" : "pages"} · Up to 50 MB
                </p>
              </div>
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
              {validationError && (
                <p
                  className="border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]"
                  role="alert"
                >
                  {validationError}
                </p>
              )}

              <div className="grid gap-5 border-b border-[#e5ece8] pb-5 md:grid-cols-2">
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-semibold text-[#263e36]">
                    Position
                  </legend>
                  <PositionSelector
                    value={options.position}
                    onChange={(value) => updateOption("position", value)}
                    disabled={isBusy}
                  />
                </fieldset>

                <fieldset className="min-w-0">
                  <legend className="mb-2 text-sm font-semibold text-[#263e36]">
                    Format
                  </legend>
                  <div className="flex flex-wrap gap-2">
                    {PAGE_NUMBER_FORMATS.map((format) => (
                      <button
                        key={format}
                        type="button"
                        aria-pressed={options.format === format}
                        onClick={() => updateOption("format", format)}
                        disabled={isBusy}
                        className={`min-h-10 border px-3 text-sm ${
                          options.format === format
                            ? "border-[#235c4f] bg-[#eaf3ed] text-[#173d34]"
                            : "border-[#dce5e0] bg-white text-[#52675e]"
                        }`}
                      >
                        {FORMAT_LABELS[format]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block text-sm font-semibold text-[#263e36]">
                  Page range
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-normal text-[#708079]">From</span>
                    <input
                      type="number"
                      min="1"
                      max={pages.length}
                      aria-label="Range from page"
                      value={options.fromPage}
                      onChange={(event) => updateOption("fromPage", event.target.value)}
                      className="min-h-10 w-20 border border-[#b8c9c0] px-2 text-sm font-normal"
                    />
                    <span className="text-xs font-normal text-[#708079]">to</span>
                    <input
                      type="number"
                      min="1"
                      max={pages.length}
                      aria-label="Range to page"
                      value={options.toPage}
                      onChange={(event) => updateOption("toPage", event.target.value)}
                      className="min-h-10 w-20 border border-[#b8c9c0] px-2 text-sm font-normal"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold text-[#263e36]">
                    Start number
                    <input
                      type="number"
                      min="1"
                      aria-label="Start number"
                      value={options.startNumber}
                      onChange={(event) => updateOption("startNumber", event.target.value)}
                      className="mt-2 min-h-10 w-full border border-[#b8c9c0] px-3 text-sm font-normal"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#263e36]">
                    Font size (pt)
                    <input
                      type="number"
                      min="8"
                      max="36"
                      aria-label="Font size"
                      value={options.fontSize}
                      onChange={(event) =>
                        updateOption(
                          "fontSize",
                          event.target.value === "" ? "" : Number(event.target.value)
                        )
                      }
                      className="mt-2 min-h-10 w-full border border-[#b8c9c0] px-3 text-sm font-normal"
                    />
                  </label>
                </div>

                <label className="block text-sm font-semibold text-[#263e36]">
                  Font
                  <select
                    aria-label="Font"
                    value={options.font}
                    onChange={(event) => updateOption("font", event.target.value)}
                    className="mt-2 min-h-10 w-full border border-[#b8c9c0] bg-white px-3 text-sm font-normal"
                  >
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times">Times</option>
                    <option value="Courier">Courier</option>
                  </select>
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block text-sm font-semibold text-[#263e36]">
                    Text color
                    <input
                      type="color"
                      aria-label="Text color"
                      value={options.color}
                      onChange={(event) => updateOption("color", event.target.value)}
                      className="mt-2 h-10 w-full cursor-pointer border border-[#b8c9c0] bg-white p-1"
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#263e36]">
                    Margin (pt)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      aria-label="Margin in points"
                      value={options.margin}
                      onChange={(event) =>
                        updateOption(
                          "margin",
                          event.target.value === "" ? "" : Number(event.target.value)
                        )
                      }
                      className="mt-2 min-h-10 w-full border border-[#b8c9c0] px-3 text-sm font-normal"
                    />
                  </label>
                </div>

                <div className="flex flex-col gap-3">
                  <label className="inline-flex min-h-10 items-center gap-2 text-sm text-[#52675e]">
                    <input
                      type="checkbox"
                      checked={options.skipFirstPage}
                      onChange={(event) =>
                        updateOption("skipFirstPage", event.target.checked)
                      }
                      disabled={isBusy}
                    />
                    Skip first page (cover)
                  </label>
                  <label className="inline-flex min-h-10 items-center gap-2 text-sm text-[#52675e]">
                    <input
                      type="checkbox"
                      checked={options.mirrorOddEven}
                      onChange={(event) =>
                        updateOption("mirrorOddEven", event.target.checked)
                      }
                      disabled={isBusy}
                    />
                    Mirror left/right on odd and even pages
                  </label>
                </div>
              </div>

              {notice && (
                <p className="text-sm text-[#235c4f]" role="status">
                  {notice}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                {pages.map((page, index) => (
                  <PagePreview
                    key={page.id}
                    page={page}
                    pageData={pageData[index]}
                    pdfDoc={pdfDoc}
                    options={options}
                    pageCount={pages.length}
                    lazy={lazyPreviews}
                    onRenderState={recordRenderingState}
                    onRenderError={handleThumbnailError}
                  />
                ))}
              </div>

              <div className="flex flex-col gap-2 border-t border-[#e5ece8] pt-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-xs text-[#708079]">
                  {pageRange.pages.length} of {pages.length} pages will be numbered.
                  Preview updates as you change the options.
                </p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExport}
                  disabled={isBusy || Boolean(validationError)}
                  isLoading={isExporting}
                  icon={<FaDownload />}
                >
                  {isExporting ? "Creating PDF..." : "Download numbered PDF"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
