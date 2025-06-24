import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            About <span className="text-primary-600">CrediLink+</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Empowering the future of education through blockchain technology and innovative learning solutions.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="mt-4 text-lg text-gray-600">
              At CrediLink+, we're dedicated to revolutionizing the way people learn and validate their skills. 
              By combining cutting-edge blockchain technology with comprehensive educational resources, 
              we create a transparent and verifiable system for skill certification.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Objectives</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <span className="h-6 w-6 text-primary-600 mr-2">✓</span>
                <span>Provide accessible, high-quality education</span>
              </li>
              <li className="flex items-start">
                <span className="h-6 w-6 text-primary-600 mr-2">✓</span>
                <span>Ensure transparent skill verification</span>
              </li>
              <li className="flex items-start">
                <span className="h-6 w-6 text-primary-600 mr-2">✓</span>
                <span>Bridge the gap between learners and employers</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Innovation</h3>
            <p className="text-gray-600">
              We constantly push the boundaries of what's possible in education and technology.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Integrity</h3>
            <p className="text-gray-600">
              We maintain the highest standards of transparency and trust in all our operations.
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">Inclusion</h3>
            <p className="text-gray-600">
              We believe in making quality education accessible to everyone, everywhere.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
} 