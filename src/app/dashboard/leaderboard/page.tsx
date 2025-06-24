'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { getRankedLeaderboard, getUserById } from '@/lib/firestore';
import { User } from '@/lib/firestore-schema';

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userImage?: string;
  userEmail?: string;
  totalScore: number;
  completedCourses: number;
  rank: number;
  isWeb3Connected?: boolean;
}

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<number | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const rankedData = await getRankedLeaderboard();
        
        const enrichedData = await Promise.all(rankedData.map(async (entry, index) => {
          const userData = await getUserById(entry.userId) as User;
          return {
            ...entry,
            rank: index + 1,
            userName: userData?.name || 'Anonymous User',
            userImage: userData?.image,
            userEmail: userData?.email,
            isWeb3Connected: userData?.isWeb3Connected || false,
          };
        }));
        
        setLeaderboard(enrichedData);

        if (user) {
          console.log('Current User ID:', user.id);
          enrichedData.forEach(entry => console.log('Leaderboard User ID:', entry.userId));
          const currentUserEntry = enrichedData.find(entry => entry.userId === user.id);
          if (currentUserEntry) {
            setUserRank(currentUserEntry.rank);
          }
        }

      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Leaderboard</h1>
            <p className="text-gray-600">See how you rank among other learners</p>
          </div>
        </div>
        
        {/* User's Rank */}
        {userRank && (
          <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="bg-primary-100 rounded-full p-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Your Rank</h3>
                <p className="text-gray-600">
                  You're currently ranked <span className="font-bold text-primary-600">#{userRank}</span> on the leaderboard
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Rank</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">User</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Email</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Completed Courses</th>
                <th className="py-3 px-4 text-left text-gray-500 font-medium">Total Score</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {leaderboard.map((entry, index) => (
                <motion.tr 
                  key={entry.userId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={user && entry.userId === user.id ? 'bg-primary-50' : ''}
                >
                  <td className="py-4 px-4">
                    {entry.rank <= 3 ? (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        entry.rank === 1 ? 'bg-yellow-500' : 
                        entry.rank === 2 ? 'bg-gray-400' : 'bg-amber-700'
                      }`}>
                        {entry.rank}
                      </div>
                    ) : (
                      <span className="text-gray-600 font-medium">{entry.rank}</span>
                    )}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium overflow-hidden">
                        {entry.userImage ? (
                          <img src={entry.userImage} alt={entry.userName} className="w-full h-full object-cover" />
                        ) : (
                          entry.userName.charAt(0)
                        )}
                      </div>
                      <div className="ml-3">
                        <div className="font-medium text-gray-800 flex items-center">
                          <span>{entry.userName}</span>
                          {user && entry.userId === user.id && (
                            <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-0.5 rounded-full">
                              You
                            </span>
                          )}
                          {entry.isWeb3Connected && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full flex items-center">
                              <svg className="h-3 w-3 mr-1" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                                <path d="M2.04183 1L15.0446 10.8397L12.7336 4.99099L2.04183 1Z" fill="currentColor" stroke="currentColor" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              MetaMask
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{entry.userEmail}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{entry.completedCourses}</div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="font-medium text-gray-800">{entry.totalScore}</div>
                  </td>
                </motion.tr>
              ))}
              
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    No leaderboard data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage; 