'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collections, Credential } from '@/lib/firestore-schema';

// Helper function to format dates from either Date objects or Firestore Timestamps
const formatDate = (date: Date | Timestamp | any): string => {
  if (date instanceof Date) {
    return date.toLocaleDateString();
  } else if (date && typeof date === 'object' && 'seconds' in date) {
    // Firestore Timestamp
    return new Date(date.seconds * 1000).toLocaleDateString();
  } else {
    // If date is in a different format or undefined
    return 'Unknown date';
  }
};

const CertificatesPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [certificates, setCertificates] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user || !user.id) return;
      
      try {
        // Query the new credentials collection
        const certificatesRef = collection(db, collections.credentials);
        const q = query(certificatesRef, where('userId', '==', user.id));
        const querySnapshot = await getDocs(q);
        
        const certificatesList: Credential[] = [];
        querySnapshot.forEach((doc) => {
          certificatesList.push({ id: doc.id, ...doc.data() } as Credential);
        });
        
        // Query the old certificates collection as fallback
        const legacyCertificatesRef = collection(db, 'certificates');
        const legacyQuery = query(legacyCertificatesRef, where('userId', '==', user.id));
        const legacySnapshot = await getDocs(legacyQuery);
        
        legacySnapshot.forEach((doc) => {
          const data = doc.data();
          // Check if this is a proper certificate with required fields
          if (data.userId && data.courseId && data.courseName) {
            certificatesList.push({ 
              id: doc.id,
              ...data,
              issuerId: data.issuerId || 'credilink-system', // Add missing fields
              skills: data.skills || [] 
            } as Credential);
          }
        });
        
        console.log(`Found ${certificatesList.length} certificates`);
        setCertificates(certificatesList);
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificates();
  }, [user]);

  const handleViewCertificate = (certificateId: string) => {
    router.push(`/dashboard/certificates/${certificateId}`);
  };

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
          <h1 className="text-3xl font-bold mb-2">My Certificates</h1>
          <p className="text-gray-600">View and share your earned certificates</p>
        </div>
      </div>
      
      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <div className="w-20 h-20 mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-300" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
          <p className="text-gray-600 mb-6">Complete courses and pass final tests to earn certificates</p>
          <button 
            onClick={() => router.push('/dashboard/courses')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Explore Courses
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate, index) => (
            <motion.div 
              key={certificate.id}
              className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              onClick={() => handleViewCertificate(certificate.id)}
            >
              {/* Certificate Preview */}
              <div 
                className="h-48 p-6 flex flex-col items-center justify-center text-center"
                style={{
                  backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
                }}
              >
                <div className="text-primary-600 font-bold text-2xl mb-1">Certificate of Completion</div>
                <div className="text-gray-600 mb-3">{certificate.courseName}</div>
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-yellow-700">Verified</span>
                </div>
              </div>
              
              {/* Certificate Info */}
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{certificate.courseName}</h3>
                
                <div className="flex justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {formatDate(certificate.issueDate)}
                  </div>
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {certificate.issuer}
                  </div>
                </div>
                
                {/* Skills */}
                {certificate.skills && certificate.skills.length > 0 && (
                  <div className="mb-4">
                    <div className="text-xs text-gray-500 mb-1">Skills</div>
                    <div className="flex flex-wrap gap-1">
                      {certificate.skills.slice(0, 3).map((skill, i) => (
                        <span 
                          key={i}
                          className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {certificate.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{certificate.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <button className="w-full py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
                  View Certificate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CertificatesPage; 