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
    PostgrestVersion: "14.4"
  }
  ead: {
    Tables: {
      announcements: {
        Row: {
          author_id: string
          body: string
          course_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          pinned: boolean | null
          priority: string | null
          published: boolean | null
          starts_at: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          body: string
          course_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean | null
          priority?: string | null
          published?: boolean | null
          starts_at?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          body?: string
          course_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          pinned?: boolean | null
          priority?: string | null
          published?: boolean | null
          starts_at?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: number
          ip_address: string | null
          metadata: Json | null
          resource: string | null
          resource_id: string | null
          tenant_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          resource_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: number
          ip_address?: string | null
          metadata?: Json | null
          resource?: string | null
          resource_id?: string | null
          tenant_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          course_id: string
          course_title: string
          duration_hours: number | null
          enrollment_id: string
          id: string
          issued_at: string | null
          pdf_url: string | null
          profile_id: string
          student_name: string
          tenant_id: string
          tenant_name: string
          verification_code: string | null
        }
        Insert: {
          course_id: string
          course_title: string
          duration_hours?: number | null
          enrollment_id: string
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          profile_id: string
          student_name: string
          tenant_id: string
          tenant_name: string
          verification_code?: string | null
        }
        Update: {
          course_id?: string
          course_title?: string
          duration_hours?: number | null
          enrollment_id?: string
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          profile_id?: string
          student_name?: string
          tenant_id?: string
          tenant_name?: string
          verification_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: true
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          active: boolean | null
          banner_horizontal_url: string | null
          banner_square_url: string | null
          banner_vertical_url: string | null
          category: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          fallback_color: string | null
          id: string
          instructor_bio: string | null
          instructor_name: string | null
          instructor_photo_url: string | null
          level: string | null
          modality: string
          organization_id: string
          published_at: string | null
          sequential_journey: boolean | null
          short_description: string | null
          slug: string
          status: string
          tags: string[] | null
          thumbnail_transparent_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          banner_horizontal_url?: string | null
          banner_square_url?: string | null
          banner_vertical_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          fallback_color?: string | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          instructor_photo_url?: string | null
          level?: string | null
          modality?: string
          organization_id: string
          published_at?: string | null
          sequential_journey?: boolean | null
          short_description?: string | null
          slug: string
          status?: string
          tags?: string[] | null
          thumbnail_transparent_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          banner_horizontal_url?: string | null
          banner_square_url?: string | null
          banner_vertical_url?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          fallback_color?: string | null
          id?: string
          instructor_bio?: string | null
          instructor_name?: string | null
          instructor_photo_url?: string | null
          level?: string | null
          modality?: string
          organization_id?: string
          published_at?: string | null
          sequential_journey?: boolean | null
          short_description?: string | null
          slug?: string
          status?: string
          tags?: string[] | null
          thumbnail_transparent_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      design_assets: {
        Row: {
          card_bg_gradient_css: string | null
          card_bg_pattern_1_url: string | null
          card_bg_pattern_2_url: string | null
          card_bg_pattern_3_url: string | null
          card_overlay_color: string | null
          certificate_bg_url: string | null
          certificate_logo_url: string | null
          certificate_signature_url: string | null
          created_at: string | null
          favicon_url: string | null
          homepage_hero_mobile_url: string | null
          homepage_hero_url: string | null
          id: string
          login_banner_url: string | null
          login_banner_vertical_url: string | null
          logo_dark_url: string | null
          logo_horizontal_url: string | null
          logo_square_url: string | null
          platform_bg_url: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          card_bg_gradient_css?: string | null
          card_bg_pattern_1_url?: string | null
          card_bg_pattern_2_url?: string | null
          card_bg_pattern_3_url?: string | null
          card_overlay_color?: string | null
          certificate_bg_url?: string | null
          certificate_logo_url?: string | null
          certificate_signature_url?: string | null
          created_at?: string | null
          favicon_url?: string | null
          homepage_hero_mobile_url?: string | null
          homepage_hero_url?: string | null
          id?: string
          login_banner_url?: string | null
          login_banner_vertical_url?: string | null
          logo_dark_url?: string | null
          logo_horizontal_url?: string | null
          logo_square_url?: string | null
          platform_bg_url?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          card_bg_gradient_css?: string | null
          card_bg_pattern_1_url?: string | null
          card_bg_pattern_2_url?: string | null
          card_bg_pattern_3_url?: string | null
          card_overlay_color?: string | null
          certificate_bg_url?: string | null
          certificate_logo_url?: string | null
          certificate_signature_url?: string | null
          created_at?: string | null
          favicon_url?: string | null
          homepage_hero_mobile_url?: string | null
          homepage_hero_url?: string | null
          id?: string
          login_banner_url?: string | null
          login_banner_vertical_url?: string | null
          logo_dark_url?: string | null
          logo_horizontal_url?: string | null
          logo_square_url?: string | null
          platform_bg_url?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_assets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      design_presets: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          thumbnail_url: string | null
          tokens_snapshot: Json
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          thumbnail_url?: string | null
          tokens_snapshot: Json
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          thumbnail_url?: string | null
          tokens_snapshot?: Json
        }
        Relationships: []
      }
      design_tokens: {
        Row: {
          color_badge_default_bg: string | null
          color_badge_default_text: string | null
          color_bg_elevated: string | null
          color_bg_overlay: string | null
          color_bg_page: string | null
          color_bg_surface: string | null
          color_border_default: string | null
          color_border_focus: string | null
          color_border_strong: string | null
          color_btn_danger_bg: string | null
          color_btn_danger_hover: string | null
          color_btn_danger_text: string | null
          color_btn_primary_bg: string | null
          color_btn_primary_hover: string | null
          color_btn_primary_text: string | null
          color_btn_secondary_bg: string | null
          color_btn_secondary_hover: string | null
          color_btn_secondary_text: string | null
          color_card_bg: string | null
          color_card_border: string | null
          color_card_shadow: string | null
          color_error: string | null
          color_error_dark: string | null
          color_error_light: string | null
          color_footer_bg: string | null
          color_footer_text: string | null
          color_header_bg: string | null
          color_header_text: string | null
          color_info: string | null
          color_info_dark: string | null
          color_info_light: string | null
          color_input_bg: string | null
          color_input_border: string | null
          color_input_focus_ring: string | null
          color_input_placeholder: string | null
          color_neutral_100: string | null
          color_neutral_200: string | null
          color_neutral_300: string | null
          color_neutral_400: string | null
          color_neutral_50: string | null
          color_neutral_500: string | null
          color_neutral_600: string | null
          color_neutral_700: string | null
          color_neutral_800: string | null
          color_neutral_900: string | null
          color_primary_100: string | null
          color_primary_200: string | null
          color_primary_300: string | null
          color_primary_400: string | null
          color_primary_50: string | null
          color_primary_500: string | null
          color_primary_600: string | null
          color_primary_700: string | null
          color_primary_800: string | null
          color_primary_900: string | null
          color_progress_fill: string | null
          color_progress_track: string | null
          color_secondary_100: string | null
          color_secondary_200: string | null
          color_secondary_300: string | null
          color_secondary_400: string | null
          color_secondary_50: string | null
          color_secondary_500: string | null
          color_secondary_600: string | null
          color_secondary_700: string | null
          color_secondary_800: string | null
          color_secondary_900: string | null
          color_sidebar_active: string | null
          color_sidebar_bg: string | null
          color_sidebar_text: string | null
          color_success: string | null
          color_success_dark: string | null
          color_success_light: string | null
          color_tertiary_100: string | null
          color_tertiary_200: string | null
          color_tertiary_300: string | null
          color_tertiary_400: string | null
          color_tertiary_50: string | null
          color_tertiary_500: string | null
          color_tertiary_600: string | null
          color_tertiary_700: string | null
          color_tertiary_800: string | null
          color_tertiary_900: string | null
          color_text_disabled: string | null
          color_text_inverse: string | null
          color_text_link: string | null
          color_text_link_hover: string | null
          color_text_primary: string | null
          color_text_secondary: string | null
          color_warning: string | null
          color_warning_dark: string | null
          color_warning_light: string | null
          created_at: string | null
          font_family_body: string | null
          font_family_heading: string | null
          font_size_2xl: string | null
          font_size_3xl: string | null
          font_size_base: string | null
          font_size_lg: string | null
          font_size_sm: string | null
          font_size_xl: string | null
          font_size_xs: string | null
          id: string
          mode: string
          radius_full: string | null
          radius_lg: string | null
          radius_md: string | null
          radius_sm: string | null
          radius_xl: string | null
          shadow_lg: string | null
          shadow_md: string | null
          shadow_sm: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color_badge_default_bg?: string | null
          color_badge_default_text?: string | null
          color_bg_elevated?: string | null
          color_bg_overlay?: string | null
          color_bg_page?: string | null
          color_bg_surface?: string | null
          color_border_default?: string | null
          color_border_focus?: string | null
          color_border_strong?: string | null
          color_btn_danger_bg?: string | null
          color_btn_danger_hover?: string | null
          color_btn_danger_text?: string | null
          color_btn_primary_bg?: string | null
          color_btn_primary_hover?: string | null
          color_btn_primary_text?: string | null
          color_btn_secondary_bg?: string | null
          color_btn_secondary_hover?: string | null
          color_btn_secondary_text?: string | null
          color_card_bg?: string | null
          color_card_border?: string | null
          color_card_shadow?: string | null
          color_error?: string | null
          color_error_dark?: string | null
          color_error_light?: string | null
          color_footer_bg?: string | null
          color_footer_text?: string | null
          color_header_bg?: string | null
          color_header_text?: string | null
          color_info?: string | null
          color_info_dark?: string | null
          color_info_light?: string | null
          color_input_bg?: string | null
          color_input_border?: string | null
          color_input_focus_ring?: string | null
          color_input_placeholder?: string | null
          color_neutral_100?: string | null
          color_neutral_200?: string | null
          color_neutral_300?: string | null
          color_neutral_400?: string | null
          color_neutral_50?: string | null
          color_neutral_500?: string | null
          color_neutral_600?: string | null
          color_neutral_700?: string | null
          color_neutral_800?: string | null
          color_neutral_900?: string | null
          color_primary_100?: string | null
          color_primary_200?: string | null
          color_primary_300?: string | null
          color_primary_400?: string | null
          color_primary_50?: string | null
          color_primary_500?: string | null
          color_primary_600?: string | null
          color_primary_700?: string | null
          color_primary_800?: string | null
          color_primary_900?: string | null
          color_progress_fill?: string | null
          color_progress_track?: string | null
          color_secondary_100?: string | null
          color_secondary_200?: string | null
          color_secondary_300?: string | null
          color_secondary_400?: string | null
          color_secondary_50?: string | null
          color_secondary_500?: string | null
          color_secondary_600?: string | null
          color_secondary_700?: string | null
          color_secondary_800?: string | null
          color_secondary_900?: string | null
          color_sidebar_active?: string | null
          color_sidebar_bg?: string | null
          color_sidebar_text?: string | null
          color_success?: string | null
          color_success_dark?: string | null
          color_success_light?: string | null
          color_tertiary_100?: string | null
          color_tertiary_200?: string | null
          color_tertiary_300?: string | null
          color_tertiary_400?: string | null
          color_tertiary_50?: string | null
          color_tertiary_500?: string | null
          color_tertiary_600?: string | null
          color_tertiary_700?: string | null
          color_tertiary_800?: string | null
          color_tertiary_900?: string | null
          color_text_disabled?: string | null
          color_text_inverse?: string | null
          color_text_link?: string | null
          color_text_link_hover?: string | null
          color_text_primary?: string | null
          color_text_secondary?: string | null
          color_warning?: string | null
          color_warning_dark?: string | null
          color_warning_light?: string | null
          created_at?: string | null
          font_family_body?: string | null
          font_family_heading?: string | null
          font_size_2xl?: string | null
          font_size_3xl?: string | null
          font_size_base?: string | null
          font_size_lg?: string | null
          font_size_sm?: string | null
          font_size_xl?: string | null
          font_size_xs?: string | null
          id?: string
          mode?: string
          radius_full?: string | null
          radius_lg?: string | null
          radius_md?: string | null
          radius_sm?: string | null
          radius_xl?: string | null
          shadow_lg?: string | null
          shadow_md?: string | null
          shadow_sm?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color_badge_default_bg?: string | null
          color_badge_default_text?: string | null
          color_bg_elevated?: string | null
          color_bg_overlay?: string | null
          color_bg_page?: string | null
          color_bg_surface?: string | null
          color_border_default?: string | null
          color_border_focus?: string | null
          color_border_strong?: string | null
          color_btn_danger_bg?: string | null
          color_btn_danger_hover?: string | null
          color_btn_danger_text?: string | null
          color_btn_primary_bg?: string | null
          color_btn_primary_hover?: string | null
          color_btn_primary_text?: string | null
          color_btn_secondary_bg?: string | null
          color_btn_secondary_hover?: string | null
          color_btn_secondary_text?: string | null
          color_card_bg?: string | null
          color_card_border?: string | null
          color_card_shadow?: string | null
          color_error?: string | null
          color_error_dark?: string | null
          color_error_light?: string | null
          color_footer_bg?: string | null
          color_footer_text?: string | null
          color_header_bg?: string | null
          color_header_text?: string | null
          color_info?: string | null
          color_info_dark?: string | null
          color_info_light?: string | null
          color_input_bg?: string | null
          color_input_border?: string | null
          color_input_focus_ring?: string | null
          color_input_placeholder?: string | null
          color_neutral_100?: string | null
          color_neutral_200?: string | null
          color_neutral_300?: string | null
          color_neutral_400?: string | null
          color_neutral_50?: string | null
          color_neutral_500?: string | null
          color_neutral_600?: string | null
          color_neutral_700?: string | null
          color_neutral_800?: string | null
          color_neutral_900?: string | null
          color_primary_100?: string | null
          color_primary_200?: string | null
          color_primary_300?: string | null
          color_primary_400?: string | null
          color_primary_50?: string | null
          color_primary_500?: string | null
          color_primary_600?: string | null
          color_primary_700?: string | null
          color_primary_800?: string | null
          color_primary_900?: string | null
          color_progress_fill?: string | null
          color_progress_track?: string | null
          color_secondary_100?: string | null
          color_secondary_200?: string | null
          color_secondary_300?: string | null
          color_secondary_400?: string | null
          color_secondary_50?: string | null
          color_secondary_500?: string | null
          color_secondary_600?: string | null
          color_secondary_700?: string | null
          color_secondary_800?: string | null
          color_secondary_900?: string | null
          color_sidebar_active?: string | null
          color_sidebar_bg?: string | null
          color_sidebar_text?: string | null
          color_success?: string | null
          color_success_dark?: string | null
          color_success_light?: string | null
          color_tertiary_100?: string | null
          color_tertiary_200?: string | null
          color_tertiary_300?: string | null
          color_tertiary_400?: string | null
          color_tertiary_50?: string | null
          color_tertiary_500?: string | null
          color_tertiary_600?: string | null
          color_tertiary_700?: string | null
          color_tertiary_800?: string | null
          color_tertiary_900?: string | null
          color_text_disabled?: string | null
          color_text_inverse?: string | null
          color_text_link?: string | null
          color_text_link_hover?: string | null
          color_text_primary?: string | null
          color_text_secondary?: string | null
          color_warning?: string | null
          color_warning_dark?: string | null
          color_warning_light?: string | null
          created_at?: string | null
          font_family_body?: string | null
          font_family_heading?: string | null
          font_size_2xl?: string | null
          font_size_3xl?: string | null
          font_size_base?: string | null
          font_size_lg?: string | null
          font_size_sm?: string | null
          font_size_xl?: string | null
          font_size_xs?: string | null
          id?: string
          mode?: string
          radius_full?: string | null
          radius_lg?: string | null
          radius_md?: string | null
          radius_sm?: string | null
          radius_xl?: string | null
          shadow_lg?: string | null
          shadow_md?: string | null
          shadow_sm?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "design_tokens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          completed_at: string | null
          enrolled_at: string | null
          id: string
          last_accessed_at: string | null
          profile_id: string
          progress: number | null
          status: string | null
          tenant_course_id: string
        }
        Insert: {
          completed_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          profile_id: string
          progress?: number | null
          status?: string | null
          tenant_course_id: string
        }
        Update: {
          completed_at?: string | null
          enrolled_at?: string | null
          id?: string
          last_accessed_at?: string | null
          profile_id?: string
          progress?: number | null
          status?: string | null
          tenant_course_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_tenant_course_id_fkey"
            columns: ["tenant_course_id"]
            isOneToOne: false
            referencedRelation: "tenant_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          profile_id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          profile_id: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          approved: boolean | null
          content: string
          created_at: string | null
          id: string
          post_id: string
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          approved: boolean | null
          content: string
          course_id: string
          created_at: string | null
          id: string
          lesson_id: string | null
          pinned: boolean | null
          post_type: string | null
          profile_id: string
          tenant_id: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          approved?: boolean | null
          content: string
          course_id: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pinned?: boolean | null
          post_type?: string | null
          profile_id: string
          tenant_id: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          approved?: boolean | null
          content?: string
          course_id?: string
          created_at?: string | null
          id?: string
          lesson_id?: string | null
          pinned?: boolean | null
          post_type?: string | null
          profile_id?: string
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          profile_id: string
          target_date: string | null
          title: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          profile_id: string
          target_date?: string | null
          title: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          profile_id?: string
          target_date?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string
          full_name: string | null
          id: string
          invited_by: string | null
          role: string | null
          status: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: string | null
          status?: string | null
          tenant_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          role?: string | null
          status?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          enrollment_id: string
          id: string
          last_watched_at: string | null
          lesson_id: string
          percentage: number | null
          total_seconds: number | null
          watched_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          enrollment_id: string
          id?: string
          last_watched_at?: string | null
          lesson_id: string
          percentage?: number | null
          total_seconds?: number | null
          watched_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          enrollment_id?: string
          id?: string
          last_watched_at?: string | null
          lesson_id?: string
          percentage?: number | null
          total_seconds?: number | null
          watched_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reactions: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          profile_id: string
          reaction_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          profile_id: string
          reaction_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          profile_id?: string
          reaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reactions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_reactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          active: boolean | null
          attachment_url: string | null
          content_body: string | null
          content_type: string
          created_at: string | null
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          is_free_preview: boolean | null
          is_required: boolean | null
          module_id: string
          panda_folder_id: string | null
          panda_video_id: string | null
          panda_video_url: string | null
          position: number
          slug: string
          supplementary_materials: Json | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          video_duration_sec: number | null
          video_status: string | null
        }
        Insert: {
          active?: boolean | null
          attachment_url?: string | null
          content_body?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          is_required?: boolean | null
          module_id: string
          panda_folder_id?: string | null
          panda_video_id?: string | null
          panda_video_url?: string | null
          position?: number
          slug: string
          supplementary_materials?: Json | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          video_duration_sec?: number | null
          video_status?: string | null
        }
        Update: {
          active?: boolean | null
          attachment_url?: string | null
          content_body?: string | null
          content_type?: string
          created_at?: string | null
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          is_required?: boolean | null
          module_id?: string
          panda_folder_id?: string | null
          panda_video_id?: string | null
          panda_video_url?: string | null
          position?: number
          slug?: string
          supplementary_materials?: Json | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          video_duration_sec?: number | null
          video_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          tenant_id: string
          token: string
          used: boolean | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          tenant_id: string
          token?: string
          used?: boolean | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          tenant_id?: string
          token?: string
          used?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magic_links_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "magic_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          active: boolean | null
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          position: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          position?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          link: string | null
          profile_id: string
          read: boolean | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          profile_id: string
          read?: boolean | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          profile_id?: string
          read?: boolean | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_admins: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          organization_id: string
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_admins_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          active: boolean | null
          created_at: string | null
          email: string
          id: string
          logo_url: string | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          cpf: string | null
          created_at: string | null
          department: string | null
          full_name: string
          id: string
          job_title: string | null
          last_login_at: string | null
          phone: string | null
          role: string
          tenant_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          department?: string | null
          full_name: string
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          phone?: string | null
          role?: string
          tenant_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          cpf?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          last_login_at?: string | null
          phone?: string | null
          role?: string
          tenant_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          scheduled_start: string
          scheduled_end: string
          actual_start: string | null
          actual_end: string | null
          status: string
          mux_live_stream_id: string | null
          mux_stream_key: string | null
          mux_playback_id: string | null
          mux_asset_id: string | null
          mux_recording_playback_id: string | null
          recording_available: boolean | null
          recording_duration_sec: number | null
          max_viewers: number | null
          created_at: string | null
          recording_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          scheduled_start: string
          scheduled_end: string
          actual_start?: string | null
          actual_end?: string | null
          status?: string
          mux_live_stream_id?: string | null
          mux_stream_key?: string | null
          mux_playback_id?: string | null
          mux_asset_id?: string | null
          mux_recording_playback_id?: string | null
          recording_available?: boolean | null
          recording_duration_sec?: number | null
          recording_expires_at?: string | null
          max_viewers?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          scheduled_start?: string
          scheduled_end?: string
          actual_start?: string | null
          actual_end?: string | null
          status?: string
          mux_live_stream_id?: string | null
          mux_stream_key?: string | null
          mux_playback_id?: string | null
          mux_asset_id?: string | null
          mux_recording_playback_id?: string | null
          recording_available?: boolean | null
          recording_duration_sec?: number | null
          recording_expires_at?: string | null
          max_viewers?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_enrollments: {
        Row: {
          id: string
          live_session_id: string
          profile_id: string
          enrolled_at: string | null
        }
        Insert: {
          id?: string
          live_session_id: string
          profile_id: string
          enrolled_at?: string | null
        }
        Update: {
          id?: string
          live_session_id?: string
          profile_id?: string
          enrolled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_enrollments_live_session_id_fkey"
            columns: ["live_session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_enrollments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tracks: {
        Row: {
          id: string
          organization_id: string
          title: string
          slug: string
          description: string | null
          icon_url: string | null
          position: number | null
          active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          title: string
          slug: string
          description?: string | null
          icon_url?: string | null
          position?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          title?: string
          slug?: string
          description?: string | null
          icon_url?: string | null
          position?: number | null
          active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tracks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      track_courses: {
        Row: {
          id: string
          track_id: string
          course_id: string
          position: number | null
        }
        Insert: {
          id?: string
          track_id: string
          course_id: string
          position?: number | null
        }
        Update: {
          id?: string
          track_id?: string
          course_id?: string
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "track_courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "track_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_courses: {
        Row: {
          active: boolean | null
          contracted_at: string | null
          course_id: string
          expires_at: string | null
          id: string
          max_enrollments: number | null
          tenant_id: string
        }
        Insert: {
          active?: boolean | null
          contracted_at?: string | null
          course_id: string
          expires_at?: string | null
          id?: string
          max_enrollments?: number | null
          tenant_id: string
        }
        Update: {
          active?: boolean | null
          contracted_at?: string | null
          course_id?: string
          expires_at?: string | null
          id?: string
          max_enrollments?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_courses_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          active: boolean | null
          allow_self_registration: boolean | null
          completion_threshold: number | null
          contract_end: string | null
          contract_start: string | null
          created_at: string | null
          custom_domain: string | null
          id: string
          max_students: number | null
          name: string
          organization_id: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          allow_self_registration?: boolean | null
          completion_threshold?: number | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          max_students?: number | null
          name: string
          organization_id: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          allow_self_registration?: boolean | null
          completion_threshold?: number | null
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string | null
          custom_domain?: string | null
          id?: string
          max_students?: number | null
          name?: string
          organization_id?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      student_rankings: {
        Row: {
          profile_id: string
          tenant_id: string
          full_name: string | null
          avatar_url: string | null
          department: string | null
          courses_completed: number
          courses_in_progress: number
          total_enrollments: number
        }
      }
    }
    Functions: {
      has_tenant_role: {
        Args: { required_role: string; t_id: string }
        Returns: boolean
      }
      is_org_admin: { Args: { org_id: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      user_tenant_ids: { Args: never; Returns: string[] }
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "ead">]

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
  ead: {
    Enums: {},
  },
} as const
