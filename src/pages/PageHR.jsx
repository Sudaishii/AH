import React, { useState, useRef, useEffect } from "react";
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { Outlet } from "react-router-dom";
import { Cn } from "../utils/cn.js";
import { useMediaQuery } from '@uidotdev/usehooks';
import { useClickOutside } from "../assets/hooks/use-click-outside.jsx";

const PageHR = () => {
  const isDesktopDevice = useMediaQuery("(min-width: 768px)");
  const [collapsed, setCollapsed] = useState(!isDesktopDevice);
  const sidebarRef = useRef(null);

  useEffect(() => {
    setCollapsed(!isDesktopDevice);
  }, [isDesktopDevice]);

  useClickOutside([sidebarRef], () => {
    if (!isDesktopDevice && !collapsed) {
      setCollapsed(true);
    }
  });

  return (
    <div className="min-h-screen flex bg-slate-100 transition-colors dark:bg-slate-950">
      
      {/* Mobile overlay */}
      <div
        className={Cn(
          "pointer-events-none fixed inset-0 -z-10 bg-black opacity-0 transition-opacity",
          !collapsed && "max-md:pointer-events-auto max-md:opacity-30 max-md:z-50"
        )}
      />

      {/* Sidebar */}
      <Sidebar ref={sidebarRef} collapsed={collapsed} />

      {/* Header */}
      <Header collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content - positioned at intersection of sidebar and header */}
      <main
        className={Cn(
          "fixed transition-all duration-300 top-16 z-30 overflow-y-auto  p-6",
          collapsed 
            ? "md:left-[70px] md:w-[calc(100%-70px)] left-0" 
            : "md:left-[250px] md:w-[calc(100%-250px)] left-0",
          "h-[calc(100vh-4rem)]"
        )}
      >
          <Outlet />
      </main>
    </div>
  );
};

export default PageHR;
