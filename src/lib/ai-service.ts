'use client';

import { 
  getAI as getFirebaseAI,
  GoogleAIBackend,
  getGenerativeModel as getFirebaseGenerativeModel
} from '@firebase/ai';
import { getApp } from 'firebase/app';

// Type definitions
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
}

export interface GeneratedQuiz {
  questions: QuizQuestion[];
}

export interface Explanation {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  selectedAnswerIndex: number;
  feedback: string;
}

// Initialize Firebase AI
export const initializeAI = () => {
  try {
    const app = getApp();
    const ai = getFirebaseAI(app, { backend: new GoogleAIBackend() });
    return ai;
  } catch (error) {
    console.error('Error initializing Firebase AI:', error);
    throw new Error('Failed to initialize Firebase AI - check console for instructions');
  }
};

// Get generative model instance
export const getGenerativeModel = (modelName = "gemini-1.5-flash") => {
  const ai = initializeAI();
  return getFirebaseGenerativeModel(ai, { model: modelName });
};

// This function generates a quiz from a YouTube transcript
export const generateQuizFromTranscript = async (
  transcript: string,
  moduleTitle: string,
  numQuestions: number = 5
): Promise<GeneratedQuiz> => {
  try {
    // Log transcript length for debugging
    console.log(`Generating quiz from transcript: ${transcript.length} characters for module: ${moduleTitle}`);
    
    if (!transcript || transcript.trim().length < 10) {
      console.error('Transcript is too short or empty');
      return { questions: [] };
    }
    
    // Get a generative model
    const model = getGenerativeModel("gemini-1.5-flash");

    // Construct the prompt
    const prompt = `
      You are an educational content creator specializing in creating quizzes for online courses. 
      I'm going to provide you with a transcript from a YouTube video about "${moduleTitle}".
      
      Please generate ${numQuestions} multiple-choice quiz questions based on the transcript provided.
      
      For each question:
      1. Create a clear question based on factual information from the transcript
      2. Provide 4 possible answers, with only one being correct
      3. Indicate which answer is correct (0, 1, 2, or 3, with 0 being the first option)
      
      Return the quiz questions in the following JSON format:
      {
        "questions": [
          {
            "id": "q1",
            "text": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctOptionIndex": 2
          },
          ... more questions
        ]
      }
      
      Only respond with the JSON and nothing else.
      
      Here's the transcript:
      
      ${transcript}
    `;
    
    console.log('Sending request to Gemini API...');

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    console.log('Received response from Gemini API');
    
    // Extract JSON from the response
    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      console.error('Failed to extract JSON from response:', text);
      return { questions: [] };
    }
    
    const jsonText = text.substring(jsonStart, jsonEnd);
    
    try {
      // Parse the JSON
      const quiz = JSON.parse(jsonText) as GeneratedQuiz;
      
      // Validate the response
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        console.error('Invalid quiz format returned:', quiz);
        return { questions: [] };
      }
      
      // Assign unique IDs to each question if they don't already have one
      quiz.questions = quiz.questions.map((question, index) => ({
        ...question,
        id: question.id || `q${index + 1}`
      }));
      
      console.log(`Successfully generated ${quiz.questions.length} questions`);
      return quiz;
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError, 'Raw JSON:', jsonText);
      return { questions: [] };
    }
  } catch (error) {
    console.error('Error generating quiz:', error);
    // Return an empty quiz in case of error
    return { questions: [] };
  }
};

