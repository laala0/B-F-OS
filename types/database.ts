// Hand-authored to match supabase/migrations/0001_init_auth.sql,
// 0002_projects.sql, 0003_tasks.sql, 0004_invoices.sql, 0005_reports.sql,
// and 0006_security_hardening.sql.
//
// Once this project is linked to a real Supabase project (`supabase link`),
// regenerate this file from the live schema instead of hand-editing it:
//
//   npx supabase gen types typescript --linked > types/database.ts
//
// The shape below matches that command's output, so nothing else in the
// codebase needs to change when you switch over.

export type UserRole = "admin" | "employee";
export type ProfileStatus = "invited" | "active" | "suspended";
export type ProjectStatus =
  | "lead"
  | "quoted"
  | "won"
  | "active"
  | "on_hold"
  | "complete"
  | "archived";
export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type InvoiceStatus = "draft" | "sent" | "paid";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          name: string;
          legal_name: string | null;
          gst_number: string | null;
          address: string | null;
          logo_url: string | null;
          timezone: string;
          default_holdback_pct: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          legal_name?: string | null;
          gst_number?: string | null;
          address?: string | null;
          logo_url?: string | null;
          timezone?: string;
          default_holdback_pct?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["companies"]["Insert"]>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          company_id: string;
          role: UserRole;
          first_name: string;
          last_name: string;
          phone: string | null;
          email: string;
          avatar_url: string | null;
          status: ProfileStatus;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id: string;
          company_id: string;
          role?: UserRole;
          first_name?: string;
          last_name?: string;
          phone?: string | null;
          email: string;
          avatar_url?: string | null;
          status?: ProfileStatus;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
        ];
      };
      invites: {
        Row: {
          id: string;
          company_id: string;
          email: string;
          phone: string | null;
          role: UserRole;
          token: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          email: string;
          phone?: string | null;
          role?: UserRole;
          token?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invites_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invites_invited_by_fkey";
            columns: ["invited_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          id: string;
          company_id: string;
          code: string;
          name: string;
          client_name: string | null;
          gc_company: string | null;
          site_address: string | null;
          status: ProjectStatus;
          contract_value_cents: number | null;
          start_date: string | null;
          target_end_date: string | null;
          actual_end_date: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          code: string;
          name: string;
          client_name?: string | null;
          gc_company?: string | null;
          site_address?: string | null;
          status?: ProjectStatus;
          contract_value_cents?: number | null;
          start_date?: string | null;
          target_end_date?: string | null;
          actual_end_date?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "projects_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      project_assignments: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          profile_id: string;
          assigned_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          project_id: string;
          profile_id: string;
          assigned_by?: string | null;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["project_assignments"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "project_assignments_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_assignments_project_id_company_id_fkey";
            columns: ["project_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "project_assignments_profile_id_company_id_fkey";
            columns: ["profile_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id", "company_id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          title: string;
          description: string | null;
          priority: TaskPriority;
          status: TaskStatus;
          due_date: string | null;
          completed_at: string | null;
          assigned_to: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          project_id: string;
          title: string;
          description?: string | null;
          priority?: TaskPriority;
          status?: TaskStatus;
          due_date?: string | null;
          completed_at?: string | null;
          assigned_to?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "tasks_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_project_id_company_id_fkey";
            columns: ["project_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "tasks_assigned_to_company_id_fkey";
            columns: ["assigned_to", "company_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "tasks_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      task_checklist_items: {
        Row: {
          id: string;
          company_id: string;
          task_id: string;
          label: string;
          is_done: boolean;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          task_id: string;
          label: string;
          is_done?: boolean;
          position?: number;
          created_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["task_checklist_items"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "task_checklist_items_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_checklist_items_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          id: string;
          company_id: string;
          project_id: string;
          invoice_number: string;
          amount_cents: number;
          status: InvoiceStatus;
          issued_date: string;
          due_date: string | null;
          paid_date: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          project_id: string;
          invoice_number: string;
          amount_cents: number;
          status?: InvoiceStatus;
          issued_date?: string;
          due_date?: string | null;
          paid_date?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["invoices"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "invoices_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_project_id_company_id_fkey";
            columns: ["project_id", "company_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id", "company_id"];
          },
          {
            foreignKeyName: "invoices_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      company_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      user_role: {
        Args: Record<PropertyKey, never>;
        Returns: UserRole;
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_active: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      bootstrap_company: {
        Args: {
          p_owner_id: string;
          p_company_name: string;
          p_first_name: string;
          p_last_name: string;
          p_email: string;
        };
        Returns: Database["public"]["Tables"]["companies"]["Row"];
      };
      accept_invite: {
        Args: {
          p_token: string;
          p_user_id: string;
          p_first_name: string;
          p_last_name: string;
        };
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
    };
    Enums: {
      user_role: UserRole;
      profile_status: ProfileStatus;
      project_status: ProjectStatus;
      task_priority: TaskPriority;
      task_status: TaskStatus;
      invoice_status: InvoiceStatus;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Company = Tables<"companies">;
export type Profile = Tables<"profiles">;
export type Invite = Tables<"invites">;
export type Project = Tables<"projects">;
export type ProjectAssignment = Tables<"project_assignments">;
export type Task = Tables<"tasks">;
export type TaskChecklistItem = Tables<"task_checklist_items">;
export type Invoice = Tables<"invoices">;
