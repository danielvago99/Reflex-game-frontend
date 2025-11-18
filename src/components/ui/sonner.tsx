"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        style: {
          background: 'rgba(16, 21, 34, 0.9)',
          border: '1px solid rgba(0, 255, 163, 0.2)',
          color: '#ffffff',
          backdropFilter: 'blur(12px)',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };