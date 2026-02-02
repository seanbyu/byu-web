/**
 * Base Repository
 * 공통 CRUD 메서드를 제공하는 기본 Repository 클래스
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Tables = Database["public"]["Tables"];
export type TableName = keyof Tables;

export abstract class BaseRepository<T extends TableName> {
  protected supabase: SupabaseClient<Database>;
  protected tableName: T;

  constructor(supabase: SupabaseClient<Database>, tableName: T) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  /**
   * ID로 단일 레코드 조회
   */
  async findById(id: string) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*")
      .eq("id" as never, id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 모든 레코드 조회
   */
  async findAll() {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select("*");

    if (error) throw error;
    return data || [];
  }

  /**
   * 레코드 생성
   */
  async create(record: Tables[T]["Insert"]) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(record as never)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 레코드 수정
   */
  async update(id: string, record: Tables[T]["Update"]) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(record as never)
      .eq("id" as never, id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * 레코드 삭제
   */
  async delete(id: string) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq("id" as never, id);

    if (error) throw error;
    return true;
  }
}