// This function generates a final test from multiple transcripts
export const generateFinalTest = async (
  transcripts: string[],
  courseTitle: string,
  numQuestions: number = 15
): Promise<GeneratedQuiz> => {
  try {
    // Get a generative model
    const model = getGenerativeModel("gemini-1.5-flash");

    // Join all transcripts with clear separation
    const allContent = transcripts.join('\n\n--- NEW TRANSCRIPT ---\n\n');
    
    // Construct the prompt
    const prompt = `
      You are an educational assessment designer specializing in creating comprehensive tests for online courses.
      I'm going to provide you with transcripts from multiple videos about "${courseTitle}".
      
      Please generate ${numQuestions} multiple-choice test questions that cover the material from all transcripts.
      Make these questions more challenging than regular quiz questions as this is a final assessment.
      
      For each question:
      1. Create a clear question based on factual information from the transcripts
      2. Provide 4 possible answers, with only one being correct
      3. Indicate which answer is correct (0, 1, 2, or 3, with 0 being the first option)
      
      Return the test questions in the following JSON format:
      {
        "questions": [
          {
            "id": "ft1",
            "text": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctOptionIndex": 2
          },
          ... more questions
        ]
      }
      
      Only respond with the JSON and nothing else. Here are the transcripts:
      
      ${allContent}
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}') + 1;
    const jsonText = text.substring(jsonStart, jsonEnd);
    
    // Parse the JSON
    const quiz = JSON.parse(jsonText) as GeneratedQuiz;
    
    // Assign unique IDs to each question if they don't already have one
    quiz.questions = quiz.questions.map((question, index) => ({
      ...question,
      id: question.id || `ft${index + 1}`
    }));
    
    return quiz;
  } catch (error) {
    console.error('Error generating final test:', error);
    return { questions: [] };
  }
};

export const generateQuizFromVideoUrl = async (
  videoUrl: string,
  moduleTitle: string
): Promise<GeneratedQuiz> => {
  try {
    const model = getGenerativeModel("gemini-1.5-flash");

    const prompt = `
      You are an expert in creating educational content.
      Watch the video from the following YouTube URL and create a 5-question multiple-choice quiz based on its content.
      The quiz is for a module titled "${moduleTitle}".

      The output should be a JSON object with a "questions" array. Each question object should have:
      1. "text": The question text.
      2. "options": An array of 4 strings (potential answers).
      3. "correctOptionIndex": The 0-based index of the correct answer in the "options" array.

      Example format:
      {
        "questions": [
          {
            "text": "What is the capital of France?",
            "options": ["Berlin", "Madrid", "Paris", "Rome"],
            "correctOptionIndex": 2
          }
        ]
      }
    `;

    const result = await model.generateContent([prompt, videoUrl]);
    const response = result.response;
    const text = response.text();

    // Extract JSON from the response
    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      console.error('Failed to extract JSON from response:', text);
      return { questions: [] };
    }

    const jsonText = text.substring(jsonStart, jsonEnd);

    try {
      // Parse the JSON
      const quiz = JSON.parse(jsonText) as GeneratedQuiz;

      // Validate the response
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        console.error('Invalid quiz format returned:', quiz);
        return { questions: [] };
      }

      // Assign unique IDs to each question if they don't already have one
      quiz.questions = quiz.questions.map((question, index) => ({
        ...question,
        id: question.id || `q${index + 1}`
      }));

      console.log(`Successfully generated ${quiz.questions.length} questions`);
      return quiz;
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError, 'Raw JSON:', jsonText);
      return { questions: [] };
    }
  } catch (error) {
    console.error('Error generating quiz from video URL:', error);
    return { questions: [] };
  }
};

export const generateFinalTestFromModules = async (
  moduleQuizzes: { title: string; questions: QuizQuestion[] }[]
): Promise<GeneratedQuiz> => {
  try {
    const model = getGenerativeModel("gemini-1.5-flash");

    const prompt = `
      You are an expert in creating educational assessments.
      Based on the following set of quizzes from different course modules, please generate a comprehensive final test.

      The final test should consist of 15 new multiple-choice questions that are closely related to the provided quiz questions but are not identical. The questions should be easy.

      Here is the content from the previous module quizzes:
      ${moduleQuizzes.map(mq => `
        Module: ${mq.title}
        ${mq.questions.map((q, i) => `Q${i+1}: ${q.text}`).join('\n')}
      `).join('\n\n')}

      The output should be a JSON object with a "questions" array. Each question object should have:
      1. "text": The question text.
      2. "options": An array of 4 strings (potential answers).
      3. "correctOptionIndex": The 0-based index of the correct answer in the "options" array.
    `;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    let jsonStart = text.indexOf('{');
    let jsonEnd = text.lastIndexOf('}') + 1;

    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      console.error('Failed to extract JSON from response:', text);
      return { questions: [] };
    }

    const jsonText = text.substring(jsonStart, jsonEnd);

    try {
      const quiz = JSON.parse(jsonText) as GeneratedQuiz;
      if (!quiz.questions || !Array.isArray(quiz.questions) || quiz.questions.length === 0) {
        return { questions: [] };
      }
      quiz.questions = quiz.questions.map((question, index) => ({
        ...question,
        id: question.id || `q${index + 1}`
      }));
      return quiz;
    } catch (jsonError) {
      return { questions: [] };
    }
  } catch (error) {
    return { questions: [] };
  }
};

// This function gets answer explanations for quiz attempts
export const getAnswerExplanations = async (
  questions: QuizQuestion[],
  answers: number[]
): Promise<Explanation[]> => {
  try {
    // Get a generative model
    const model = getGenerativeModel("gemini-1.5-flash");

    // Construct the prompt
    const prompt = `
      You are an educational assessment specialist providing feedback on quiz answers.
      For each question and the selected answer, provide a brief explanation of whether
      the answer is correct or not, and why. Be encouraging in your feedback.
      
      Here are the questions and the selected answers (answer index starts at 0):
      
      ${questions.map((q, i) => `
      Question ${i+1}: ${q.text}
      Options: ${q.options.join(', ')}
      Correct Answer Index: ${q.correctOptionIndex}
      Selected Answer Index: ${answers[i]}
      `).join('\n')}
      
      Provide an explanation for each question in a JSON array of objects. Each object should have the following keys: "question", "options", "correctAnswerIndex", "selectedAnswerIndex", "feedback".
      Example format:
      [
        {
          "question": "What is the capital of France?",
          "options": ["Berlin", "Madrid", "Paris", "Rome"],
          "correctAnswerIndex": 2,
          "selectedAnswerIndex": 2,
          "feedback": "Correct! Paris is a beautiful city. Well done!"
        }
      ]
    `;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    
    // Extract JSON from the response
    let jsonStart = text.indexOf('[');
    let jsonEnd = text.lastIndexOf(']') + 1;
    
    if (jsonStart === -1 || jsonEnd <= jsonStart) {
      return questions.map((q, i) => {
        const correct = q.correctOptionIndex === answers[i];
        return {
          question: q.text,
          options: q.options,
          correctAnswerIndex: q.correctOptionIndex,
          selectedAnswerIndex: answers[i],
          feedback: correct ? 
          "Correct! Well done." : 
          `Incorrect. The correct answer is: ${q.options[q.correctOptionIndex]}`
        };
      });
    }
    
    const jsonText = text.substring(jsonStart, jsonEnd);
    
    try {
      // Parse the JSON
      const explanations = JSON.parse(jsonText) as Explanation[];
      return explanations;
    } catch (jsonError) {
      console.error('JSON parsing error for explanations:', jsonError);
      // Fallback response
      return questions.map((q, i) => {
        const correct = q.correctOptionIndex === answers[i];
        return {
          question: q.text,
          options: q.options,
          correctAnswerIndex: q.correctOptionIndex,
          selectedAnswerIndex: answers[i],
          feedback: correct ? 
          "Correct! Well done." : 
          `Incorrect. The correct answer is: ${q.options[q.correctOptionIndex]}`
        };
      });
    }
  } catch (error) {
    console.error('Error getting answer explanations:', error);
    // Fallback response
    return questions.map((q, i) => {
        const correct = q.correctOptionIndex === answers[i];
        return {
          question: q.text,
          options: q.options,
          correctAnswerIndex: q.correctOptionIndex,
          selectedAnswerIndex: answers[i],
          feedback: correct ? 
            "Correct! Well done." : 
            `Incorrect. The correct answer is: ${q.options[q.correctOptionIndex]}`
        };
    });
  }
}; 