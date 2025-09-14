export interface User {
    $id: string;
    username: string;
    email: string;
    role: 'student' | 'admin';
    $createdAt: string;
}
export interface Question {
    $id: string;
    text: string;
    options: string[];
    correctAnswer: number;
    timeLimit: number;
    isActive: boolean;
    createdBy: string;
    $createdAt: string;
}
export interface CreateQuestionRequest {
    text: string;
    options: string[];
    correctAnswer: number;
    timeLimit?: number;
}
export interface QuizSession {
    $id: string;
    currentQuestionId: string | null;
    startTime: string;
    isActive: boolean;
    createdBy: string;
    $createdAt: string;
}
export interface UserResponse {
    $id: string;
    userId: string;
    sessionId: string;
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    responseTime: number;
    $createdAt: string;
}
export interface SubmitAnswerRequest {
    questionId: string;
    selectedAnswer: number;
    responseTime: number;
}
export interface LeaderboardEntry {
    $id: string;
    userId: string;
    username: string;
    sessionId: string;
    totalScore: number;
    correctAnswers: number;
    averageResponseTime: number;
    $createdAt: string;
}
export interface ServerToClientEvents {
    'quiz-started': (session: QuizSession) => void;
    'new-question': (question: Omit<Question, 'correctAnswer'>) => void;
    'question-ended': (questionId: string) => void;
    'leaderboard-update': (leaderboard: LeaderboardEntry[]) => void;
    'quiz-ended': (sessionId: string) => void;
    'error': (message: string) => void;
}
export interface ClientToServerEvents {
    'join-quiz': (userId: string) => void;
    'submit-answer': (data: SubmitAnswerRequest) => void;
    'admin-join': (adminId: string) => void;
    'force-next-question': () => void;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface AuthResponse {
    user: User;
    token: string;
}
export interface LoginRequest {
    email: string;
    password: string;
}
export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
}
export interface AdminLoginRequest {
    email: string;
    password: string;
    adminKey: string;
}
export interface QuizSettings {
    questionTimeLimit: number;
    autoAdvance: boolean;
    showCorrectAnswer: boolean;
}
export interface QuizStats {
    totalQuestions: number;
    totalParticipants: number;
    averageScore: number;
    completionRate: number;
}
//# sourceMappingURL=types.d.ts.map