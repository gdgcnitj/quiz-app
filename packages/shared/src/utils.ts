// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateUsername = (username: string): boolean => {
  return username.length >= 3 && username.length <= 20;
};

// Time utilities
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const calculateScore = (correctAnswers: number, totalQuestions: number, averageResponseTime: number): number => {
  const baseScore = (correctAnswers / totalQuestions) * 100;
  const timeBonus = Math.max(0, (60 - averageResponseTime) / 60) * 10;
  return Math.round(baseScore + timeBonus);
};

// Response utilities
export const createSuccessResponse = <T>(data: T, message?: string) => ({
  success: true,
  data,
  message
});

export const createErrorResponse = (error: string, message?: string) => ({
  success: false,
  error,
  message
});

// Constants
export const CONSTANTS = {
  DEFAULT_QUESTION_TIME: 60,
  MAX_QUESTION_TIME: 300,
  MIN_QUESTION_TIME: 10,
  MAX_OPTIONS: 6,
  MIN_OPTIONS: 2,
  ADMIN_KEY_LENGTH: 32
} as const;
