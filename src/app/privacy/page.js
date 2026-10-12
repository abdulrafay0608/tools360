import { Fragment } from "react";
import { getAbsoluteUrl, SITE_NAME } from "@/config/site";
import { getPrivacyContent } from "@/content/pages/privacy";
import ArticlePageLayout from "@/components/layout/ArticlePageLayout";

const content = getPrivacyContent({ siteName: SITE_NAME });
const pageUrl = getAbsoluteUrl("/privacy");

export const metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  alternates: { canonical: pageUrl },
  openGraph: {
    title: `${content.metaTitle} | ${SITE_NAME}`,
    description: content.metaDescription,
    url: pageUrl,
  },
};

export default function PrivacyPage() {
  return (
    <ArticlePageLayout eyebrow={content.eyebrow} title={content.title}>
      <p className="mt-5 leading-7 text-[#5d706a]">
        {content.intro}
      </p>

      {content.sections.map((section, idx) => (
        <Fragment key={idx}>
          <h2 className="mt-8 text-lg font-semibold text-[#173d34]">
            {section.heading}
          </h2>
          {section.paragraphs.map((p, pIdx) => {
            if (typeof p === "string") {
              return (
                <p key={pIdx} className="mt-3 leading-7 text-[#5d706a]">
                  {p}
                </p>
              );
            }
            return (
              <p key={pIdx} className="mt-3 leading-7 text-[#5d706a]">
                {p.lead}
                <a
                  href={p.linkHref}
                  className="text-[#235c4f] underline underline-offset-2 hover:text-[#173d34]"
                >
                  {p.linkText}
                </a>
                {p.trail}
              </p>
            );
          })}
        </Fragment>
      ))}
    </ArticlePageLayout>
  );
}
