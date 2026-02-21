export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'company' | 'broker'
          company_id: string | null
          broker_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          role: 'admin' | 'company' | 'broker'
          company_id?: string | null
          broker_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'company' | 'broker'
          company_id?: string | null
          broker_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          name: string
          registration_number: string
          address: string
          city: string
          province: 'haut-katanga' | 'lualaba'
          phone: string
          email: string
          owner_id: string
          subscription_id: string | null
          status: 'active' | 'suspended' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number: string
          address: string
          city: string
          province: 'haut-katanga' | 'lualaba'
          phone: string
          email: string
          owner_id: string
          subscription_id?: string | null
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          registration_number?: string
          address?: string
          city?: string
          province?: 'haut-katanga' | 'lualaba'
          phone?: string
          email?: string
          owner_id?: string
          subscription_id?: string | null
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      brokers: {
        Row: {
          id: string
          name: string
          registration_number: string
          address: string
          city: string
          province: 'haut-katanga' | 'lualaba'
          phone: string
          email: string
          owner_id: string
          subscription_id: string | null
          status: 'active' | 'suspended' | 'pending'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          registration_number: string
          address: string
          city: string
          province: 'haut-katanga' | 'lualaba'
          phone: string
          email: string
          owner_id: string
          subscription_id?: string | null
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          registration_number?: string
          address?: string
          city?: string
          province?: 'haut-katanga' | 'lualaba'
          phone?: string
          email?: string
          owner_id?: string
          subscription_id?: string | null
          status?: 'active' | 'suspended' | 'pending'
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan: 'standard' | 'enhanced' | 'pro' | 'select' | 'office'
          price: number
          status: 'active' | 'expired' | 'cancelled'
          start_date: string
          end_date: string
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan: 'standard' | 'enhanced' | 'pro' | 'select' | 'office'
          price: number
          status?: 'active' | 'expired' | 'cancelled'
          start_date: string
          end_date: string
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan?: 'standard' | 'enhanced' | 'pro' | 'select' | 'office'
          price?: number
          status?: 'active' | 'expired' | 'cancelled'
          start_date?: string
          end_date?: string
          auto_renew?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      trucks: {
        Row: {
          id: string
          company_id: string
          type: string
          capacity: number
          current_location: Json
          available_date: string
          destination: Json | null
          price: number
          price_per_km: number
          status: 'available' | 'booked' | 'in-transit' | 'maintenance'
          features: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          type: string
          capacity: number
          current_location: Json
          available_date: string
          destination?: Json | null
          price: number
          price_per_km: number
          status?: 'available' | 'booked' | 'in-transit' | 'maintenance'
          features?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          type?: string
          capacity?: number
          current_location?: Json
          available_date?: string
          destination?: Json | null
          price?: number
          price_per_km?: number
          status?: 'available' | 'booked' | 'in-transit' | 'maintenance'
          features?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      loads: {
        Row: {
          id: string
          broker_id: string
          origin: Json
          destination: Json
          distance: number
          duration: string
          trailer_type: string
          weight: number
          price: number
          price_per_km: number
          pickup_date: string
          delivery_date: string
          cargo_type: string | null
          status: 'available' | 'booked' | 'in-transit' | 'completed'
          /** Étape détaillée du workflow (dispatché, en_route_pickup, at_pickup, …). Optionnel si migration non appliquée. */
          workflow_step?: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          broker_id: string
          origin: Json
          destination: Json
          distance: number
          duration: string
          trailer_type: string
          weight: number
          price: number
          price_per_km: number
          pickup_date: string
          delivery_date: string
          cargo_type?: string | null
          status?: 'available' | 'booked' | 'in-transit' | 'completed'
          workflow_step?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          broker_id?: string
          origin?: Json
          destination?: Json
          distance?: number
          duration?: string
          trailer_type?: string
          weight?: number
          price?: number
          price_per_km?: number
          pickup_date?: string
          delivery_date?: string
          cargo_type?: string | null
          status?: 'available' | 'booked' | 'in-transit' | 'completed'
          workflow_step?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      bols: {
        Row: {
          id: string
          load_id: string
          truck_id: string
          shipper: Json
          carrier: Json
          origin: Json
          destination: Json
          items: Json
          total_weight: number
          total_value: number
          pickup_date: string
          delivery_date: string
          signature: string | null
          status: 'draft' | 'signed' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          load_id: string
          truck_id: string
          shipper: Json
          carrier: Json
          origin: Json
          destination: Json
          items: Json
          total_weight: number
          total_value: number
          pickup_date: string
          delivery_date: string
          signature?: string | null
          status?: 'draft' | 'signed' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          load_id?: string
          truck_id?: string
          shipper?: Json
          carrier?: Json
          origin?: Json
          destination?: Json
          items?: Json
          total_weight?: number
          total_value?: number
          pickup_date?: string
          delivery_date?: string
          signature?: string | null
          status?: 'draft' | 'signed' | 'completed'
          created_at?: string
          updated_at?: string
        }
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
  }
}




