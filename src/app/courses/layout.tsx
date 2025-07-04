'use client';

import React from 'react';
import Footer from '@/components/Footer';

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="pt-16">
        {children}
      </div>
      <Footer />
    </>
  );
} 