-- ========================================================
-- DATABASE SCHEMA CHO KINGDOM 2676 & HỆ THỐNG ĐA VƯƠNG QUỐC (MULTI-KINGDOM)
-- Hãy sao chép toàn bộ nội dung file này và dán vào Supabase SQL Editor rồi bấm "Run".
-- ========================================================

-- 1. BẢNG CẤU HÌNH VƯƠNG QUỐC (LOGO, DISCORD, MÃ BẢO VỆ ADMIN)
CREATE TABLE IF NOT EXISTS public.kingdom_config (
    kingdom_id TEXT PRIMARY KEY, -- '2676', '2677',...
    name TEXT NOT NULL DEFAULT 'Kingdom 2676',
    tagline TEXT DEFAULT 'Zipporania · Continent of Egria · Chatsworth',
    logo_url TEXT DEFAULT '/logo.png',
    discord_url TEXT DEFAULT 'https://discord.gg/',
    contact_info TEXT DEFAULT 'R4/R5 Recruitment Team',
    admin_username TEXT DEFAULT 'admin', -- Tài khoản đăng nhập
    admin_pin TEXT DEFAULT 'kd2676admin', -- Mật khẩu đăng nhập
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG BÀI VIẾT & TIÊU CHÍ TUYỂN DỤNG (RECRUITMENT)
CREATE TABLE IF NOT EXISTS public.recruitment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kingdom_id TEXT NOT NULL, -- Dùng chung bảng, phân biệt qua kingdom_id
    title TEXT NOT NULL DEFAULT 'New Season Warriors Recruitment · Kingdom 2676',
    status TEXT NOT NULL DEFAULT 'open', -- 'open' (Đang mở) hoặc 'closed' (Tạm đóng)
    poster_url TEXT DEFAULT '',
    discord_url TEXT DEFAULT '',
    min_power TEXT DEFAULT '60,000,000',
    min_kp TEXT DEFAULT '300,000,000',
    min_dead TEXT DEFAULT '3,000,000',
    preferred_language TEXT DEFAULT 'Tiếng Việt / English',
    content TEXT DEFAULT 'Kingdom 2676 đang mở cổng chào đón các chiến binh nhiệt huyết cho mùa giải Season of Conquest mới! Chúng tôi sở hữu cộng đồng gắn kết, kỷ luật cao, ban lãnh đạo công tâm và chiến thuật KvK bài bản.',
    perks JSONB DEFAULT '["Phân chia phần thưởng MGE minh bạch theo DKP chiến đấu", "Môi trường KvK không drama, ban lãnh đạo túc trực 24/7", "Liên minh Top 1 max toàn bộ công nghệ, mở rương vàng liên tục", "Hỗ trợ tài nguyên bồi dưỡng và kỹ thuật tác chiến chuyên sâu"]'::jsonb,
    requirements JSONB DEFAULT '["Tham gia đầy đủ các trận đánh then chốt trong KvK", "Tuân thủ nghiêm lệnh điều động của R4/R5", "Không toxic, tôn trọng đồng đội trong vương quốc"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_kingdom_recruitment FOREIGN KEY (kingdom_id) REFERENCES public.kingdom_config(kingdom_id) ON DELETE CASCADE
);

-- 3. DỮ LIỆU KHỞI TẠO CHO KINGDOM 2676
INSERT INTO public.kingdom_config (kingdom_id, name, tagline, logo_url, discord_url, contact_info, admin_username, admin_pin)
VALUES (
    '2676',
    'Kingdom 2676',
    'Zipporania · Continent of Egria · Chatsworth',
    '/logo.png',
    'https://discord.gg/',
    'R4 / R5 Kingdom 2676',
    'admin',
    'kd2676admin'
)
ON CONFLICT (kingdom_id) DO UPDATE 
SET tagline = EXCLUDED.tagline,
    name = EXCLUDED.name;

INSERT INTO public.recruitment (kingdom_id, title, status, poster_url, min_power, min_kp, min_dead, discord_url, content)
VALUES (
    '2676',
    'New Season Warriors Recruitment · Kingdom 2676',
    'open',
    '',
    '60,000,000',
    '300,000,000',
    '3,000,000',
    'https://discord.gg/',
    'Kingdom 2676 đang mở cổng nhập cư chào đón các chiến binh nhiệt huyết cho mùa giải Season of Conquest tiếp theo! Hãy cùng chúng tôi cống hiến và viết tiếp những chiến tích vang dội.'
)
ON CONFLICT DO NOTHING;

-- 4. BẬT BẢO MẬT ROW LEVEL SECURITY (RLS) VÀ CẤP QUYỀN
ALTER TABLE public.kingdom_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recruitment ENABLE ROW LEVEL SECURITY;

-- Cấp quyền đọc công khai (SELECT) cho tất cả mọi người
DROP POLICY IF EXISTS "Allow public read kingdom_config" ON public.kingdom_config;
CREATE POLICY "Allow public read kingdom_config" ON public.kingdom_config FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public read recruitment" ON public.recruitment;
CREATE POLICY "Allow public read recruitment" ON public.recruitment FOR SELECT USING (true);

-- Cấp quyền thao tác (INSERT, UPDATE, DELETE) qua API
DROP POLICY IF EXISTS "Allow full access kingdom_config" ON public.kingdom_config;
CREATE POLICY "Allow full access kingdom_config" ON public.kingdom_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access recruitment" ON public.recruitment;
CREATE POLICY "Allow full access recruitment" ON public.recruitment FOR ALL USING (true) WITH CHECK (true);

-- 5. CẤU HÌNH BUCKET LƯU TRỮ POSTER VÀ LOGO (STORAGE BUCKET: kingdom-media)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('kingdom-media', 'kingdom-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Allow public read storage kingdom-media" ON storage.objects;
CREATE POLICY "Allow public read storage kingdom-media" ON storage.objects FOR SELECT USING (bucket_id = 'kingdom-media');

DROP POLICY IF EXISTS "Allow public upload storage kingdom-media" ON storage.objects;
CREATE POLICY "Allow public upload storage kingdom-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kingdom-media');

DROP POLICY IF EXISTS "Allow public update storage kingdom-media" ON storage.objects;
CREATE POLICY "Allow public update storage kingdom-media" ON storage.objects FOR UPDATE USING (bucket_id = 'kingdom-media');


-- 6. BẢNG QUẢN LÝ TÀI KHOẢN ADMIN (R4/R5 LEADERSHIP)
CREATE TABLE IF NOT EXISTS public.admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL DEFAULT 'kd2676',
    role TEXT DEFAULT 'R4/R5 Officer',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access admin_users" ON public.admin_users;
CREATE POLICY "Allow public access admin_users" ON public.admin_users FOR ALL USING (true) WITH CHECK (true);

-- Khởi tạo tài khoản admin mặc định
-- Khởi tạo tài khoản admin duy nhất với vai trò độc quyền 'Admin'
INSERT INTO public.admin_users (username, password, role)
VALUES 
    ('admin', 'kd2676admin', 'Admin')
ON CONFLICT (username) DO UPDATE SET role = 'Admin';
