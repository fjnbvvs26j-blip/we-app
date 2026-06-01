import { supabase } from '@/shared/lib/supabase'
import type { MyStatus, PartnerStatus, CountdownData, PartnerInfo, StatusOption } from './home.types'

export const homeService = {
  // ============ 状态 ============

  /** 获取自己的当前状态（无记录返回 null） */
  async getMyStatus(userId: string): Promise<MyStatus> {
    const { data, error } = await supabase
      .from('statuses')
      .select('status, custom_text, updated_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (error || !data) return null
    return data as MyStatus
  },

  /** 设置/更新自己的状态（upsert） */
  async setMyStatus(userId: string, status: StatusOption, customText?: string): Promise<void> {
    const { error } = await supabase
      .from('statuses')
      .upsert({
        user_id: userId,
        status,
        custom_text: status === 'custom' ? (customText || '') : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

    if (error) throw error
  },

  /** 获取伴侣的状态 */
  async getPartnerStatus(partnerId: string): Promise<PartnerStatus> {
    const { data, error } = await supabase
      .from('statuses')
      .select('status, custom_text, updated_at')
      .eq('user_id', partnerId)
      .maybeSingle()

    if (error || !data) return null

    // 同时获取伴侣昵称
    const { data: partner } = await supabase
      .from('profiles')
      .select('nickname')
      .eq('id', partnerId)
      .single()

    return {
      status: data.status as StatusOption,
      custom_text: data.custom_text,
      updated_at: data.updated_at,
      partner_nickname: partner?.nickname || '伴侣',
    }
  },

  // ============ 见面倒计时 ============

  /** 获取最近一次待确认/已确认的见面计划 */
  async getNextMeeting(): Promise<CountdownData> {
    const { data, error } = await supabase
      .from('meet_plans')
      .select('meet_date, status, from_city')
      .in('status', ['planning', 'confirmed'])
      .order('meet_date', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (error || !data || !data.meet_date) return null

    const meetDate = new Date(data.meet_date)
    const now = new Date()
    const daysUntil = Math.ceil((meetDate.getTime() - now.getTime()) / 86400000)

    return {
      daysUntil: Math.max(0, daysUntil),
      meetDate: data.meet_date,
      meetStatus: data.status as CountdownData['meetStatus'],
      fromCity: data.from_city ?? null,
    }
  },

  // ============ 伴侣信息 ============

  /** 获取伴侣基本信息 */
  async getPartnerInfo(partnerId: string): Promise<PartnerInfo> {
    const { data, error } = await supabase
      .from('profiles')
      .select('nickname, target_school, avatar_url')
      .eq('id', partnerId)
      .single()

    if (error || !data) return null
    return {
      nickname: data.nickname,
      target_school: data.target_school ?? null,
      avatar_url: data.avatar_url ?? null,
    }
  },

  /** 按邀请码查找用户 */
  async lookupByInviteCode(inviteCode: string): Promise<{ id: string; nickname: string } | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, nickname')
      .eq('invite_code', inviteCode.toLowerCase())
      .single()

    if (error || !data) return null
    return { id: data.id, nickname: data.nickname }
  },
}
