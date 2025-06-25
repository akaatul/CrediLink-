'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, CourseModule } from '@/lib/firestore-schema';
import Link from 'next/link';
import { 
  generateQuizFromVideoUrl,
  QuizQuestion, 
  getAnswerExplanations, 
  Explanation 
} from '@/lib/ai-service';
import { QuizAttempt } from '@/lib/firestore-schema';

const QuizPage = () => {
  const { courseId, moduleId } = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, getAuthenticatedUserId } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [module, setModule] = useState<CourseModule | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [explanations, setExplanations] = useState<Explanation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Fetch course and module data
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!courseId) return;
        
        // Wait for auth to initialize
        if (isLoading) {
          console.log('Auth is still loading, waiting...');
          return;
        }
        
        // Get authenticated user ID
        const userId = getAuthenticatedUserId();
        
        if (!userId) {
          console.log('No authenticated user found, redirecting to login');
          sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
          router.push('/auth/login');
          return;
        }
        
        const courseDoc = await getDoc(doc(db, 'courses', courseId as string));
        
        if (!courseDoc.exists()) {
          console.error('Course not found');
          router.push('/dashboard/courses');
          return;
        }
        
        const courseData = courseDoc.data() as Course;
        setCourse(courseData);
        
        const moduleData = courseData.modules.find(m => m.id === moduleId);
        if (moduleData) {
          console.log('Module found:', moduleData);
          setModule(moduleData);
          
          // If questions exist, use them
          if (moduleData.quiz?.questions && moduleData.quiz.questions.length > 0) {
            console.log('Quiz questions found:', moduleData.quiz.questions.length);
            setQuestions(moduleData.quiz.questions);
            // Initialize selected options array
            setSelectedOptions(new Array(moduleData.quiz.questions.length).fill(-1));
          } else {
            console.log('No quiz questions found for this module');
          }
        } else {
          console.error('Module not found');
          router.push(`/dashboard/courses/${courseId}`);
        }
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('An error occurred while loading the quiz. Please try again.');
      }
    };

    fetchData();
  }, [courseId, moduleId, isLoading, router, getAuthenticatedUserId]);

  const generateQuiz = async () => {
    if (!module || !courseId || !moduleId) {
      setError('Module or course information is missing. Please try again.');
      return;
    }
    
    if (!module.videoUrl) {
      setError('This module does not have a video URL to generate a quiz from.');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Generate quiz from video URL using the AI service
      const generatedQuiz = await generateQuizFromVideoUrl(module.videoUrl, module.title);
      
      if (generatedQuiz.questions.length > 0) {
        // Update the module in Firestore with the new questions
        const courseRef = doc(db, 'courses', courseId as string);
        const courseSnap = await getDoc(courseRef);
        if (courseSnap.exists()) {
          const courseData = courseSnap.data() as Course;
          const moduleIndex = courseData.modules.findIndex(m => m.id === moduleId);
          
          if (moduleIndex !== -1) {
            const updatedModules = [...courseData.modules];
            updatedModules[moduleIndex].quiz = { questions: generatedQuiz.questions };
            await updateDoc(courseRef, { modules: updatedModules });
          }
        }
        
        setQuestions(generatedQuiz.questions);
        setSelectedOptions(new Array(generatedQuiz.questions.length).fill(-1));
        console.log('Quiz generated and stored successfully with', generatedQuiz.questions.length, 'questions');
      } else {
        setError('The AI failed to generate a quiz for this video.');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz. Please try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptionSelect = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return; // Don't allow changing answers after submission
    
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[questionIndex] = optionIndex;
    setSelectedOptions(newSelectedOptions);
  };

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

  const calculateScore = () => {
    let correctCount = 0;
    
    questions.forEach((question, index) => {
      if (selectedOptions[index] === question.correctOptionIndex) {
        correctCount++;
      }
    });
    
    return Math.round((correctCount / questions.length) * 100);
  };

  const saveQuizProgress = async (userId: string, finalScore: number, isPassed: boolean, attempt: QuizAttempt) => {
    const userProgressRef = doc(db, 'user-progress', `${userId}_${courseId}`);
    
    try {
      await updateDoc(userProgressRef, {
        [`moduleScores.${moduleId}`]: finalScore,
        [`quizAttempts.${moduleId}`]: arrayUnion(attempt),
        ...(isPassed && { completedModules: arrayUnion(moduleId) }),
        lastAccessedAt: new Date(),
      });
      console.log('Quiz progress saved successfully');
    } catch (error: any) {
      if (error.code === 'not-found') {
        // Document doesn't exist, create it
        await setDoc(userProgressRef, {
          userId,
          courseId,
          enrolledAt: new Date(),
          lastAccessedAt: new Date(),
          completedModules: isPassed ? [moduleId] : [],
          moduleScores: { [moduleId as string]: finalScore },
          quizAttempts: { [moduleId as string]: [attempt] },
        });
        console.log('New user progress document created and quiz progress saved');
      } else {
        console.error("Error saving quiz progress: ", error);
        throw error;
      }
    }
  };

  const handleSubmit = async () => {
    // Calculate score
    const finalScore = calculateScore();
    setScore(finalScore);
    setIsSubmitted(true);
    
    try {
      // Get explanations for answers
      const explanationTexts = await getAnswerExplanations(questions, selectedOptions);
      setExplanations(explanationTexts);
      
      // Store result in database
      if (courseId && moduleId) {
        // Get user ID from any authentication source
        const userId = getAuthenticatedUserId();
        
        if (userId) {
          const isPassed = finalScore >= (module?.quiz?.passingScore || 70);
          
          const quizAttempt: QuizAttempt = {
            attemptedAt: new Date(),
            score: finalScore,
            answers: questions.reduce((acc, _, index) => {
              acc[index.toString()] = selectedOptions[index];
              return acc;
            }, {} as { [key: string]: number }),
            passed: isPassed,
            attemptNumber: retryCount + 1
          };

          await saveQuizProgress(userId, finalScore, isPassed, quizAttempt);
        } else {
          console.error('No user ID available for storing quiz result');
        }
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      setError('Failed to submit quiz results. Your progress may not be saved.');
    }
  };

  const handleFinish = () => {
    if (courseId) {
      router.push(`/dashboard/courses/${courseId}`);
    } else {
      router.push('/dashboard/courses');
    }
  };

  const handleRetry = () => {
    // Reset all quiz states
    setIsSubmitted(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOptions(new Array(questions.length).fill(-1));
    setExplanations([]);
    setRetryCount(prev => prev + 1);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!course || !module) {
    return (
      <div className="flex items-center justify-center h-96 flex-col">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600">Loading course content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-600">Error</h2>
          <p className="mb-6 text-gray-700">{error}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link 
              href={`/dashboard/courses/${courseId}/modules/${moduleId}`}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              Back to Module
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0 || isGenerating) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{module.title} - Quiz</h1>
          <p className="text-gray-600">{course.title}</p>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          <h2 className="text-xl font-semibold mb-4">Generate Quiz</h2>
          <p className="mb-6">
            This module doesn't have a quiz yet. We'll generate one based on the video content.
          </p>
          
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600">Generating quiz questions based on the video content...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a minute or two.</p>
            </div>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={generateQuiz}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Generate Quiz
              </button>
              <Link 
                href={`/dashboard/courses/${courseId}/modules/${moduleId}`}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Back to Module
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    const currentQuestion = questions[currentQuestionIndex];
    const userAnswer = selectedOptions[currentQuestionIndex];
    const isCorrect = userAnswer === currentQuestion.correctOptionIndex;
    
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-2">{module.title} - Quiz Results</h1>
          <p className="text-gray-600">{course.title}</p>
        </div>
        
        <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-semibold">Your Score: {score}%</h2>
              <p className={`font-medium ${score >= 70 ? 'text-green-600' : 'text-red-600'}`}>
                {score >= 70 ? 'Passed!' : 'Failed - Please retry'}
              </p>
            </div>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center ${
              score >= 70 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}>
              <span className="text-3xl font-bold">{score}%</span>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Question {currentQuestionIndex + 1} of {questions.length}</h3>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-lg mb-4">{currentQuestion.text}</p>
              
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option, optionIdx) => (
                  <div 
                    key={optionIdx} 
                    className={`p-3 rounded-lg border ${
                      optionIdx === currentQuestion.correctOptionIndex
                        ? 'bg-green-100 border-green-300'
                        : optionIdx === userAnswer
                          ? 'bg-red-100 border-red-300'
                          : 'border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                        optionIdx === currentQuestion.correctOptionIndex
                          ? 'bg-green-500 text-white'
                        : optionIdx === userAnswer
                          ? 'bg-red-500 text-white'
                          : 'bg-gray-200'
                      }`}>
                        {optionIdx === currentQuestion.correctOptionIndex ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : optionIdx === userAnswer ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <span>{String.fromCharCode(65 + optionIdx)}</span>
                        )}
                      </div>
                      <span>{option}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              {explanations[currentQuestionIndex] && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                  <p className="text-blue-700">{explanations[currentQuestionIndex].feedback}</p>
                </div>
              )}
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
                disabled={currentQuestionIndex === questions.length - 1}
                className="py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 ml-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            
            {score >= 70 && currentQuestionIndex === questions.length - 1 && (
              <button
                onClick={handleFinish}
                className="btn-primary"
              >
                Continue to Next Module
              </button>
            )}
            
            {score < 70 && currentQuestionIndex === questions.length - 1 && (
              <button
                onClick={handleRetry}
                className="py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry Quiz
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text mb-2">{module.title} - Quiz</h1>
        <p className="text-gray-600">{course.title}</p>
      </div>
      
      <div className="bg-white rounded-xl p-8 shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Question {currentQuestionIndex + 1} of {questions.length}</h2>
          <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xl font-bold">
            {currentQuestionIndex + 1}/{questions.length}
          </div>
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
              disabled={currentQuestionIndex === questions.length - 1}
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
              Submit Quiz
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPage; 