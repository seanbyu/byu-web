/**
 * Customer Repository
 * 고객 데이터 접근 레이어
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type Customer = Database["public"]["Tables"]["customers"]["Row"];
type InsertCustomer = Database["public"]["Tables"]["customers"]["Insert"];

export class CustomerRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * 전화번호로 고객 조회 (살롱 내)
   */
  async findByPhone(salonId: string, phone: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("salon_id", salonId)
      .eq("phone", phone)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * LINE user ID로 고객 조회 (살롱 내)
   */
  async findByLineUserId(salonId: string, lineUserId: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("salon_id", salonId)
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * user_id로 고객 조회 (살롱 내)
   */
  async findByUserId(salonId: string, userId: string): Promise<Customer | null> {
    const { data, error } = await this.supabase
      .from("customers")
      .select("*")
      .eq("salon_id", salonId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * 고객 생성
   */
  async create(customer: InsertCustomer): Promise<Customer> {
    const { data, error } = await this.supabase
      .from("customers")
      .insert(customer)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to create customer");
    return data;
  }

  /**
   * 고객 정보 업데이트
   */
  async update(id: string, updates: Partial<InsertCustomer>): Promise<Customer> {
    const { data, error } = await this.supabase
      .from("customers")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Failed to update customer");
    return data;
  }
}
