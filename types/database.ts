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
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          type: "income" | "expense"
          amount: number
          category: string
          notes: Json
          date: string
          receipt_url: string | null
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug?: string
          type: "income" | "expense"
          amount: number
          category: string
          notes?: Json
          date: string
          receipt_url?: string | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          type?: "income" | "expense"
          amount?: number
          category?: string
          notes?: Json
          date?: string
          receipt_url?: string | null
          source?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      receipt_images: {
        Row: {
          id: string
          transaction_id: string
          user_id: string
          file_name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          storage_bucket: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          user_id?: string
          file_name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          storage_bucket?: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          user_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          storage_bucket?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_images_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: {
        Args: {
          title: string
          user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      transaction_type: "income" | "expense"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
