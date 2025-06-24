'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getUserEnrolledCourses, getUserCourseProgress } from '@/lib/firestore';
import { Course, Credential, collections } from '@/lib/firestore-schema';
import Link from 'next/link';

// Components
const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
  <div className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${color}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-full ${color.replace('border-', 'bg-').replace('-500', '-100')}`}>
        {icon}
      </div>
    </div>
  </div>
);

const CourseCard = ({ course, progress }: { course: Course; progress: number }) => (
  <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
    <div className="h-40 overflow-hidden relative">
      <img 
        src={course.coverImage || "https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1332&q=80"} 
        alt={course.title} 
        className="w-full h-full object-cover" 
      />
      <div className="absolute top-2 right-2 bg-white py-1 px-2 rounded-full text-xs font-medium">
        {course.level || 'All Levels'}
      </div>
    </div>
    <div className="p-4 flex-1 flex flex-col">
      <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">{progress}% Complete</span>
          <span className="text-sm font-medium text-primary-600">{progress < 100 ? 'In Progress' : 'Completed'}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-500 rounded-full h-2"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  </div>
);

const JobCard = ({ title, company, location, salary, tags }: { title: string; company: string; location: string; salary: string; tags: string[] }) => (
  <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-gray-600 mt-1">{company} • {location}</p>
      </div>
      <div className="bg-primary-50 text-primary-700 py-1 px-3 rounded-full text-sm font-medium">
        {salary}
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded">
          {tag}
        </span>
      ))}
    </div>
    <div className="mt-4 flex justify-end">
      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
        View Details →
      </button>
    </div>
  </div>
);

const CandidateCard = ({ name, title, skills, matchScore }: { name: string; title: string; skills: string[]; matchScore: number }) => (
  <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-start">
      <img
        src={`https://randomuser.me/api/portraits/${Math.random() > 0.5 ? 'men' : 'women'}/${Math.floor(Math.random() * 100)}.jpg`}
        alt={name}
        className="w-12 h-12 rounded-full object-cover mr-4"
      />
      <div>
        <h3 className="font-semibold text-lg">{name}</h3>
        <p className="text-gray-600 mt-1">{title}</p>
      </div>
      <div className="ml-auto">
        <div className="bg-primary-50 text-primary-700 py-1 px-3 rounded-full text-sm font-medium">
          {matchScore}% Match
        </div>
      </div>
    </div>
    <div className="mt-4 flex flex-wrap gap-2">
      {skills.map((skill, index) => (
        <span key={index} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded">
          {skill}
        </span>
      ))}
    </div>
    <div className="mt-4 flex justify-end">
      <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
        View Profile →
      </button>
    </div>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const userType = user?.userType || 'student';
  
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [courseProgress, setCourseProgress] = useState<{[courseId: string]: number}>({});
  const [certificates, setCertificates] = useState<Credential[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user || !user.id) return;
      
      try {
        setLoading(true);
        
        // Fetch enrolled courses
        const courses = await getUserEnrolledCourses(user.id);
        setEnrolledCourses(courses);
        
        // Calculate course progress for each enrolled course
        const progressData: {[courseId: string]: number} = {};
        let totalProgress = 0;
        
        for (const course of courses) {
          const progress = await getUserCourseProgress(user.id, course.id);
          if (progress && course.modules) {
            const completedModules = progress.completedModules?.length || 0;
            const totalModules = course.modules.length;
            const percentComplete = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
            progressData[course.id] = percentComplete;
            totalProgress += percentComplete;
          } else {
            progressData[course.id] = 0;
          }
        }
        
        setCourseProgress(progressData);
        setOverallProgress(courses.length > 0 ? Math.round(totalProgress / courses.length) : 0);
        
        // Fetch certificates
        const certificatesRef = collection(db, collections.credentials);
        const certificatesQuery = query(certificatesRef, where('userId', '==', user.id));
        const certificatesSnapshot = await getDocs(certificatesQuery);
        
        const certificatesList: Credential[] = [];
        certificatesSnapshot.forEach((doc) => {
          certificatesList.push({ id: doc.id, ...doc.data() } as Credential);
        });
        
        // Also check legacy certificates collection
        const legacyCertificatesRef = collection(db, 'certificates');
        const legacyQuery = query(legacyCertificatesRef, where('userId', '==', user.id));
        const legacySnapshot = await getDocs(legacyQuery);
        
        legacySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.userId && data.courseId && data.courseName) {
            certificatesList.push({ 
              id: doc.id,
              ...data,
              issuerId: data.issuerId || 'credilink-system',
              skills: data.skills || [] 
            } as Credential);
          }
        });
        
        setCertificates(certificatesList);
        
        // Extract unique skills from certificates
        const allSkills = certificatesList.flatMap(cert => cert.skills || []);
        const uniqueSkills = [...new Set(allSkills)];
        setSkills(uniqueSkills);
        
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, [user]);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-morphic p-6"
      >
        <h2 className="text-xl font-bold mb-2">
          Welcome, {user?.name || user?.walletAddress?.substring(0, 6) + '...' + user?.walletAddress?.substring(38) || 'User'}!
        </h2>
        <p className="text-gray-600">
          {userType === 'student'
            ? 'Track your learning progress and credentials.'
            : 'Find and verify candidates with blockchain credentials.'}
        </p>
        
        {/* Authentication Method */}
        <div className="mt-4 flex items-center">
          <span className="text-sm text-gray-500 mr-2">Signed in via:</span>
          {user?.isWeb3Connected ? (
            <span className="bg-primary-50 text-primary-600 text-xs px-2 py-1 rounded-full flex items-center">
              <svg className="h-3 w-3 mr-1" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2.04183 1L15.0446 10.8397L12.7336 4.99099L2.04183 1Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              MetaMask
            </span>
          ) : (
            <span className="bg-blue-50 text-blue-600 text-xs px-2 py-1 rounded-full">
              {user?.email ? 'Email' : 'OAuth'}
            </span>
          )}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        /* Dashboard Content based on user type */
        userType === 'student' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Learning Progress</h3>
                <span className="text-primary-600 text-sm font-medium">
                  {enrolledCourses.length > 0 ? 
                    `${Object.values(courseProgress).filter(p => p === 100).length}/${enrolledCourses.length} Courses` : 
                    'No courses yet'}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
                <div 
                  className="h-full bg-primary-500 rounded-full" 
                  style={{ width: `${overallProgress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600">
                {overallProgress > 0 
                  ? `You're making great progress! Overall completion: ${overallProgress}%` 
                  : 'Enroll in courses to start your learning journey!'}
              </p>
            </motion.div>

            {/* Certificates Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Certificates</h3>
                <span className="text-primary-600 text-sm font-medium">{certificates.length} Earned</span>
              </div>
              <div className="flex space-x-2 mb-4">
                {certificates.length > 0 ? (
                  certificates.slice(0, 3).map((cert, index) => (
                    <div 
                      key={cert.id}
                      className={`w-10 h-10 rounded-full ${
                        index === 0 ? 'bg-primary-100 text-primary-600' : 
                        index === 1 ? 'bg-accent-100 text-accent-600' :
                        'bg-green-100 text-green-600'
                      } flex items-center justify-center`}
                    >
                      <span className="text-xs font-medium">{cert.courseName.substring(0, 2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
                {certificates.length > 3 && (
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                    <span className="text-xs">+{certificates.length - 3}</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {certificates.length > 0 
                  ? 'Your credentials are secured on blockchain.' 
                  : 'Complete courses to earn blockchain-verified certificates.'}
              </p>
              {certificates.length > 0 && (
                <Link href="/dashboard/certificates" className="mt-3 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all certificates →
                </Link>
              )}
            </motion.div>

            {/* Skills Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Skills Earned</h3>
                <span className="text-primary-600 text-sm font-medium">{skills.length} Skills</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {skills.length > 0 ? (
                  skills.slice(0, 5).map((skill, i) => (
                    <span 
                      key={i}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No skills earned yet.</p>
                )}
                {skills.length > 5 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{skills.length - 5} more
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {skills.length > 0 
                  ? 'Skills verified through course completions.' 
                  : 'Complete courses to earn verified skills.'}
              </p>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Candidates Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Candidate Pool</h3>
                <span className="text-primary-600 text-sm font-medium">120 Candidates</span>
              </div>
              <div className="flex space-x-2 mb-4">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <span className="text-xs">JD</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <span className="text-xs">KL</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <span className="text-xs">MN</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  <span className="text-xs">+</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Browse candidates with verified credentials.</p>
            </motion.div>

            {/* Job Postings Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Job Postings</h3>
                <span className="text-primary-600 text-sm font-medium">3 Active</span>
              </div>
              <div className="flex flex-col space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Frontend Developer</span>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">12 Applicants</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Blockchain Engineer</span>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">8 Applicants</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Product Manager</span>
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">5 Applicants</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">Manage your job postings and applicants.</p>
            </motion.div>

            {/* Analytics Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Analytics</h3>
                <span className="text-primary-600 text-sm font-medium">Last 30 days</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Profile Views</span>
                <span className="text-sm font-medium">248</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full mb-4">
                <div className="h-full bg-primary-500 rounded-full" style={{ width: '70%' }}></div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Job Post Views</span>
                <span className="text-sm font-medium">1,024</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full">
                <div className="h-full bg-accent-500 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </motion.div>
          </div>
        )
      )}

      {/* Enrolled Courses Section */}
      {userType === 'student' && enrolledCourses.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Courses</h2>
            <Link href="/dashboard/courses" className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.slice(0, 3).map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
                <CourseCard 
                  course={course} 
                  progress={courseProgress[course.id] || 0} 
                />
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* For recruiters: Job Listings Section */}
      {userType === 'recruiter' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Your Job Listings</h2>
            <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <JobCard
              title="Senior Blockchain Developer"
              company="CrediLink Technologies"
              location="Remote"
              salary="$120K - $150K"
              tags={['Smart Contracts', 'Solidity', 'Web3.js', 'Full-time']}
            />
            <JobCard
              title="Frontend Engineer"
              company="CrediLink Technologies"
              location="New York, NY"
              salary="$90K - $120K"
              tags={['React', 'TypeScript', 'Web3', 'Full-time']}
            />
          </div>
        </motion.div>
      )}

      {/* For recruiters: Top Candidates Section */}
      {userType === 'recruiter' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Top Candidates</h2>
            <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
              View All →
            </button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CandidateCard
              name="Alex Johnson"
              title="Senior Blockchain Developer"
              skills={['Solidity', 'Smart Contracts', 'DeFi', 'Web3.js']}
              matchScore={95}
            />
            <CandidateCard
              name="Sarah Williams"
              title="Frontend Engineer"
              skills={['React', 'TypeScript', 'Web3', 'UI/UX']}
              matchScore={92}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
} 