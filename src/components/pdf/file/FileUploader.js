// src/components/pdf/file/FileUploader.js
"use client";

import React, { useId, useRef, useState } from "react";
import { useAdPauseWhile } from "@/hooks/useAdPause";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const isFileAccepted = (file, acceptStr) => {
  if (!acceptStr || acceptStr === "*") return true;
  const acceptedTypes = acceptStr.split(",").map((s) => s.trim().toLowerCase());
  const fileType = (file.type || "").toLowerCase();
  const fileName = (file.name || "").toLowerCase();

  return acceptedTypes.some((type) => {
    if (type.startsWith(".")) {
      return fileName.endsWith(type);
    }
    if (type.endsWith("/*")) {
      const category = type.slice(0, -2);
      return fileType.startsWith(category);
    }
    return fileType === type;
  });
};

const FileUploader = ({
  onUpload,
  accept = "application/pdf,.pdf",
  multiple = true,
  fileTypeLabel,
  titleText,
  maxFileSizeBytes = MAX_FILE_SIZE_BYTES,
  maxFiles,
  allowPartial = false,
  onError,
}) => {
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");
  const dragDepth = useRef(0);
  useAdPauseWhile("file-drag", dragActive);
  useAdPauseWhile("uploader-error", Boolean(error));

  const isImageMode = accept.includes("image") || accept.includes("jpg") || accept.includes("png");
  const typeLabel = fileTypeLabel || (isImageMode ? "JPG image" : "PDF file");

  const handleDragEnter = (event) => {
    event.preventDefault();
    if (!event.dataTransfer.types.includes("Files")) return;
    dragDepth.current += 1;
    setDragActive(true);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepth.current = 0;
    setDragActive(false);
    validateAndUpload(e.dataTransfer.files);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragActive(false);
  };

  const handleChange = (e) => {
    validateAndUpload(e.target.files);
    e.target.value = "";
  };

  const validateAndUpload = (fileList) => {
    let files = Array.from(fileList);
    if (!files.length) return;

    if (!multiple && files.length > 1) {
      const msg = `Choose one ${typeLabel} at a time.`;
      setError(msg);
      onError?.(msg);
      return;
    }

    if (!allowPartial) {
      if (maxFiles && files.length > maxFiles) {
        const msg = `Maximum ${maxFiles} files allowed at a time.`;
        setError(msg);
        onError?.(msg);
        return;
      }

      const invalidSizeFile = files.find((file) => file.size > maxFileSizeBytes);
      if (invalidSizeFile) {
        const maxFileSizeMb = Math.floor(maxFileSizeBytes / (1024 * 1024));
        const msg = `${invalidSizeFile.name} exceeds the ${maxFileSizeMb} MB file limit.`;
        setError(msg);
        onError?.(msg);
        return;
      }

      const invalidTypeFile = files.find((file) => !isFileAccepted(file, accept));
      if (invalidTypeFile) {
        const msg = `${invalidTypeFile.name} is not a valid ${typeLabel}.`;
        setError(msg);
        onError?.(msg);
        return;
      }

      setError("");
      onUpload(files);
      return;
    }

    // allowPartial mode (allows valid files to process while reporting skipped files)
    let notice = "";
    if (maxFiles && files.length > maxFiles) {
      notice = `Maximum ${maxFiles} files allowed at once. Only the first ${maxFiles} files were kept. `;
      files = files.slice(0, maxFiles);
    }

    const validFiles = [];
    const skippedErrors = [];

    for (const file of files) {
      if (file.size > maxFileSizeBytes) {
        const maxFileSizeMb = Math.floor(maxFileSizeBytes / (1024 * 1024));
        skippedErrors.push(`${file.name} exceeds ${maxFileSizeMb} MB limit`);
      } else if (!isFileAccepted(file, accept)) {
        skippedErrors.push(`${file.name} is not a valid ${typeLabel}`);
      } else {
        validFiles.push(file);
      }
    }

    if (skippedErrors.length > 0 || notice) {
      const combinedMsg = `${notice}${
        skippedErrors.length > 0
          ? `${skippedErrors.length} file(s) skipped: ${skippedErrors.slice(0, 2).join(", ")}${
              skippedErrors.length > 2 ? ` (+${skippedErrors.length - 2} more)` : ""
            }.`
          : ""
      }`.trim();
      setError(combinedMsg);
      onError?.(combinedMsg);
    } else {
      setError("");
    }

    if (validFiles.length > 0) {
      onUpload(validFiles, skippedErrors.length > 0 || notice ? combinedMsg : "");
    }
  };

  const displayTitle = titleText
    ? titleText
    : dragActive
    ? `Drop ${typeLabel}s to add them`
    : `Drop ${typeLabel}s here`;

  return (
    <div
      data-dropzone="true"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragOver={(event) => {
        event.preventDefault();
        if (event.dataTransfer.types.includes("Files")) {
          event.dataTransfer.dropEffect = "copy";
        }
      }}
      className={`border border-dashed p-4 text-center transition-colors sm:p-10 ${
        dragActive
          ? "border-[#235c4f] bg-[#eaf3ed]"
          : "border-[#b8c9c0] bg-white hover:border-[#7e9b8c]"
      }`}
      aria-label={`${typeLabel} drop area`}
    >
      <div className="flex flex-col items-center justify-center">
        <div className="mb-3 flex size-12 items-center justify-center bg-[#eaf3ed] text-[#235c4f]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <p className="mb-1 text-[#263e36]" aria-live="polite">
          <span className="font-semibold">{displayTitle}</span>
        </p>
        <p className="mb-4 text-sm text-[#708079]">or choose from your device</p>
        <div>
          <input
            id={inputId}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleChange}
            aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`}
            aria-invalid={Boolean(error)}
            className="peer sr-only"
          />
          <label
            htmlFor={inputId}
            className="inline-flex min-h-11 cursor-pointer items-center justify-center bg-[#173d34] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#245b4c] peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-[#235c4f]"
          >
            Browse files
          </label>
        </div>
        <p id={`${inputId}-help`} className="mt-4 text-xs text-[#708079]">
          {multiple
            ? `${typeLabel}s up to ${Math.floor(maxFileSizeBytes / (1024 * 1024))} MB each`
            : `One ${typeLabel} up to ${Math.floor(maxFileSizeBytes / (1024 * 1024))} MB`}
        </p>
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-3 text-sm text-[#a13c2f]"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
