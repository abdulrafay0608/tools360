import { notFound } from "next/navigation";
import { getLiveTools, getToolCategory } from "@/data/toolsDataUtils";
import { toolContent } from "@/data/toolContent";
import ToolLayout from "@/components/layout/ToolLayout";
import ToolRenderer from "@/components/layout/ToolRenderer";
import { getAbsoluteUrl } from "@/config/site";

export const dynamicParams = false;

export async function generateStaticParams() {
  return getLiveTools().map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const tool = getLiveTools().find((entry) => entry.slug === slug);
  if (!tool) return { title: "Tool Not Found | Tools360" };

  const title = `${tool.name} Online | Tools360`;
  const description = tool.description;
  const url = getAbsoluteUrl(`/tools/${slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: "Tools360", type: "website" },
    twitter: { card: "summary", title, description },
  };
}

function ToolGuidance({ tool, content }) {
  return (
    <section className="space-y-6 border border-[#dce5e0] bg-[#f8faf9] p-5 sm:p-8">
      <div>
        <h2 className="text-lg font-semibold text-[#1a3328] sm:text-xl">
          How to use {tool.name}
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-[#52675e]">
          {content.steps.map((step) => <li key={step}>{step}</li>)}
        </ol>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[#1a3328] sm:text-xl">
          Before you start
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#52675e]">{content.limitations}</p>
        <p className="mt-3 text-sm leading-6 text-[#52675e]">
          File and text processing happens in your browser. Selected content is not
          sent to a processing server; loading the website still requests normal
          page assets from the host. Advertising and analytics are currently disabled.
        </p>
      </div>
    </section>
  );
}

export default async function ToolPage({ params }) {
  const { slug } = await params;
  const tool = getLiveTools().find((entry) => entry.slug === slug);
  if (!tool) notFound();

  const content = toolContent[slug];
  if (!content) throw new Error(`Missing guidance for live tool: ${slug}`);
  const toolUrl = getAbsoluteUrl(`/tools/${slug}`);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: tool.name,
    url: toolUrl,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "All",
    browserRequirements: "Requires JavaScript.",
    description: tool.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  const isCalculator = [
    "loan-emi-calculator", "age-calculator", "percentage-calculator", "word-counter",
  ].includes(slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ToolLayout
        title={tool.name}
        category={getToolCategory(slug)}
        currentToolSlug={slug}
        description={content.intro}
        seoContent={<ToolGuidance tool={tool} content={content} />}
        trustText={isCalculator ? "Inputs stay in this browser session" : undefined}
      >
        <ToolRenderer slug={slug} />
      </ToolLayout>
    </>
  );
}
