import React from "react";
import { SidebarAd } from "../ads/adUnit";

const RightSidebar = () => (
  <div className="hidden lg:block">
    <div className="sticky top-8 space-y-6">
      <SidebarAd slot="sidebar-right-1" />
      <div className="hidden xl:block">
        <SidebarAd slot="sidebar-right-2" size="square" />
      </div>
    </div>
  </div>
);

export default RightSidebar;
