'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, Timestamp, onSnapshot, setDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, CourseModule } from '@/lib/firestore-schema';
import Link from 'next/link';
import { auth } from '@/lib/firebase';

// Helper function to parse params
const parseParams = (params: any) => {
  if (!params) return { courseId: null, moduleId: null };
  
  // Handle both array and string formats
  const courseId = Array.isArray(params.courseId) 
    ? params.courseId[0] 
    : params.courseId;
    
  const moduleId = Array.isArray(params.moduleId)
    ? params.moduleId[0]
    : params.moduleId;
    
  return { courseId, moduleId };
};

const ModulePage = () => {
  const params = useParams();
  const { courseId, moduleId } = parseParams(params);
  
  console.log('Module page params:', { courseId, moduleId, rawParams: params });
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getAuthenticatedUserId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<CourseModule | null>(null);
  const [isVideoCompleted, setIsVideoCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState<any>(null);
  const [nextModuleId, setNextModuleId] = useState<string | null>(null);
  const [previousModuleId, setPreviousModuleId] = useState<string | null>(null);
  const [enrollmentComplete, setEnrollmentComplete] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [isAutoEnrolling, setIsAutoEnrolling] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState<string | null>(null);
  
  // Use a ref to track the last update timestamp to prevent excessive updates
  const lastUpdateRef = useRef<number>(0);
  const unsubscribeRef = useRef<any>(null);
  const enrolledRef = useRef<boolean>(false);
  
  // Clean up the snapshot listener when component unmounts
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        console.log('Cleaning up snapshot listener');
        unsubscribeRef.current();
      }
    };
  }, []);

  // Load course data when user is available
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId || !moduleId) {
          console.error('Missing courseId or moduleId:', { courseId, moduleId });
          return;
        }
        
        // Wait for auth to initialize
        if (isLoading) {
          console.log('Auth is still loading, waiting...');
          return;
        }
        
        // Get user ID from either Firebase auth or wallet address using the helper
        const userId = getAuthenticatedUserId();
        
        if (!userId) {
          console.log('No authenticated user found, redirecting to login');
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          router.push('/auth/login');
          return;
        }
        
        if (enrolledRef.current) {
          console.log('Already enrolled and loaded, skipping fetch');
          return;
        }
        
        console.log('Fetching course data for:', courseId);
        // Fetch course details
        const courseDoc = await getDoc(doc(db, 'courses', courseId as string));
        
        if (!courseDoc.exists()) {
          console.error('Course not found:', courseId);
          router.push('/dashboard/courses');
          return;
        }
        
        const courseData = courseDoc.data() as Course;
        console.log('Course data loaded:', courseData.title);
        setCourse(courseData);
        
        // Find current module
        const currentModule = courseData.modules.find(m => m.id === moduleId);
        if (currentModule) {
          console.log('Module found:', currentModule.title);
          setModule(currentModule);
          
          // Find next and previous modules
          const currentIndex = courseData.modules.findIndex(m => m.id === moduleId);
          
          if (currentIndex > 0) {
            setPreviousModuleId(courseData.modules[currentIndex - 1].id);
          }
          
          if (currentIndex < courseData.modules.length - 1) {
            setNextModuleId(courseData.modules[currentIndex + 1].id);
          }
        } else {
          console.error('Module not found:', moduleId);
          router.push(`/dashboard/courses/${courseId}`);
          return;
        }
        
        // Check enrollment with real-time updates
        if (userId) {
          console.log('Setting up progress listener for user:', userId);
          const progressRef = doc(db, 'user-progress', `${userId}_${courseId}`);
          
          // First check if the document exists
          const progressDoc = await getDoc(progressRef);
          
          if (!progressDoc.exists()) {
            console.log('User not enrolled, auto-enrolling...');
            setIsAutoEnrolling(true);
            
            // Auto-enroll user
            try {
              // Check if user document exists first
              const userRef = doc(db, 'users', userId);
              const userDoc = await getDoc(userRef);
              
              // Create user document if it doesn't exist (particularly for wallet users)
              if (!userDoc.exists()) {
                console.log('Creating user document for user:', userId);
                
                // Try to get any available user info
                const userInfo = {
                  walletAddress: user?.walletAddress || (userId.startsWith('0x') ? userId : undefined),
                  isWeb3Connected: !!(user?.walletAddress || userId.startsWith('0x')),
                  name: user?.name,
                  email: user?.email,
                  image: user?.image,
                  enrolledCourses: [courseId],
                  userType: 'student',
                  createdAt: Timestamp.now(),
                  updatedAt: Timestamp.now(),
                };
                
                await setDoc(userRef, userInfo);
              }
              
              // Create progress document
              await setDoc(progressRef, {
                userId: userId,
                courseId,
                enrolledAt: Timestamp.now(),
                lastAccessedAt: Timestamp.now(),
                completedModules: [],
                moduleScores: {},
                quizAttempts: {}
              });
              
              // Update user document if it already existed
              if (userDoc.exists()) {
                const userData = userDoc.data();
                const enrolledCourses = userData.enrolledCourses || [];
                
                if (!enrolledCourses.includes(courseId)) {
                  await updateDoc(userRef, {
                    enrolledCourses: [...enrolledCourses, courseId],
                    updatedAt: Timestamp.now()
                  });
                }
              }
              
              // Update course enrollment count
              const courseRef = doc(db, 'courses', courseId as string);
              await updateDoc(courseRef, {
                enrolledStudents: arrayUnion(userId),
                enrolledCount: increment(1)
              });
              
              setEnrollmentComplete(true);
              setIsEnrolled(true);
              console.log('Auto-enrollment complete');
            } catch (enrollError) {
              console.error('Error auto-enrolling:', enrollError);
              setEnrollmentError('Failed to auto-enroll in this course. Please try enrolling from the course page.');
            } finally {
              setIsAutoEnrolling(false);
            }
          } else {
            setEnrollmentComplete(true);
            setIsEnrolled(true);
          }
          
          // Set up real-time listener only if not already set up
          if (!unsubscribeRef.current) {
            console.log('Setting up new snapshot listener');
            
            const unsub = onSnapshot(progressRef, (doc) => {
              if (doc.exists()) {
                const progressData = doc.data();
                const now = Date.now();
                
                // Only update if last update was more than 5 seconds ago
                if (now - lastUpdateRef.current > 5000) {
                  console.log('Progress updated:', progressData);
                  setProgress(progressData);
                  setCompletedModules(progressData.completedModules || []);
                  lastUpdateRef.current = now;
                  
                  // Update lastAccessedAt timestamp, but don't listen for the result
                  updateDoc(progressRef, {
                    lastAccessedAt: Timestamp.now()
                  }).catch(error => {
                    console.error('Error updating lastAccessedAt:', error);
                  });
                  
                  enrolledRef.current = true;
                  setLoading(false);
                }
              }
            }, (error) => {
              console.error('Error listening to progress:', error);
              setLoading(false);
            });
            
            unsubscribeRef.current = unsub;
          }
        }
      } catch (error) {
        console.error('Error fetching module data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, moduleId, isLoading, router, enrollmentComplete, getAuthenticatedUserId, user]);

  // Called when a video is complete
  const handleVideoComplete = async () => {
    try {
      // Get user ID from either Firebase auth or wallet address
      const userId = getAuthenticatedUserId();
      
      if (!userId || !courseId || !moduleId || !module) {
        console.error('Missing data for marking complete:', { userId, courseId, moduleId });
        return;
      }
      
      setIsVideoCompleted(true);
      
      // Mark module as completed in user progress
      const progressRef = doc(db, 'user-progress', `${userId}_${courseId}`);
      
      // Get current progress
      const progressDoc = await getDoc(progressRef);
      
      if (progressDoc.exists()) {
        const progressData = progressDoc.data();
        const completedModules = progressData.completedModules || [];
        
        // Only add if not already completed
        if (!completedModules.includes(moduleId)) {
          // Update user progress
          await updateDoc(progressRef, {
            completedModules: arrayUnion(moduleId),
            lastAccessedAt: Timestamp.now()
          });
          
          console.log('Module marked as completed');
        } else {
          console.log('Module was already completed');
        }
      }
    } catch (error) {
      console.error('Error marking module as complete:', error);
    }
  };

  const handleStartQuiz = () => {
    router.push(`/dashboard/courses/${courseId}/modules/${moduleId}/quiz`);
  };

  // Render loading state
  if (loading || isLoading || isAutoEnrolling) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle enrollment error
  if (enrollmentError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Enrollment Error</h1>
            <p className="mb-4 text-gray-700">{enrollmentError}</p>
            <Link 
              href={`/dashboard/courses/${courseId}`} 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!course || !module) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex flex-col items-center">
        <div className="max-w-4xl w-full">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-4">Module not found</h1>
            <p className="mb-4 text-gray-700">
              Sorry, we couldn't find the module you're looking for.
            </p>
            <Link 
              href="/dashboard/courses" 
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isModuleCompleted = progress?.completedModules?.includes(moduleId);

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <Link 
            href={`/dashboard/courses/${courseId}`}
            className="text-blue-600 hover:underline flex items-center"
          >
            <span className="mr-1">←</span> Back to Course
          </Link>
          
          <div className="text-sm text-gray-500">
            Module {module.orderNumber} of {course.modules.length}
          </div>
        </div>
        
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{module.title}</h1>
          
          <div className="mb-6 flex items-center">
            {isModuleCompleted ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                In Progress
              </span>
            )}
          </div>
          
          {module.videoUrl && (
            <div className="mb-8">
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}> {/* 16:9 aspect ratio */}
                <iframe 
                  src={module.videoUrl}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  title={module.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onEnded={handleVideoComplete}
                ></iframe>
              </div>
              
              <div className="mt-4 flex space-x-4">
                <button 
                  onClick={handleVideoComplete}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Mark video as watched
                </button>
                
                <button
                  onClick={() => router.push(`/dashboard/courses/${courseId}/modules/${moduleId}/quiz`)}
                  className="text-sm text-green-600 hover:text-green-800 underline"
                >
                  Take Quiz
                </button>
              </div>
            </div>
          )}
          
          {module.content && (
            <div className="mb-8 prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: module.content }} />
            </div>
          )}
          
          <div className="pt-6 border-t border-gray-200 flex justify-between">
            {previousModuleId ? (
              <Link 
                href={`/dashboard/courses/${courseId}/modules/${previousModuleId}`}
                className="bg-gray-100 px-4 py-2 rounded text-gray-800 hover:bg-gray-200"
              >
                Previous Module
              </Link>
            ) : (
              <div></div>
            )}
            
            <div className="flex space-x-3">
              {nextModuleId ? (
                <Link 
                  href={`/dashboard/courses/${courseId}/modules/${nextModuleId}`}
                  className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
                >
                  Next Module
                </Link>
              ) : (
                <Link 
                  href={`/dashboard/courses/${courseId}/final-test`}
                  className="bg-blue-600 px-4 py-2 rounded text-white hover:bg-blue-700"
                >
                  Take Final Test
                </Link>
              )}
              
              {module.quiz && module.quiz.questions && module.quiz.questions.length > 0 && (
                <button 
                  onClick={handleStartQuiz}
                  className="bg-green-600 px-4 py-2 rounded text-white hover:bg-green-700"
                >
                  Take Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModulePage; 