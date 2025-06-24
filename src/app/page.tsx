'use client';

import React from 'react';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CourseShowcase from '@/components/CourseShowcase';
import AuthSection from '@/components/AuthSection';
import TrustIndicators from '@/components/TrustIndicators';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <HeroSection />
      <FeaturesSection />
      <CourseShowcase />
      <AuthSection />
      <TrustIndicators />
      <Footer />
    </main>
  );
} 