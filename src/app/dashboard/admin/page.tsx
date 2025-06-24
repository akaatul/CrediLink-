'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getAllCourses, deleteCourseAndRelatedContent } from '@/lib/firestore';
import { Course } from '@/lib/firestore-schema';
import Link from 'next/link';

const AdminDashboard = () => {
  const { user, isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    
    if (!isLoading && !isAdmin) {
      router.push('/dashboard');
      return;
    }

    const fetchCourses = async () => {
      try {
        const allCourses = await getAllCourses();
        setCourses(allCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [isAuthenticated, isAdmin, isLoading, router]);

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Are you sure you want to delete this course and all its content? This action cannot be undone.')) {
      setDeleting(courseId);
      try {
        await deleteCourseAndRelatedContent(courseId);
        setCourses(courses.filter(c => c.id !== courseId));
      } catch (error) {
        console.error('Error deleting course:', error);
        alert('Failed to delete course. Please try again.');
      } finally {
        setDeleting(null);
      }
    }
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">Admin Dashboard</h1>
        <Link href="/dashboard/admin/courses/new" className="btn-primary">
          Create New Course
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Course Management</h2>
        
        {courses.length === 0 ? (
          <p className="text-gray-600">No courses available. Create your first course!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modules</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-md overflow-hidden mr-3">
                          <img 
                            src={course.coverImage || 'https://via.placeholder.com/150'} 
                            alt={course.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{course.title}</span>
                          <span className="text-xs text-gray-500">{course.instructor}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${course.level === 'beginner' ? 'bg-green-100 text-green-800' : 
                          course.level === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'}`}
                      >
                        {course.level.charAt(0).toUpperCase() + course.level.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.modules.length}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {course.enrolledCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link href={`/dashboard/admin/courses/${course.id}/edit`} className="text-primary-600 hover:text-primary-900 mr-4">
                        Edit
                      </Link>
                      <Link href={`/dashboard/courses/${course.id}`} className="text-gray-600 hover:text-gray-900 mr-4" target="_blank">
                        Preview
                      </Link>
                      <button
                        onClick={() => handleDeleteCourse(course.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={deleting === course.id}
                      >
                        {deleting === course.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Admin Analytics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-4xl font-bold text-primary-600">{courses.length}</p>
            <p className="text-gray-600">Total Courses</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-4xl font-bold text-primary-600">
              {courses.reduce((total, course) => total + (course.enrolledCount || 0), 0)}
            </p>
            <p className="text-gray-600">Total Enrollments</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 text-center">
            <p className="text-4xl font-bold text-primary-600">
              {courses.reduce((total, course) => total + course.modules.length, 0)}
            </p>
            <p className="text-gray-600">Total Modules</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 