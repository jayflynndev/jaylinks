import * as React from "react";

type Props = {
  message?: string;
};

export function LoadingSpinner({ message = "Loading..." }: Props) {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      <span className="ml-2 text-white/80">{message}</span>
    </div>
  );
}
