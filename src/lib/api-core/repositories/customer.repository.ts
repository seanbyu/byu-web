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
   * phone_normalized 컬럼을 사용하여 포맷에 무관하게 매칭
   */
  async findByPhone(salonId: string, phone: string): Promise<Customer | null> {
    const normalized = phone.replace(/[^0-9+]/g, '');
    if (!normalized) return null;

    const { data, error } = await (this.supabase as any)
      .from("customers")
      .select("*")
      .eq("salon_id", salonId)
      .eq("phone_normalized", normalized)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  /**
   * 이름 변경 이력 기록
   */
  async logNameChange(
    customerId: string,
    oldName: string,
    newName: string,
    changedBy: string
  ): Promise<void> {
    const { error } = await (this.supabase as any)
      .from("customer_name_history")
      .insert({
        customer_id: customerId,
        old_name: oldName,
        new_name: newName,
        changed_by: changedBy,
      });

    if (error) {
      console.error("Failed to log name change:", error);
    }
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
