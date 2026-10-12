import { CONTACT_EMAIL, SITE_NAME } from "@/config/site";
import { getContactContent } from "@/content/pages/contact";
import ArticlePageLayout from "@/components/layout/ArticlePageLayout";

const content = getContactContent({ siteName: SITE_NAME, contactEmail: CONTACT_EMAIL });

export const metadata = {
  title: content.metaTitle,
  description: content.metaDescription,
  openGraph: {
    title: `${content.metaTitle} | ${SITE_NAME}`,
    description: content.metaDescription,
  },
};

export default function ContactPage() {
  return (
    <ArticlePageLayout eyebrow={content.eyebrow} title={content.title}>
      <p className="mt-5 leading-7 text-[#5d706a]">
        {content.introLead}
        <a
          href={`mailto:${content.contactEmail}`}
          className="text-[#235c4f] underline underline-offset-2 hover:text-[#173d34]"
        >
          {content.contactEmail}
        </a>
        .
      </p>
      <p className="mt-4 leading-7 text-[#5d706a]">
        {content.warningParagraph}
      </p>
    </ArticlePageLayout>
  );
}
