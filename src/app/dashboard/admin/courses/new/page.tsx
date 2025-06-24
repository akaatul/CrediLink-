'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Course, CourseModule, FinalTest } from '@/lib/firestore-schema';
import { getAI, getGenerativeModel, GoogleGenerativeAI } from '@/lib/ai-service';

interface ModuleFormData {
  title: string;
  description: string;
  videoUrl: string;
  id: string;
}

const NewCoursePage = () => {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();

  // Course form data
  const [courseData, setCourseData] = useState({
    title: '',
    description: '',
    level: 'beginner',
    instructor: '',
    coverImage: '',
    duration: 0,
  });

  // Modules state
  const [modules, setModules] = useState<ModuleFormData[]>([
    { id: `module-${Date.now()}`, title: '', description: '', videoUrl: '' }
  ]);

  // Saving state
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      
      if (!isAdmin) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  // Update form data
  const updateCourseData = (field: string, value: string | number) => {
    setCourseData({
      ...courseData,
      [field]: value
    });
  };

  // Add a new module
  const addModule = () => {
    setModules([
      ...modules,
      { id: `module-${Date.now()}`, title: '', description: '', videoUrl: '' }
    ]);
  };

  // Update module data
  const updateModule = (index: number, field: string, value: string) => {
    const updatedModules = [...modules];
    updatedModules[index] = { ...updatedModules[index], [field]: value };
    setModules(updatedModules);
  };

  // Remove a module
  const removeModule = (index: number) => {
    if (modules.length <= 1) {
      return; // Don't remove the last module
    }
    
    const updatedModules = [...modules];
    updatedModules.splice(index, 1);
    setModules(updatedModules);
  };

  // Extract YouTube ID from URL
  const extractYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  // Format YouTube URL to embed format
  const formatYouTubeUrl = (url: string) => {
    const youtubeId = extractYouTubeId(url);
    return youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : '';
  };

  // Calculate estimated duration based on modules
  useEffect(() => {
    // Assume each module is approximately 45 minutes
    const totalMinutes = modules.length * 45;
    const hours = Math.ceil(totalMinutes / 60);
    
    setCourseData(prevData => ({
      ...prevData,
      duration: hours
    }));
  }, [modules.length]);

  // Submit course
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      // Validate form
      if (!courseData.title || !courseData.description || !courseData.instructor) {
        throw new Error('Please fill in all required course fields');
      }

      // Validate modules
      const invalidModules = modules.filter(m => !m.title || !m.description || !m.videoUrl);
      if (invalidModules.length > 0) {
        throw new Error('Please fill in all required module fields');
      }

      // Format modules with quizzes
      const formattedModules: CourseModule[] = modules.map((module, index) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        videoUrl: formatYouTubeUrl(module.videoUrl),
        duration: 45, // Default duration in minutes
        order: index,
        quiz: {
          questions: [] // Will be generated later when user takes the quiz
        }
      }));

      // Create empty final test structure
      const finalTest: FinalTest = {
        questions: [],
        passingScore: 70
      };

      // Create course document in Firestore
      const courseRef = await addDoc(collection(db, 'courses'), {
        title: courseData.title,
        description: courseData.description,
        instructor: courseData.instructor || user?.name || 'Instructor',
        coverImage: courseData.coverImage || 'https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1332&q=80',
        level: courseData.level,
        duration: courseData.duration,
        enrolledCount: 0,
        rating: 0,
        modules: formattedModules,
        finalTest: finalTest,
        createdAt: Timestamp.now()
      });

      // Update the document with its ID
      await updateDoc(doc(db, 'courses', courseRef.id), {
        id: courseRef.id
      });

      // Redirect to admin dashboard
      router.push('/dashboard/admin');
      
    } catch (err: any) {
      console.error('Error creating course:', err);
      setError(err.message || 'Failed to create course');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold gradient-text">Create New Course</h1>
        <p className="text-gray-600">Add a new course with modules and YouTube videos</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Course Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Course Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={courseData.title}
                onChange={(e) => updateCourseData('title', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="instructor" className="block text-sm font-medium text-gray-700 mb-1">
                Instructor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="instructor"
                value={courseData.instructor}
                onChange={(e) => updateCourseData('instructor', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty Level <span className="text-red-500">*</span>
              </label>
              <select
                id="level"
                value={courseData.level}
                onChange={(e) => updateCourseData('level', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                required
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label htmlFor="coverImage" className="block text-sm font-medium text-gray-700 mb-1">
                Cover Image URL
              </label>
              <input
                type="url"
                id="coverImage"
                value={courseData.coverImage}
                onChange={(e) => updateCourseData('coverImage', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={courseData.description}
                onChange={(e) => updateCourseData('description', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                rows={4}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Course Modules</h2>
            <button
              type="button"
              onClick={addModule}
              className="py-1 px-3 bg-primary-100 text-primary-700 rounded-md hover:bg-primary-200 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Module
            </button>
          </div>

          <div className="space-y-6">
            {modules.map((module, index) => (
              <div key={module.id} className="border border-gray-300 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-medium">Module {index + 1}</h3>
                  {modules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeModule(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor={`module-${index}-title`} className="block text-sm font-medium text-gray-700 mb-1">
                      Module Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`module-${index}-title`}
                      value={module.title}
                      onChange={(e) => updateModule(index, 'title', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`module-${index}-description`} className="block text-sm font-medium text-gray-700 mb-1">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id={`module-${index}-description`}
                      value={module.description}
                      onChange={(e) => updateModule(index, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      rows={2}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor={`module-${index}-video`} className="block text-sm font-medium text-gray-700 mb-1">
                      YouTube Video URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id={`module-${index}-video`}
                      value={module.videoUrl}
                      onChange={(e) => updateModule(index, 'videoUrl', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://www.youtube.com/watch?v=..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Paste the YouTube video URL. Quizzes will be automatically generated from the video content.
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => router.push('/dashboard/admin')}
            className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              'Create Course'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewCoursePage; 