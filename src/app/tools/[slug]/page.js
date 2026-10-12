import { notFound } from "next/navigation";
import { getLiveTools, getToolCategory } from "@/data/toolsDataUtils";
import { getAbsoluteUrl, SITE_URL, SITE_NAME } from "@/config/site";
import { getToolPageConfig } from "@/config/toolPageConfig";
import { getToolContent } from "@/content/tools";
import ToolLayout from "@/components/layout/ToolLayout";
import ToolRenderer from "@/components/layout/ToolRenderer";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getLiveTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getLiveTools().find((entry) => entry.slug === slug);

  if (!tool) {
    return {
      title: "Tool Not Found",
      description: `The requested tool is not available on ${SITE_NAME}.`,
    };
  }

  const fullTitle = `${tool.name} Online | ${SITE_NAME}`;
  const description =
    tool.description ||
    `Use ${tool.name} in your browser. Files are processed locally and are not uploaded.`;
  const url = getAbsoluteUrl(`/tools/${tool.slug}`);

  return {
    title: `${tool.name} Online`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

/**
 * SEO Content section — server-rendered, passed to ToolLayout as `seoContent`.
 */
function ToolSEOContent({ tool, content }) {
  if (!content) return null;

  return (
    <section className="border border-[#dce5e0] bg-[#f8faf9] p-6 sm:p-8 space-y-8">
      {/* How to use */}
      {content.howTo && content.howTo.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#1a3328] sm:text-xl">
            How to use {tool.name} online
          </h2>
          <ol className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm text-[#52675e]">
            {content.howTo.map((step) => (
              <li
                key={step.step}
                className="rounded-sm border border-[#dce5e0] bg-white p-4"
              >
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#e6f0eb] font-bold text-xs text-[#173d34] mb-2">
                  {step.step}
                </span>
                <p className="font-semibold text-[#263e36]">{step.title}</p>
                <p className="mt-1 text-xs text-[#708079]">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Pro Tips & Privacy Section */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {content.tips && content.tips.length > 0 && (
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
        )}

        {content.privacyText && (
          <div className="rounded-sm border border-[#dce5e0] bg-white p-5 space-y-3">
            <h3 className="text-sm font-semibold text-[#1a3328] uppercase tracking-wider">
              🔒 Privacy & Local Processing
            </h3>
            <p className="text-xs leading-relaxed text-[#52675e]">
              {content.privacyText}
            </p>
          </div>
        )}
      </div>

      {/* FAQs */}
      {content.faqs && content.faqs.length > 0 && (
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
      )}
    </section>
  );
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = getLiveTools().find((entry) => entry.slug === slug);

  if (!tool) notFound();

  const category = getToolCategory(tool.slug);
  const config = getToolPageConfig(tool.slug);
  const content = config.hasSeoContent ? getToolContent(tool.slug) : null;
  const toolUrl = getAbsoluteUrl(`/tools/${tool.slug}`);

  const shouldRenderFaq = Boolean(
    config.showFaqSchema &&
      content &&
      content.faqs &&
      content.faqs.length > 0
  );

  // JSON-LD Schemas: WebApplication + optional FAQPage (only when FAQ is visible on the page)
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
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      ...(shouldRenderFaq
        ? [
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
          ]
        : []),
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
        category={category}
        currentToolSlug={tool.slug}
        description={config.hideDescription ? null : tool.description}
        seoContent={
          content ? <ToolSEOContent tool={tool} content={content} /> : null
        }
        trustText={config.trustText}
      >
        {/* Interactive Client Component Tool */}
        <ToolRenderer slug={tool.slug} />
      </ToolLayout>
    </>
  );
}
