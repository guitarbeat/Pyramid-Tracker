// src/lib/utils.ts
export function cn(...args: string[]) {
    return args.filter(Boolean).join(' ');
  }