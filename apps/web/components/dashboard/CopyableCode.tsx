'use client';

import { useState } from 'react';

export default function CopyableCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="bg-slate-900 rounded-xl p-4 relative">
      <pre className="text-sm text-teal-300 overflow-x-auto whitespace-pre-wrap break-all">{code}</pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }}
        className="absolute top-3 right-3 text-xs bg-slate-700 text-white px-3 py-1 rounded-lg hover:bg-slate-600"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
