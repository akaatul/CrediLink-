'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getCourseById, getUserCourseProgress, updateUserCourseProgress } from '@/lib/firestore';
import { Course, UserCourseProgress, CourseModule } from '@/lib/firestore-schema';
import Link from 'next/link';
import { doc, getDoc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface UserProgressWithId extends UserCourseProgress {
  id?: string;
}

const CourseDetailsPage = () => {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getAuthenticatedUserId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        if (!courseId) return;
        
        // Fetch course details
        const courseDoc = await getDoc(doc(db, 'courses', courseId as string));
        
        if (!courseDoc.exists()) {
          console.error('Course not found');
          router.push('/dashboard/courses');
          return;
        }
        
        const courseData = courseDoc.data() as Course;
        setCourse(courseData);
        
        // Check enrollment status and progress using getAuthenticatedUserId
        const userId = getAuthenticatedUserId();
        if (userId) {
          // Check progress
          const progressRef = doc(db, 'user-progress', `${userId}_${courseId}`);
          const progressDoc = await getDoc(progressRef);
          
          if (progressDoc.exists()) {
            const progressData = progressDoc.data();
            setProgress(progressData);
            setIsEnrolled(true);
            setCompletedModules(progressData.completedModules || []);
          }
          
          // Check enrollment through user document as well
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.enrolledCourses && userData.enrolledCourses.includes(courseId)) {
              setIsEnrolled(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      }
    };
    
    if (!isLoading) {
      fetchCourse();
    }
  }, [courseId, isLoading, router, getAuthenticatedUserId]);

  const handleEnroll = async () => {
    try {
      // Get the authenticated user ID from any source (Firebase or wallet)
      const userId = getAuthenticatedUserId();
      
      if (!userId || !courseId || !course) {
        console.error('Cannot enroll: missing data', { 
          userId,
          courseId,
          hasCourse: !!course
        });
        
        // If we don't have a user ID, we need to authenticate
        if (!userId) {
          console.log('No authenticated user, redirecting to login');
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          router.push('/auth/login');
          return;
        }
        
        return;
      }
      
      console.log('Starting enrollment process for course:', courseId);
      setIsEnrolling(true);
      
      // Check if user document exists (especially important for wallet users)
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      // Create user document if it doesn't exist (for wallet users)
      if (!userDoc.exists()) {
        console.log('User document does not exist, creating one');
        
        // Try to get any available user info from the user object
        const userInfo = {
          walletAddress: user?.walletAddress || (userId.startsWith('0x') ? userId : undefined),
          isWeb3Connected: !!(user?.walletAddress || userId.startsWith('0x')),
          name: user?.name,
          email: user?.email,
          image: user?.image,
          enrolledCourses: [],
          userType: 'student',
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        };
        
        await setDoc(userRef, userInfo);
      }
      
      // Create progress document
      const progressRef = doc(db, 'user-progress', `${userId}_${courseId}`);
      const progressData = {
        userId: userId,
        courseId,
        enrolledAt: Timestamp.now(),
        lastAccessedAt: Timestamp.now(),
        completedModules: [],
        moduleScores: {},
        quizAttempts: {}
      };
      
      console.log('Creating progress document:', progressData);
      await setDoc(progressRef, progressData);
      
      // Update user document
      const userData = userDoc.exists() ? userDoc.data() : { enrolledCourses: [] };
      const enrolledCourses = userData.enrolledCourses || [];
      
      if (!enrolledCourses.includes(courseId)) {
        console.log('Adding course to user enrolled courses');
        await updateDoc(userRef, {
          enrolledCourses: [...enrolledCourses, courseId],
          updatedAt: Timestamp.now()
        });
      }
      
      // Update course enrollment count
      const courseRef = doc(db, 'courses', courseId as string);
      console.log('Updating course enrollment count');
      await updateDoc(courseRef, {
        enrolledCount: increment(1)
      });
      
      setIsEnrolled(true);
      console.log('Enrollment complete, redirecting to first module');
      
      // Redirect to first module
      if (course.modules.length > 0) {
        const firstModuleId = course.modules[0].id;
        console.log('Navigating to first module:', firstModuleId);
        router.push(`/dashboard/courses/${courseId}/modules/${firstModuleId}`);
      }
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setIsEnrolling(false);
    }
  };

  const getModuleStatus = (moduleId: string) => {
    if (completedModules.includes(moduleId)) {
      return 'completed';
    }
    
    // Find the index of the first uncompleted module
    const moduleIndex = course?.modules.findIndex(m => m.id === moduleId) || 0;
    const firstUncompletedIndex = course?.modules.findIndex(m => !completedModules.includes(m.id)) || 0;
    
    if (moduleIndex === firstUncompletedIndex) {
      return 'in-progress';
    }
    
    if (moduleIndex > firstUncompletedIndex) {
      return 'locked';
    }
    
    return 'available';
  };

  const handleModuleClick = (index: number) => {
    // Implementation of handleModuleClick
  };

  const handleStartQuiz = (moduleId: string) => {
    router.push(`/dashboard/courses/${courseId}/modules/${moduleId}/quiz`);
  };

  const handleTakeFinalTest = () => {
    router.push(`/dashboard/courses/${courseId}/final-test`);
  };

  const calculateProgress = () => {
    if (!course || !progress || !progress.completedModules) return 0;
    return Math.round((progress.completedModules.length / course.modules.length) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Course not found</h3>
          <p className="text-gray-600 mb-4">The course you're looking for doesn't exist or you don't have access.</p>
          <button 
            onClick={() => router.push('/dashboard/courses')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  const activeModule = course.modules[0]; // Assuming activeModule is the first module
  const progressPercentage = calculateProgress();
  const canTakeFinalTest = progressPercentage === 100;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Course Image */}
          <div className="w-full md:w-1/3 h-48 md:h-auto rounded-lg overflow-hidden">
            <img 
              src={course.coverImage || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80'} 
              alt={course.title} 
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Course Info */}
          <div className="w-full md:w-2/3">
            <div className="flex justify-between items-start mb-2">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                {course.level}
              </span>
              {course.rating && (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm ml-1 text-gray-700">{course.rating}</span>
                </div>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{course.title}</h1>
            <p className="text-gray-600 mb-4">{course.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-gray-700">{course.modules.length} Modules</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-700">{course.duration} hours</span>
              </div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="text-gray-700">By {course.instructor}</span>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div 
                className="bg-primary-500 h-2.5 rounded-full" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600 mb-4">
              <span>{progressPercentage}% complete</span>
              <span>{progress?.completedModules?.length || 0} of {course.modules.length} modules</span>
            </div>
            
            {/* Final Test Button */}
            {canTakeFinalTest && !progress?.finalTestPassed && (
              <button 
                onClick={handleTakeFinalTest}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
              >
                Take Final Test
              </button>
            )}
            
            {/* Certificate Button */}
            {progress?.finalTestPassed && progress?.certificateId && (
              <button 
                onClick={() => router.push(`/dashboard/certificates/${progress.certificateId}`)}
                className="px-6 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors"
              >
                View Certificate
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Course Content</h2>
            <p className="text-gray-600">
              {course?.modules.length} modules • {course?.duration} hours of content
            </p>
          </div>
          
          <div className="mt-4 md:mt-0">
            {isAuthenticated ? (
              isEnrolled ? (
                (() => {
                  // Find the first uncompleted module or first module
                  const firstUncompletedModule = course?.modules.find(m => !completedModules.includes(m.id));
                  const targetModule = firstUncompletedModule || course?.modules[0];
                  
                  return (
                    <Link
                      href={`/dashboard/courses/${courseId}/modules/${targetModule?.id}`}
                      className="btn-primary"
                    >
                      {progress?.completedAt ? 'Review Course' : 'Continue Learning'}
                    </Link>
                  );
                })()
              ) : (
                <button
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                  className="btn-primary"
                >
                  {isEnrolling ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enrolling...
                    </span>
                  ) : (
                    'Enroll Now'
                  )}
                </button>
              )
            ) : (
              <Link href="/auth/login" className="btn-primary">
                Login to Enroll
              </Link>
            )}
          </div>
        </div>
        
        {/* Module List */}
        <div className="space-y-4">
          {course?.modules.map((module, index) => {
            const moduleStatus = getModuleStatus(module.id);
            
            return (
              <div
                key={module.id}
                className={`border rounded-lg p-4 ${
                  moduleStatus === 'completed' ? 'border-green-300 bg-green-50' : 
                  moduleStatus === 'in-progress' ? 'border-primary-300 bg-primary-50' :
                  moduleStatus === 'locked' ? 'border-gray-200 bg-gray-50 opacity-75' :
                  'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                      moduleStatus === 'completed' ? 'bg-green-500 text-white' :
                      moduleStatus === 'in-progress' ? 'bg-primary-500 text-white' :
                      'bg-gray-200 text-gray-700'
                    }`}>
                      {moduleStatus === 'completed' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span>{index + 1}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">{module.title}</h3>
                      <p className="text-sm text-gray-600">{module.duration} min</p>
                    </div>
                  </div>
                  
                  {isEnrolled && (
                    moduleStatus === 'locked' ? (
                      <span className="text-sm text-gray-500 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Locked
                      </span>
                    ) : (
                      <Link 
                        href={`/dashboard/courses/${courseId}/modules/${module.id}`}
                        className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                      >
                        {moduleStatus === 'completed' ? 'Review' : 'Start'}
                      </Link>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Final Test */}
        {isEnrolled && (
          <div className={`mt-6 border rounded-lg p-4 ${
            progress?.finalTestPassed ? 'border-green-300 bg-green-50' :
            completedModules.length === course?.modules.length ? 'border-primary-300 bg-primary-50' :
            'border-gray-200 bg-gray-50 opacity-75'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                  progress?.finalTestPassed ? 'bg-green-500 text-white' :
                  completedModules.length === course?.modules.length ? 'bg-primary-500 text-white' :
                  'bg-gray-200 text-gray-700'
                }`}>
                  {progress?.finalTestPassed ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className="font-medium">Final Assessment</h3>
                  <p className="text-sm text-gray-600">
                    {progress?.finalTestPassed 
                      ? `Completed with ${progress.finalTestScore}%` 
                      : 'Complete all modules to unlock'}
                  </p>
                </div>
              </div>
              
              {isEnrolled && (
                completedModules.length === course?.modules.length ? (
                  progress?.finalTestPassed ? (
                    <Link 
                      href={`/dashboard/certificates/${progress.certificateId}`}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      View Certificate
                    </Link>
                  ) : (
                    <button
                      onClick={() => router.push(`/dashboard/courses/${courseId}/final-test`)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      Take Test
                    </button>
                  )
                ) : (
                  <span className="text-sm text-gray-500 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    Locked
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDetailsPage; 