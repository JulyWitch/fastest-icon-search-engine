import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '../../utils/clipboard';

interface CopyButtonProps {
  text: string;
  variant?: 'primary' | 'secondary';
}

export function CopyButton({ text, variant = 'primary' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors";
  const variantStyles = variant === 'primary'
    ? "bg-blue-500 text-white hover:bg-blue-600"
    : "border border-gray-300 text-gray-700 hover:bg-gray-50";

  return (
    <button
      onClick={handleCopy}
      className={`${baseStyles} ${variantStyles}`}
    >
      {copied ? (
        <Check className="h-5 w-5" />
      ) : (
        <Copy className="h-5 w-5" />
      )}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}