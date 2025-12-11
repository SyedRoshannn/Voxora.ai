import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-2xl border-0 bg-gray-700 text-gray-100 px-4 py-3 pr-12 text-base shadow-[0_0_15px_rgba(0,0,0,0.1)] placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none",
            className
          )}
          ref={ref}
          {...props}
        />
        <div className="absolute right-3 bottom-3 flex items-center">
          <button 
            type="button"
            aria-label="Send message"
            className="h-5 w-5 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center transition-colors"
            onClick={() => {
              // Handle send button click
              const form = (ref as React.RefObject<HTMLTextAreaElement>).current?.form;
              if (form) {
                form.requestSubmit();
              }
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-3.5 w-3.5 text-white"
            >
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
