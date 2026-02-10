import React from 'react';
import { Loader2 } from 'lucide-react';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
}

export const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  isLoading, 
  variant = 'primary', 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "relative px-6 py-3 rounded-xl font-medium transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 overflow-hidden group";
  
  const variants = {
    primary: "bg-gradient-to-br from-cyan-500/20 to-blue-600/20 hover:from-cyan-500/30 hover:to-blue-600/30 border border-cyan-500/30 text-cyan-50 shadow-[0_0_20px_rgba(6,182,212,0.15)] hover:shadow-[0_0_30px_rgba(6,182,212,0.3)]",
    secondary: "bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300",
    accent: "bg-gradient-to-br from-pink-500/20 to-purple-600/20 hover:from-pink-500/30 hover:to-purple-600/30 border border-pink-500/30 text-pink-50 shadow-[0_0_20px_rgba(236,72,153,0.15)] hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]"
  };

  return (
    <button 
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent z-10" />
    </button>
  );
};