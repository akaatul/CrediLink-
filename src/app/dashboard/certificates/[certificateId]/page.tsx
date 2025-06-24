'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getDocument } from '@/lib/firestore';
import { collections, Credential } from '@/lib/firestore-schema';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Timestamp } from 'firebase/firestore';

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

const CertificateViewPage = () => {
  const { certificateId } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [credential, setCredential] = useState<Credential | null>(null);
  const [loading, setLoading] = useState(true);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCertificate = async () => {
      if (!user || !certificateId) return;
      
      try {
        // Try to get certificate from the credentials collection
        let certificateData = await getDocument<Credential>(collections.credentials, certificateId as string);
        
        // If not found, try the old certificates collection name as fallback
        if (!certificateData) {
          console.log('Attempting fallback to certificates collection');
          certificateData = await getDocument<Credential>('certificates', certificateId as string);
        }
        
        if (!certificateData) {
          console.error('Certificate not found in any collection:', certificateId);
          router.push('/dashboard/certificates');
          return;
        }
        
        // Check if certificate belongs to the user
        if (certificateData.userId !== user.id) {
          console.error('Certificate does not belong to user:', certificateId);
          router.push('/dashboard/certificates');
          return;
        }
        
        console.log('Certificate loaded:', certificateData);
        setCredential(certificateData);
      } catch (error) {
        console.error('Error fetching certificate:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCertificate();
  }, [user, certificateId, router]);

  const handleDownloadPDF = async () => {
    if (!certificateRef.current) return;
    
    try {
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const imgWidth = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`${credential?.courseName.replace(/\s+/g, '_')}_Certificate.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    }
  };

  const handleShareCertificate = () => {
    if (!credential) return;
    
    const shareUrl = `${window.location.origin}/verify-certificate/${certificateId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${credential.courseName} Certificate`,
        text: `Check out my certificate for completing ${credential.courseName}`,
        url: shareUrl
      }).catch(error => console.error('Error sharing:', error));
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Certificate verification link copied to clipboard!'))
        .catch(error => console.error('Error copying to clipboard:', error));
    }
  };

  const handleBackToCourses = () => {
    router.push('/dashboard/courses');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!credential) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl p-8 text-center shadow-sm">
          <h3 className="text-xl font-semibold mb-2">Certificate not found</h3>
          <p className="text-gray-600 mb-4">The certificate you're looking for doesn't exist or you don't have access.</p>
          <button 
            onClick={() => router.push('/dashboard/certificates')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
          >
            Back to Certificates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold mb-2 md:mb-0">Your Certificate</h1>
          <div className="flex space-x-3">
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 flex items-center bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download PDF
            </button>
            <button 
              onClick={handleShareCertificate}
              className="px-4 py-2 flex items-center border border-primary-500 text-primary-500 rounded-lg font-medium hover:bg-primary-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
              Share
            </button>
          </div>
        </div>
        
        {/* Certificate Display */}
        <div className="mb-6 overflow-auto">
          <div 
            ref={certificateRef}
            className="w-full aspect-[1.414/1] bg-certificate-pattern bg-cover bg-center rounded-lg border border-gray-200 p-8 flex flex-col items-center justify-center text-center"
            style={{
              backgroundImage: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              minWidth: '800px'
            }}
          >
            {/* Certificate Header */}
            <div className="mb-6">
              <div className="text-primary-600 font-bold text-4xl mb-1">CrediLink+</div>
              <div className="text-gray-600 text-xl">Certificate of Completion</div>
            </div>
            
            {/* Certificate Body */}
            <div className="mb-8">
              <div className="text-gray-500 mb-4">This is to certify that</div>
              <div className="text-3xl font-bold text-gray-800 mb-4">{user?.name}</div>
              <div className="text-gray-500 mb-4">has successfully completed</div>
              <div className="text-2xl font-bold text-primary-600 mb-2">{credential.courseName}</div>
              <div className="text-gray-600 mb-4">with all requirements and assessments</div>
              <div className="text-gray-500">Issued on {formatDate(credential.issueDate)}</div>
            </div>
            
            {/* Certificate Footer */}
            <div className="flex w-full justify-between items-end">
              <div>
                <div className="h-0.5 w-40 bg-gray-400 mb-1"></div>
                <div className="text-gray-600 font-medium">{credential.issuer}</div>
                <div className="text-gray-500 text-sm">Course Instructor</div>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 mb-2">
                  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 0C22.4 0 0 22.4 0 50C0 77.6 22.4 100 50 100C77.6 100 100 77.6 100 50C100 22.4 77.6 0 50 0ZM50 90C27.9 90 10 72.1 10 50C10 27.9 27.9 10 50 10C72.1 10 90 27.9 90 50C90 72.1 72.1 90 50 90Z" fill="#4F46E5"/>
                    <path d="M42 65.5L25 48.5L32 41.5L42 51.5L68 25.5L75 32.5L42 65.5Z" fill="#4F46E5"/>
                  </svg>
                </div>
                <div className="text-gray-600 text-xs">Verified by Blockchain</div>
                <div className="text-gray-500 text-xs mt-1">ID: {certificateId}</div>
              </div>
              
              <div>
                <div className="h-0.5 w-40 bg-gray-400 mb-1"></div>
                <div className="text-gray-600 font-medium">CrediLink+ Academy</div>
                <div className="text-gray-500 text-sm">Authorized Signature</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Certificate Details */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4">Certificate Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Certificate ID</div>
              <div className="font-mono text-gray-800">{certificateId}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Issued Date</div>
              <div className="text-gray-800">{formatDate(credential.issueDate)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Course</div>
              <div className="text-gray-800">{credential.courseName}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Issued By</div>
              <div className="text-gray-800">{credential.issuer}</div>
            </div>
            {credential.expiryDate && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Expiry Date</div>
                <div className="text-gray-800">{formatDate(credential.expiryDate)}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-500 mb-1">Verification Status</div>
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-green-600 font-medium">Verified</span>
              </div>
            </div>
          </div>
          
          {/* Skills */}
          {credential.skills && credential.skills.length > 0 && (
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Skills</div>
              <div className="flex flex-wrap gap-2">
                {credential.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Blockchain Verification */}
          {credential.blockchainVerified && credential.blockchainTxHash && (
            <div className="mt-6">
              <div className="text-sm text-gray-500 mb-2">Blockchain Verification</div>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700 font-medium">This certificate is verified on the blockchain</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  Transaction Hash: <span className="font-mono">{credential.blockchainTxHash}</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Back Button */}
        <div className="mt-6 flex justify-center">
          <button 
            onClick={handleBackToCourses}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Back to Courses
          </button>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewPage; 