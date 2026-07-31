/**
 * Hand-written types mirroring supabase/migrations/20260731000000_initial_schema.sql.
 * Keep these in sync whenever a migration changes table shape — there's no
 * Supabase CLI codegen wired into this project (Jay applies migrations by
 * pasting SQL into the dashboard, not via `supabase db push`), so nothing
 * regenerates this file automatically.
 */

export type PuzzleStatus = "draft" | "scheduled" | "published";

export type JudgedAnswerVerdict = "accept" | "reject";

export type JudgedAnswerSource = "ai" | "admin_override";

export type JudgedAnswerReviewStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "dismissed"
  | "not_applicable";

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_daily: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Puzzle {
  id: string;
  category_id: string;
  episode_number: number;
  /** Nullable: only meaningful for is_daily categories. */
  publish_date: string | null;
  status: PuzzleStatus;
  title: string;
  link_answer: string;
  link_alternatives: string[];
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: string;
  puzzle_id: string;
  /** 1-5, the order the question is asked in. */
  position: number;
  question_text: string;
  answer: string;
  alternatives: string[];
  created_at: string;
  updated_at: string;
}

export interface JudgedAnswer {
  id: string;
  question_id: string | null;
  puzzle_id: string | null;
  normalized_answer: string;
  raw_answer: string;
  verdict: JudgedAnswerVerdict;
  confidence: number | null;
  reason: string | null;
  source: JudgedAnswerSource;
  times_seen: number;
  review_status: JudgedAnswerReviewStatus;
  reviewed_at: string | null;
  created_at: string;
}

/** Minimal typed schema shape handed to the Supabase client's generic param. */
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, "slug" | "name">;
        Update: Partial<Category>;
      };
      puzzles: {
        Row: Puzzle;
        Insert: Partial<Puzzle> &
          Pick<Puzzle, "category_id" | "episode_number" | "title" | "link_answer">;
        Update: Partial<Puzzle>;
      };
      questions: {
        Row: Question;
        Insert: Partial<Question> &
          Pick<Question, "puzzle_id" | "position" | "question_text" | "answer">;
        Update: Partial<Question>;
      };
      judged_answers: {
        Row: JudgedAnswer;
        Insert: Partial<JudgedAnswer> &
          Pick<JudgedAnswer, "normalized_answer" | "raw_answer" | "verdict">;
        Update: Partial<JudgedAnswer>;
      };
    };
  };
}
