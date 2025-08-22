// components/ui/TrustIndicators.js
import React from "react";
import { FaLightbulb, FaArrowRight, FaShieldAlt } from "react-icons/fa";

const TrustIndicators = () => {
  return (
    <div className="flex flex-wrap justify-center gap-x-4">
      <div className="flex items-center bg-green-100 text-green-800 px-3 py-1.5 rounded-full">
        <FaShieldAlt className="w-4 h-4 mr-2" />
        <span className="text-xs font-medium">Secure Processing</span>
      </div>
      <div className="flex items-center bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full">
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span className="text-xs font-medium">No File Storage</span>
      </div>
      <div className="flex items-center bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full">
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
          />
        </svg>
        <span className="text-xs font-medium">100% Free</span>
      </div>
    </div>
  );
};

export default TrustIndicators;
