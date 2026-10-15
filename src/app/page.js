import HomeExplorer from "@/components/ui/HomeExplorer";
import { getCategoriesWithLiveTools } from "@/data/toolsDataUtils";
import { SITE_URL } from "@/config/site";

const title = "Tools360 | Browser-Based PDF, Image & Calculator Tools";
const description =
  "Free browser-based PDF, image, writing, and calculator tools. Selected files and text are processed locally in your browser.";

export const metadata = {
  title,
  description,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: "Tools360",
    type: "website",
  },
};

export default function Home() {
  return <HomeExplorer categories={getCategoriesWithLiveTools()} />;
}
