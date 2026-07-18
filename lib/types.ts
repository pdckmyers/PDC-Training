export type Role = "hire" | "admin";

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_index: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  body: string;
  image_url: string | null;
  video_url: string | null;
  quiz: QuizQuestion[];
  published: boolean;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  module_id: string;
  quiz_score: number | null;
  quiz_total: number | null;
  completed_at: string;
}
