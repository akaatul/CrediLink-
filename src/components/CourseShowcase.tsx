'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import Link from 'next/link';
import { getAllCourses } from '@/lib/firestore';
import { Course } from '@/lib/firestore-schema';

const CourseCard = ({ course, delay = 0 }: { course: Course, delay?: number }) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  // Format course data
  const category = course.level || 'All Levels';
  const modules = course.modules?.length || 0;
  const duration = course.duration ? `${course.duration} hours` : 'Self-paced';
  const learners = course.enrolledCount || 0;
  const rating = course.rating || 4.5;
  const progress = 0; // For showcase, we always show 0 progress
  
  const progressColor = progress > 70 ? 'bg-green-500' : progress > 30 ? 'bg-yellow-500' : 'bg-primary-500';

  return (
    <motion.div
      ref={ref}
      className="relative w-72 h-96 rounded-3xl overflow-hidden shadow-xl bg-white group"
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -10, transition: { duration: 0.2 } }}
    >
      {/* Course image */}
      <div className="h-40 overflow-hidden">
        <img 
          src={course.coverImage || "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80"} 
          alt={course.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      
      {/* Progress bar */}
      <div className="absolute top-36 left-0 right-0 h-1 bg-gray-200">
        <div 
          className={`h-full ${progressColor}`} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Content */}
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
            {category}
          </span>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-sm ml-1 text-gray-700">{rating}</span>
          </div>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
        
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {modules} Modules
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {duration}
          </div>
        </div>
        
        {/* Module thumbnails */}
        <div className="flex space-x-2 mb-4">
          {Array(Math.min(4, modules)).fill(0).map((_, i) => (
            <div 
              key={i} 
              className="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center overflow-hidden"
            >
              <span className="text-xs text-gray-500 font-medium">{i + 1}</span>
            </div>
          ))}
          {modules > 4 && (
            <div className="w-10 h-10 rounded-md bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-500">+{modules - 4}</span>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {learners.toLocaleString()} learners
          </div>
          <div className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Start Course
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const CourseShowcase = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const autoplayInterval = useRef<NodeJS.Timeout | null>(null);

  // Fetch courses from Firebase
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const fetchedCourses = await getAllCourses(10);
        setCourses(fetchedCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, []);
  
  // Set up autoplay for slideshow
  useEffect(() => {
    if (autoplay && courses.length > 0) {
      autoplayInterval.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.ceil(courses.length / 3));
      }, 5000);
    }
    
    return () => {
      if (autoplayInterval.current) {
        clearInterval(autoplayInterval.current);
      }
    };
  }, [autoplay, courses.length]);
  
  // Handle pause/resume autoplay on hover
  const handleMouseEnter = () => setAutoplay(false);
  const handleMouseLeave = () => setAutoplay(true);
  
  // Calculate visible courses based on current slide
  const visibleCourses = courses.slice(currentSlide * 3, currentSlide * 3 + 3);
  const totalSlides = Math.ceil(courses.length / 3);

  return (
    <section className="py-20 px-4 bg-white">
      <div className="container mx-auto">
        <motion.div
          ref={ref}
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4 gradient-text">Featured Courses</h2>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Explore our most popular blockchain and Web3 courses with verifiable credentials
          </p>
        </motion.div>

        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center text-gray-600">
            <p>No courses available at the moment.</p>
          </div>
        ) : (
          <div 
            className="relative" 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* Slideshow Arrows */}
            {courses.length > 3 && (
              <>
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides)} 
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                  aria-label="Previous slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button 
                  onClick={() => setCurrentSlide((prev) => (prev + 1) % totalSlides)} 
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 z-10 bg-white p-2 rounded-full shadow-md hover:bg-gray-100"
                  aria-label="Next slide"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            
            {/* Course Cards */}
            <motion.div 
              className="flex justify-center flex-wrap gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              key={`slide-${currentSlide}`}
            >
              {visibleCourses.map((course, index) => (
                <CourseCard 
                  key={course.id} 
                  course={course} 
                  delay={index * 0.1}
                />
              ))}
            </motion.div>
            
            {/* Slideshow Indicators */}
            {totalSlides > 1 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array(totalSlides).fill(0).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`w-3 h-3 rounded-full ${
                      currentSlide === index ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link href="/courses" className="btn-primary">
            View All Courses
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default CourseShowcase; 