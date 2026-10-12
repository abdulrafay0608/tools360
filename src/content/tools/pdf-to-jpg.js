/**
 * pdf-to-jpg.js
 * Custom SEO and informational content for the PDF to JPG conversion tool.
 */

export const pdfToJpgContent = {
  howTo: [
    {
      step: 1,
      title: "Select or drop your PDF",
      description:
        "Choose your PDF file or drag and drop it into the upload dropzone.",
    },
    {
      step: 2,
      title: "Customize options & pages",
      description:
        "Select the pages you need, choose image quality, and set your desired DPI resolution.",
    },
    {
      step: 3,
      title: "Download your file",
      description:
        "Process the file in your browser, then download the result to your device.",
    },
  ],
  tips: [
    "Choose **1.5x (150 DPI)** or **2x (300 DPI)** if you plan to print the exported JPG images or present them on high-resolution Retina displays.",
    "Use **Low Quality (60%)** when you need compact file sizes for emailing or fast web sharing.",
    "Click the quick **JPG** button directly on any page thumbnail to instantly export just that single page without processing the entire document.",
    "Select specific page checkboxes to convert only the relevant pages and automatically download them packaged in a clean ZIP archive.",
  ],
  privacyText:
    "Your privacy and document security are our highest priorities. All PDF parsing and canvas rendering occur 100% locally within your device's web browser using client-side WebAssembly and HTML5 Canvas. Your confidential files are never uploaded, transmitted, or stored on any external server.",
  faqs: [
    {
      question: "How do I convert a multi-page PDF into separate JPG images?",
      answer:
        "Simply upload your PDF file into the drop zone. Our tool automatically displays thumbnails for all pages. You can choose your preferred resolution and quality, then click 'Convert Pages to JPG (ZIP)' to download all pages packaged in a single ZIP folder.",
    },
    {
      question: "Can I download just a single page from my PDF as a JPG?",
      answer:
        "Yes! You can either select only the specific page checkbox or click the instant 'JPG' download button directly on the thumbnail of the page you want.",
    },
    {
      question: "What resolution and DPI settings are supported?",
      answer:
        "We offer 3 resolution presets: 1x (~96 DPI for standard screen viewing), 1.5x (~150 DPI for medium-resolution displays), and 2x (~300 DPI for high-resolution printing and detailed graphics).",
    },
    {
      question: "Are password-protected or encrypted PDF files supported?",
      answer:
        "For security reasons and client-side processing limitations, password-protected PDFs must have their password removed prior to conversion.",
    },
    {
      question: "Is there any file size limit for PDF to JPG conversion?",
      answer:
        "Because all processing runs in your browser, there are no hard server upload limits. Files up to 100MB+ convert smoothly depending on your computer or mobile device's available memory.",
    },
    {
      question: "Is this PDF to JPG tool completely free to use?",
      answer:
        "Yes, 100% free with no registration, no email required, no subscriptions, and no watermarks added to your converted images.",
    },
  ],
};

export default pdfToJpgContent;
