export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: "API_KEY_MISSING" | "RATE_LIMIT" | "NOT_FOUND" | "API_ERROR";
    message: string;
    retryAfter?: number;
  };
}
