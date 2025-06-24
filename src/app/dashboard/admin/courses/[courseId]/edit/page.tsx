'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getCourse, updateCourse } from '@/lib/firestore';
import { Course, CourseModule } from '@/lib/firestore-schema';
import Link from 'next/link';

interface ModuleFormData {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
}

const EditCoursePage = () => {
  const { isAdmin, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { courseId } = useParams();

  const [courseData, setCourseData] = useState<Partial<Course>>({});
  const [modules, setModules] = useState<ModuleFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/dashboard');
    }
  }, [isAdmin, authLoading, router]);

  useEffect(() => {
    const fetchCourseData = async () => {
      if (typeof courseId !== 'string') return;
      try {
        setLoading(true);
        const course = await getCourse(courseId);
        if (course) {
          setCourseData(course);
          setModules(course.modules.map(m => ({ ...m })));
        } else {
          setError('Course not found.');
        }
      } catch (err) {
        setError('Failed to fetch course data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourseData();
  }, [courseId]);
  
  const updateCourseField = (field: keyof Course, value: any) => {
    setCourseData(prev => ({ ...prev, [field]: value }));
  };

  const updateModuleField = (index: number, field: keyof ModuleFormData, value: string) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    setModules(newModules);
  };

  const addModule = () => {
    setModules([...modules, { id: `new-module-${Date.now()}`, title: '', description: '', videoUrl: '' }]);
  };

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      setModules(modules.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof courseId !== 'string') return;

    setIsSaving(true);
    setError(null);
    try {
      const updatedData: Partial<Course> = {
        ...courseData,
        modules: modules.map((m, index) => ({ ...m, order: index })),
      };
      await updateCourse(courseId, updatedData);
      router.push('/dashboard/admin');
    } catch (err) {
      setError('Failed to update course.');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
        <div className="flex items-center justify-center h-96">
            <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold gradient-text mb-6">Edit Course</h1>
      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Course Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input type="text" value={courseData.title || ''} onChange={(e) => updateCourseField('title', e.target.value)} placeholder="Course Title" className="form-input" required />
            <input type="text" value={courseData.instructor || ''} onChange={(e) => updateCourseField('instructor', e.target.value)} placeholder="Instructor" className="form-input" required />
            <select value={courseData.level || 'beginner'} onChange={(e) => updateCourseField('level', e.target.value)} className="form-input">
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
            </select>
            <input type="url" value={courseData.coverImage || ''} onChange={(e) => updateCourseField('coverImage', e.target.value)} placeholder="Cover Image URL" className="form-input" />
            <textarea value={courseData.description || ''} onChange={(e) => updateCourseField('description', e.target.value)} placeholder="Description" className="form-input md:col-span-2" rows={4} required />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Modules</h2>
                <button type="button" onClick={addModule} className="btn-outline btn-sm">Add Module</button>
            </div>
            <div className="space-y-4">
                {modules.map((module, index) => (
                    <div key={module.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="font-semibold">Module {index + 1}</h3>
                           {modules.length > 1 && <button type="button" onClick={() => removeModule(index)} className="text-red-500">Remove</button>}
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <input type="text" value={module.title} onChange={(e) => updateModuleField(index, 'title', e.target.value)} placeholder="Module Title" className="form-input" required />
                            <textarea value={module.description} onChange={(e) => updateModuleField(index, 'description', e.target.value)} placeholder="Module Description" className="form-input" rows={3} required />
                            <input type="url" value={module.videoUrl} onChange={(e) => updateModuleField(index, 'videoUrl', e.target.value)} placeholder="YouTube Video URL" className="form-input" required />
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex justify-end gap-4">
            <Link href="/dashboard/admin" className="py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</Link>
            <button type="submit" className="py-2 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
      </form>
    </div>
  );
};

export default EditCoursePage; 