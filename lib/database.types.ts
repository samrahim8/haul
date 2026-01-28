export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserType = "buyer" | "company";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          user_type: UserType;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          user_type?: UserType;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          user_type?: UserType;
          created_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          company_name: string;
          description: string | null;
          phone: string | null;
          email: string | null;
          website: string | null;
          service_areas: string[];
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name: string;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          service_areas?: string[];
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string;
          description?: string | null;
          phone?: string | null;
          email?: string | null;
          website?: string | null;
          service_areas?: string[];
          logo_url?: string | null;
          created_at?: string;
        };
      };
      sales: {
        Row: {
          id: string;
          company_id: string | null;
          title: string;
          description: string | null;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          photos: string[];
          video_url: string | null;
          is_featured: boolean;
          is_published: boolean;
          seller_name: string | null;
          seller_email: string | null;
          seller_phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id?: string | null;
          title: string;
          description?: string | null;
          address: string;
          city: string;
          state: string;
          zip_code: string;
          start_date: string;
          end_date: string;
          start_time: string;
          end_time: string;
          photos?: string[];
          video_url?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
          seller_name?: string | null;
          seller_email?: string | null;
          seller_phone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          company_id?: string | null;
          title?: string;
          description?: string | null;
          address?: string;
          city?: string;
          state?: string;
          zip_code?: string;
          start_date?: string;
          end_date?: string;
          start_time?: string;
          end_time?: string;
          photos?: string[];
          video_url?: string | null;
          is_featured?: boolean;
          is_published?: boolean;
          seller_name?: string | null;
          seller_email?: string | null;
          seller_phone?: string | null;
          created_at?: string;
        };
      };
      saved_sales: {
        Row: {
          id: string;
          user_id: string;
          sale_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sale_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          sale_id?: string;
          created_at?: string;
        };
      };
    };
    Enums: {
      user_type: UserType;
    };
  };
}

// Helper types for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
export type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export type Company = Database["public"]["Tables"]["companies"]["Row"];
export type CompanyInsert = Database["public"]["Tables"]["companies"]["Insert"];
export type CompanyUpdate = Database["public"]["Tables"]["companies"]["Update"];

export type Sale = Database["public"]["Tables"]["sales"]["Row"];
export type SaleInsert = Database["public"]["Tables"]["sales"]["Insert"];
export type SaleUpdate = Database["public"]["Tables"]["sales"]["Update"];

export type SavedSale = Database["public"]["Tables"]["saved_sales"]["Row"];
export type SavedSaleInsert = Database["public"]["Tables"]["saved_sales"]["Insert"];
export type SavedSaleUpdate = Database["public"]["Tables"]["saved_sales"]["Update"];

// Sale with company info for display
export type SaleWithCompany = Sale & {
  company: Company;
};
