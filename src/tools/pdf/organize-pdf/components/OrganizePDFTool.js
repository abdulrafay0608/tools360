"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheckSquare,
  FaCopy,
  FaDownload,
  FaFilePdf,
  FaGripVertical,
  FaRedo,
  FaSquare,
  FaTrash,
  FaUndo,
} from "react-icons/fa";
import Button from "@/components/ui/Button";
import FileUploader from "@/components/pdf/file/FileUploader";
import usePDFJS from "@/hooks/usePDFJS";
import { useAdPauseWhile } from "@/hooks/useAdPause";
import {
  createPageEntries,
  duplicatePage,
  exportPdfPages,
  getActivePageCount,
  getOrganizedFilename,
  getPdfLoadErrorMessage,
  markPagesDeleted,
  MAX_ORGANIZE_FILE_SIZE_BYTES,
  movePage,
  movePageBy,
  pushHistory,
  rotatePages,
} from "../organizePdfUtils";

function PageThumbnail({
  page,
  pdfDoc,
  lazy,
  onRenderState,
  onRenderError,
}) {
  const containerRef = useRef(null);
  const [shouldRender, setShouldRender] = useState(!lazy);
  const [rendered, setRendered] = useState(false);

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

    (async () => {
      try {
        const pdfPage = await pdfDoc.getPage(page.sourceIndex + 1);
        if (!isActive || !canvas) return;
        const viewport = pdfPage.getViewport({ scale: 0.28 });
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
  }, [onRenderError, onRenderState, page.id, page.sourceIndex, pdfDoc, shouldRender]);

  return (
    <div
      ref={containerRef}
      className="flex aspect-[3/4] items-center justify-center overflow-hidden bg-[#f4f7f5] p-2"
    >
      <canvas
        aria-label={`Preview of source page ${page.sourceIndex + 1}`}
        className="max-h-full max-w-full object-contain"
        style={{ transform: `rotate(${page.rotation}deg)` }}
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

function SortablePageCard({
  page,
  index,
  pageCount,
  pdfDoc,
  lazy,
  selected,
  onSelect,
  onRenderState,
  onRenderError,
  onDelete,
  onRotate,
  onDuplicate,
  onMove,
  isBusy,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id, disabled: isBusy });

  return (
    <article
      ref={setNodeRef}
      data-page-id={page.id}
      data-page-source={page.sourceIndex + 1}
      data-page-deleted={page.deleted ? "true" : "false"}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`relative min-w-0 border bg-white p-2 transition-shadow sm:p-3 ${
        selected ? "border-[#235c4f] ring-1 ring-[#235c4f]" : "border-[#dce5e0]"
      } ${page.deleted ? "opacity-50" : ""} ${
        isDragging ? "z-10 shadow-lg" : ""
      }`}
    >
      {page.deleted && (
        <div className="absolute inset-0 z-[1] flex items-center justify-center bg-white/60">
          <span className="border border-[#a13c2f] bg-white px-2 py-1 text-xs font-semibold text-[#a13c2f]">
            Marked for deletion
          </span>
        </div>
      )}

      <div className="mb-2 flex items-center justify-between gap-1">
        <button
          type="button"
          aria-label={`Select page ${index + 1}`}
          aria-pressed={selected}
          onClick={(event) => onSelect(page.id, index, event.shiftKey)}
          className="inline-flex min-h-9 min-w-9 items-center gap-1 text-xs font-semibold text-[#263e36] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f]"
        >
          {selected ? (
            <FaCheckSquare aria-hidden="true" className="text-[#235c4f]" />
          ) : (
            <FaSquare aria-hidden="true" className="text-[#9aaca3]" />
          )}
          Page {index + 1}
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Drag page ${index + 1}`}
          title="Drag to reorder"
          className="inline-flex min-h-9 min-w-9 touch-none items-center justify-center text-[#708079] hover:bg-[#f4f7f5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#235c4f]"
        >
          <FaGripVertical aria-hidden="true" />
        </button>
      </div>

      <div className="relative">
        <PageThumbnail
          page={page}
          pdfDoc={pdfDoc}
          lazy={lazy}
          onRenderState={onRenderState}
          onRenderError={onRenderError}
        />
      </div>

      <p className="mt-2 truncate text-center text-[11px] text-[#708079]">
        Original page {page.sourceIndex + 1}
        {page.rotation ? ` · ${page.rotation}°` : ""}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => onMove(page.id, -1)}
          disabled={index === 0 || isBusy}
          aria-label={`Move page ${index + 1} left`}
          className="min-h-9 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          <FaArrowLeft className="mr-1 inline" aria-hidden="true" />
          Move left
        </button>
        <button
          type="button"
          onClick={() => onMove(page.id, 1)}
          disabled={index === pageCount - 1 || isBusy}
          aria-label={`Move page ${index + 1} right`}
          className="min-h-9 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          Move right
          <FaArrowRight className="ml-1 inline" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => onRotate(page.id, -90)}
          disabled={page.deleted || isBusy}
          aria-label={`Rotate page ${index + 1} left`}
          className="min-h-9 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          <FaUndo className="mr-1 inline" aria-hidden="true" />
          Rotate left
        </button>
        <button
          type="button"
          onClick={() => onRotate(page.id, 90)}
          disabled={page.deleted || isBusy}
          aria-label={`Rotate page ${index + 1} right`}
          className="min-h-9 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          <FaRedo className="mr-1 inline" aria-hidden="true" />
          Rotate right
        </button>
        <button
          type="button"
          onClick={() => onDuplicate(page.id)}
          disabled={page.deleted || isBusy}
          aria-label={`Duplicate page ${index + 1}`}
          className="min-h-9 border border-[#dce5e0] text-xs text-[#52675e] hover:bg-[#f4f7f5] disabled:opacity-40"
        >
          <FaCopy className="mr-1 inline" aria-hidden="true" />
          Duplicate
        </button>
        <button
          type="button"
          onClick={() => onDelete(page.id)}
          disabled={page.deleted || isBusy}
          aria-label={`Delete page ${index + 1}`}
          className="min-h-9 border border-[#f3cfc8] text-xs text-[#a13c2f] hover:bg-[#fdf4f3] disabled:opacity-40"
        >
          <FaTrash className="mr-1 inline" aria-hidden="true" />
          Delete
        </button>
      </div>
    </article>
  );
}

export default function OrganizePDFTool() {
  const [file, setFile] = useState(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [sourceBytes, setSourceBytes] = useState(null);
  const [pages, setPages] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [renderingPages, setRenderingPages] = useState(() => new Set());
  const [notice, setNotice] = useState("");
  const anchorIndexRef = useRef(null);
  const nextDuplicateIdRef = useRef(0);
  const activeLoadingTaskRef = useRef(null);
  const { pdfjs, isLoading: isPDFJSLoading } = usePDFJS();

  const hasDocument = Boolean(file && pdfDoc);
  const isBusy = isLoadingDocument || isExporting;
  const lazyThumbnails = pages.length >= 100;
  useAdPauseWhile(
    "organize-processing",
    isBusy || renderingPages.size > 0
  );
  useAdPauseWhile("organize-dragging", isDragging);
  useAdPauseWhile("organize-error", Boolean(error));
  useAdPauseWhile("organize-empty", !hasDocument);

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
        setSourceBytes(bytes);
        setPdfDoc(documentProxy);
        setPages(createPageEntries(documentProxy.numPages));
        setSelectedIds([]);
        setHistory([]);
      } catch (loadError) {
        if (isActive) {
          setError(getPdfLoadErrorMessage(loadError));
          setPdfDoc(null);
          setSourceBytes(null);
          setPages([]);
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

  const changePages = useCallback(
    (operation) => {
      const next = operation(pages);
      if (next === pages) return;
      setHistory((past) => pushHistory(past, pages));
      setPages(next);
      setNotice("");
    },
    [pages]
  );

  const selectedActiveIds = selectedIds.filter((id) =>
    pages.some((page) => page.id === id && !page.deleted)
  );
  const activePageCount = getActivePageCount(pages);
  const deletedPageCount = pages.length - activePageCount;
  const allPagesSelected =
    activePageCount > 0 && selectedActiveIds.length === activePageCount;

  const handleSelectPage = (pageId, index, shiftKey) => {
    if (shiftKey && anchorIndexRef.current !== null) {
      const start = Math.min(anchorIndexRef.current, index);
      const end = Math.max(anchorIndexRef.current, index);
      const rangeIds = pages
        .slice(start, end + 1)
        .filter((page) => !page.deleted)
        .map((page) => page.id);
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

  const toggleSelectAll = () => {
    setSelectedIds(
      allPagesSelected
        ? []
        : pages.filter((page) => !page.deleted).map((page) => page.id)
    );
    anchorIndexRef.current = null;
  };

  const deletePages = (pageIds) => {
    if (
      pageIds.filter((id) => pages.some((page) => page.id === id && !page.deleted))
        .length >= activePageCount
    ) {
      setError("Keep at least one page. Select another page before deleting these.");
      return;
    }
    changePages((current) => markPagesDeleted(current, pageIds));
    setSelectedIds([]);
  };

  const rotatePageIds = (pageIds, rotation) => {
    changePages((current) => rotatePages(current, pageIds, rotation));
  };

  const duplicatePageById = (pageId) => {
    nextDuplicateIdRef.current += 1;
    const newId = `duplicate-${nextDuplicateIdRef.current}`;
    changePages((current) => duplicatePage(current, pageId, newId));
  };

  const handleUndo = () => {
    if (!history.length) return;
    setPages(history[history.length - 1]);
    setHistory((past) => past.slice(0, -1));
    setSelectedIds([]);
    setError("");
    setNotice("Last page change undone.");
  };

  const handleReset = () => {
    if (!pdfDoc) return;
    changePages((current) => {
      const original = createPageEntries(pdfDoc.numPages);
      if (
        current.length === original.length &&
        current.every(
          (page, index) =>
            page.sourceIndex === original[index].sourceIndex &&
            page.rotation === 0 &&
            !page.deleted
        )
      ) {
        return current;
      }
      return original;
    });
    setSelectedIds([]);
  };

  const handleDragEnd = ({ active, over }) => {
    setIsDragging(false);
    if (over && active.id !== over.id) {
      changePages((current) => movePage(current, active.id, over.id));
    }
  };

  const handleExport = async (extractSelected = false) => {
    if (!sourceBytes || isExporting) return;
    if (activePageCount === 0) {
      setError("There are no pages left to export. Undo or reset to restore pages.");
      return;
    }

    const exportPages = extractSelected
      ? pages.filter(
          (page) => selectedActiveIds.includes(page.id) && !page.deleted
        )
      : pages;
    if (extractSelected && exportPages.length === 0) {
      setError("Select at least one active page to extract.");
      return;
    }

    setIsExporting(true);
    setError("");
    setNotice("");
    try {
      const bytes = await exportPdfPages(sourceBytes, exportPages);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = getOrganizedFilename(file.name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(
        extractSelected
          ? `${exportPages.length} selected page${exportPages.length === 1 ? "" : "s"} exported.`
          : `${activePageCount} page${activePageCount === 1 ? "" : "s"} exported.`
      );
    } catch (exportError) {
      console.error("PDF export failed:", exportError);
      setError(
        exportError.message ||
          "The organized PDF could not be created. Please try again."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleUpload = useCallback((files) => {
    const pdfFile = files.find(
      (candidate) =>
        candidate.type === "application/pdf" ||
        candidate.name.toLowerCase().endsWith(".pdf")
    );
    if (!pdfFile) {
      setError("Choose a PDF file to organize.");
      return;
    }
    setFile(pdfFile);
    setPdfDoc(null);
    setSourceBytes(null);
    setPages([]);
    setSelectedIds([]);
    setHistory([]);
    setError("");
    setNotice("");
  }, []);

  const handleChooseAnother = () => {
    activeLoadingTaskRef.current?.destroy?.();
    setFile(null);
    setPdfDoc(null);
    setSourceBytes(null);
    setPages([]);
    setSelectedIds([]);
    setHistory([]);
    setError("");
    setNotice("");
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <div className="p-4 sm:p-6">
      {error && (
        <div
          className="mb-4 rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]"
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
          maxFileSizeBytes={MAX_ORGANIZE_FILE_SIZE_BYTES}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 border-b border-[#e5ece8] pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <FaFilePdf
                className="h-6 w-6 shrink-0 text-[#235c4f]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a3328]" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-[#708079]">
                  {activePageCount} of {pages.length} pages · Up to 50 MB
                  {deletedPageCount > 0
                    ? ` · ${deletedPageCount} marked for deletion`
                    : ""}
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
              <div className="flex flex-wrap items-center gap-2 border-b border-[#e5ece8] pb-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                  disabled={isBusy || activePageCount === 0}
                >
                  {allPagesSelected ? "Select none" : "Select all"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={isBusy || history.length === 0}
                  icon={<FaUndo />}
                  iconPosition="left"
                >
                  Undo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={isBusy || history.length === 0}
                  icon={<FaRedo />}
                  iconPosition="left"
                >
                  Reset
                </Button>
                <span className="text-xs text-[#708079]" aria-live="polite">
                  {selectedActiveIds.length} selected
                </span>

                {selectedActiveIds.length > 0 && (
                  <div className="flex w-full flex-wrap gap-2 border-t border-[#eef2ef] pt-3 sm:w-auto sm:border-0 sm:pt-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => rotatePageIds(selectedActiveIds, -90)}
                      disabled={isBusy}
                      icon={<FaUndo />}
                      iconPosition="left"
                    >
                      Rotate selected left
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => rotatePageIds(selectedActiveIds, 90)}
                      disabled={isBusy}
                      icon={<FaRedo />}
                      iconPosition="left"
                    >
                      Rotate selected right
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => deletePages(selectedActiveIds)}
                      disabled={isBusy}
                      icon={<FaTrash />}
                      iconPosition="left"
                    >
                      Delete selected
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleExport(true)}
                      disabled={isBusy}
                      icon={<FaDownload />}
                      iconPosition="left"
                    >
                      Extract selected pages
                    </Button>
                  </div>
                )}
              </div>

              {activePageCount === 0 && (
                <p className="rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]" role="alert">
                  No pages remain. Undo or reset before exporting.
                </p>
              )}
              {notice && (
                <p className="text-sm text-[#235c4f]" role="status">
                  {notice}
                </p>
              )}

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={() => {
                  setNotice("");
                  setIsDragging(true);
                }}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setIsDragging(false)}
              >
                <SortableContext
                  items={pages.map((page) => page.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                    {pages.map((page, index) => (
                      <SortablePageCard
                        key={page.id}
                        page={page}
                        index={index}
                        pageCount={pages.length}
                        pdfDoc={pdfDoc}
                        lazy={lazyThumbnails}
                        selected={selectedActiveIds.includes(page.id)}
                        onSelect={handleSelectPage}
                        onRenderState={recordRenderingState}
                        onRenderError={handleThumbnailError}
                        onDelete={(id) => deletePages([id])}
                        onRotate={(id, rotation) => rotatePageIds([id], rotation)}
                        onDuplicate={duplicatePageById}
                        onMove={(id, direction) =>
                          changePages((current) => movePageBy(current, id, direction))
                        }
                        isBusy={isBusy}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="flex flex-col gap-2 border-t border-[#e5ece8] pt-4 sm:flex-row sm:items-center">
                <p className="flex-1 text-xs text-[#708079]">
                  Drag pages to reorder, or use the move buttons. Changes are applied when you export.
                </p>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={() => handleExport(false)}
                  disabled={isBusy || activePageCount === 0}
                  icon={<FaDownload />}
                  iconPosition="left"
                >
                  {isExporting ? "Creating PDF..." : "Download organized PDF"}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
