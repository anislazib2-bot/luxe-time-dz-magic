export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          id: string
          name_ar: string
          name_en: string
          name_fr: string
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name_ar: string
          name_en: string
          name_fr: string
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name_ar?: string
          name_en?: string
          name_fr?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          name_snapshot: string
          order_id: string
          price_snapshot: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          name_snapshot: string
          order_id: string
          price_snapshot: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          name_snapshot?: string
          order_id?: string
          price_snapshot?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          commune: string
          created_at: string
          customer_user_id: string | null
          delivery_dzd: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          full_name: string
          id: string
          notes: string | null
          order_number: string
          phone: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_dzd: number
          total_dzd: number
          updated_at: string
          wilaya_code: number
        }
        Insert: {
          address?: string | null
          commune: string
          created_at?: string
          customer_user_id?: string | null
          delivery_dzd: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          full_name: string
          id?: string
          notes?: string | null
          order_number: string
          phone: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_dzd: number
          total_dzd: number
          updated_at?: string
          wilaya_code: number
        }
        Update: {
          address?: string | null
          commune?: string
          created_at?: string
          customer_user_id?: string | null
          delivery_dzd?: number
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          full_name?: string
          id?: string
          notes?: string | null
          order_number?: string
          phone?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_dzd?: number
          total_dzd?: number
          updated_at?: string
          wilaya_code?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_wilaya_code_fkey"
            columns: ["wilaya_code"]
            isOneToOne: false
            referencedRelation: "wilayas"
            referencedColumns: ["code"]
          },
        ]
      }
      products: {
        Row: {
          brand: string
          category_id: string | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          description_fr: string | null
          discount_price_dzd: number | null
          featured: boolean
          gender: Database["public"]["Enums"]["product_gender"]
          id: string
          images: Json
          is_active: boolean
          is_limited: boolean
          is_new: boolean
          name_ar: string
          name_en: string
          name_fr: string
          price_dzd: number
          slug: string
          specs: Json
          stock: number
          updated_at: string
        }
        Insert: {
          brand: string
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          discount_price_dzd?: number | null
          featured?: boolean
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          images?: Json
          is_active?: boolean
          is_limited?: boolean
          is_new?: boolean
          name_ar: string
          name_en: string
          name_fr: string
          price_dzd: number
          slug: string
          specs?: Json
          stock?: number
          updated_at?: string
        }
        Update: {
          brand?: string
          category_id?: string | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          description_fr?: string | null
          discount_price_dzd?: number | null
          featured?: boolean
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          images?: Json
          is_active?: boolean
          is_limited?: boolean
          is_new?: boolean
          name_ar?: string
          name_en?: string
          name_fr?: string
          price_dzd?: number
          slug?: string
          specs?: Json
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          address: string | null
          email: string | null
          facebook_url: string | null
          free_shipping_threshold_dzd: number | null
          id: number
          instagram_url: string | null
          logo_url: string | null
          phone: string | null
          store_name: string
          topbar_text: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          email?: string | null
          facebook_url?: string | null
          free_shipping_threshold_dzd?: number | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          phone?: string | null
          store_name?: string
          topbar_text?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          email?: string | null
          facebook_url?: string | null
          free_shipping_threshold_dzd?: number | null
          id?: number
          instagram_url?: string | null
          logo_url?: string | null
          phone?: string | null
          store_name?: string
          topbar_text?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wilayas: {
        Row: {
          code: number
          delivery_home_dzd: number
          delivery_office_dzd: number
          name_ar: string
          name_fr: string
        }
        Insert: {
          code: number
          delivery_home_dzd?: number
          delivery_office_dzd?: number
          name_ar: string
          name_fr: string
        }
        Update: {
          code?: number
          delivery_home_dzd?: number
          delivery_office_dzd?: number
          name_ar?: string
          name_fr?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_first_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      lookup_order: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          address: string
          commune: string
          created_at: string
          delivery_dzd: number
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          full_name: string
          order_number: string
          phone: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal_dzd: number
          total_dzd: number
          wilaya_code: number
        }[]
      }
      lookup_order_items: {
        Args: { _order_number: string; _phone: string }
        Returns: {
          image_url: string
          name_snapshot: string
          price_snapshot: number
          product_id: string
          quantity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "customer"
      delivery_type: "home" | "office"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipping"
        | "delivered"
        | "cancelled"
      product_gender: "men" | "women" | "unisex"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      delivery_type: ["home", "office"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipping",
        "delivered",
        "cancelled",
      ],
      product_gender: ["men", "women", "unisex"],
    },
  },
} as const
