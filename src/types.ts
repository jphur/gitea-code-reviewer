export type AIComment = { line: number; body: string };
export type AIFile = { path: string; comments: AIComment[] };