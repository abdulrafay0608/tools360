import { SITE_NAME } from "@/config/site";
import { getAboutContent } from "@/content/pages/about";
import ArticlePageLayout from "@/components/layout/ArticlePageLayout";

const content = getAboutContent({ siteName: SITE_NAME });

export const metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  openGraph: {
    title: `${content.metaTitle} | ${SITE_NAME}`,
    description: content.metaDescription,
  },
};

export default function AboutPage() {
  return (
    <ArticlePageLayout eyebrow={content.eyebrow} title={content.title}>
      {content.paragraphs.map((p, i) => (
        <p key={i} className={`${i === 0 ? "mt-5" : "mt-4"} leading-7 text-[#5d706a]`}>
          {p}
        </p>
      ))}
    </ArticlePageLayout>
  );
}