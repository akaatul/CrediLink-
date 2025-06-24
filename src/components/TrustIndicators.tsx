'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const partners = [
  { id: 1, name: 'Ethereum Foundation', logo: '🦊' },
  { id: 2, name: 'MIT', logo: '🎓' },
  { id: 3, name: 'Stanford', logo: '🌲' },
  { id: 4, name: 'Google', logo: '🔍' },
  { id: 5, name: 'Microsoft', logo: '🪟' },
  { id: 6, name: 'IBM', logo: '💻' },
  { id: 7, name: 'Deloitte', logo: '📊' },
  { id: 8, name: 'Polygon', logo: '🔷' },
];

const metrics = [
  { id: 1, value: '50K+', label: 'Active Learners', color: 'primary', startColor: '#38bdf8', endColor: '#0284c7' },
  { id: 2, value: '200+', label: 'Courses', color: 'accent', startColor: '#a78bfa', endColor: '#7c3aed' },
  { id: 3, value: '95%', label: 'Completion Rate', color: 'secondary', startColor: '#e879f9', endColor: '#c026d3' },
  { id: 4, value: '87%', label: 'Employment Rate', color: 'green', startColor: '#4ade80', endColor: '#16a34a' },
];

const testimonials = [
  {
    id: 1,
    name: 'Sarah Johnson',
    role: 'Software Developer',
    company: 'Blockchain Solutions Inc.',
    image: 'https://randomuser.me/api/portraits/women/32.jpg',
    text: 'CrediLink+ transformed my career. The blockchain-verified credentials gave me instant credibility with employers.',
    delay: 0.1,
  },
  {
    id: 2,
    name: 'Michael Chen',
    role: 'Product Manager',
    company: 'Web3 Innovations',
    image: 'https://randomuser.me/api/portraits/men/46.jpg',
    text: 'The quality of courses and the verification system makes CrediLink+ stand out from other learning platforms.',
    delay: 0.3,
  },
  {
    id: 3,
    name: 'Aisha Patel',
    role: 'Blockchain Developer',
    company: 'DeFi Protocols',
    image: 'https://randomuser.me/api/portraits/women/65.jpg',
    text: 'I landed my dream job within weeks of completing my certification. The employer trusted my skills because they were blockchain-verified.',
    delay: 0.5,
  },
];

const CircularProgress = ({ value, label, color, startColor, endColor }: { 
  value: string, 
  label: string, 
  color: string,
  startColor: string,
  endColor: string 
}) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const gradientId = `gradient-${color}`;

  return (
    <motion.div
      ref={ref}
      className="flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative w-32 h-32 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="#e6e6e6"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray="283"
            strokeDashoffset="283"
            initial={{ strokeDashoffset: 283 }}
            animate={inView ? { strokeDashoffset: 50 } : { strokeDashoffset: 283 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={startColor} />
              <stop offset="100%" stopColor={endColor} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{value}</span>
        </div>
      </div>
      <span className="text-gray-700 font-medium">{label}</span>
    </motion.div>
  );
};

const TestimonialCard = ({ testimonial }: { testimonial: typeof testimonials[0] }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <motion.div
      ref={ref}
      className="bg-white p-6 rounded-2xl shadow-lg max-w-md"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay: testimonial.delay }}
      style={{
        borderRadius: '30px 30px 30px 5px',
      }}
    >
      <div className="flex items-center mb-4">
        <img
          src={testimonial.image}
          alt={testimonial.name}
          className="w-12 h-12 rounded-full object-cover mr-4"
        />
        <div>
          <h4 className="font-bold text-gray-900">{testimonial.name}</h4>
          <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
        </div>
      </div>
      <p className="text-gray-700">{testimonial.text}</p>
      <div className="mt-4 flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </motion.div>
  );
};

const VerificationProcess = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const steps = [
    { id: 1, title: 'Complete Course', icon: '📚', delay: 0.1 },
    { id: 2, title: 'Verify Identity', icon: '🔐', delay: 0.2 },
    { id: 3, title: 'Issue Certificate', icon: '📜', delay: 0.3 },
    { id: 4, title: 'Store on Blockchain', icon: '⛓️', delay: 0.4 },
    { id: 5, title: 'Share Credentials', icon: '🌐', delay: 0.5 },
  ];

  return (
    <div ref={ref} className="max-w-4xl mx-auto mt-16">
      <h3 className="text-2xl font-bold text-center mb-8 gradient-text">How Our Verification Works</h3>
      <div className="flex flex-wrap justify-center">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <motion.div
              className="flex flex-col items-center mx-4 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.5, delay: step.delay }}
            >
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center text-2xl mb-2 shadow-md">
                {step.icon}
              </div>
              <span className="text-gray-800 font-medium text-center">{step.title}</span>
            </motion.div>
            {index < steps.length - 1 && (
              <motion.div 
                className="hidden md:flex items-center mx-2"
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.5, delay: step.delay + 0.1 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

const TrustIndicators = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <section className="py-20 px-4 bg-gray-50">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Trusted by Industry Leaders</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Join thousands of learners and organizations who trust our blockchain-verified credentials
          </p>
        </motion.div>

        {/* Partner logos in wave design */}
        <div className="relative mb-20 overflow-hidden">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 py-8">
            {partners.map((partner, index) => (
              <motion.div
                key={partner.id}
                className="flex items-center justify-center bg-white p-4 rounded-xl shadow-md w-24 h-24 md:w-32 md:h-32"
                initial={{ opacity: 0, y: 50 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{
                  transform: `translateY(${index % 2 === 0 ? '-10px' : '10px'})`,
                }}
              >
                <div className="text-4xl md:text-5xl">{partner.logo}</div>
              </motion.div>
            ))}
          </div>
          {/* Wave overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-12 wave-top"></div>
        </div>

        {/* Success metrics */}
        <div className="mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {metrics.map((metric) => (
              <CircularProgress
                key={metric.id}
                value={metric.value}
                label={metric.label}
                color={metric.color}
                startColor={metric.startColor}
                endColor={metric.endColor}
              />
            ))}
          </div>
        </div>

        {/* Blockchain verification process */}
        <VerificationProcess />

        {/* Testimonials */}
        <div className="mt-20">
          <h3 className="text-2xl font-bold text-center mb-12 gradient-text">What Our Learners Say</h3>
          <div className="flex flex-wrap justify-center gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.id} testimonial={testimonial} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrustIndicators; 