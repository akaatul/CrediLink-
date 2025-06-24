'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isAuthenticated, isLoading, user, isAdmin, getAuthenticatedUserId } = useAuth();
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [didRedirect, setDidRedirect] = useState(false);

  useEffect(() => {
    // This function checks authentication once and handles redirect if needed
    const checkAuthentication = async () => {
      try {
        setCheckingAuth(true);
        
        // Short delay to allow AuthContext to initialize
        if (isLoading) {
          console.log('Auth is still loading, waiting...');
          return; // Exit early and wait for isLoading to change
        }
        
        // Get the authenticated user ID from any source (Firebase or wallet)
        const userId = getAuthenticatedUserId();
        console.log('Dashboard layout - Authenticated user ID:', userId);

        if (!userId && !isAuthenticated) {
          console.log('Not authenticated, redirecting to login');
          // Only set redirect path if we're actually redirecting
          // This prevents setting redirectAfterLogin when already authenticated
          if (!didRedirect) {
            console.log('Storing current path for redirect:', window.location.pathname);
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            setDidRedirect(true);
            router.push('/auth/login');
          }
        } else {
          console.log('User is authenticated:', userId);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuthentication();
  }, [isLoading, isAuthenticated, router, getAuthenticatedUserId, didRedirect]);

  // If we're still loading or checking auth, show a loading spinner
  if (isLoading || checkingAuth) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
      </div>
    );
  }

  // If the user is authenticated, render the dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden md:block w-64 bg-white min-h-screen shadow-sm">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Dashboard</h2>
            <nav>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Overview
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/courses" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    My Courses
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/certificates" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Certificates
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Profile
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/leaderboard" className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md">
                    Leaderboard
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link href="/dashboard/admin" className="block px-4 py-2 text-red-600 font-bold hover:bg-red-100 rounded-md">
                      Admin Panel
                    </Link>
                  </li>
                )}
              </ul>
            </nav>
          </div>
        </div>
        
        {/* Main content */}
        <div className="flex-1 p-4 md:p-8">
          {children}
        </div>
      </div>
    </div>
  );
} 