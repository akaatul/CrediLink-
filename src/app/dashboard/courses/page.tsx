'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCourses, getUserEnrolledCourses, enrollInCourse } from '@/lib/firestore';
import { Course } from '@/lib/firestore-schema';

const CoursesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'enrolled', 'not-enrolled'

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user || !user.id) return;
      
      try {
        // Fetch all courses
        const allCourses = await getAllCourses();
        setCourses(allCourses);
        
        // Fetch user's enrolled courses
        const userEnrolledCourses = await getUserEnrolledCourses(user.id);
        const enrolledIds = userEnrolledCourses.map((course: any) => course.id);
        setEnrolledCourseIds(enrolledIds);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourses();
  }, [user]);

  const handleEnroll = async (courseId: string) => {
    if (!user || !user.id) {
      router.push('/auth/login');
      return;
    }
    
    try {
      // Show enrollment in progress
      setLoading(true);
      
      // Check if the user is a wallet user or email user
      const userId = user.id;
      
      console.log(`Enrolling user ${userId} in course ${courseId}`);
      await enrollInCourse(userId, courseId);
      
      // Update the UI to show the course as enrolled
      setEnrolledCourseIds([...enrolledCourseIds, courseId]);
      
      // Navigate to the course page
      router.push(`/dashboard/courses/${courseId}`);
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseClick = (courseId: string) => {
    if (enrolledCourseIds.includes(courseId)) {
      router.push(`/dashboard/courses/${courseId}`);
    }
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'enrolled') return enrolledCourseIds.includes(course.id);
    if (filter === 'not-enrolled') return !enrolledCourseIds.includes(course.id);
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Courses</h1>
          <p className="text-gray-600">Explore our courses and start your learning journey</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <div className="flex space-x-2 bg-white p-1 rounded-lg shadow">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'all' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              All Courses
            </button>
            <button 
              onClick={() => setFilter('enrolled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'enrolled' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Enrolled
            </button>
            <button 
              onClick={() => setFilter('not-enrolled')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                filter === 'not-enrolled' ? 'bg-primary-500 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Not Enrolled
            </button>
          </div>
        </div>
      </div>
      
      {filteredCourses.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold mb-2">No courses found</h3>
          <p className="text-gray-600">
            {filter === 'enrolled' 
              ? "You haven't enrolled in any courses yet." 
              : "No courses available at the moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course, index) => (
            <CourseCard 
              key={course.id} 
              course={course} 
              isEnrolled={enrolledCourseIds.includes(course.id)}
              onEnroll={() => handleEnroll(course.id)}
              onClick={() => handleCourseClick(course.id)}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CourseCardProps {
  course: Course;
  isEnrolled: boolean;
  onEnroll: () => void;
  onClick: () => void;
  index: number;
}

const CourseCard = ({ course, isEnrolled, onEnroll, onClick, index }: CourseCardProps) => {
  return (
    <motion.div 
      className={`bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer ${
        isEnrolled ? 'border-2 border-primary-500' : ''
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      onClick={isEnrolled ? onClick : undefined}
    >
      {/* Course Image */}
      <div className="h-48 overflow-hidden">
        <img 
          src={course.coverImage || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80'} 
          alt={course.title} 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* Course Content */}
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
            {course.level}
          </span>
          {course.rating && (
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm ml-1 text-gray-700">{course.rating}</span>
            </div>
          )}
        </div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
        
        <div className="flex justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            {course.modules.length} Modules
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {course.duration} hours
          </div>
        </div>
        
        {/* Instructor */}
        <div className="flex items-center mb-6">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-medium">
            {course.instructor.charAt(0)}
          </div>
          <span className="ml-2 text-sm text-gray-700">
            By <span className="font-medium">{course.instructor}</span>
          </span>
        </div>
        
        {/* Enroll Button */}
        {!isEnrolled ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEnroll();
            }} 
            className="w-full py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Enroll Now
          </button>
        ) : (
          <button 
            className="w-full py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
          >
            Continue Learning
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default CoursesPage; 