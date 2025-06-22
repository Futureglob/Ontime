
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
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          organization_id?: string | null
          employee_id?: string | null
          full_name?: string | null
          designation?: string | null
          mobile_number?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          employee_id?: string | null
          full_name?: string | null
          designation?: string | null
          mobile_number?: string | null
          role?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          organization_id: string | null
          title: string
          description: string | null
          task_type: string
          location: string | null
          location_lat: number | null
          location_lng: number | null
          client_info: string | null
          deadline: string | null
          assigned_to: string | null
          assigned_by: string | null
          status: string | null
          travel_distance: number | null
          travel_duration: number | null
          working_hours: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id?: string | null
          title: string
          description?: string | null
          task_type: string
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          client_info?: string | null
          deadline?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          status?: string | null
          travel_distance?: number | null
          travel_duration?: number | null
          working_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string | null
          title?: string
          description?: string | null
          task_type?: string
          location?: string | null
          location_lat?: number | null
          location_lng?: number | null
          client_info?: string | null
          deadline?: string | null
          assigned_to?: string | null
          assigned_by?: string | null
          status?: string | null
          travel_distance?: number | null
          travel_duration?: number | null
          working_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_by_fkey"
            columns: ["assigned_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
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
          task_id: string | null
          sender_id: string | null
          content: string
          is_read: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id?: string | null
          sender_id?: string | null
          content: string
          is_read?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string | null
          sender_id?: string | null
          content?: string
          is_read?: boolean | null
          created_at?: string | null
        }
        Relationships: [
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
