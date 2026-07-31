/**
 * Hand-written types mirroring supabase/migrations/20260731000000_initial_schema.sql.
 * Keep these in sync whenever a migration changes table shape — there's no
 * Supabase CLI codegen wired into this project (Jay applies migrations by
 * pasting SQL into the dashboard, not via `supabase db push`), so nothing
 * regenerates this file automatically.
 *
 * Insert/Update types are written as plain object literals (matching what
 * `supabase gen types` itself produces) rather than `Partial<Row> & Pick<...>`
 * compositions — supabase-js's internal generic resolution doesn't reliably
 * unwrap intersection types and silently degrades query results to `never`.
 *
 * The Row types below are `type` aliases, not `interface`s, for the same
 * reason: postgrest-js structurally checks each table's Row against
 * `Record<string, unknown>`, and TypeScript only grants object *type*
 * literals the implicit index signature that check needs — `interface`
 * declarations are excluded from that leniency and fail the check, which
 * silently collapses every query on that table to `never` with no error
 * at the call site (only at the point of use, as a confusing `never`).
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

export type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_daily: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Puzzle = {
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
};

export type Question = {
  id: string;
  puzzle_id: string;
  /** 1-5, the order the question is asked in. */
  position: number;
  question_text: string;
  answer: string;
  alternatives: string[];
  created_at: string;
  updated_at: string;
};

export type JudgedAnswer = {
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
};

/**
 * Minimal typed schema shape handed to the Supabase client's generic param.
 * `Views`/`Functions` and each table's `Relationships` are required by
 * postgrest-js's internal `GenericSchema`/`GenericTable` constraints even
 * though this project doesn't use views, RPC functions, or FK-embed
 * queries yet — omitting them silently degrades every query's inferred
 * type to `never` instead of producing a helpful error.
 */
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Relationships: [];
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          is_daily?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          is_daily?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      puzzles: {
        Row: Puzzle;
        Relationships: [];
        Insert: {
          id?: string;
          category_id: string;
          episode_number: number;
          publish_date?: string | null;
          status?: PuzzleStatus;
          title: string;
          link_answer: string;
          link_alternatives?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          episode_number?: number;
          publish_date?: string | null;
          status?: PuzzleStatus;
          title?: string;
          link_answer?: string;
          link_alternatives?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: Question;
        Relationships: [];
        Insert: {
          id?: string;
          puzzle_id: string;
          position: number;
          question_text: string;
          answer: string;
          alternatives?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          puzzle_id?: string;
          position?: number;
          question_text?: string;
          answer?: string;
          alternatives?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      judged_answers: {
        Row: JudgedAnswer;
        Relationships: [];
        Insert: {
          id?: string;
          question_id?: string | null;
          puzzle_id?: string | null;
          normalized_answer: string;
          raw_answer: string;
          verdict: JudgedAnswerVerdict;
          confidence?: number | null;
          reason?: string | null;
          source?: JudgedAnswerSource;
          times_seen?: number;
          review_status?: JudgedAnswerReviewStatus;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string | null;
          puzzle_id?: string | null;
          normalized_answer?: string;
          raw_answer?: string;
          verdict?: JudgedAnswerVerdict;
          confidence?: number | null;
          reason?: string | null;
          source?: JudgedAnswerSource;
          times_seen?: number;
          review_status?: JudgedAnswerReviewStatus;
          reviewed_at?: string | null;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
