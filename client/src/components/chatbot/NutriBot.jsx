import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const QUICK_PROMPTS = [
  '🥚 Calories in 2 boiled eggs?',
  '🍚 Macros in 1 cup of rice?',
  '💪 High protein breakfast ideas',
  '🥗 Best foods for weight loss',
  '💧 How much water should I drink?',
];

const TypingIndicator = () => (
  <div className="flex items-end gap-2 mb-4">
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0">
      N
    </div>
    <div className="bg-gray-100 border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3">
      <div className="flex gap-1 items-center h-5">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const Message = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-end gap-2 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0 ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
          : 'bg-gradient-to-br from-green-400 to-emerald-500'
      }`}>
        {isUser ? 'U' : 'N'}
      </div>
      <div className={`max-w-[75%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
        isUser
          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm shadow-sm'
          : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-bl-sm'
      }`}>
        {msg.content}
        <div className={`text-xs mt-1 ${isUser ? 'text-emerald-100' : 'text-gray-400'}`}>
          {msg.time}
        </div>
      </div>
    </div>
  );
};

export default function NutriBot({ externalOpen, onClose }) {
  const { user } = useAuth();
  const isControlled = externalOpen !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? externalOpen : internalOpen;

  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: `Hi${user?.name ? ` ${user.name.split(' ')[0]}` : ''}! 👋 I'm NutriBot, your personal nutrition assistant.\n\nAsk me anything about calories, macros, meal plans, or healthy eating. I'm here to help! 🥗`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const sessionId = useRef(`session_${Date.now()}`);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setIsMinimized(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isControlled) onClose?.();
    else setInternalOpen(false);
  };

  const sendMessage = async (text) => {
    const messageText = (text || input).trim();
    if (!messageText || loading) return;

    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await axios.post('/api/chatbot/chat', {
        message: messageText,
        sessionId: sessionId.current,
      });

      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.message || 'Sorry, I could not process that. Please try again.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ I\'m having trouble connecting right now. Please try again in a moment.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: Date.now(),
      role: 'assistant',
      content: 'Chat cleared! How can I help you with your nutrition today? 🥗',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }]);
  };

  if (!user) return null;

  return (
    <>
      {/* Floating button — only shown when NOT controlled by navbar */}
      {!isControlled && (
        <button
          onClick={() => setInternalOpen(o => !o)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center"
          aria-label="Open NutriBot"
        >
          <span className="text-2xl">🤖</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
            isMinimized ? 'h-14' : 'h-[520px]'
          }`}
          style={{
            bottom: '80px',
            right: '24px',
            width: '360px',
            maxHeight: 'calc(100vh - 100px)',
          }}
        >
          {/* Header — matches landing page navbar gradient */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-t-2xl flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-lg shadow-sm">
                🤖
              </div>
              <div>
                <p className="text-white font-semibold text-sm">NutriBot</p>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-200 rounded-full animate-pulse" />
                  <span className="text-white/80 text-xs">Online</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={clearChat}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/15"
                title="Clear chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <button
                onClick={() => setIsMinimized(m => !m)}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/15"
                title={isMinimized ? 'Expand' : 'Minimize'}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMinimized ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'} />
                </svg>
              </button>
              <button
                onClick={handleClose}
                className="text-white/70 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/15"
                title="Close"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Messages area — light background */}
              <div className="flex-1 overflow-y-auto px-4 py-4 bg-gray-50 space-y-1">
                {messages.map((msg) => (
                  <Message key={msg.id} msg={msg} />
                ))}
                {loading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts */}
              {messages.length <= 1 && (
                <div className="px-4 py-2 bg-white border-t border-gray-100 flex-shrink-0">
                  <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-xs bg-green-50 border border-green-200 text-green-700 px-2 py-1 rounded-full hover:bg-green-100 hover:border-green-400 transition-colors"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input area */}
              <div className="px-4 py-3 bg-white border-t border-gray-100 rounded-b-2xl flex-shrink-0">
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask about calories, nutrition..."
                    rows={1}
                    className="flex-1 resize-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all max-h-24"
                    style={{ minHeight: '40px' }}
                    disabled={loading}
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || loading}
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white flex items-center justify-center hover:shadow-md hover:scale-105 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 flex-shrink-0"
                    aria-label="Send"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1 text-center">Enter to send · Shift+Enter for new line</p>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
