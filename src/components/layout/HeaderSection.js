import React from "react";
import TrustIndicators from "../ui/TrustIndicators";

const HeaderSection = ({ title, description }) => (
  <div className="bg-blue-50 border-b border-gray-200 pt-20">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="text-center max-w-4xl mx-auto">
        {/* Title */}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 leading-tight">
          {title}
        </h1>

        {/* Description */}
        {description && (
          <p className="text-xs lg:text-base text-gray-600 mb-4 leading-relaxed max-w-3xl mx-auto">
            {description}
          </p>
        )}

        {/* Trust Indicators */}
        <TrustIndicators />
      </div>
    </div>
  </div>
);

export default HeaderSection;
