// src/app/tools/pdf/merge-pdf/components/FileUploader.js
import React from "react";

const FileUploader = ({ onUpload }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    onUpload(e.dataTransfer.files);
  };

  const handleChange = (e) => {
    onUpload(e.target.files);
    e.target.value = ""; // Reset input
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center cursor-pointer transition-colors hover:bg-blue-50"
    >
      <div className="flex flex-col items-center justify-center">
        <div className="bg-blue-100 p-3 rounded-full mb-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-blue-600"
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
        <p className="mb-2 text-gray-700">
          <span className="font-medium text-blue-600">Drag and drop</span> PDF
          files here
        </p>
        <p className="text-sm text-gray-500 mb-4">or</p>
        <label className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors cursor-pointer">
          Browse Files
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={handleChange}
            className="hidden"
          />
        </label>
        <p className="mt-3 text-xs text-gray-500">
          Maximum file size: 10MB • Supported format: PDF
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
