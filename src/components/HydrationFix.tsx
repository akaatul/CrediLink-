'use client';

import React, { useEffect, useState } from 'react';

export default function HydrationFix({ children }: { children: React.ReactNode }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <>
      <div suppressHydrationWarning>
        {isClient ? children : null}
      </div>
      {!isClient && <div className="hidden">{children}</div>}
    </>
  );
} 