import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  addDoc,
  serverTimestamp,
  Timestamp,
  DocumentData,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { db } from './firebase';
import { collections, Course, UserCourseProgress, QuizAttempt, User, QuizQuestion } from './firestore-schema';
import { 
  generateQuizFromTranscript, 
  generateFinalTest,
  getAnswerExplanations,
  GeneratedQuiz,
  generateQuizFromVideoUrl,
  generateFinalTestFromModules
} from './ai-service';

// Convert Firestore timestamp to Date
export const timestampToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

// Convert Date to Firestore timestamp
export const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Add a document to a collection with auto-generated ID
export const addDocument = async <T extends DocumentData>(
  collectionName: string, 
  data: T
): Promise<string> => {
  const collectionRef = collection(db, collectionName);
  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

// Set a document with a specific ID
export const setDocument = async <T extends DocumentData>(
  collectionName: string, 
  id: string, 
  data: T
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

// Get a document by ID
export const getDocument = async <T>(
  collectionName: string, 
  id: string
): Promise<T | null> => {
  const docRef = doc(db, collectionName, id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as unknown as T;
  } else {
    return null;
  }
};

// Update a document
export const updateDocument = async <T extends DocumentData>(
  collectionName: string, 
  id: string, 
  data: Partial<T>
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

// Delete a document
export const deleteDocument = async (
  collectionName: string, 
  id: string
): Promise<void> => {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
};

// Query documents
export const queryDocuments = async <T>(
  collectionName: string,
  fieldPath: string,
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any',
  value: any,
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limitCount?: number
): Promise<T[]> => {
  const collectionRef = collection(db, collectionName);
  
  let q = query(collectionRef, where(fieldPath, operator, value));
  
  if (orderByField) {
    q = query(q, orderBy(orderByField, orderDirection || 'asc'));
  }
  
  if (limitCount) {
    q = query(q, limit(limitCount));
  }
  
  const querySnapshot = await getDocs(q);
  const results: T[] = [];
  
  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() } as unknown as T);
  });
  
  return results;
};

// User-related functions
export const getUserById = async (userId: string) => {
  return getDocument(collections.users, userId);
};

export const updateUserProfile = async (userId: string, data: Partial<DocumentData>) => {
  return updateDocument(collections.users, userId, data);
};

// Course-related functions
export const getCourseById = async (courseId: string) => {
  return getDocument(collections.courses, courseId);
};

export const getAllCourses = async (limitCount = 20) => {
  try {
    const collectionRef = collection(db, collections.courses);
    // Simpler query that doesn't require a complex index
    const q = query(collectionRef, limit(limitCount));
    const querySnapshot = await getDocs(q);
    const results: Course[] = [];
    
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() } as unknown as Course);
    });
    
    return results;
  } catch (error) {
    console.error('Error getting all courses:', error);
    return [];
  }
};

export const getUserEnrolledCourses = async (userId: string) => {
  try {
    // Get user document first
    const userDoc = await getDocument<any>('users', userId);
    if (!userDoc || !userDoc.enrolledCourses) {
      return [];
    }
    
    // Get each enrolled course by ID (doesn't require compound index)
    const enrolledCourseIds = userDoc.enrolledCourses || [];
    const enrolledCourses: Course[] = [];
    
    for (const courseId of enrolledCourseIds) {
      const course = await getCourseById(courseId);
      if (course) {
        enrolledCourses.push(course as Course);
      }
    }
    
    return enrolledCourses;
  } catch (error) {
    console.error('Error getting user enrolled courses:', error);
    return [];
  }
};

