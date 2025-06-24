'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Footer = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const socialLinks = [
    { name: 'Twitter', icon: '𝕏', href: '#' },
    { name: 'LinkedIn', icon: 'in', href: '#' },
    { name: 'GitHub', icon: '⌨️', href: '#' },
    { name: 'Discord', icon: '🎮', href: '#' },
    { name: 'YouTube', icon: '▶️', href: '#' },
  ];

  const quickLinks = [
    {
      title: 'Platform',
      links: [
        { name: 'How it Works', href: '#' },
        { name: 'Pricing', href: '#' },
        { name: 'Features', href: '#' },
        { name: 'FAQ', href: '#' },
      ],
    },
    {
      title: 'Courses',
      links: [
        { name: 'Blockchain Basics', href: '#' },
        { name: 'Smart Contracts', href: '#' },
        { name: 'Web3 Development', href: '#' },
        { name: 'DeFi Fundamentals', href: '#' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { name: 'Blog', href: '#' },
        { name: 'Documentation', href: '#' },
        { name: 'Community', href: '#' },
        { name: 'Webinars', href: '#' },
      ],
    },
    {
      title: 'Company',
      links: [
        { name: 'About Us', href: '#' },
        { name: 'Careers', href: '#' },
        { name: 'Partners', href: '#' },
        { name: 'Contact', href: '#' },
      ],
    },
  ];

  return (
    <footer className="bg-gray-900 text-white relative">
      {/* Curved top border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-10 overflow-hidden">
        <div 
          className="absolute top-0 left-0 right-0 h-20 rounded-b-[50%] bg-gradient-to-r from-primary-500 via-accent-500 to-secondary-500"
          style={{ transform: 'translateY(-50%)' }}
        ></div>
      </div>
      
      <div className="container mx-auto pt-16 pb-8 px-4">
        <motion.div 
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          {/* Brand and newsletter */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary-400 via-accent-400 to-secondary-400 bg-clip-text text-transparent">CrediLink+</h2>
              <p className="mt-2 text-gray-400">Transform your career with blockchain-verified credentials</p>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Subscribe to our newsletter</h3>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="bg-gray-800 text-white px-4 py-2 rounded-l-md w-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button className="bg-primary-600 hover:bg-primary-700 px-4 py-2 rounded-r-md transition-colors">
                  Subscribe
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">Get the latest updates on new courses and features</p>
            </div>
          </div>
          
          {/* Quick links in staggered columns */}
          {quickLinks.map((column, columnIndex) => (
            <motion.div 
              key={column.title}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: 0.1 * columnIndex }}
              style={{ marginTop: columnIndex % 2 === 0 ? '0' : '2rem' }}
            >
              <h3 className="text-lg font-semibold mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.name}>
                    <a 
                      href={link.href} 
                      className="text-gray-400 hover:text-primary-400 transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>
        
        {/* Social links */}
        <motion.div 
          className="flex justify-center gap-4 mb-8"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {socialLinks.map((social) => (
            <a 
              key={social.name}
              href={social.href}
              className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-primary-600 transition-colors"
              aria-label={social.name}
            >
              <span className="text-xl">{social.icon}</span>
            </a>
          ))}
        </motion.div>
        
        {/* Copyright */}
        <div className="text-center text-gray-500 text-sm border-t border-gray-800 pt-8">
          <p>© {new Date().getFullYear()} CrediLink+. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-400 transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 