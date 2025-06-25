'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import SafeHydrate from '@/components/SafeHydrate';

const SignupPage = () => {
  const [userType, setUserType] = useState<'student' | 'recruiter'>('student');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    jobTitle: '',
    agreeToTerms: false,
  });
  const [signupError, setSignupError] = useState<string | null>(null);
  
  const { connectWallet, oauthSignIn, isAuthenticated, error, signup } = useAuth();
  const router = useRouter();
  
  // Store user type in localStorage when it changes
  useEffect(() => {
    localStorage.setItem('userType', userType);
  }, [userType]);
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setSignupError("Passwords don't match");
      return;
    }
    
    try {
      const fullName = `${formData.firstName} ${formData.lastName}`;
      await signup(formData.email, formData.password, fullName);
      // Redirect happens in the auth context
    } catch (err: any) {
      setSignupError(err.message || 'Signup failed');
    }
  };

  const handleMetaMaskSignup = async () => {
    setSignupError(null);
    
    try {
      await connectWallet();
      // Redirect happens in the auth context
    } catch (err: any) {
      setSignupError(err.message || 'MetaMask connection failed');
    }
  };

  const handleOAuthSignup = async (provider: string) => {
    setSignupError(null);
    
    try {
      await oauthSignIn(provider.toLowerCase());
      // Redirect happens in the auth context
    } catch (err: any) {
      setSignupError(err.message || `Failed to sign in with ${provider}`);
    }
  };

  return (
    <SafeHydrate>
      <div className="min-h-screen pt-20 pb-12 flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-morphic p-8 relative overflow-hidden"
          >
            {/* Floating shapes for decoration */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary-200 rounded-full opacity-20"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-secondary-200 rounded-full opacity-20"></div>

            <div>
              <Link href="/" className="flex items-center mb-8">
                <span className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  CrediLink<span className="text-primary-500">+</span>
                </span>
              </Link>
            </div>

            <h1 className="text-2xl font-bold text-center mb-6 gradient-text">Create Your Account</h1>

            {/* User Type Tabs */}
            <div className="flex mb-6 border-b border-gray-200">
              <button
                className={`pb-2 px-4 text-lg font-medium flex-1 ${
                  userType === 'student'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setUserType('student')}
              >
                Student
              </button>
              <button
                className={`pb-2 px-4 text-lg font-medium flex-1 ${
                  userType === 'recruiter'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-500'
                }`}
                onClick={() => setUserType('recruiter')}
              >
                Recruiter
              </button>
            </div>

            {/* Display error message if any */}
            {(signupError || error) && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                {signupError || error}
              </div>
            )}

            {/* MetaMask Signup Option */}
            <button
              onClick={handleMetaMaskSignup}
              className="w-full py-3 px-4 mb-6 bg-gradient-to-r from-primary-500 to-accent-500 text-white rounded-lg flex items-center justify-center font-medium hover:shadow-lg transition-shadow"
            >
              <svg
                className="h-5 w-5 mr-2"
                viewBox="0 0 35 33"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2.04183 1L15.0446 10.8397L12.7336 4.99099L2.04183 1Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M28.2769 23.4515L24.7909 28.7707L32.2899 30.7966L34.4189 23.5737L28.2769 23.4515Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M0.599609 23.5737L2.7079 30.7966L10.2069 28.7707L6.7209 23.4515L0.599609 23.5737Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.82973 14.4846L7.74463 17.6931L15.1633 18.0207L14.9202 10.0039L9.82973 14.4846Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M25.1702 14.4846L19.9993 9.88245L19.8242 18.0207L27.2428 17.6931L25.1702 14.4846Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10.207 28.7707L14.7274 26.587L10.8172 23.6348L10.207 28.7707Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M20.2725 26.587L24.7929 28.7707L24.1827 23.6348L20.2725 26.587Z"
                  fill="white"
                  stroke="white"
                  strokeWidth="0.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Sign Up with MetaMask
            </button>

            <div className="relative flex items-center justify-center mb-6">
              <div className="flex-grow h-px bg-gray-300"></div>
              <span className="mx-4 text-sm text-gray-500">or</span>
              <div className="flex-grow h-px bg-gray-300"></div>
            </div>

            {/* OAuth Providers */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => handleOAuthSignup('google')}
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.66 15.63 16.88 16.79 15.71 17.57V20.34H19.28C21.36 18.42 22.56 15.59 22.56 12.25Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23C14.97 23 17.46 22.02 19.28 20.34L15.71 17.57C14.73 18.23 13.48 18.63 12 18.63C9.19 18.63 6.8 16.73 5.95 14.18H2.27V17.04C4.08 20.58 7.76 23 12 23Z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.95 14.18C5.75 13.52 5.63 12.81 5.63 12.08C5.63 11.35 5.75 10.64 5.95 9.98V7.12H2.27C1.57 8.61 1.17 10.3 1.17 12.08C1.17 13.86 1.57 15.55 2.27 17.04L5.95 14.18Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.53C13.62 5.53 15.06 6.09 16.21 7.18L19.36 4.03C17.45 2.23 14.97 1.17 12 1.17C7.76 1.17 4.08 3.59 2.27 7.12L5.95 9.98C6.8 7.43 9.19 5.53 12 5.53Z"
                    fill="#EA4335"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleOAuthSignup('facebook')}
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M24 12.073C24 5.40365 18.629 0 12 0C5.37097 0 0 5.40365 0 12.073C0 18.0988 4.38823 23.0935 10.125 24V15.563H7.07661V12.073H10.125V9.41306C10.125 6.38751 11.9153 4.71627 14.6574 4.71627C15.9706 4.71627 17.3439 4.95189 17.3439 4.95189V7.92146H15.8303C14.34 7.92146 13.875 8.85225 13.875 9.8069V12.073H17.2031L16.6708 15.563H13.875V24C19.6118 23.0935 24 18.0988 24 12.073Z"
                    fill="#1877F2"
                  />
                </svg>
              </button>
              <button
                onClick={() => handleOAuthSignup('github')}
                className="flex items-center justify-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12 0C5.37 0 0 5.37 0 12C0 17.31 3.435 21.795 8.205 23.385C8.805 23.49 9.03 23.13 9.03 22.815C9.03 22.53 9.015 21.585 9.015 20.58C6 21.135 5.22 19.845 4.98 19.17C4.845 18.825 4.26 17.76 3.75 17.475C3.33 17.25 2.73 16.695 3.735 16.68C4.68 16.665 5.355 17.55 5.58 17.91C6.66 19.725 8.385 19.215 9.075 18.9C9.18 18.12 9.495 17.595 9.84 17.295C7.17 16.995 4.38 15.96 4.38 11.37C4.38 10.065 4.845 8.985 5.61 8.145C5.49 7.845 5.07 6.615 5.73 4.965C5.73 4.965 6.735 4.65 9.03 6.195C9.99 5.925 11.01 5.79 12.03 5.79C13.05 5.79 14.07 5.925 15.03 6.195C17.325 4.635 18.33 4.965 18.33 4.965C18.99 6.615 18.57 7.845 18.45 8.145C19.215 8.985 19.68 10.05 19.68 11.37C19.68 15.975 16.875 16.995 14.205 17.295C14.64 17.67 15.015 18.39 15.015 19.515C15.015 21.12 15 22.41 15 22.815C15 23.13 15.225 23.505 15.825 23.385C18.2072 22.5807 20.2772 21.0497 21.7437 19.0074C23.2101 16.965 23.9993 14.5143 24 12C24 5.37 18.63 0 12 0Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                    required
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="your@email.com"
                  required
                  suppressHydrationWarning
                />
              </div>

              {userType === 'recruiter' && (
                <>
                  <div className="mb-4">
                    <label
                      htmlFor="company"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required={userType === 'recruiter'}
                      suppressHydrationWarning
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="jobTitle"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Job Title
                    </label>
                    <input
                      type="text"
                      id="jobTitle"
                      name="jobTitle"
                      value={formData.jobTitle}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                      required={userType === 'recruiter'}
                      suppressHydrationWarning
                    />
                  </div>
                </>
              )}

              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div className="mb-6">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                  placeholder="••••••••"
                  required
                  suppressHydrationWarning
                />
              </div>

              <div className="flex items-center mb-6">
                <input
                  id="agreeToTerms"
                  name="agreeToTerms"
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  required
                  suppressHydrationWarning
                />
                <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-700">
                  I agree to the{' '}
                  <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Sign Up
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Log in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </SafeHydrate>
  );
};

export default SignupPage; 