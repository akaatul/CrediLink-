import React from 'react';
import { FaGraduationCap, FaChartLine, FaShieldAlt, FaCertificate, FaUsers, FaHandshake } from 'react-icons/fa';

export default function FeaturesPage() {
  const features = [
    {
      icon: <FaGraduationCap className="h-8 w-8 text-primary-600" />,
      title: "Interactive Learning",
      description: "Engage with our comprehensive course materials, interactive quizzes, and hands-on projects designed to maximize learning effectiveness."
    },
    {
      icon: <FaCertificate className="h-8 w-8 text-primary-600" />,
      title: "Blockchain Certification",
      description: "Receive tamper-proof certificates stored on the blockchain, providing verifiable proof of your skills and achievements."
    },
    {
      icon: <FaChartLine className="h-8 w-8 text-primary-600" />,
      title: "Progress Tracking",
      description: "Monitor your learning journey with detailed analytics and progress tracking tools."
    },
    {
      icon: <FaShieldAlt className="h-8 w-8 text-primary-600" />,
      title: "Secure Platform",
      description: "Your data and credentials are protected by state-of-the-art security measures and blockchain technology."
    },
    {
      icon: <FaUsers className="h-8 w-8 text-primary-600" />,
      title: "Community Learning",
      description: "Connect with fellow learners, share experiences, and participate in group discussions and projects."
    },
    {
      icon: <FaHandshake className="h-8 w-8 text-primary-600" />,
      title: "Recruiter Connection",
      description: "Get discovered by top employers through our integrated recruitment platform."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Platform <span className="text-primary-600">Features</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Discover the powerful features that make CrediLink+ the leading platform for blockchain-verified education.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center mb-4">
                {feature.icon}
                <h3 className="text-xl font-semibold text-gray-900 ml-3">{feature.title}</h3>
              </div>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-primary-600 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:py-20 text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Ready to Start Your Learning Journey?
            </h2>
            <p className="mt-4 text-lg leading-6 text-primary-100">
              Join thousands of learners who are already benefiting from our platform.
            </p>
            <a
              href="/auth/signup"
              className="mt-8 inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>
    </div>
  );
} 