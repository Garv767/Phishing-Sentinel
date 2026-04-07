import React from 'react';
import { ExternalLink, AlertTriangle } from 'lucide-react';

const REPO_URL = "https://github.com/Garv767/Phishing-Sentinel/blob/main/ERRORS.md";

const ErrorAlert = ({ error }) => {
  if (!error || !error.code) return null;

  return (
    <div className="border border-red-600 text-red-600 dark:border-red-500 dark:text-red-500 bg-red-50 dark:bg-red-950/20 p-4 w-full text-left mb-6">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
            System Fault: [{error.code}]
          </p>
          <p className="text-sm mt-1 font-medium mb-3">{error.message}</p>
          <a 
            href={`${REPO_URL}#${error.code}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors underline underline-offset-4"
          >
            Diagnostics & Resolution <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default ErrorAlert;
