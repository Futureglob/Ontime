export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          logo_url: string | null
          primary_color: string | null
          secondary_color: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          logo_url?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          employee_id: string | null
          full_name: string | null
          designation: string | null
          mobile_number: string | null
          role: string | null
          created_at: string
          updated_at: string
          is_active: boolean
          pin_hash: string | null
          pin_created_at: string | null
          pin_expires_at: string | null
          failed_pin_attempts: number | null
          pin_locked_until: string | null
          pin_reset_requested: boolean | null
          pin_reset_requested_at: string | null
        }
        Insert: {
          id: string
          organization_id?: string | null
          employee_id?: string | null
          full_name?: string | null
          designation?: string | null
          mobile_number?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          pin_hash?: string | null
          pin_created_at?: string | null
          pin_expires_at?: string | null
          failed_pin_attempts?: number | null
          pin_locked_until?: string | null
          pin_reset_requested?: boolean | null
          pin_reset_requested_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          employee_id?: string | null
          full_name?: string | null
          designation?: string | null
          mobile_number?: string | null
          role?: string | null
          created_at?: string
          updated_at?: string
          is_active?: boolean
          pin_hash?: string | null
          pin_created_at?: string | null
          pin_expires_at?: string | null
          failed_pin_attempts?: number | null
          pin_locked_until?: string | null
          pin_reset_requested?: boolean | null
          pin_reset_requested_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      clients: {
        Row: {
          id: string
          name: string
          contact_person: string | null
          place: string | null
          emirate: string | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_person?: string | null
          place?: string | null
          emirate?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_person?: string | null
          place?: string | null
          emirate?: string | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
          assignee_id: string | null
          organization_id: string
          created_by: string
          location: string | null
          client_id: string | null
          task_type: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          assignee_id?: string | null
          organization_id: string
          created_by: string
          location?: string | null
          client_id?: string | null
          task_type?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
          assignee_id?: string | null
          organization_id?: string
          created_by?: string
          location?: string | null
          client_id?: string | null
          task_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      task_photos: {
        Row: {
          id: string
          task_id: string | null
          photo_url: string
          photo_type: string | null
          latitude: number | null
          longitude: number | null
          taken_at: string | null
          uploaded_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          photo_url: string
          photo_type?: string | null
          latitude?: number | null
          longitude?: number | null
          taken_at?: string | null
          uploaded_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string | null
          photo_url?: string
          photo_type?: string | null
          latitude?: number | null
          longitude?: number | null
          taken_at?: string | null
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_photos_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      task_status_history: {
        Row: {
          id: string
          task_id: string | null
          status: string
          updated_by: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          status: string
          updated_by?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string | null
          status?: string
          updated_by?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_updated_by_fkey"
            columns: ["updated_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          task_id: string | null
          content: string
          created_at: string
          is_read: boolean
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          task_id?: string | null
          content: string
          created_at?: string
          is_read?: boolean
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          task_id?: string | null
          content?: string
          created_at?: string
          is_read?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "messages_receiver_id_fkey"
            columns: ["receiver_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_task_id_fkey"
            columns: ["task_id"]
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          }
        ]
      }
      pin_audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          details: string | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          details?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          details?: string | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pin_audit_logs_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
