/**
 * AI Agent-related types
 */

/**
 * Agent request format
 */
export interface AgentRequest {
  query: string;
  context?: Record<string, any>;
  sessionId?: string;
  userId?: string;
}

/**
 * Agent response format
 */
export interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  agentName: string;
  timestamp: string;
  processingTime?: number;
  tokensUsed?: number;
}

/**
 * Agent status
 */
export enum AgentStatus {
  IDLE = 'idle',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
}

/**
 * Coordinator request
 */
export interface CoordinatorRequest {
  query: string;
  preferences?: Record<string, any>;
  sessionId?: string;
}

/**
 * Coordinator response
 */
export interface CoordinatorResponse {
  success: boolean;
  plan?: string;
  results: AgentResult[];
  summary: string;
  processingTime: number;
}

/**
 * Individual agent result
 */
export interface AgentResult {
  agentName: string;
  success: boolean;
  data?: any;
  error?: string;
  processingTime: number;
}

/**
 * Agent metadata
 */
export interface AgentMetadata {
  name: string;
  type: 'typescript' | 'python';
  endpoint: string;
  description: string;
  capabilities: string[];
  status: AgentStatus;
  version: string;
}

/**
 * Chat message (for conversational interfaces)
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * Chat session
 */
export interface ChatSession {
  id: string;
  userId?: string;
  messages: ChatMessage[];
  context: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
