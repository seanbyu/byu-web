/**
 * Customer Service
 * 고객 비즈니스 로직 레이어
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { CustomerRepository } from "../repositories/customer.repository";

type Customer = Database["public"]["Tables"]["customers"]["Row"];

export interface FindOrCreateCustomerParams {
  salonId: string;
  userId: string; // LINE user ID from auth
  name: string;
  phone?: string;
  lineUserId?: string;
  lineDisplayName?: string;
  linePictureUrl?: string;
}

export class CustomerService {
  private repository: CustomerRepository;

  constructor(supabase: SupabaseClient<Database>) {
    this.repository = new CustomerRepository(supabase);
  }

  /**
   * 고객 찾기 또는 생성
   * 우선순위:
   * 1. phone이 있으면 phone으로 조회
   * 2. phone이 없으면 user_id로 조회
   * 3. 둘 다 없으면 새로 생성
   */
  async findOrCreateCustomer(params: FindOrCreateCustomerParams): Promise<Customer> {
    const {
      salonId,
      userId,
      name,
      phone,
      lineUserId,
      lineDisplayName,
      linePictureUrl,
    } = params;

    let customer: Customer | null = null;

    // 1. phone이 있으면 phone으로 먼저 조회
    if (phone && phone.trim()) {
      customer = await this.repository.findByPhone(salonId, phone);

      // 기존 고객이 있으면 LINE 정보 + 이름 동기화
      if (customer) {
        const updates: Record<string, unknown> = {};

        // user_id나 LINE 정보가 없으면 업데이트
        if (!customer.user_id || !customer.line_user_id) {
          updates.user_id = userId;
          updates.line_user_id = lineUserId;
          updates.line_display_name = lineDisplayName;
          updates.line_picture_url = linePictureUrl;
        }

        // 이름이 다르면 업데이트 + 이력 기록
        if (name && customer.name !== name) {
          await this.repository.logNameChange(customer.id, customer.name, name, 'web_booking');
          updates.name = name;
        }

        if (Object.keys(updates).length > 0) {
          customer = await this.repository.update(customer.id, updates);
        }
        return customer;
      }
    }

    // 2. user_id로 조회 (phone이 없거나 phone으로 못 찾은 경우)
    customer = await this.repository.findByUserId(salonId, userId);
    if (customer) {
      // phone이 새로 제공되었으면 업데이트
      if (phone && phone.trim() && !customer.phone) {
        customer = await this.repository.update(customer.id, {
          phone,
          name, // 이름도 업데이트
        });
      }
      return customer;
    }

    // 3. 새 고객 생성
    const cleanPhone = phone && phone.trim() ? phone.trim() : null;

    customer = await this.repository.create({
      salon_id: salonId,
      user_id: userId,
      name,
      phone: cleanPhone,
      line_user_id: lineUserId || null,
      line_display_name: lineDisplayName || null,
      line_picture_url: linePictureUrl || null,
      customer_type: "local",
      marketing_consent: false,
    });

    return customer;
  }

  /**
   * 전화번호로 고객 조회
   */
  async getByPhone(salonId: string, phone: string): Promise<Customer | null> {
    return this.repository.findByPhone(salonId, phone);
  }

  /**
   * user_id로 고객 조회
   */
  async getByUserId(salonId: string, userId: string): Promise<Customer | null> {
    return this.repository.findByUserId(salonId, userId);
  }
}

/**
 * Service 인스턴스 생성 헬퍼
 */
export const createCustomerService = (supabase: SupabaseClient<Database>) => {
  return new CustomerService(supabase);
};
