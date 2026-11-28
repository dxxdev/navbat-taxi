
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bookings": {
                  Row: {
                    "cancel_reason": string | null,"closed_at": string | null,"created_at": string,"expires_at": string,"fare_per_seat": number,"id": string,"idempotency_key": string,"passenger_id": string,"queue_entry_id": string,"seated_at": string | null,"seats": number,"status": string,"wait_minutes": number
                  }
                  ComputedFields: never
                  Insert: {
                    "cancel_reason"?: string | null,"closed_at"?: string | null,"created_at"?: string,"expires_at": string,"fare_per_seat": number,"id"?: string,"idempotency_key": string,"passenger_id": string,"queue_entry_id": string,"seated_at"?: string | null,"seats": number,"status"?: string,"wait_minutes": number
                  }
                  Update: {
                    "cancel_reason"?: string | null,"closed_at"?: string | null,"created_at"?: string,"expires_at"?: string,"fare_per_seat"?: number,"id"?: string,"idempotency_key"?: string,"passenger_id"?: string,"queue_entry_id"?: string,"seated_at"?: string | null,"seats"?: number,"status"?: string,"wait_minutes"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "bookings_passenger_id_fkey"
      columns: ["passenger_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "bookings_queue_entry_id_fkey"
      columns: ["queue_entry_id"]
isOneToOne: false
      referencedRelation: "queue_entries"
      referencedColumns: ["id"]
    }
                  ]
                },"cities": {
                  Row: {
                    "created_at": string,"id": string,"is_active": boolean,"name_uz": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name_uz": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"is_active"?: boolean,"name_uz"?: string
                  }
                  Relationships: [
                    
                  ]
                },"drivers": {
                  Row: {
                    "created_at": string,"license_number": string,"license_photo_path": string | null,"status": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"license_number": string,"license_photo_path"?: string | null,"status"?: string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"license_number"?: string,"license_photo_path"?: string | null,"status"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "drivers_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"notifications": {
                  Row: {
                    "attempts": number,"created_at": string,"id": string,"payload": NonNullable<Json>,"sent_at": string | null,"status": string,"type": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "attempts"?: number,"created_at"?: string,"id"?: string,"payload"?: NonNullable<Json>,"sent_at"?: string | null,"status"?: string,"type": string,"user_id": string
                  }
                  Update: {
                    "attempts"?: number,"created_at"?: string,"id"?: string,"payload"?: NonNullable<Json>,"sent_at"?: string | null,"status"?: string,"type"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "notifications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "created_at": string,"full_name": string | null,"id": string,"language": string,"phone": string | null,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name"?: string | null,"id": string,"language"?: string,"phone"?: string | null,"role"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string | null,"id"?: string,"language"?: string,"phone"?: string | null,"role"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"queue_entries": {
                  Row: {
                    "created_at": string,"departed_at": string | null,"driver_id": string,"fare": number,"id": string,"joined_at": string,"route_id": string,"seats_occupied": number,"seats_total": number,"status": string,"vehicle_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"departed_at"?: string | null,"driver_id": string,"fare": number,"id"?: string,"joined_at"?: string,"route_id": string,"seats_occupied"?: number,"seats_total": number,"status"?: string,"vehicle_id": string
                  }
                  Update: {
                    "created_at"?: string,"departed_at"?: string | null,"driver_id"?: string,"fare"?: number,"id"?: string,"joined_at"?: string,"route_id"?: string,"seats_occupied"?: number,"seats_total"?: number,"status"?: string,"vehicle_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "queue_entries_driver_id_fkey"
      columns: ["driver_id"]
isOneToOne: false
      referencedRelation: "drivers"
      referencedColumns: ["user_id"]
    },{
      foreignKeyName: "queue_entries_route_id_fkey"
      columns: ["route_id"]
isOneToOne: false
      referencedRelation: "routes"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "queue_entries_vehicle_id_fkey"
      columns: ["vehicle_id"]
isOneToOne: false
      referencedRelation: "vehicles"
      referencedColumns: ["id"]
    }
                  ]
                },"routes": {
                  Row: {
                    "created_at": string,"destination_name": string,"duration_min": number,"fare_max": number,"fare_min": number,"id": string,"is_active": boolean,"station_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"destination_name": string,"duration_min": number,"fare_max": number,"fare_min": number,"id"?: string,"is_active"?: boolean,"station_id": string
                  }
                  Update: {
                    "created_at"?: string,"destination_name"?: string,"duration_min"?: number,"fare_max"?: number,"fare_min"?: number,"id"?: string,"is_active"?: boolean,"station_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "routes_station_id_fkey"
      columns: ["station_id"]
isOneToOne: false
      referencedRelation: "stations"
      referencedColumns: ["id"]
    }
                  ]
                },"settings": {
                  Row: {
                    "key": string,"updated_at": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"stations": {
                  Row: {
                    "address": string | null,"city_id": string,"created_at": string,"id": string,"is_active": boolean,"location": unknown,"name": string,"radius_m": number
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"city_id": string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"location": unknown,"name": string,"radius_m"?: number
                  }
                  Update: {
                    "address"?: string | null,"city_id"?: string,"created_at"?: string,"id"?: string,"is_active"?: boolean,"location"?: unknown,"name"?: string,"radius_m"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "stations_city_id_fkey"
      columns: ["city_id"]
isOneToOne: false
      referencedRelation: "cities"
      referencedColumns: ["id"]
    }
                  ]
                },"vehicles": {
                  Row: {
                    "color": string,"created_at": string,"driver_id": string,"id": string,"is_active": boolean,"model": string,"photo_path": string | null,"plate_number": string,"seats_total": number
                  }
                  ComputedFields: never
                  Insert: {
                    "color": string,"created_at"?: string,"driver_id": string,"id"?: string,"is_active"?: boolean,"model": string,"photo_path"?: string | null,"plate_number": string,"seats_total": number
                  }
                  Update: {
                    "color"?: string,"created_at"?: string,"driver_id"?: string,"id"?: string,"is_active"?: boolean,"model"?: string,"photo_path"?: string | null,"plate_number"?: string,"seats_total"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "vehicles_driver_id_fkey"
      columns: ["driver_id"]
isOneToOne: false
      referencedRelation: "drivers"
      referencedColumns: ["user_id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "driver_depart":
{ Args: { "p_force"?: boolean }; Returns: Json
                           },
"driver_join_queue":
{ Args: { "p_fare": number,"p_lat"?: number,"p_lng"?: number,"p_route_id": string,"p_seats_total": number,"p_vehicle_id": string }; Returns: Json
                           },
"driver_leave_queue":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"driver_register":
{ Args: { "p_license_number": string,"p_license_photo_path": string,"p_vehicle": Json }; Returns: Json
                           },
"get_my_driver":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"register_profile":
{ Args: { "p_full_name": string,"p_role": string }; Returns: Json
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
