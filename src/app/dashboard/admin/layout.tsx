'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const pathname = usePathname();

  // Check if user is admin
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  // If loading or not admin, show loading
  if (isLoading || (isAuthenticated && !isAdmin)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Admin nav links
  const navLinks = [
    { name: 'Dashboard', path: '/dashboard/admin' },
    { name: 'Courses', path: '/dashboard/admin/courses/new' },
  ];

  return (
    <div className="min-h-screen">
      {/* Admin Navigation */}
      <div className="bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="font-bold text-lg">Admin Dashboard</div>
            <div className="flex space-x-6">
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.path}
                  className={`${
                    pathname === link.path
                      ? 'text-white border-b-2 border-white'
                      : 'text-primary-100 hover:text-white'
                  } px-1 py-2 text-sm font-medium`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
} 