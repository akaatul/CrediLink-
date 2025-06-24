'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading, needsProfileCompletion } = useAuth();
  const [activeTab, setActiveTab] = useState<'personal' | 'skills' | 'credentials'>('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  // Fetch user profile from Firestore
  useEffect(() => {
    if (user?.id) {
      const fetchProfile = async () => {
        setLoadingProfile(true);
        const userDoc = await getDoc(doc(db, 'users', user.id));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          setUserData({
            name: user.name || '',
            email: user.email || '',
            walletAddress: user.walletAddress || '',
            profileImage: user.image || '',
            skills: [],
            credentials: [],
            phone: '',
            location: '',
            about: '',
          });
        }
        setLoadingProfile(false);
      };
      fetchProfile();
    }
  }, [user]);

  // Prompt for profile completion
  useEffect(() => {
    if (userData && (!userData.name || !userData.email)) {
      setIsEditing(true);
    }
  }, [userData]);

  // Always open edit mode if needsProfileCompletion is true
  useEffect(() => {
    if (needsProfileCompletion) {
      setIsEditing(true);
    }
  }, [needsProfileCompletion]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setSaveMessage(null);
  };

  const handleSaveChanges = async () => {
    if (user?.id) {
      await setDoc(doc(db, 'users', user.id), userData, { merge: true });
      setIsEditing(false);
      setSaveMessage('Profile updated successfully!');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleAddSkill = () => {
    setUserData((prev: any) => ({
      ...prev,
      skills: [...(prev.skills || []), { name: '', level: 0 }],
    }));
  };

  const handleSkillChange = (index: number, field: string, value: string | number) => {
    setUserData((prev: any) => {
      const updatedSkills = [...(prev.skills || [])];
      updatedSkills[index] = { ...updatedSkills[index], [field]: value };
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleRemoveSkill = (index: number) => {
    setUserData((prev: any) => {
      const updatedSkills = [...(prev.skills || [])];
      updatedSkills.splice(index, 1);
      return { ...prev, skills: updatedSkills };
    });
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
        setUserData((prev: any) => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCredential = () => {
    setUserData((prev: any) => ({
      ...prev,
      credentials: [
        ...(prev.credentials || []),
        {
          id: Date.now().toString(),
          name: '',
          issuer: '',
          issueDate: '',
          expiryDate: '',
          verified: false,
          txHash: '',
        },
      ],
    }));
  };

  const handleCredentialChange = (index: number, field: string, value: string | boolean) => {
    setUserData((prev: any) => {
      const updatedCredentials = [...(prev.credentials || [])];
      updatedCredentials[index] = { ...updatedCredentials[index], [field]: value };
      return { ...prev, credentials: updatedCredentials };
    });
  };

  const handleRemoveCredential = (index: number) => {
    setUserData((prev: any) => {
      const updatedCredentials = [...(prev.credentials || [])];
      updatedCredentials.splice(index, 1);
      return { ...prev, credentials: updatedCredentials };
    });
  };

  if (isLoading || loadingProfile || !userData) return <div className="p-8 text-center">Loading...</div>;

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      {isEditing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              name="location"
              value={userData.location}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
            <textarea
              name="about"
              value={userData.about}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            ></textarea>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
            <input
              type="text"
              name="walletAddress"
              value={userData.walletAddress}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Full Name</h3>
            <p className="mt-1 text-base font-medium">{userData.name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Email</h3>
            <p className="mt-1 text-base">{userData.email}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Phone</h3>
            <p className="mt-1 text-base">{userData.phone}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Location</h3>
            <p className="mt-1 text-base">{userData.location}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">About</h3>
            <p className="mt-1 text-base">{userData.about}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-sm font-medium text-gray-500">Wallet Address</h3>
            <div className="mt-1 flex items-center">
              <p className="text-sm font-mono bg-gray-100 py-1 px-2 rounded">{userData.walletAddress}</p>
              <button className="ml-2 text-primary-600 hover:text-primary-700">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                  <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      {(userData.skills || []).length === 0 && !isEditing && (
        <div className="text-gray-500">No skills added yet.</div>
      )}
      {(userData.skills || []).map((skill, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between">
            {isEditing ? (
              <>
                <input
                  type="text"
                  value={skill.name}
                  onChange={e => handleSkillChange(index, 'name', e.target.value)}
                  placeholder="Skill name"
                  className="w-1/2 px-2 py-1 border border-gray-300 rounded mr-2"
                />
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={skill.level}
                  onChange={e => handleSkillChange(index, 'level', Number(e.target.value))}
                  placeholder="Level %"
                  className="w-20 px-2 py-1 border border-gray-300 rounded mr-2"
                />
                <button type="button" onClick={() => handleRemoveSkill(index)} className="text-red-500 hover:text-red-700 ml-2">Remove</button>
              </>
            ) : (
              <>
                <span className="text-base font-medium">{skill.name}</span>
                <span className="text-sm font-medium text-gray-500">{skill.level}%</span>
              </>
            )}
          </div>
          {!isEditing && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-primary-600 h-2.5 rounded-full"
                style={{ width: `${skill.level}%` }}
              ></div>
            </div>
          )}
        </div>
      ))}
      {isEditing && (
        <button
          type="button"
          onClick={handleAddSkill}
          className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Skill
        </button>
      )}
    </div>
  );

  const renderCredentials = () => (
    <div className="space-y-6">
      {(userData.credentials || []).length === 0 && !isEditing && (
        <div className="text-gray-500">No credentials yet.</div>
      )}
      {(userData.credentials || []).map((credential, index) => (
        <div key={credential.id} className="bg-white rounded-lg shadow-sm p-5 border border-gray-100">
          {isEditing ? (
            <div className="space-y-2">
              <input
                type="text"
                value={credential.name}
                onChange={e => handleCredentialChange(index, 'name', e.target.value)}
                placeholder="Credential Name"
                className="w-full px-2 py-1 border border-gray-300 rounded mb-1"
              />
              <input
                type="text"
                value={credential.issuer}
                onChange={e => handleCredentialChange(index, 'issuer', e.target.value)}
                placeholder="Issuer"
                className="w-full px-2 py-1 border border-gray-300 rounded mb-1"
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  value={credential.issueDate}
                  onChange={e => handleCredentialChange(index, 'issueDate', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded mb-1"
                />
                <input
                  type="date"
                  value={credential.expiryDate}
                  onChange={e => handleCredentialChange(index, 'expiryDate', e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded mb-1"
                />
              </div>
              <input
                type="text"
                value={credential.txHash}
                onChange={e => handleCredentialChange(index, 'txHash', e.target.value)}
                placeholder="Transaction Hash (optional)"
                className="w-full px-2 py-1 border border-gray-300 rounded mb-1"
              />
              <label className="inline-flex items-center mt-1">
                <input
                  type="checkbox"
                  checked={!!credential.verified}
                  onChange={e => handleCredentialChange(index, 'verified', e.target.checked)}
                  className="mr-2"
                />
                Verified on Blockchain
              </label>
              <button type="button" onClick={() => handleRemoveCredential(index)} className="text-red-500 hover:text-red-700 mt-2">Remove</button>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{credential.name}</h3>
                  <p className="text-gray-600 mt-1">Issued by {credential.issuer}</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Issued: {credential.issueDate ? new Date(credential.issueDate).toLocaleDateString() : '-'} •
                    Expires: {credential.expiryDate ? new Date(credential.expiryDate).toLocaleDateString() : '-'}
                  </p>
                </div>
                {credential.verified && (
                  <div className="bg-green-50 text-green-700 py-1 px-3 rounded-full text-sm font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified on Blockchain
                  </div>
                )}
              </div>
              {credential.txHash && (
                <div className="mt-4">
                  <p className="text-xs text-gray-500 font-mono">Transaction: {credential.txHash.substring(0, 10)}...{credential.txHash.substring(credential.txHash.length - 10)}</p>
                </div>
              )}
              <div className="mt-4 flex justify-end">
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  View Certificate →
                </button>
              </div>
            </>
          )}
        </div>
      ))}
      {isEditing && (
        <button
          type="button"
          onClick={handleAddCredential}
          className="flex items-center text-primary-600 hover:text-primary-700 font-medium"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add New Credential
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-10 px-2 min-h-screen" style={{ background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 50%, #f5f7fa 100%)' }}>
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row items-center md:items-start">
          <div className="relative mb-4 md:mb-0 md:mr-6 flex flex-col items-center">
            <img
              src={profileImagePreview || userData.profileImage}
              alt={userData.name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow"
            />
            {isEditing && (
              <>
                <label className="mt-2 cursor-pointer text-primary-600 hover:underline text-sm">
                  Change Photo
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageChange}
                    className="hidden"
                  />
                </label>
              </>
            )}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold">{userData.name}</h1>
            <p className="text-gray-600 mt-1">{userData.location}</p>
            <div className="mt-4 flex flex-wrap gap-2 justify-center md:justify-start">
              {(userData.skills || []).map((skill, idx) => (
                skill.name && (
                  <span key={idx} className="bg-primary-50 text-primary-700 py-1 px-3 rounded-full text-sm font-medium">
                    {skill.name}
                  </span>
                )
              ))}
            </div>
          </div>
          <div className="mt-4 md:mt-0">
            {isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveChanges}
                  className="bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleEditToggle}
                  className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={handleEditToggle}
                className="flex items-center bg-primary-50 text-primary-700 py-2 px-4 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8">
            <button
              className={`pb-4 font-medium ${
                activeTab === 'personal'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              Personal Information
            </button>
            <button
              className={`pb-4 font-medium ${
                activeTab === 'skills'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('skills')}
            >
              Skills
            </button>
            <button
              className={`pb-4 font-medium ${
                activeTab === 'credentials'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('credentials')}
            >
              Credentials
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'personal' && renderPersonalInfo()}
          {activeTab === 'skills' && renderSkills()}
          {activeTab === 'credentials' && renderCredentials()}
        </motion.div>
      </div>

      {/* Show a prompt if needsProfileCompletion */}
      {needsProfileCompletion && (
        <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm text-center">
          Please complete your profile to continue.
        </div>
      )}
    </div>
  );
};

export default ProfilePage; 