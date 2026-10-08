import { notFound } from "next/navigation";
import { toolsData } from "@/data/tools-data";
import ToolLayout from "@/components/layout/ToolLayout";
import ToolRenderer from "@/components/layout/ToolRenderer";

export const dynamicParams = false;

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tools360.com";

export async function generateStaticParams() {
  const slugs = toolsData.flatMap((cat) =>
    cat.tools
      .filter((tool) => tool.available)
      .map((tool) => ({ slug: tool.slug }))
  );
  return slugs;
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === slug && t.available);

  if (!tool) {
    return {
      title: "Tool Not Found | Tools360",
      description: "The requested tool is not available on Tools360.",
    };
  }

  const title = `${tool.name} Online | Tools360`;
  const description =
    tool.description ||
    `Use ${tool.name} in your browser. Files are processed locally and are not uploaded.`;
  const url = `${BASE_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Tools360",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function getToolContent(tool) {
  if (tool.slug === "pdf-to-jpg") {
    return {
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
  }

  // Default content for other tools
  return {
    tips: [
      "Review your document pages before processing to ensure all contents are aligned.",
      "All file operations are performed client-side in your browser for maximal speed.",
      "You can reorder, rotate, or customize settings before downloading.",
    ],
    privacyText:
      "All document processing happens entirely inside your web browser. No files or private data are ever sent to or stored on our servers.",
    faqs: [
      {
        question: `How does the online ${tool.name} work?`,
        answer: `Our ${tool.name} runs 100% in your web browser. Your files are processed locally on your device using advanced client-side technology, ensuring maximum speed, privacy, and zero data uploads to external servers.`,
      },
      {
        question: "Are my uploaded files safe and private?",
        answer:
          "Yes, completely safe. Unlike traditional online tools, your files never leave your computer or phone. All conversions and modifications happen directly within your browser session.",
      },
      {
        question: `Is ${tool.name} free to use?`,
        answer: `Yes, ${tool.name} is 100% free with no registration, subscription, or software installation required.`,
      },
      {
        question: "Does this tool work on mobile devices?",
        answer: `Yes! ${tool.name} is fully responsive and optimized to work seamlessly across iPhone, Android, tablets, Windows, Mac, and Linux devices.`,
      },
      {
        question: "Will the quality of my document be affected?",
        answer:
          "Our algorithms are optimized to preserve maximal quality and clarity while keeping file sizes lightweight and optimized.",
      },
    ],
  };
}

/**
 * SEO Content section — server-rendered, passed to ToolLayout as `seoContent`.
 */
function ToolSEOContent({ tool, content }) {
  return (
    <section className="border border-[#dce5e0] bg-[#f8faf9] p-6 sm:p-8 space-y-8">
      {/* How to use */}
      <div>
        <h2 className="text-lg font-semibold text-[#1a3328] sm:text-xl">
          How to use {tool.name} online
        </h2>
        <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm text-[#52675e]">
          <li className="rounded-sm border border-[#dce5e0] bg-white p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e6f0eb] font-bold text-xs text-[#173d34] mb-2">
              1
            </span>
            <p className="font-semibold text-[#263e36]">Select or drop your PDF</p>
            <p className="mt-1 text-xs text-[#708079]">
              Choose your PDF file or drag and drop it into the upload dropzone.
            </p>
          </li>
          <li className="rounded-sm border border-[#dce5e0] bg-white p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e6f0eb] font-bold text-xs text-[#173d34] mb-2">
              2
            </span>
            <p className="font-semibold text-[#263e36]">Customize options & pages</p>
            <p className="mt-1 text-xs text-[#708079]">
              Select the pages you need, choose image quality, and set your desired DPI resolution.
            </p>
          </li>
          <li className="rounded-sm border border-[#dce5e0] bg-white p-4">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e6f0eb] font-bold text-xs text-[#173d34] mb-2">
              3
            </span>
            <p className="font-semibold text-[#263e36]">Download your file</p>
            <p className="mt-1 text-xs text-[#708079]">
              Process the file in your browser, then download the result to your device.
            </p>
          </li>
        </ol>
      </div>

      {/* Pro Tips & Privacy Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-sm border border-[#dce5e0] bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#1a3328] uppercase tracking-wider">
            💡 Pro Tips for Best Results
          </h3>
          <ul className="space-y-2 text-xs leading-relaxed text-[#52675e]">
            {content.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#235c4f] font-bold">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-sm border border-[#dce5e0] bg-white p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#1a3328] uppercase tracking-wider">
            🔒 Privacy & Local Processing
          </h3>
          <p className="text-xs leading-relaxed text-[#52675e]">
            {content.privacyText}
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div>
        <h2 className="text-lg font-semibold text-[#1a3328] sm:text-xl">
          Frequently Asked Questions (FAQs)
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {content.faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-sm border border-[#dce5e0] bg-white p-4"
            >
              <h3 className="text-sm font-semibold text-[#263e36]">
                {faq.question}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-[#52675e]">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const allTools = toolsData.flatMap((cat) => cat.tools);
  const tool = allTools.find((t) => t.slug === slug && t.available);

  if (!tool) notFound();

  const content = getToolContent(tool);
  const toolUrl = `${BASE_URL}/tools/${tool.slug}`;

  // JSON-LD Schemas: WebApplication + FAQPage
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: tool.name,
        url: toolUrl,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "All",
        browserRequirements: "Requires JavaScript. Requires HTML5.",
        description: tool.description,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      ...(tool.slug === "organize-pdf" || tool.slug === "rotate-pdf"
        ? []
        : [
            {
              "@type": "FAQPage",
              mainEntity: content.faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            },
          ]),
    ],
  };

  return (
    <>
      {/* Structured Data Script for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ToolLayout
        title={tool.name}
        description={tool.slug === "rotate-pdf" ? null : tool.description}
        seoContent={
          tool.slug === "organize-pdf" || tool.slug === "rotate-pdf" ? null : (
            <ToolSEOContent tool={tool} content={content} />
          )
        }
      >
        {/* Interactive Client Component Tool */}
        <ToolRenderer slug={tool.slug} />
      </ToolLayout>
    </>
  );
}
