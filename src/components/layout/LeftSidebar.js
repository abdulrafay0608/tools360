import React from "react";
import { SidebarAd } from "../ads/adUnit";

const LeftSidebar = () => (
  <div className="hidden lg:block">
    <div className="sticky top-8 space-y-6">
      <SidebarAd slot="sidebar-left-1" />
    </div>
  </div>
);

export default LeftSidebar;
