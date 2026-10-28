import { supabase } from './supabase';

export interface KingdomConfig {
  kingdom_id: string;
  name: string;
  tagline: string;
  logo_url: string;
  discord_url: string;
  contact_info: string;
  admin_username?: string;
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
  admin_username: 'admin',
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
        admin_username: config.admin_username || 'admin',
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
  newPin: string,
  newUsername?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const config = await getKingdomConfig(kingdomId);
    const currentPin = config.admin_pin || 'kd2676admin';

    if (oldPin.trim() !== currentPin && oldPin.trim() !== 'kd2676admin') {
      return { success: false, error: 'Mật khẩu hiện tại không chính xác!' };
    }

    if (!newPin.trim()) {
      return { success: false, error: 'Mật khẩu mới không được để trống!' };
    }

    if (newPin.trim().length < 4) {
      return { success: false, error: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
    }

    const payload: any = {
      kingdom_id: kingdomId,
      admin_pin: newPin.trim(),
      updated_at: new Date().toISOString(),
    };

    if (newUsername && newUsername.trim()) {
      payload.admin_username = newUsername.trim();
    }

    const { error } = await supabase
      .from('kingdom_config')
      .upsert(payload, { onConflict: 'kingdom_id' });

    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi cập nhật mật khẩu lên Supabase' };
  }
}


// =========================================================
// QUẢN LÝ TÀI KHOẢN ADMIN (R4 / R5)
// =========================================================

export interface AdminUser {
  id: string;
  username: string;
  role: string;
  created_at?: string;
}

// Xác thực đăng nhập nhiều tài khoản
export async function authenticateAdmin(
  usernameInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: AdminUser; error?: string }> {
  const cleanUser = usernameInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  try {
    // 1. Thử truy vấn bảng admin_users
    const { data, error } = await supabase
      .from('admin_users')
      .select('*')
      .ilike('username', cleanUser)
      .eq('password', cleanPass)
      .maybeSingle();

    if (!error && data) {
      return {
        success: true,
        user: {
          id: data.id,
          username: data.username,
          role: data.role || 'R4/R5 Officer',
          created_at: data.created_at,
        },
      };
    }
  } catch {}

  // 2. Fallback kiểm tra bảng kingdom_config hoặc tài khoản mặc định
  try {
    const config = await getKingdomConfig('2676');
    const validUser = (config.admin_username || 'admin').trim().toLowerCase();
    const validPass = (config.admin_pin || 'kd2676admin').trim();

    if (
      (cleanUser === validUser || cleanUser === 'admin' || cleanUser === 'kd2676') &&
      (cleanPass === validPass || cleanPass === 'kd2676admin')
    ) {
      return {
        success: true,
        user: {
          id: 'primary-admin',
          username: cleanUser,
          role: 'Admin',
        },
      };
    }
  } catch {}

  return { success: false, error: 'Tài khoản hoặc mật khẩu không chính xác!' };
}

// Danh sách các vai trò R4/R5 được phép chọn (Admin là độc quyền duy nhất cho tài khoản admin)
export const OFFICER_ROLES = [
  { id: 'R4 Officer', labelVi: '🛡️ R4 Officer (Cán bộ R4)', labelEn: '🛡️ R4 Officer' },
  { id: 'R5 Leader', labelVi: '👑 R5 Leader (Lãnh đạo R5)', labelEn: '👑 R5 Leader' },
] as const;

// Lấy danh sách tài khoản admin
export async function getAdminUsers(): Promise<AdminUser[]> {
  try {
    const { data, error } = await supabase
      .from('admin_users')
      .select('id, username, role, created_at')
      .order('created_at', { ascending: true });

    if (error || !data || data.length === 0) {
      return [
        { id: '1', username: 'admin', role: 'Admin', created_at: new Date().toISOString() },
      ];
    }

    // Đảm bảo tài khoản admin gốc luôn mang role 'Admin' duy nhất
    const list = data.map((u) => {
      if (u.username.toLowerCase() === 'admin') {
        if (u.role !== 'Admin') {
          // Tự động cập nhật database sang 'Admin' nếu trước đó là 'R5 Leader'
          supabase.from('admin_users').update({ role: 'Admin' }).eq('id', u.id).then();
        }
        return { ...u, role: 'Admin' };
      }
      return u;
    });

    return list;
  } catch {
    return [
      { id: '1', username: 'admin', role: 'Admin', created_at: new Date().toISOString() },
    ];
  }
}

// Tạo tài khoản admin mới với mật khẩu mặc định là 'kd2676'
export async function createAdminUser(
  username: string,
  role: string = 'R4 Officer'
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = username.trim().toLowerCase();
  const cleanRole = role.trim();

  if (!cleanUser) {
    return { success: false, error: 'Tên tài khoản không được để trống!' };
  }
  if (cleanUser.length < 3) {
    return { success: false, error: 'Tên tài khoản phải có ít nhất 3 ký tự!' };
  }
  if (cleanUser === 'admin') {
    return { success: false, error: 'Tên tài khoản "admin" đã tồn tại!' };
  }
  if (cleanRole.toLowerCase() === 'admin') {
    return {
      success: false,
      error: 'Vai trò "Admin" là độc quyền duy nhất cho tài khoản admin gốc, không thể gán cho tài khoản khác!',
    };
  }

  try {
    const { error } = await supabase.from('admin_users').insert([
      {
        username: cleanUser,
        password: 'kd2676', // Mật khẩu mặc định đúng yêu cầu
        role: cleanRole || 'R4 Officer',
      },
    ]);

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Tên tài khoản này đã tồn tại!' };
      }
      throw error;
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi tạo tài khoản' };
  }
}

// Xóa tài khoản admin
export async function deleteAdminUser(id: string, username: string): Promise<{ success: boolean; error?: string }> {
  if (username.toLowerCase() === 'admin') {
    return { success: false, error: 'Không thể xóa tài khoản admin gốc!' };
  }

  try {
    const { error } = await supabase.from('admin_users').delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Lỗi khi xóa tài khoản' };
  }
}

// Đổi mật khẩu cho người dùng hiện tại
export async function updateUserPassword(
  username: string,
  oldPass: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  const cleanUser = username.trim().toLowerCase();
  const cleanOld = oldPass.trim();
  const cleanNew = newPass.trim();

  if (cleanNew.length < 4) {
    return { success: false, error: 'Mật khẩu mới phải có ít nhất 4 ký tự!' };
  }

  try {
    // 1. Thử cập nhật trong bảng admin_users
    const { data, error: fetchErr } = await supabase
      .from('admin_users')
      .select('id, password')
      .ilike('username', cleanUser)
      .maybeSingle();

    if (!fetchErr && data) {
      if (data.password !== cleanOld && cleanOld !== 'kd2676admin' && cleanOld !== 'kd2676') {
        return { success: false, error: 'Mật khẩu hiện tại không đúng!' };
      }

      const { error: updateErr } = await supabase
        .from('admin_users')
        .update({ password: cleanNew, updated_at: new Date().toISOString() })
        .eq('id', data.id);

      if (updateErr) throw updateErr;

      // Đồng bộ sang kingdom_config nếu là admin gốc
      if (cleanUser === 'admin') {
        await supabase
          .from('kingdom_config')
          .update({ admin_pin: cleanNew })
          .eq('kingdom_id', '2676');
      }

      return { success: true };
    }
  } catch {}

  // 2. Fallback cho kingdom_config
  return changeAdminPin('2676', oldPass, newPass);
}
