import { useState } from 'react';
import axios from 'axios';
import type { EditorRef } from './EditorWorkspace';

interface AIChatSidebarProps {
  editorRef: React.RefObject<EditorRef>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatSidebar({ editorRef }: AIChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! Highlight some code and ask me a question, or just chat." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    // Get currently active code context
    const codeContext = editorRef.current?.getCode() || "";
    const userMessage = input;

    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ai/chat`, {
        prompt: userMessage,
        codeContext: codeContext
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Sorry, an error occurred: ${err.message}. Make sure Anthropic API key is configured.` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#252526] border-l border-[#3c3c3c]">
      <div className="h-10 border-b border-[#3c3c3c] flex items-center px-4 font-semibold text-gray-300 text-sm tracking-wide">
        AI ASSISTANT
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <span className="text-xs text-gray-500 mb-1">
              {msg.role === 'user' ? 'You' : 'Claude'}
            </span>
            <div className={`text-sm py-2 px-3 rounded-lg max-w-[90%] whitespace-pre-wrap ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-[#3c3c3c] text-gray-200 border border-gray-600'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-gray-500 animate-pulse">
            Claude is thinking...
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#3c3c3c]">
        <textarea
          className="w-full bg-[#1e1e1e] border border-[#3c3c3c] rounded text-sm text-gray-200 p-2 outline-none focus:border-blue-500 resize-none"
          rows={3}
          placeholder="Ask a question about your code..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-1.5 rounded text-sm transition"
          onClick={sendMessage}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
