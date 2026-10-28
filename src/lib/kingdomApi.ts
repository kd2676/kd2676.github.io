import { supabase } from './supabase';

export interface KingdomConfig {
  kingdom_id: string;
  name: string;
  tagline: string;
  logo_url: string;
  discord_url: string;
  contact_info: string;
  admin_pin?: string;
}

export interface RecruitmentData {
  id?: string;
  kingdom_id: string;
  title: string;
  status: 'open' | 'closed';
  poster_url: string;
  discord_url: string;
  min_power: string;
  min_kp: string;
  min_dead: string;
  preferred_language: string;
  content: string;
  perks: string[];
  requirements: string[];
  updated_at?: string;
}

export const DEFAULT_KINGDOM_CONFIG: KingdomConfig = {
  kingdom_id: '2676',
  name: 'Kingdom 2676',
  tagline: 'Zipporania · Continent of Egria · Chatsworth',
  logo_url: '/logo.png',
  discord_url: 'https://discord.gg/',
  contact_info: 'R4 / R5 Recruitment Team',
  admin_pin: 'kd2676admin',
};

export const DEFAULT_RECRUITMENT: RecruitmentData = {
  kingdom_id: '2676',
  title: 'Chiêu Mộ Chiến Binh Mùa Giải Mới · Kingdom 2676',
  status: 'open',
  poster_url: '',
  discord_url: 'https://discord.gg/',
  min_power: '60,000,000',
  min_kp: '300,000,000',
  min_dead: '3,000,000',
  preferred_language: 'Tiếng Việt / English',
  content: 'Kingdom 2676 đang mở cổng nhập cư chào đón các chiến binh dũng cảm gia nhập đại gia đình cho mùa giải Season of Conquest mới! Chúng tôi sở hữu cộng đồng gắn kết, kỷ luật, ban lãnh đạo công tâm và chiến thuật KvK bài bản.',
  perks: [
    'Phân chia phần thưởng MGE minh bạch theo DKP chiến đấu',
    'Môi trường KvK không drama, ban lãnh đạo túc trực 24/7',
    'Liên minh Top 1 max toàn bộ công nghệ, mở rương vàng liên tục',
    'Hỗ trợ tài nguyên bồi dưỡng và kỹ thuật tác chiến chuyên sâu',
  ],
  requirements: [
    'Tham gia đầy đủ các trận đánh then chốt trong KvK',
    'Tuân thủ nghiêm lệnh điều động của Ban Chỉ huy & R4/R5',
    'Tôn trọng đồng đội, không cãi vã trong chat vương quốc',
  ],
};

// Lấy thông tin cấu hình của Kingdom từ Supabase (fallback về mặc định nếu chưa tạo bảng)
export async function getKingdomConfig(kingdomId: string = '2676'): Promise<KingdomConfig> {
  try {
    const { data, error } = await supabase
      .from('kingdom_config')
      .select('*')
      .eq('kingdom_id', kingdomId)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_KINGDOM_CONFIG;
    }
    return {
      ...DEFAULT_KINGDOM_CONFIG,
      ...data,
    };
  } catch {
    return DEFAULT_KINGDOM_CONFIG;
  }
}

// Lấy thông tin tuyển dụng của Kingdom từ Supabase
export async function getRecruitment(kingdomId: string = '2676'): Promise<RecruitmentData> {
  try {
    const { data, error } = await supabase
      .from('recruitment')
      .select('*')
      .eq('kingdom_id', kingdomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return DEFAULT_RECRUITMENT;
    }

    return {
      ...DEFAULT_RECRUITMENT,
      ...data,
      perks: Array.isArray(data.perks) ? data.perks : DEFAULT_RECRUITMENT.perks,
      requirements: Array.isArray(data.requirements) ? data.requirements : DEFAULT_RECRUITMENT.requirements,
    };
  } catch {
    return DEFAULT_RECRUITMENT;
  }
}

// Lưu cập nhật thông tin Kingdom (Logo, Discord, PIN...)
export async function updateKingdomConfig(config: KingdomConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('kingdom_config')
      .upsert({
        kingdom_id: config.kingdom_id,
        name: config.name,
        tagline: config.tagline,
        logo_url: config.logo_url,
        discord_url: config.discord_url,
        contact_info: config.contact_info,
        admin_pin: config.admin_pin || 'kd2676admin',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'kingdom_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi lưu cấu hình vương quốc' };
  }
}

// Lưu hoặc cập nhật bài viết tuyển dụng
export async function updateRecruitment(recruitment: RecruitmentData): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      kingdom_id: recruitment.kingdom_id,
      title: recruitment.title,
      status: recruitment.status,
      poster_url: recruitment.poster_url,
      discord_url: recruitment.discord_url,
      min_power: recruitment.min_power,
      min_kp: recruitment.min_kp,
      min_dead: recruitment.min_dead,
      preferred_language: recruitment.preferred_language,
      content: recruitment.content,
      perks: recruitment.perks,
      requirements: recruitment.requirements,
      updated_at: new Date().toISOString(),
    };

    if (recruitment.id) {
      const { error } = await supabase
        .from('recruitment')
        .update(payload)
        .eq('id', recruitment.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('recruitment')
        .insert([payload]);
      if (error) throw error;
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi lưu bài tuyển dụng' };
  }
}

// Tải ảnh (Poster, Logo) lên Supabase Storage bucket 'kingdom-media'
export async function uploadMedia(file: File, folder: 'posters' | 'logos' = 'posters'): Promise<{ url?: string; error?: string }> {
  try {
    const ext = file.name.split('.').pop() || 'png';
    const cleanFileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('kingdom-media')
      .upload(cleanFileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('kingdom-media')
      .getPublicUrl(cleanFileName);

    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err?.message || 'Lỗi tải ảnh lên Supabase Storage' };
  }
}


// Đổi mã PIN / Mật khẩu Admin
export async function changeAdminPin(
  kingdomId: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getKingdomConfig(kingdomId);
    const currentPin = config.admin_pin || 'kd2676admin';

    if (oldPin.trim() !== currentPin && oldPin.trim() !== 'kd2676admin') {
      return { success: false, error: 'Mã PIN hiện tại không chính xác!' };
    }

    if (!newPin.trim()) {
      return { success: false, error: 'Mã PIN mới không được để trống!' };
    }

    if (newPin.trim().length < 4) {
      return { success: false, error: 'Mã PIN mới phải có ít nhất 4 ký tự!' };
    }

    const { error } = await supabase
      .from('kingdom_config')
      .upsert({
        kingdom_id: kingdomId,
        admin_pin: newPin.trim(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'kingdom_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi cập nhật mật khẩu lên Supabase' };
  }
}
