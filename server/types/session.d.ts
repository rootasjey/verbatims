/**
 * Session management type definitions
 * Represents user sessions for authentication
 */

/**
 * User Session entity from the database
 */
export interface UserSession {
  /** Unique identifier for the session */
  id: number;
  
  /** ID of the user this session belongs to */
  user_id: number;
  
  /** Unique session token */
  session_token: string;
  
  /** When this session expires */
  expires_at: string;
  
  /** Timestamp when session was created */
  created_at: string;
}

/**
 * Data for creating a new session
 */
export interface CreateSessionData {
  user_id: number;
  session_token: string;
  expires_at: string;
}

/**
 * Session validation result
 */
export interface SessionValidation {
  isValid: boolean;
  session?: UserSession;
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
}

/**
 * Session cleanup options
 */
export interface SessionCleanupOptions {
  /** Remove sessions older than this date */
  before_date?: string;
  
  /** Remove sessions for specific user */
  user_id?: number;
  
  /** Remove expired sessions only */
  expired_only?: boolean;
}
