export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      banners: {
        Row: {
          active: boolean | null
          button_link: string | null
          button_text: string | null
          created_at: string
          desktop_image_url: string | null
          id: string
          image_fit: string | null
          image_position: string | null
          mobile_image_url: string | null
          name: string
          position: number | null
          subtitle: string | null
          title: string | null
          type: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          active?: boolean | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          desktop_image_url?: string | null
          id?: string
          image_fit?: string | null
          image_position?: string | null
          mobile_image_url?: string | null
          name: string
          position?: number | null
          subtitle?: string | null
          title?: string | null
          type: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          active?: boolean | null
          button_link?: string | null
          button_text?: string | null
          created_at?: string
          desktop_image_url?: string | null
          id?: string
          image_fit?: string | null
          image_position?: string | null
          mobile_image_url?: string | null
          name?: string
          position?: number | null
          subtitle?: string | null
          title?: string | null
          type?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      cart_reservations: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          product_id: string
          quantity: number
          session_id: string
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          product_id: string
          quantity: number
          session_id: string
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          product_id?: string
          quantity?: number
          session_id?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_reservations_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          id: string
          name: string
          pagarme_customer_id: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          pagarme_customer_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          pagarme_customer_id?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      inventory_alerts: {
        Row: {
          alert_type: string
          created_at: string
          current_stock: number
          id: string
          product_id: string
          resolved_at: string | null
          status: string
          threshold_value: number | null
          updated_at: string
          variation_id: string | null
        }
        Insert: {
          alert_type: string
          created_at?: string
          current_stock: number
          id?: string
          product_id: string
          resolved_at?: string | null
          status?: string
          threshold_value?: number | null
          updated_at?: string
          variation_id?: string | null
        }
        Update: {
          alert_type?: string
          created_at?: string
          current_stock?: number
          id?: string
          product_id?: string
          resolved_at?: string | null
          status?: string
          threshold_value?: number | null
          updated_at?: string
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_alerts_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          id: string
          is_category: boolean
          link: string | null
          name: string
          position: number
          tag_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          is_category?: boolean
          link?: string | null
          name: string
          position?: number
          tag_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          id?: string
          is_category?: boolean
          link?: string | null
          name?: string
          position?: number
          tag_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_items_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          id: string
          items: Json
          notes: string | null
          payment_method: string | null
          payment_status: string
          shipping_address: Json
          shipping_cost: number
          status: string
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          id?: string
          items: Json
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address: Json
          shipping_cost?: number
          status?: string
          subtotal: number
          total: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          id?: string
          items?: Json
          notes?: string | null
          payment_method?: string | null
          payment_status?: string
          shipping_address?: Json
          shipping_cost?: number
          status?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          boleto_barcode: string | null
          boleto_url: string | null
          card_brand: string | null
          card_last_digits: string | null
          created_at: string
          customer_id: string | null
          id: string
          installments: number | null
          order_id: string | null
          pagarme_transaction_id: string | null
          paid_at: string | null
          payment_method: string
          pix_qr_code: string | null
          pix_qr_code_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          card_brand?: string | null
          card_last_digits?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          installments?: number | null
          order_id?: string | null
          pagarme_transaction_id?: string | null
          paid_at?: string | null
          payment_method: string
          pix_qr_code?: string | null
          pix_qr_code_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          card_brand?: string | null
          card_last_digits?: string | null
          created_at?: string
          customer_id?: string | null
          id?: string
          installments?: number | null
          order_id?: string | null
          pagarme_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string
          pix_qr_code?: string | null
          pix_qr_code_url?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_values: Json
          created_at: string
          display_order: number
          id: string
          product_id: string
          updated_at: string
        }
        Insert: {
          attribute_name: string
          attribute_values: Json
          created_at?: string
          display_order?: number
          id?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          attribute_name?: string
          attribute_values?: Json
          created_at?: string
          display_order?: number
          id?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_details: {
        Row: {
          created_at: string
          id: string
          product_id: string
          template_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          template_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_details_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_details_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "product_details_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      product_details_templates: {
        Row: {
          active: boolean | null
          content: Json
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          content: Json
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          content?: Json
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_tags: {
        Row: {
          created_at: string
          id: string
          product_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          tag_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_tags_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          attributes: Json
          created_at: string
          id: string
          images: string[] | null
          low_stock_threshold: number | null
          price_adjustment: number | null
          product_id: string
          reorder_point: number | null
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          attributes: Json
          created_at?: string
          id?: string
          images?: string[] | null
          low_stock_threshold?: number | null
          price_adjustment?: number | null
          product_id: string
          reorder_point?: number | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          attributes?: Json
          created_at?: string
          id?: string
          images?: string[] | null
          low_stock_threshold?: number | null
          price_adjustment?: number | null
          product_id?: string
          reorder_point?: number | null
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variations: {
        Row: {
          active: boolean | null
          created_at: string
          id: string
          low_stock_threshold: number | null
          price_adjustment: number | null
          product_id: string
          reorder_point: number | null
          sku: string | null
          stock_quantity: number | null
          updated_at: string
          variation_type: string
          variation_value: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          price_adjustment?: number | null
          product_id: string
          reorder_point?: number | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          variation_type: string
          variation_value: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          price_adjustment?: number | null
          product_id?: string
          reorder_point?: number | null
          sku?: string | null
          stock_quantity?: number | null
          updated_at?: string
          variation_type?: string
          variation_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          auto_reorder: boolean | null
          category_id: string | null
          created_at: string
          description: string | null
          featured: boolean | null
          height_cm: number | null
          id: string
          images: string[] | null
          length_cm: number | null
          low_stock_threshold: number | null
          name: string
          price: number
          reorder_point: number | null
          sale_price: number | null
          sku: string | null
          slug: string
          stock_quantity: number | null
          tags: string[] | null
          updated_at: string
          weight_grams: number | null
          width_cm: number | null
        }
        Insert: {
          active?: boolean | null
          auto_reorder?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          height_cm?: number | null
          id?: string
          images?: string[] | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          name: string
          price: number
          reorder_point?: number | null
          sale_price?: number | null
          sku?: string | null
          slug: string
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
        }
        Update: {
          active?: boolean | null
          auto_reorder?: boolean | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          height_cm?: number | null
          id?: string
          images?: string[] | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          name?: string
          price?: number
          reorder_point?: number | null
          sale_price?: number | null
          sku?: string | null
          slug?: string
          stock_quantity?: number | null
          tags?: string[] | null
          updated_at?: string
          weight_grams?: number | null
          width_cm?: number | null
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
      settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          new_stock: number
          notes: string | null
          order_id: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          variation_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          new_stock: number
          notes?: string | null
          order_id?: string | null
          previous_stock: number
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          variation_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          new_stock?: number
          notes?: string | null
          order_id?: string | null
          previous_stock?: number
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          variation_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_variation_id_fkey"
            columns: ["variation_id"]
            isOneToOne: false
            referencedRelation: "product_variations"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_inventory_alerts: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_expired_reservations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_variant_sku: {
        Args: { p_product_id: string; p_attributes: Json }
        Returns: string
      }
      get_available_attribute_values: {
        Args: { p_product_id: string; p_selected_attributes?: Json }
        Returns: {
          attribute_name: string
          available_values: Json
          has_stock: boolean
        }[]
      }
      has_any_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      make_user_admin: {
        Args: { user_email: string }
        Returns: undefined
      }
      record_stock_movement: {
        Args: {
          p_product_id: string
          p_movement_type: string
          p_quantity: number
          p_variation_id?: string
          p_reason?: string
          p_order_id?: string
          p_reference_id?: string
          p_notes?: string
          p_created_by?: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
