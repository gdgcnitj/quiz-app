export declare const validateEmail: (email: string) => boolean;
export declare const validatePassword: (password: string) => boolean;
export declare const validateUsername: (username: string) => boolean;
export declare const formatTime: (seconds: number) => string;
export declare const calculateScore: (correctAnswers: number, totalQuestions: number, averageResponseTime: number) => number;
export declare const createSuccessResponse: <T>(data: T, message?: string) => {
    success: boolean;
    data: T;
    message: string | undefined;
};
export declare const createErrorResponse: (error: string, message?: string) => {
    success: boolean;
    error: string;
    message: string | undefined;
};
export declare const CONSTANTS: {
    readonly DEFAULT_QUESTION_TIME: 60;
    readonly MAX_QUESTION_TIME: 300;
    readonly MIN_QUESTION_TIME: 10;
    readonly MAX_OPTIONS: 6;
    readonly MIN_OPTIONS: 2;
    readonly ADMIN_KEY_LENGTH: 32;
};
//# sourceMappingURL=utils.d.ts.map