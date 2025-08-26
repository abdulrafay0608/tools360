"use client";
import React from "react";
import { AdProvider } from "../ads/utils/adUtils";
import HeaderSection from "./HeaderSection";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import MainContentArea from "./MainContentArea";
import { HeaderAd } from "../ads/adUnit";
import RelatedTools from "./RelatedTools";

// Page configuration
const adConfig = {
  maxAdsPerPage: 8,
  lazyLoadThreshold: 300,
  enableLazyLoading: true,
  debugMode: process.env.NODE_ENV === "development",
};

const ToolLayout = ({ title, description, slug, category, children }) => {
  return (
    <AdProvider config={adConfig}>
      <div className="relative min-h-screen bg-gray-50">
        {/* Header Section */}
        <HeaderSection title={title} description={description} />
        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-8 py-8">
          {/* Left Sidebar - Desktop Only */}
          {/* <LeftSidebar /> */}

          {/* Main Content Area */}
          <MainContentArea
            title={title}
            description={description}
            slug={slug}
            category={category}
            children={children}
          />

          {/* Right Sidebar - Desktop Only */}
          {/* <RightSidebar /> */}
          {/* Related Tools */}
          <div className="mb-8">
            <RelatedTools currentCategory={category} currentToolSlug={slug} />
          </div>
        </div>
      </div>
    </AdProvider>
  );
};

export default ToolLayout;
