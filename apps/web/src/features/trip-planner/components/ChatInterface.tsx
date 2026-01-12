import { MessageSquare, User, Bot } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatInterfaceProps {
  messages: Message[];
  loading?: boolean;
}

export default function ChatInterface({ messages, loading }: ChatInterfaceProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 overflow-y-auto" style={{ height: 'calc(100vh - 280px)' }}>
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-full text-gray-400">
          <MessageSquare className="h-16 w-16 mb-4" />
          <p>Start a conversation to plan your trip</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-primary-600" />
                </div>
              )}
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p>{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="shrink-0 h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <Bot className="h-5 w-5 text-primary-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
