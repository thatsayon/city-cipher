"use client";
import React, { useState } from 'react';
import Sidebar from '@/components/Common/Sidebar';

function page() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  return (
     <div className="flex h-screen bg-gray-100">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
    </div>
  )
}

export default page