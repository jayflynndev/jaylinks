/**
 * Hand-written types mirroring supabase/migrations/20260731000000_initial_schema.sql.
 * Keep these in sync whenever a migration changes table shape — there's no
 * Supabase CLI codegen wired into this project (Jay applies migrations by
 * pasting SQL into the dashboard, not via `supabase db push`), so nothing
 * regenerates this file automatically.
 *
 * Table names are prefixed "JL_" (exact case) so they're visually
 * distinguishable from QuizHub's tables in the same shared Supabase
 * project — the `Database["public"]["Tables"]` keys below must match the
 * quoted-identifier table names in the migration exactly, since
 * supabase-js's `.from(name)` is case-sensitive.
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

/** A single clue word/phrase — auto-revealed on a timer, never individually answered. */
export type Clue = {
  id: string;
  puzzle_id: string;
  /** 1-5, the order the clue reveals in. */
  position: number;
  clue_text: string;
  created_at: string;
  updated_at: string;
};

/**
 * Not one of ours — this is Jay's existing `profiles` table from the
 * shared Supabase project (also used by QuizHub), queried only to check
 * admin status (see src/lib/supabase/admin-check.ts). Schema assumed per
 * Supabase's standard convention: profiles.id = auth.users.id, plus an
 * is_admin boolean. **Confirm against the real table** — if the column or
 * join differs, this is the one place to fix it.
 */
export type Profile = {
  id: string;
  is_admin: boolean;
};

export type JudgedAnswer = {
  id: string;
  /** Always a link guess — clues are never individually judged. */
  puzzle_id: string;
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
      JL_categories: {
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
      JL_puzzles: {
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
      JL_clues: {
        Row: Clue;
        Relationships: [];
        Insert: {
          id?: string;
          puzzle_id: string;
          position: number;
          clue_text: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          puzzle_id?: string;
          position?: number;
          clue_text?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      JL_judged_answers: {
        Row: JudgedAnswer;
        Relationships: [];
        Insert: {
          id?: string;
          puzzle_id: string;
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
          puzzle_id?: string;
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
      profiles: {
        Row: Profile;
        Relationships: [];
        // This app never writes to `profiles` (that's QuizHub's table to
        // manage) — Insert/Update are typed loosely since they're unused.
        Insert: { id: string; is_admin?: boolean };
        Update: { id?: string; is_admin?: boolean };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}
