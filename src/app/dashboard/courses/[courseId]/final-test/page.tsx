'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, CourseModule, QuizQuestion } from '@/lib/firestore-schema';
import { 
  generateFinalTestFromCourseModules,
  storeFinalTestResult
} from '@/lib/firestore';
import { QuizQuestion as AIQuizQuestion } from '@/lib/ai-service';
import Link from 'next/link';

const FinalTestPage = () => {
  const { courseId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [questions, setQuestions] = useState<AIQuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Test state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [certificateId, setCertificateId] = useState<string | null>(null);
  const [allModulesCompleted, setAllModulesCompleted] = useState(false);

  // Fetch course data and check progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId || !user) return;
        
        // Fetch course data
        const courseDoc = await getDoc(doc(db, 'courses', courseId as string));
        
        if (!courseDoc.exists()) {
          console.error('Course not found');
          router.push('/dashboard/courses');
          return;
        }
        
        const courseData = courseDoc.data() as Course;
        setCourse(courseData);
        
        // Check if all modules are completed
        const progressRef = doc(db, 'user-progress', `${user.id}_${courseId}`);
        const progressDoc = await getDoc(progressRef);
        
        if (progressDoc.exists()) {
          const progressData = progressDoc.data();
          const completedModules = progressData.completedModules || [];
          const allCompleted = courseData.modules.every(module => 
            completedModules.includes(module.id)
          );
          
          setAllModulesCompleted(allCompleted);
          
          // Check if the user has already passed the final test
          if (progressData.finalTestPassed && progressData.certificateId) {
            setCertificateId(progressData.certificateId);
          }
        } else {
          setAllModulesCompleted(false);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isAuthenticated && !isLoading) {
      fetchData();
    } else if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [courseId, user, isAuthenticated, isLoading, router]);

  // Generate final test
  const generateFinalTest = async () => {
    if (!courseId) return;
    
    setIsGenerating(true);
    
    try {
      // Generate and store final test
      const generatedQuestions = await generateFinalTestFromCourseModules(
        courseId as string
      );
      
      setQuestions(generatedQuestions as AIQuizQuestion[]);
      setSelectedOptions(new Array(generatedQuestions.length).fill(undefined));

    } catch (error) {
      console.error('Error generating final test:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOptions(new Array(questions.length).fill(undefined));
  };

  // Handle option selection
  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };

  // Navigation functions
  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Calculate score
  const calculateScore = () => {
    let correctCount = 0;
    
    questions.forEach((question, index) => {
      if (selectedOptions[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });
    
    return Math.round((correctCount / questions.length) * 100);
  };

  // Submit final test
  const handleSubmit = async () => {
    if (!courseId || !user?.id) return;
    
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
    
    try {
      // Final test passing threshold (70% by default)
      const passingThreshold = course?.finalTest?.passingScore || 70;
      const isPassed = finalScore >= passingThreshold;
      
      // Store result in database and get certificate ID if passed
      const certId = await storeFinalTestResult(
        user.id,
        courseId as string,
        finalScore,
        isPassed
      );
      
      if (certId) {
        setCertificateId(certId);
      }
    } catch (error) {
      console.error('Error submitting final test:', error);
    }
  };

  // Loading state
  if (isLoading || !course) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If certificate is already issued
  if (certificateId) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{course.title} - Final Test</h1>
          <p className="text-gray-600">You've already completed this course and earned a certificate!</p>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Congratulations!</h2>
          <p className="text-gray-600 mb-6">
            You've successfully completed the final test and earned your certificate.
          </p>
          <div className="flex justify-center">
            <Link
              href={`/dashboard/certificates/${certificateId}`}
              className="btn-primary"
            >
              View Certificate
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If not all modules are completed
  if (!allModulesCompleted) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{course.title} - Final Test</h1>
          <p className="text-gray-600">Complete all course modules to unlock the final test</p>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-yellow-400 mr-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-xl font-semibold mb-2">Modules Required</h3>
              <p className="text-gray-600">
                You need to complete all course modules before taking the final test.
              </p>
            </div>
          </div>
          
          <div className="mt-6 border-t border-gray-200 pt-6">
            <h4 className="font-medium mb-3">Course Modules:</h4>
            <ul className="space-y-2">
              {course.modules.map((module, index) => (
                <li key={module.id} className="flex items-center">
                  <span className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center mr-3 text-sm">
                    {index + 1}
                  </span>
                  <Link
                    href={`/dashboard/courses/${courseId}/modules/${module.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {module.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="mt-6">
            <Link
              href={`/dashboard/courses/${courseId}`}
              className="btn-primary"
            >
              Return to Course
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Generate final test view
  if (questions.length === 0 || isGenerating) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{course.title} - Final Test</h1>
          <p className="text-gray-600">Test your knowledge of the entire course</p>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Final Assessment</h2>
          <p className="mb-6">
            Congratulations on completing all the modules! You're now ready to take the final test.
            This test will evaluate your understanding of all the material covered in the course.
          </p>
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Generating final test questions based on the course content...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a minute or two.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <h3 className="text-blue-800 font-medium">Important Information</h3>
                </div>
                <ul className="mt-2 text-blue-700 text-sm pl-8 list-disc space-y-1">
                  <li>The test consists of 15 multiple-choice questions.</li>
                  <li>You need to score at least 70% to pass and earn your certificate.</li>
                  <li>You can review your answers before final submission.</li>
                  <li>Make sure you have enough time to complete the test in one sitting.</li>
                </ul>
              </div>
              
              <button
                onClick={generateFinalTest}
                className="btn-primary w-full"
              >
                Start Final Test
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Final test result view
  if (isSubmitted) {
    const passingThreshold = course?.finalTest?.passingScore || 70;
    const isPassed = score >= passingThreshold;
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{course.title} - Final Test Results</h1>
          <p className="text-gray-600">Your assessment results</p>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-semibold">Your Score: {score}%</h2>
              <p className={`font-medium ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                {isPassed ? `Passed! You've earned a certificate.` : `Failed - You need ${passingThreshold}% to pass`}
              </p>
            </div>
            <div className={`w-28 h-28 rounded-full flex items-center justify-center ${
              isPassed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              <span className="text-4xl font-bold">{score}%</span>
            </div>
          </div>
          
          {isPassed ? (
            <div className="mb-8">
              <div className="p-6 border border-green-200 bg-green-50 rounded-lg text-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-green-800 mb-2">Congratulations!</h3>
                <p className="text-green-700">
                  You've successfully passed the final test and earned your certificate.
                </p>
              </div>
              
              {certificateId ? (
                <div className="text-center">
                  <Link
                    href={`/dashboard/certificates/${certificateId}`}
                    className="btn-primary inline-flex"
                  >
                    View Your Certificate
                  </Link>
                </div>
              ) : (
                <p className="text-center text-gray-600">
                  Your certificate is being generated and will be available soon.
                </p>
              )}
            </div>
          ) : (
            <div className="mb-8">
              <div className="p-6 border border-red-200 bg-red-50 rounded-lg text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-red-800 mb-2">Keep Learning</h3>
                <p className="text-red-700 mb-4">
                  You didn't reach the passing score. Review the course material and try again.
                </p>
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Retry Final Test
                </button>
              </div>
            </div>
          )}
          
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Test Overview</h3>
            <p className="text-gray-600 mb-4">
              You answered {questions.filter((_, index) => selectedOptions[index] === questions[index].correctOptionIndex).length} out of {questions.length} questions correctly.
            </p>
            
            <div className="text-center mt-8">
              <Link
                href={`/dashboard/courses/${courseId}`}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Return to Course
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Taking final test view
  const currentQuestion = questions[currentQuestionIndex];
  const isQuestionAnswered = selectedOptions[currentQuestionIndex] !== undefined;
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">{course.title} - Final Test</h1>
        <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
        <div className="mb-4 w-full bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-primary-500 h-1.5 rounded-full" 
            style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
        
        <div className="mb-8">
          <p className="text-lg mb-6">{currentQuestion.text}</p>
          
          <div className="space-y-3">
            {currentQuestion.options.map((option, optionIdx) => (
              <div 
                key={optionIdx}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedOptions[currentQuestionIndex] === optionIdx
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => handleOptionSelect(currentQuestionIndex, optionIdx)}
              >
                <div className="flex items-center">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                    selectedOptions[currentQuestionIndex] === optionIdx
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200'
                  }`}>
                    <span>{String.fromCharCode(65 + optionIdx)}</span>
                  </div>
                  <span>{option}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-between">
          <div>
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === questions.length - 1 || !isQuestionAnswered}
              className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          {currentQuestionIndex === questions.length - 1 && (
            <button
              onClick={handleSubmit}
              disabled={selectedOptions.length < questions.length || selectedOptions.some(option => option === undefined)}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Final Test
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalTestPage; 