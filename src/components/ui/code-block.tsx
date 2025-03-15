
import React from "react";
import { cn } from "@/lib/utils";

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "javascript",
  showLineNumbers = false,
  className,
}) => {
  return (
    <div className={cn("relative overflow-hidden rounded-md border", className)}>
      <pre
        className={cn(
          "bg-slate-950 text-slate-50 p-4 overflow-x-auto text-sm font-mono",
          showLineNumbers && "pl-12 relative"
        )}
      >
        {showLineNumbers && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-slate-900 flex flex-col items-end pr-2 text-slate-500 select-none">
            {code.split("\n").map((_, i) => (
              <div key={i} className="h-6 text-xs">
                {i + 1}
              </div>
            ))}
          </div>
        )}
        <code className={language}>{code}</code>
      </pre>
    </div>
  );
};

export default CodeBlock;
