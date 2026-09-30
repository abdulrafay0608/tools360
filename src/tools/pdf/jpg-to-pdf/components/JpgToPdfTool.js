"use client";

import React, { useState, useCallback, useRef } from "react";
import { saveAs } from "file-saver";
import { FaDownload, FaRedo, FaFilePdf, FaImage, FaSlidersH, FaLock, FaFileArchive } from "react-icons/fa";
import FileUploader from "@/components/pdf/file/FileUploader";
import Button from "@/components/ui/Button";
import ImagePreviewGrid from "./ImagePreviewGrid";
import JpgToPdfOptionsBar from "./JpgToPdfOptionsBar";
import { convertImagesToSinglePdf, convertImagesToZipPdfs } from "../jpgToPdfUtils";

export default function JpgToPdfTool() {
  const [images, setImages] = useState([]);
  const [options, setOptions] = useState({
    outputMode: "zip",
    orientation: "auto",
    pageSize: "a4",
    margin: "small",
  });
  const [filename, setFilename] = useState("converted-images.pdf");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedBlob, setConvertedBlob] = useState(null);
  const [error, setError] = useState("");

  const hiddenInputRef = useRef(null);

  /* ── Upload handlers ── */
  const handleUpload = useCallback((uploadedFiles) => {
    const validImages = Array.from(uploadedFiles).filter((file) => {
      const isImg =
        file.type.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(file.name);
      return isImg;
    });

    if (validImages.length === 0) {
      setError("Please select valid image files (JPG, PNG, WEBP).");
      return;
    }

    const newItems = validImages.map((file, idx) => ({
      id: `${file.name}-${Date.now()}-${idx}`,
      file,
      rotation: 0,
    }));

    setImages((prev) => [...prev, ...newItems]);
    setError("");
    setConvertedBlob(null);
  }, []);

  const handleAddMore = () => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.click();
    }
  };

  const handleHiddenInputChange = (e) => {
    if (e.target.files) {
      handleUpload(e.target.files);
    }
    e.target.value = "";
  };

  /* ── Image manipulators ── */
  const handleRotate = useCallback((index) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        rotation: (updated[index].rotation + 90) % 360,
      };
      return updated;
    });
  }, []);

  const handleMove = useCallback((fromIndex, toIndex) => {
    setImages((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  }, []);

  const handleRemove = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setConvertedBlob(null);
  }, []);

  const handleClearAll = useCallback(() => {
    setImages([]);
    setConvertedBlob(null);
    setError("");
  }, []);

  const handleOptionChange = useCallback((key, value) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }, []);

  /* ── Conversion execution ── */
  const isZipMode = options.outputMode === "zip" && images.length > 1;

  const handleConvert = async () => {
    if (images.length === 0) return;
    setIsConverting(true);
    setError("");
    try {
      let blob;
      if (isZipMode) {
        blob = await convertImagesToZipPdfs(images, options);
      } else {
        blob = await convertImagesToSinglePdf(images, options);
      }
      setConvertedBlob(blob);
    } catch (err) {
      console.error("Conversion failed:", err);
      setError(err.message || "Failed to convert images to PDF. Please try again.");
    } finally {
      setIsConverting(false);
    }
  };

  const handleDownload = () => {
    if (!convertedBlob) return;
    if (isZipMode) {
      saveAs(convertedBlob, "converted-pdfs.zip");
    } else {
      const saveName = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
      saveAs(convertedBlob, saveName || "converted-images.pdf");
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#e5ece8] pb-4">
        <h2 className="text-xl font-semibold text-[#1a3328] sm:text-2xl">
          JPG to PDF Converter
        </h2>
        <p className="mt-1 text-sm text-[#52675e]">
          Convert JPG, PNG, or WEBP images into individual PDFs (ZIP) or a single combined PDF document. Adjust orientation, margins, and page order easily. 100% private in your browser.
        </p>
      </div>

      <input
        ref={hiddenInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        className="hidden"
        onChange={handleHiddenInputChange}
      />

      {error && (
        <div className="rounded-sm border border-[#f3cfc8] bg-[#fdf4f3] px-4 py-3 text-sm text-[#a13c2f]" role="alert">
          {error}
        </div>
      )}

      {/* State 1: No images uploaded */}
      {images.length === 0 && (
        <div className="space-y-8">
          <FileUploader
            onUpload={handleUpload}
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            multiple
            fileTypeLabel="JPG image"
            titleText="Drop JPG image / files here"
          />

          {/* Feature Highlights */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                title: "Multiple Formats",
                desc: "Supports JPG, PNG, WEBP, and BMP images seamlessly.",
                icon: FaImage,
              },
              {
                title: "ZIP & Single PDF Modes",
                desc: "Export each image as a separate PDF in ZIP format or combine into 1 document.",
                icon: FaSlidersH,
              },
              {
                title: "Private & Secure",
                desc: "All image processing is done locally in your browser context.",
                icon: FaLock,
              },
            ].map(({ title, desc, icon: Icon }) => (
              <div
                key={title}
                className="flex flex-col gap-2 rounded-sm border border-[#dce5e0] bg-[#f8faf9] p-4 transition-colors hover:bg-white"
              >
                <div className="flex h-9 w-9 items-center justify-center bg-[#e6f0eb] text-[#235c4f]">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-[#263e36]">{title}</p>
                <p className="text-xs leading-5 text-[#627a6e]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* State 2: Images uploaded but not yet converted / editing */}
      {images.length > 0 && !convertedBlob && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Main image grid */}
          <ImagePreviewGrid
            images={images}
            onRotate={handleRotate}
            onMove={handleMove}
            onRemove={handleRemove}
            onClearAll={handleClearAll}
            onAddMore={handleAddMore}
          />

          {/* Settings panel */}
          <JpgToPdfOptionsBar
            options={options}
            onOptionsChange={handleOptionChange}
            filename={filename}
            onFilenameChange={setFilename}
            onConvert={handleConvert}
            isConverting={isConverting}
            imageCount={images.length}
          />
        </div>
      )}

      {/* State 3: Conversion complete state */}
      {convertedBlob && (
        <div className="mx-auto max-w-xl text-center space-y-5 rounded-sm border border-[#dce5e0] bg-white p-6 shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e6f0eb] text-[#235c4f]">
            {isZipMode ? <FaFileArchive className="h-7 w-7" /> : <FaFilePdf className="h-7 w-7" />}
          </div>

          <div>
            <h3 className="text-lg font-bold text-[#1a3328]">
              {isZipMode ? "Your PDF ZIP Archive is ready!" : "Your PDF Document is ready!"}
            </h3>
            <p className="mt-1 text-xs text-[#708079]">
              {isZipMode
                ? `Converted ${images.length} images into individual PDFs inside a ZIP archive.`
                : `Successfully converted ${images.length} image${images.length !== 1 ? "s" : ""} into a single PDF document.`}
            </p>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleDownload}
              icon={<FaDownload />}
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              {isZipMode ? "Download ZIP Archive" : "Download PDF Document"}
            </Button>

            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={handleClearAll}
              icon={<FaRedo />}
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              Convert More Images
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
