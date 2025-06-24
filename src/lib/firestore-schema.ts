/**
 * This file defines the Firestore database schema for the CrediLink+ application.
 * It's not used directly by Firestore but serves as documentation for the data structure.
 */

import { Timestamp } from 'firebase/firestore';

// User document structure
export interface User {
  id: string; // Same as the Firebase Auth UID
  name?: string;
  email?: string;
  image?: string;
  userType: 'student' | 'recruiter';
  walletAddress?: string;
  isWeb3Connected?: boolean;
  createdAt: Date;
  updatedAt?: Date;
  
  // Student-specific fields
  enrolledCourses?: string[]; // Array of course IDs
  completedCourses?: string[]; // Array of course IDs
  credentials?: string[]; // Array of credential IDs
  skills?: string[]; // Array of skill names
  
  // Recruiter-specific fields
  company?: string;
  jobTitle?: string;
  jobPostings?: string[]; // Array of job posting IDs
}

// Course document structure
export interface Course {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  instructor: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in hours
  enrolledCount?: number;
  rating?: number;
  modules: CourseModule[];
  finalTest: FinalTest;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

// Course module structure
export interface CourseModule {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  order: number;
  orderNumber?: number; // For displaying module number
  content?: string; // HTML content for the module
  quiz: Quiz;
}

// Quiz structure
export interface Quiz {
  id?: string;           // Optional ID
  title?: string;        // Optional title
  questions: QuizQuestion[];
  passingScore?: number; // Optional passing score threshold
}

// Quiz question structure
export interface QuizQuestion {
  id: string;
  text?: string;        // Question text for AI-generated questions
  question?: string;    // Question text for manually created questions
  options: string[];
  correctOptionIndex: number;
  points?: number;      // Optional points for scoring
  explanation?: string; // Optional explanation for the answer
}

// Final test structure
export interface FinalTest {
  id?: string;
  title?: string;
  questions: QuizQuestion[];
  passingScore: number;
}

// User course progress structure
export interface UserCourseProgress {
  id?: string;         // Document ID (optional as it's sometimes added after querying)
  userId: string;
  courseId: string;
  enrolledAt: Date;
  lastAccessedAt: Date;
  completedModules: string[]; // Array of module IDs
  moduleScores: {
    [moduleId: string]: number; // Module ID -> score
  };
  quizAttempts: {
    [quizId: string]: QuizAttempt[]; // Quiz ID -> attempts
  };
  finalTestScore?: number;
  finalTestPassed?: boolean;
  certificateId?: string;
  completedAt?: Date;
}

// Quiz attempt structure
export interface QuizAttempt {
  attemptedAt: Date;
  score: number;
  answers: {
    [questionId: string]: number; // Question ID -> selected option index
  };
  passed: boolean;
  attemptNumber: number; // Track which attempt this is
}

// Lesson structure
export interface Lesson {
  id: string;
  title: string;
  description: string;
  contentType: 'video' | 'text' | 'quiz';
  contentUrl?: string;
  duration: number; // In minutes
  order: number;
}

// Credential document structure
export interface Credential {
  id: string;
  userId: string;
  courseId: string;
  courseName: string;
  issueDate: Date;
  expiryDate?: Date;
  skills: string[];
  certificateUrl?: string;
  blockchainVerified: boolean;
  blockchainTxHash?: string;
  issuer: string;
  issuerId: string;
}

// Job posting document structure
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  recruiterId: string;
  location: string;
  remote: boolean;
  description: string;
  requirements: string[];
  preferredSkills: string[];
  requiredCredentials?: string[];
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  applicants?: string[]; // Array of user IDs
  status: 'open' | 'closed' | 'filled';
  createdAt: Date;
  updatedAt?: Date;
  closingDate?: Date;
}

// Application document structure
export interface Application {
  id: string;
  jobId: string;
  userId: string;
  resumeUrl?: string;
  coverLetter?: string;
  status: 'applied' | 'reviewing' | 'interview' | 'offered' | 'rejected' | 'accepted';
  appliedAt: Date;
  updatedAt?: Date;
  notes?: string;
  sharedCredentials: string[]; // Array of credential IDs
}

// Firestore collections
export const collections = {
  users: 'users',
  courses: 'courses',
  credentials: 'credentials',
  jobPostings: 'job-postings',
  applications: 'applications',
  userProgress: 'user-progress',
  leaderboard: 'leaderboard',
}; 