export const enrollInCourse = async (userId: string, courseId: string) => {
  try {
    // First, check if user document exists
    const userRef = doc(db, collections.users, userId);
    const userDoc = await getDoc(userRef);
    
    // Create user document if it doesn't exist (particularly important for wallet users)
    if (!userDoc.exists()) {
      console.log('User document does not exist, creating one for wallet user');
      await setDoc(userRef, {
        walletAddress: userId, // Assume it's a wallet address if document doesn't exist
        isWeb3Connected: true,
        enrolledCourses: [],
        userType: 'student',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    
    // Add user to course's enrolled students
    await updateDocument(collections.courses, courseId, {
      enrolledStudents: arrayUnion(userId)
    });
    
    // Add course to user's enrolled courses
    await updateDocument(collections.users, userId, {
      enrolledCourses: arrayUnion(courseId)
    });
    
    // Initialize user progress for this course
    const userProgress: UserCourseProgress = {
      userId,
      courseId,
      enrolledAt: new Date(),
      lastAccessedAt: new Date(),
      completedModules: [],
      moduleScores: {},
      quizAttempts: {}
    };
    
    await addDocument(collections.userProgress, userProgress);
    return true;
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

export const unenrollFromCourse = async (userId: string, courseId: string) => {
  // Remove user from course's enrolled students
  await updateDocument(collections.courses, courseId, {
    enrolledStudents: arrayRemove(userId)
  });
  
  // Remove course from user's enrolled courses
  await updateDocument(collections.users, userId, {
    enrolledCourses: arrayRemove(courseId)
  });
  
  // Find and delete user progress for this course
  const progressDocs = await queryDocuments<UserCourseProgress>(
    collections.userProgress,
    'userId',
    '==',
    userId,
    undefined,
    undefined,
    undefined
  );
  
  const userProgressDoc = progressDocs.find((doc) => doc.courseId === courseId);
  if (userProgressDoc && userProgressDoc.id) {
    await deleteDocument(collections.userProgress, userProgressDoc.id);
  }
};

export const getUserCourseProgress = async (userId: string, courseId: string) => {
  const progressDocs = await queryDocuments<UserCourseProgress>(
    collections.userProgress,
    'userId',
    '==',
    userId,
    undefined,
    undefined,
    undefined
  );
  
  return progressDocs.find((doc) => doc.courseId === courseId);
};

export const updateUserCourseProgress = async (progressId: string, data: Partial<UserCourseProgress>) => {
  return updateDocument(collections.userProgress, progressId, {
    ...data,
    lastAccessedAt: new Date()
  });
};

export const completeModule = async (progressId: string, moduleId: string, score: number) => {
  const progressDoc = await getDocument<UserCourseProgress>(collections.userProgress, progressId);
  if (!progressDoc) return null;
  
  const completedModules = progressDoc.completedModules || [];
  const moduleScores = progressDoc.moduleScores || {};
  
  // Only add to completed modules if not already completed
  if (!completedModules.includes(moduleId)) {
    completedModules.push(moduleId);
  }
  
  // Update the score
  moduleScores[moduleId] = score;
  
  return updateDocument(collections.userProgress, progressId, {
    completedModules,
    moduleScores,
    lastAccessedAt: new Date()
  });
};

export const saveQuizAttempt = async (
  progressId: string, 
  quizId: string, 
  attempt: QuizAttempt
) => {
  const progressDoc = await getDocument<UserCourseProgress>(collections.userProgress, progressId);
  if (!progressDoc) return null;
  
  const quizAttempts = progressDoc.quizAttempts || {};
  if (!quizAttempts[quizId]) {
    quizAttempts[quizId] = [];
  }
  
  quizAttempts[quizId].push(attempt);
  
  return updateDocument(collections.userProgress, progressId, {
    quizAttempts,
    lastAccessedAt: new Date()
  });
};

export const saveFinalTestResult = async (
  progressId: string,
  score: number,
  passed: boolean,
  certificateId?: string
) => {
  const updates: any = {
    finalTestScore: score,
    finalTestPassed: passed,
    lastAccessedAt: new Date()
  };
  
  if (passed) {
    updates.certificateId = certificateId;
    updates.completedAt = new Date();
  }
  
  return updateDocument(collections.userProgress, progressId, updates);
};

export const getLeaderboard = async (limitCount = 10) => {
  const collectionRef = collection(db, collections.userProgress);
  const q = query(
    collectionRef,
    where('finalTestPassed', '==', true),
    orderBy('finalTestScore', 'desc'),
    limit(limitCount)
  );
  
  const querySnapshot = await getDocs(q);
  const results: UserCourseProgress[] = [];
  
  querySnapshot.forEach((doc) => {
    results.push({ id: doc.id, ...doc.data() } as unknown as UserCourseProgress);
  });
  
  return results;
};

// Job-related functions
export const getJobById = async (jobId: string) => {
  return getDocument(collections.jobPostings, jobId);
};

export const getRecruiterJobs = async (recruiterId: string) => {
  return queryDocuments(collections.jobPostings, 'recruiterId', '==', recruiterId);
};

// Application-related functions
export const getUserApplications = async (userId: string) => {
  return queryDocuments(collections.applications, 'userId', '==', userId);
};

export const getJobApplications = async (jobId: string) => {
  return queryDocuments(collections.applications, 'jobId', '==', jobId);
};

// Function to extract YouTube ID from URL
export const extractYouTubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);

  if (match && match[2].length === 11) {
    return match[2];
  } else {
    return null;
  }
};

// Generate quiz for a module from a video URL
export const generateAndStoreQuizFromVideo = async (
  courseId: string,
  moduleId: string,
  videoUrl: string,
  moduleTitle: string
): Promise<QuizQuestion[]> => {
  try {
    // Generate quiz questions using AI
    const quiz = await generateQuizFromVideoUrl(videoUrl, moduleTitle);
    
    // Get module reference
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }
    
    const courseData = courseDoc.data() as Course;
    const moduleIndex = courseData.modules.findIndex(m => m.id === moduleId);
    
    if (moduleIndex === -1) {
      throw new Error('Module not found');
    }
    
    // Update the module with the generated quiz
    const updatedModules = [...courseData.modules];
    updatedModules[moduleIndex] = {
      ...updatedModules[moduleIndex],
      quiz: {
        questions: quiz.questions
      }
    };
    
    // Update the course document
    await updateDoc(courseRef, {
      modules: updatedModules
    });
    
    return quiz.questions;
  } catch (error) {
    console.error('Error generating and storing quiz:', error);
    return [];
  }
};

export const generateFinalTestFromCourseModules = async (
  courseId: string
): Promise<QuizQuestion[]> => {
  try {
    const courseRef = doc(db, 'courses', courseId);
    const courseDoc = await getDoc(courseRef);

    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }

    const courseData = courseDoc.data() as Course;
    const moduleQuizzes = courseData.modules
      .filter(m => m.quiz && m.quiz.questions.length > 0)
      .map(m => ({
        title: m.title,
        questions: m.quiz.questions
      }));

    if (moduleQuizzes.length === 0) {
      throw new Error('No module quizzes found to generate a final test from.');
    }

    const finalTest = await generateFinalTestFromModules(moduleQuizzes);
    return finalTest.questions;

  } catch (error) {
    console.error('Error generating final test from modules:', error);
    return [];
  }
};

// Store quiz results for a user
export const storeQuizResult = async (
  userId: string,
  courseId: string,
  moduleId: string,
  score: number,
  isPassed: boolean
): Promise<void> => {
  try {
    // Get user progress document
    const progressRef = doc(db, collections.userProgress, `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (progressDoc.exists()) {
      // Update existing progress
      const progressData = progressDoc.data() as UserCourseProgress;
      
      // Update module scores
      const updatedModuleScores = {
        ...progressData.moduleScores,
        [moduleId]: score
      };
      
      // Update completed modules if passed
      let updatedCompletedModules = [...progressData.completedModules];
      if (isPassed && !updatedCompletedModules.includes(moduleId)) {
        updatedCompletedModules.push(moduleId);
      }
      
      await updateDoc(progressRef, {
        moduleScores: updatedModuleScores,
        completedModules: updatedCompletedModules,
        lastAccessedAt: Timestamp.now()
      });
    } else {
      // Create new progress document
      await setDoc(progressRef, {
        userId,
        courseId,
        enrolledAt: Timestamp.now(),
        lastAccessedAt: Timestamp.now(),
        completedModules: isPassed ? [moduleId] : [],
        moduleScores: {
          [moduleId]: score
        },
        quizAttempts: {}
      });
    }
  } catch (error) {
    console.error('Error storing quiz result:', error);
    throw error;
  }
};

// Store final test result for a user
export const storeFinalTestResult = async (
  userId: string,
  courseId: string,
  score: number,
  isPassed: boolean
): Promise<string | null> => {
  try {
    // Get user progress document
    const progressRef = doc(db, collections.userProgress, `${userId}_${courseId}`);
    const progressDoc = await getDoc(progressRef);
    
    if (!progressDoc.exists()) {
      throw new Error('User progress not found');
    }
    
    // Get course data
    const courseRef = doc(db, collections.courses, courseId);
    const courseDoc = await getDoc(courseRef);
    
    if (!courseDoc.exists()) {
      throw new Error('Course not found');
    }
    
    const courseData = courseDoc.data() as Course;
    
    // Update progress with final test results
    await updateDoc(progressRef, {
      finalTestScore: score,
      finalTestPassed: isPassed,
      completedAt: isPassed ? Timestamp.now() : null,
      lastAccessedAt: Timestamp.now()
    });
    
          // If passed, create certificate
      if (isPassed) {
        // Create certificate document
        const certificateRef = await addDoc(collection(db, collections.credentials), {
          userId,
          courseId,
          courseName: courseData.title,
          issueDate: Timestamp.now(),
          skills: courseData.modules.map(module => module.title) || ['blockchain', 'web3'], // Extract skills from module titles
          blockchainVerified: true,
          blockchainTxHash: `0x${Math.random().toString(36).substring(2, 15)}`, // Mock hash
          issuer: 'CrediLink+',
          issuerId: 'credilink-system',
        });
        
        // Update with certificate ID
        await updateDoc(doc(db, collections.credentials, certificateRef.id), {
          id: certificateRef.id
        });
      
              // Update user progress with certificate ID
        await updateDoc(progressRef, {
          certificateId: certificateRef.id,
          completedAt: Timestamp.now()
        });
        
        // Update user document
        const userRef = doc(db, collections.users, userId);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data() as User;
          
          // Update completed courses
          const completedCourses = userData.completedCourses || [];
          if (!completedCourses.includes(courseId)) {
            completedCourses.push(courseId);
          }
          
          // Update credentials
          const credentials = userData.credentials || [];
          credentials.push(certificateRef.id);
          
          await updateDoc(userRef, {
            completedCourses,
            credentials,
            updatedAt: Timestamp.now()
          });
          
          // Update leaderboard
          await updateLeaderboard(userId);
        }
      
      return certificateRef.id;
    }
    
    return null;
  } catch (error) {
    console.error('Error storing final test result:', error);
    return null;
  }
};

// Update leaderboard after course completion
export const updateLeaderboard = async (userId: string): Promise<void> => {
  try {
    // Get user data
    const userRef = doc(db, collections.users, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data() as User;
    
    // Get all user progress documents for this user
    const progressQuery = query(collection(db, collections.userProgress), where('userId', '==', userId));
    const progressDocs = await getDocs(progressQuery);
    
    // Calculate total score
    let totalScore = 0;
    let completedCourses = 0;
    
    progressDocs.forEach((doc) => {
      const progress = doc.data() as UserCourseProgress;
      
      if (progress.finalTestPassed) {
        completedCourses++;
        totalScore += progress.finalTestScore || 0;
      }
    });
    
    // Get or create leaderboard entry
    const leaderboardRef = doc(db, collections.leaderboard, userId);
    const leaderboardDoc = await getDoc(leaderboardRef);
    
    if (leaderboardDoc.exists()) {
      // Update existing entry
      await updateDoc(leaderboardRef, {
        totalScore,
        completedCourses,
        earnedCertificates: userData.credentials?.length || 0,
        updatedAt: Timestamp.now()
      });
    } else {
      // Create new entry
      await setDoc(leaderboardRef, {
        id: userId,
        userId,
        userName: userData.name || 'Anonymous',
        userImage: userData.image || '',
        totalScore,
        completedCourses,
        earnedCertificates: userData.credentials?.length || 0,
        rank: 0, // Will be calculated by a Cloud Function
        updatedAt: Timestamp.now()
      });
    }
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

export const getRankedLeaderboard = async () => {
  try {
    const progressQuery = query(
      collection(db, 'user-progress'),
      where('finalTestPassed', '==', true)
    );
    const progressSnap = await getDocs(progressQuery);

    const userProgressMap: { [userId: string]: { completedCourses: number, totalScore: number } } = {};

    progressSnap.forEach(doc => {
      const progress = doc.data() as UserCourseProgress;
      if (!userProgressMap[progress.userId]) {
        userProgressMap[progress.userId] = { completedCourses: 0, totalScore: 0 };
      }
      userProgressMap[progress.userId].completedCourses += 1;
      userProgressMap[progress.userId].totalScore += progress.finalTestScore || 0;
    });

    const leaderboard = Object.entries(userProgressMap).map(([userId, data]) => ({
      userId,
      ...data
    }));

    leaderboard.sort((a, b) => b.completedCourses - a.completedCourses || b.totalScore - a.totalScore);

    return leaderboard;

  } catch (error) {
    console.error('Error getting ranked leaderboard:', error);
    return [];
  }
};

// Function to create a new company document in Firestore
export const createCompany = async (companyData: Omit<Company, 'id' | 'createdAt'>): Promise<string> => {
  // ... existing code ...
};

// Function to get a single course by ID
export const getCourse = async (id: string): Promise<Course | null> => {
  // ... existing code ...
};

export const updateCourse = async (id: string, data: Partial<Course>): Promise<void> => {
  const courseRef = doc(db, 'courses', id);
  return await updateDoc(courseRef, {
    ...data,
    updatedAt: new Date(),
  });
};

export const deleteCourseAndRelatedContent = async (courseId: string): Promise<void> => {
  // Delete the course itself
  const courseRef = doc(db, 'courses', courseId);
  await deleteDoc(courseRef);

  // Delete related user progress
  const progressQuery = query(
    collection(db, 'user-progress'),
    where('courseId', '==', courseId)
  );
  const progressSnap = await getDocs(progressQuery);
  const deletePromises: Promise<void>[] = [];
  progressSnap.forEach((doc) => {
    deletePromises.push(deleteDoc(doc.ref));
  });

  await Promise.all(deletePromises);
};

// Function to create a new user document in Firestore
export const createUser = async (
  id: string,
  data: Omit<User, 'id'>
): Promise<void> => {
  const userRef = doc(db, 'users', id);
  return await setDoc(userRef, {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}; 