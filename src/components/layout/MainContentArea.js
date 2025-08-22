import React from "react";
import RelatedTools from "./RelatedTools";
import { ContentAd, HeaderAd, ResponsiveAd } from "../ads/adUnit";

const MainContentArea = ({ children, slug, category }) => (
  <div className="lg:col-span-2 xl:col-span-3">
    {/* Middle Content Ad */}
    <div className="mb-8">
      <HeaderAd slot="content-middle" />
    </div>

    {/* Tool Container */}
    <div className="bg-white border border-gray-200 rounded p-2">
      <div className=" bg-gray-100 rounded p-4">
        <div className="bg-white rounded">
          <div className="p-6 sm:p-4">{children}</div>
        </div>
      </div>
    </div>

    {/* Bottom Mobile Ad */}
    <div className="lg:hidden mt-8">
      <ResponsiveAd
        mobile={{
          slot: "mobile-bottom",
          size: "banner",
          layout: "clean",
        }}
      />
    </div>
  </div>
);

export default MainContentArea;
