import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Send, Sparkles, AlertCircle, X, MessageSquare, Mic, MicOff, Copy, Check } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { analyzeLabReport, createChatSession, sendChatMessage } from '../services/geminiService';
import { Message, Sender } from '../types';
import ReactMarkdown from 'react-markdown';
import { Chat } from '@google/genai';

// Add type definition for window.SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export const AnalysisView: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Extract base64 data and mime type
        const matches = base64String.match(/^data:(.+);base64,(.+)$/);
        if (matches) {
          setMimeType(matches[1]);
          setImage(base64String);
          setAnalysis(null);
          setMessages([]);
          setChatSession(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    try {
      // Clean base64 string for API
      const base64Data = image.split(',')[1];
      
      const result = await analyzeLabReport(base64Data, mimeType);
      setAnalysis(result.text);
      
      // Initialize chat session
      const session = createChatSession(base64Data, mimeType);
      setChatSession(session);
      
      setMessages([{
        id: 'init',
        text: "I've analyzed your report. Feel free to ask any specific questions!",
        sender: Sender.Bot,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error(error);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !chatSession) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: Sender.User,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsSending(true);

    try {
      const responseText = await sendChatMessage(chatSession, userMsg.text);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: Sender.Bot,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      // Stop logic is handled by onend usually, but we can force stop if needed
      // Currently simple implementation relies on browser stopping
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputText((prev) => (prev ? prev + ' ' : '') + transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleCopy = async () => {
    if (!analysis) return;
    try {
      await navigator.clipboard.writeText(analysis);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearImage = () => {
    setImage(null);
    setAnalysis(null);
    setMessages([]);
    setChatSession(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 animate-float">
      {/* Upload Section */}
      {!analysis && (
        <GlassCard className="p-8 text-center transition-all duration-500">
          <div className="flex flex-col items-center justify-center space-y-6">
            <div className="p-4 rounded-full bg-cyan-500/10 border border-cyan-500/20 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Upload className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight">Upload Lab Report</h2>
              <p className="text-slate-400 max-w-sm mx-auto">
                Scan or upload your medical lab report for instant AI-powered insights and analysis.
              </p>
            </div>
            
            {!image ? (
              <div className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                <GlassButton variant="primary" className="group-hover:scale-105">
                  <FileText className="w-5 h-5" />
                  <span>Select Image</span>
                </GlassButton>
              </div>
            ) : (
              <div className="space-y-6 w-full max-w-md">
                <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                  <img src={image} alt="Preview" className="w-full h-64 object-cover" />
                  <button 
                    onClick={clearImage}
                    className="absolute top-2 right-2 p-2 bg-black/50 backdrop-blur-md rounded-full hover:bg-black/70 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
                <GlassButton 
                  onClick={handleAnalyze} 
                  isLoading={isAnalyzing} 
                  className="w-full"
                  variant="accent"
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze with Gemini Pro</span>
                </GlassButton>
              </div>
            )}
          </div>
        </GlassCard>
      )}

      {/* Analysis Result Section */}
      {analysis && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[800px]">
          {/* Left: Report & Analysis */}
          <GlassCard className="p-6 overflow-y-auto scrollbar-hide flex flex-col h-full">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-slate-900/80 backdrop-blur-xl pb-4 border-b border-white/10 z-10 transition-all">
              <h3 className="text-xl font-semibold text-cyan-300 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Report Analysis
              </h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-slate-300 hover:text-cyan-300 transition-all active:scale-95"
                  title="Copy to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied' : 'Copy'}
                </button>
                <button onClick={clearImage} className="text-xs text-slate-400 hover:text-white transition-colors">
                  New Analysis
                </button>
              </div>
            </div>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              <ReactMarkdown>{analysis}</ReactMarkdown>
            </div>
          </GlassCard>

          {/* Right: Chat */}
          <GlassCard className="flex flex-col h-full">
            <div className="p-6 border-b border-white/10 bg-white/5">
              <h3 className="text-xl font-semibold text-pink-300 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                AI Health Assistant
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === Sender.User ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${
                      msg.sender === Sender.User 
                        ? 'bg-gradient-to-br from-pink-600/80 to-purple-600/80 text-white rounded-br-none border border-pink-500/30' 
                        : 'bg-slate-800/80 text-slate-200 rounded-bl-none border border-slate-700/50'
                    }`}
                  >
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {isSending && (
                 <div className="flex justify-start">
                   <div className="bg-slate-800/80 text-cyan-400 p-4 rounded-2xl rounded-bl-none border border-slate-700/50 flex items-center gap-2">
                     <LoaderDots />
                   </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white/5 border-t border-white/10">
              <div className="relative flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isListening ? "Listening..." : "Ask about your results..."}
                    className={`w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all ${isListening ? 'border-pink-500/50 ring-1 ring-pink-500/50' : ''}`}
                  />
                  <button
                    onClick={toggleListening}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                      isListening 
                        ? 'text-pink-400 bg-pink-500/20 animate-pulse' 
                        : 'text-slate-400 hover:text-cyan-400 hover:bg-white/5'
                    }`}
                    title="Speak"
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>
                <button 
                  onClick={handleSendMessage}
                  disabled={!inputText.trim() || isSending}
                  className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

const LoaderDots = () => (
  <div className="flex space-x-1">
    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
  </div>
);