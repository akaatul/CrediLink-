'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary-50 via-white to-accent-50 py-20">
      {/* Animated floating blockchain nodes */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute w-20 h-20 bg-primary-200 rounded-full opacity-70"
          style={{ top: '15%', left: '10%' }}
          animate={{
            y: [0, -20, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-12 h-12 bg-secondary-200 rounded-full opacity-60"
          style={{ top: '30%', right: '15%' }}
          animate={{
            y: [0, -15, 0],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
        <motion.div
          className="absolute w-16 h-16 bg-accent-200 rounded-full opacity-80"
          style={{ bottom: '20%', left: '20%' }}
          animate={{
            y: [0, -25, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        
        {/* Blockchain connection lines */}
        <svg className="absolute inset-0 w-full h-full">
          <motion.path
            d="M100,150 Q200,100 300,200 T500,250"
            stroke="url(#gradient-line)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2 }}
          />
          <motion.path
            d="M700,100 Q600,200 500,150 T300,300"
            stroke="url(#gradient-line)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2, delay: 0.5 }}
          />
          <defs>
            <linearGradient id="gradient-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* 3D Floating Certificate Elements */}
      <motion.div 
        className="absolute right-[5%] lg:right-[10%] top-[5%] md:top-[15%] w-64 h-40 bg-white rounded-lg shadow-xl p-4 flex flex-col justify-between transform rotate-6 hidden md:flex"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 1 }}
        style={{ 
          perspective: "1000px",
          boxShadow: "0 10px 30px rgba(14, 165, 233, 0.2)"
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-primary-700">Blockchain Development</h4>
            <p className="text-xs text-gray-500">Advanced Certificate</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-400 to-accent-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-end">
          <div className="text-xs text-gray-500">
            <p>Issued: June 2023</p>
            <p>ID: 0x8f...3e4f</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
        </div>
      </motion.div>

      <motion.div 
        className="absolute left-[5%] lg:left-[15%] bottom-[5%] md:bottom-[15%] w-56 h-36 bg-white rounded-lg shadow-xl p-4 flex flex-col justify-between transform -rotate-3 hidden md:flex"
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1 }}
        style={{ 
          perspective: "1000px",
          boxShadow: "0 10px 30px rgba(139, 92, 246, 0.2)"
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-accent-700">Data Science</h4>
            <p className="text-xs text-gray-500">Professional Certificate</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent-400 to-secondary-400 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="mt-4 flex justify-between items-end">
          <div className="text-xs text-gray-500">
            <p>Issued: May 2023</p>
            <p>ID: 0x3d...7a2c</p>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-secondary-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
        </div>
      </motion.div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 gradient-text"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Transform Your Career with Blockchain-Verified Credentials
        </motion.h1>
        <motion.p 
          className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          Where Learning Meets Web3 Innovation
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-4 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <Link href="/courses" className="btn-primary">
            Start Learning
          </Link>
          <button className="btn-secondary">
            For Employers
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection; 