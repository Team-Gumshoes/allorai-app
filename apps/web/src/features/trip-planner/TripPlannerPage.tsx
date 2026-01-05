import { useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import ChatInterface from './components/ChatInterface';
import TripSummary from './components/TripSummary';

export default function TripPlannerPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    // TODO: Call coordinator API
    // Simulating response for now
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Trip planning agent response will appear here...'
      }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary-600" />
          AI Trip Planner
        </h1>
        <p className="mt-2 text-gray-600">
          Let our AI assistant help you plan your perfect trip
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChatInterface messages={messages} loading={loading} />
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your trip..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
              Send
            </button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <TripSummary />
        </div>
      </div>
    </div>
  );
}
