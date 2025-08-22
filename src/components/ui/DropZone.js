// components/DropZone.js
"use client";

import React, { useRef, useState, useEffect } from "react";
import { FaCloudUploadAlt, FaTimes, FaFilePdf } from "react-icons/fa";

const DropZone = ({
  onUpload,
  accept = "application/pdf",
  multiple = true,
  fileTypeName = "PDF",
  validator = null,
  maxSizeMB = 10,
  position = "center",
  theme = "light",
}) => {
  const [isActive, setIsActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const dropzoneRef = useRef(null);

  // Theme configuration
  const themes = {
    light: {
      bg: "bg-white/95",
      text: "text-gray-800",
      secondaryText: "text-gray-600",
      iconBg: "bg-blue-50",
      iconColor: "text-blue-400",
      border: "border-blue-200",
      close: "text-gray-500 hover:bg-gray-100",
      dropArea: "bg-blue-50 border-blue-200",
    },
    dark: {
      bg: "bg-gray-900/95",
      text: "text-white",
      secondaryText: "text-gray-300",
      iconBg: "bg-blue-900/30",
      iconColor: "text-blue-300",
      border: "border-blue-700",
      close: "text-gray-300 hover:bg-gray-800",
      dropArea: "bg-blue-900/30 border-blue-700",
    },
    blue: {
      bg: "bg-blue-600/95",
      text: "text-white",
      secondaryText: "text-blue-100",
      iconBg: "bg-white/20",
      iconColor: "text-white",
      border: "border-blue-400",
      close: "text-white hover:bg-blue-700",
      dropArea: "bg-white/20 border-blue-400",
    },
  };

  const currentTheme = themes[theme] || themes.light;

  // Position classes
  const positionClasses = {
    center: "items-center justify-center",
    top: "items-start justify-center pt-20",
    bottom: "items-end justify-center pb-20",
  };

  useEffect(() => {
    const handleDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((prev) => prev + 1);
      if (dragCounter === 0) {
        setIsActive(true);
      }
    };

    const handleDragLeave = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setDragCounter((prev) => prev - 1);
      if (dragCounter === 1) {
        setIsActive(false);
        setDragCounter(0);
      }
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsActive(false);
      setDragCounter(0);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        validateAndUpload(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    };

    // Add event listeners to the entire document
    document.addEventListener("dragenter", handleDragEnter);
    document.addEventListener("dragleave", handleDragLeave);
    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("drop", handleDrop);

    // Cleanup
    return () => {
      document.removeEventListener("dragenter", handleDragEnter);
      document.removeEventListener("dragleave", handleDragLeave);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("drop", handleDrop);
    };
  }, [dragCounter]);

  // Default validator function if none provided
  const defaultValidator = (file) => {
    const isTypeValid =
      file.type === accept ||
      (accept === "application/pdf" &&
        file.name.toLowerCase().endsWith(".pdf"));
    const isSizeValid = file.size <= maxSizeMB * 1024 * 1024;
    return isTypeValid && isSizeValid;
  };

  const validateAndUpload = (fileList) => {
    const files = Array.from(fileList);
    const validate = validator || defaultValidator;

    // Check files using provided validator or default
    const validFiles = files.filter(validate);
    const invalidFiles = files.filter((file) => !validate(file));

    if (invalidFiles.length > 0) {
      alert(
        `Only ${fileTypeName} files (max ${maxSizeMB}MB) are accepted. ${invalidFiles.length} file(s) were ignored.`
      );
    }

    if (validFiles.length > 0) {
      onUpload(validFiles);
    }
  };

  const handleClose = () => {
    setIsActive(false);
    setDragCounter(0);
  };

  if (!isActive) return null;

  return (
    <div
      ref={dropzoneRef}
      className={`fixed inset-0 z-50 ${currentTheme.bg} backdrop-blur-sm flex ${positionClasses[position]} p-4`}
    >
      {/* Close button */}
      <button
        onClick={handleClose}
        className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${currentTheme.close}`}
      >
        <FaTimes className="h-6 w-6" />
      </button>

      {/* Dropzone content */}
      <div className="text-center max-w-md">
        <div className="mb-6">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 ${currentTheme.iconBg} rounded-full mb-4`}
          >
            <FaCloudUploadAlt
              className={`h-12 w-12 ${currentTheme.iconColor}`}
            />
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${currentTheme.text}`}>
            Drop Your Files Here
          </h2>
          <p className={currentTheme.secondaryText}>
            Release to upload your {fileTypeName} files
          </p>
        </div>

        <div
          className={`rounded-xl p-6 border-2 border-dashed ${currentTheme.dropArea}`}
        >
          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-full mb-3 ${currentTheme.iconBg}`}>
              <FaFilePdf className={`h-8 w-8 ${currentTheme.iconColor}`} />
            </div>
            <p className={`text-sm font-medium mb-1 ${currentTheme.text}`}>
              {fileTypeName} Files Only
            </p>
            <p className={`text-xs ${currentTheme.secondaryText}`}>
              Max file size: {maxSizeMB}MB
            </p>
            <p className={`text-xs mt-1 ${currentTheme.secondaryText}`}>
              Drag and drop your files anywhere on the screen
            </p>
          </div>
        </div>

        <div
          className={`mt-6 flex items-center justify-center space-x-2 text-sm ${currentTheme.secondaryText}`}
        >
          <div className="flex space-x-1">
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            ></div>
            <div
              className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            ></div>
          </div>
          <span>Ready to accept files</span>
        </div>
      </div>
    </div>
  );
};

export default DropZone;
