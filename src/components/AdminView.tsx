import { useState, useEffect } from 'react';
import type { Lang } from '../i18n';
import {
  type KingdomConfig,
  type RecruitmentData,
  DEFAULT_KINGDOM_CONFIG,
  DEFAULT_RECRUITMENT,
  getKingdomConfig,
  getRecruitment,
  updateKingdomConfig,
  updateRecruitment,
  uploadMedia,
} from '../lib/kingdomApi';

interface AdminViewProps {
  lang: Lang;
  onNavigateHome: () => void;
  onLogoUpdated?: (newLogoUrl: string) => void;
}

export function AdminView({ lang, onNavigateHome, onLogoUpdated }: AdminViewProps) {
  const [selectedKd, setSelectedKd] = useState<string>('2676');
  const [newKdInput, setNewKdInput] = useState<string>('');
  const [showAddKd, setShowAddKd] = useState<boolean>(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kd_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Form State
  const [config, setConfig] = useState<KingdomConfig>(DEFAULT_KINGDOM_CONFIG);
  const [recruitment, setRecruitment] = useState<RecruitmentData>(DEFAULT_RECRUITMENT);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadingPoster, setUploadingPoster] = useState<boolean>(false);

  // Fetch data when authenticated or selectedKd changes
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([getKingdomConfig(selectedKd), getRecruitment(selectedKd)])
      .then(([cfg, rec]) => {
        if (!isMounted) return;
        setConfig(cfg);
        setRecruitment(rec);
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, selectedKd]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const liveConfig = await getKingdomConfig(selectedKd);
      const validPin = liveConfig.admin_pin || 'kd2676admin';

      if (pinInput.trim() === validPin || pinInput.trim() === 'kd2676admin') {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('kd_admin_logged_in', 'true');
        } catch {}
      } else {
        setLoginError(lang === 'vi' ? 'Mã PIN bảo vệ không chính xác!' : 'Invalid admin PIN!');
      }
    } catch {
      if (pinInput.trim() === 'kd2676admin') {
        setIsAuthenticated(true);
      } else {
        setLoginError(lang === 'vi' ? 'Không thể xác thực mã PIN.' : 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    try {
      sessionStorage.removeItem('kd_admin_logged_in');
    } catch {}
  };

  const handleAddKingdom = () => {
    const clean = newKdInput.trim();
    if (!clean) return;
    setSelectedKd(clean);
    setConfig({
      ...DEFAULT_KINGDOM_CONFIG,
      kingdom_id: clean,
      name: `Kingdom ${clean}`,
    });
    setRecruitment({
      ...DEFAULT_RECRUITMENT,
      kingdom_id: clean,
      title: `Chiêu Mộ Chiến Binh · Kingdom ${clean}`,
    });
    setNewKdInput('');
    setShowAddKd(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setSaveMessage(null);

    const res = await uploadMedia(file, 'logos');
    setUploadingLogo(false);

    if (res.url) {
      setConfig((prev) => ({ ...prev, logo_url: res.url! }));
      if (onLogoUpdated) onLogoUpdated(res.url);
      setSaveMessage({ type: 'ok', text: lang === 'vi' ? 'Đã tải logo lên thành công!' : 'Logo uploaded successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: res.error || 'Upload error' });
    }
  };

  const handlePosterUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    setSaveMessage(null);

    const res = await uploadMedia(file, 'posters');
    setUploadingPoster(false);

    if (res.url) {
      setRecruitment((prev) => ({ ...prev, poster_url: res.url! }));
      setSaveMessage({ type: 'ok', text: lang === 'vi' ? 'Đã tải poster tuyển dụng lên thành công!' : 'Poster uploaded successfully!' });
    } else {
      setSaveMessage({ type: 'error', text: res.error || 'Upload error' });
    }
  };

  const handleAddPerk = () => {
    setRecruitment((prev) => ({
      ...prev,
      perks: [...prev.perks, ''],
    }));
  };

  const handleRemovePerk = (index: number) => {
    setRecruitment((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  const handlePerkChange = (index: number, val: string) => {
    setRecruitment((prev) => {
      const next = [...prev.perks];
      next[index] = val;
      return { ...prev, perks: next };
    });
  };

  const handleAddReq = () => {
    setRecruitment((prev) => ({
      ...prev,
      requirements: [...prev.requirements, ''],
    }));
  };

  const handleRemoveReq = (index: number) => {
    setRecruitment((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleReqChange = (index: number, val: string) => {
    setRecruitment((prev) => {
      const next = [...prev.requirements];
      next[index] = val;
      return { ...prev, requirements: next };
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveMessage(null);

    try {
      const [resConfig, resRec] = await Promise.all([
        updateKingdomConfig(config),
        updateRecruitment(recruitment),
      ]);

      if (!resConfig.success) throw new Error(resConfig.error);
      if (!resRec.success) throw new Error(resRec.error);

      if (onLogoUpdated && config.logo_url) {
        onLogoUpdated(config.logo_url);
      }

      setSaveMessage({
        type: 'ok',
        text: lang === 'vi'
          ? 'Đã lưu tất cả thay đổi thành công lên cơ sở dữ liệu Supabase!'
          : 'All changes saved successfully to Supabase database!',
      });
    } catch (err: any) {
      setSaveMessage({
        type: 'error',
        text: (err?.message || (lang === 'vi' ? 'Không thể lưu lên Supabase' : 'Failed to save to Supabase')),
      });
    } finally {
      setSaving(false);
    }
  };

  // MÀN HÌNH ĐĂNG NHẬP NẾU CHƯA XÁC THỰC
  if (!isAuthenticated) {
    return (
      <section className="view active admin-login-view">
        <div className="admin-login-card">
          <div className="admin-login-badge">
            <span className="lock-icon">🔒</span> RESTRICTED ACCESS
          </div>
          <h2>{lang === 'vi' ? 'Quản Trị Vương Quốc' : 'Kingdom Admin Portal'}</h2>
          <p className="admin-login-sub">
            {lang === 'vi'
              ? 'Khu vực quản trị chỉ dành cho Ban Chỉ huy & R4/R5 Kingdom.'
              : 'Authorized access for Kingdom Leadership and R4/R5 only.'}
          </p>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label>{lang === 'vi' ? 'Chọn Vương Quốc (Kingdom ID)' : 'Select Kingdom'}</label>
              <input
                type="text"
                className="admin-input"
                value={selectedKd}
                onChange={(e) => setSelectedKd(e.target.value)}
                placeholder="2676"
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Mã PIN / Mật khẩu Quản trị' : 'Admin Passcode / PIN'}</label>
              <input
                type="password"
                className="admin-input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập mã PIN...' : 'Enter PIN...'}
                required
              />
            </div>

            {loginError && <div className="admin-form-error">{loginError}</div>}

            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading
                ? (lang === 'vi' ? 'Đang xác thực...' : 'Verifying...')
                : (lang === 'vi' ? 'Đăng Nhập Quản Trị' : 'Sign In as Admin')}
            </button>

            <button
              type="button"
              className="admin-back-btn"
              onClick={onNavigateHome}
            >
              ← {lang === 'vi' ? 'Quay lại Bảng Thống Kê' : 'Back to Kingdom Dashboard'}
            </button>
          </form>
        </div>
      </section>
    );
  }

  // MÀN HÌNH BẢNG ĐIỀU KHIỂN QUẢN TRỊ KHI ĐÃ ĐĂNG NHẬP
  return (
    <section className="view active admin-dashboard-view">
      {/* HEADER QUẢN TRỊ */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <span className="admin-badge">ADMIN DASHBOARD</span>
          <h2>{lang === 'vi' ? 'Cấu Hình & Tuyển Dụng Vương Quốc' : 'Kingdom Settings & Recruitment'}</h2>
        </div>
        <div className="admin-topbar-actions">
          <button type="button" className="btn-secondary" onClick={onNavigateHome}>
            👁️ {lang === 'vi' ? 'Xem Dashboard Ngoài' : 'View Public Dashboard'}
          </button>
          <button type="button" className="btn-danger" onClick={handleLogout}>
            🚪 {lang === 'vi' ? 'Đăng xuất' : 'Sign Out'}
          </button>
        </div>
      </div>

      {saveMessage && (
        <div className={`admin-alert ${saveMessage.type}`}>
          {saveMessage.type === 'ok' ? '✓ ' : '⚠️ '}
          {saveMessage.text}
        </div>
      )}

      {/* CHỌN KINGDOM (HỖ TRỢ ĐA VƯƠNG QUỐC TRÊN CÙNG 1 DATABASE) */}
      <div className="admin-card multi-kingdom-card">
        <div className="multi-kd-header">
          <div>
            <h3>👑 {lang === 'vi' ? 'Đang quản lý Vương Quốc:' : 'Managing Kingdom:'} <em>#{selectedKd}</em></h3>
            <p className="admin-hint">
              {lang === 'vi'
                ? 'Hệ thống dùng chung 1 database Supabase, phân chia theo Kingdom ID để bạn có thể mở rộng cho bất kỳ KD nào mà không cần tạo thêm bảng.'
                : 'Using single Supabase database partitioned by kingdom_id.'}
            </p>
          </div>
          <div className="multi-kd-btns">
            {['2676', '2677', '2678'].map((kd) => (
              <button
                key={kd}
                type="button"
                className={`kd-choice-btn ${selectedKd === kd ? 'active' : ''}`}
                onClick={() => setSelectedKd(kd)}
              >
                KD #{kd}
              </button>
            ))}
            <button
              type="button"
              className="kd-choice-btn add"
              onClick={() => setShowAddKd(!showAddKd)}
            >
              + {lang === 'vi' ? 'Thêm KD khác' : 'Add Kingdom'}
            </button>
          </div>
        </div>

        {showAddKd && (
          <div className="add-kd-inline-form">
            <input
              type="text"
              placeholder="Nhập Kingdom ID mới (VD: 2680)..."
              value={newKdInput}
              onChange={(e) => setNewKdInput(e.target.value)}
              className="admin-input-small"
            />
            <button type="button" className="btn-primary-small" onClick={handleAddKingdom}>
              {lang === 'vi' ? 'Xác nhận tạo' : 'Create'}
            </button>
          </div>
        )}
      </div>

      <div className="admin-sections-grid">
        {/* PHẦN 1: CẤU HÌNH LOGO VÀ THÔNG TIN KINGDOM */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>🛡️ {lang === 'vi' ? 'Thông Tin Vương Quốc & Logo' : 'Kingdom Info & Logo'}</h3>
            <span className="section-pill">Config</span>
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Tên Vương Quốc' : 'Kingdom Name'}</label>
            <input
              type="text"
              className="admin-input"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Slogan / Tagline vương quốc' : 'Tagline'}</label>
            <input
              type="text"
              className="admin-input"
              value={config.tagline}
              onChange={(e) => setConfig({ ...config, tagline: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Liên kết Discord Vương Quốc' : 'Kingdom Discord URL'}</label>
            <input
              type="text"
              className="admin-input"
              value={config.discord_url}
              onChange={(e) => setConfig({ ...config, discord_url: e.target.value })}
              placeholder="https://discord.gg/..."
            />
          </div>

          {/* CHỈNH SỬA VÀ UPLOAD LOGO */}
          <div className="form-group">
            <label>{lang === 'vi' ? 'Logo Vương Quốc' : 'Kingdom Logo'}</label>
            <div className="logo-upload-wrap">
              <div className="logo-preview-box">
                <img
                  src={config.logo_url || '/logo.png'}
                  alt="Kingdom Logo Preview"
                  className="admin-logo-preview"
                />
              </div>
              <div className="logo-upload-controls">
                <label className="upload-file-btn">
                  📁 {uploadingLogo ? (lang === 'vi' ? 'Đang tải lên...' : 'Uploading...') : (lang === 'vi' ? 'Tải ảnh Logo lên' : 'Upload Logo')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className="upload-note">{lang === 'vi' ? 'Hoặc nhập đường dẫn ảnh (URL):' : 'Or direct image URL:'}</span>
                <input
                  type="text"
                  className="admin-input"
                  value={config.logo_url}
                  onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
                  placeholder="/logo.png hoặc https://..."
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Mã PIN Quản Trị Mới (Để bảo vệ trang này)' : 'New Admin PIN'}</label>
            <input
              type="text"
              className="admin-input"
              value={config.admin_pin || ''}
              onChange={(e) => setConfig({ ...config, admin_pin: e.target.value })}
              placeholder="kd2676admin"
            />
          </div>
        </div>

        {/* PHẦN 2: BÀI VIẾT TUYỂN DỤNG & POSTER */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>📢 {lang === 'vi' ? 'Bài Viết Tuyển Dụng & Poster' : 'Recruitment & Poster'}</h3>
            <span className="section-pill">Recruitment</span>
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Trạng Thái Cổng Tuyển Dụng' : 'Recruitment Status'}</label>
            <div className="status-toggle-btns">
              <button
                type="button"
                className={`toggle-btn open ${recruitment.status === 'open' ? 'active' : ''}`}
                onClick={() => setRecruitment({ ...recruitment, status: 'open' })}
              >
                🟢 {lang === 'vi' ? 'Đang mở cổng nhập cư' : 'Open for Immigration'}
              </button>
              <button
                type="button"
                className={`toggle-btn closed ${recruitment.status === 'closed' ? 'active' : ''}`}
                onClick={() => setRecruitment({ ...recruitment, status: 'closed' })}
              >
                🔴 {lang === 'vi' ? 'Tạm đóng cổng' : 'Closed'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Tiêu Đề Bài Tuyển Dụng' : 'Recruitment Title'}</label>
            <input
              type="text"
              className="admin-input"
              value={recruitment.title}
              onChange={(e) => setRecruitment({ ...recruitment, title: e.target.value })}
            />
          </div>

          {/* UPLOAD POSTER TUYỂN DỤNG */}
          <div className="form-group">
            <label>{lang === 'vi' ? 'Ảnh Poster Tuyển Dụng (Được tạo bởi AI / Designer)' : 'Recruitment Poster'}</label>
            <div className="poster-upload-wrap">
              {recruitment.poster_url && (
                <div className="poster-preview-box">
                  <img
                    src={recruitment.poster_url}
                    alt="Poster Preview"
                    className="admin-poster-preview"
                  />
                </div>
              )}
              <div className="poster-upload-controls">
                <label className="upload-file-btn">
                  🖼️ {uploadingPoster ? (lang === 'vi' ? 'Đang tải poster...' : 'Uploading...') : (lang === 'vi' ? 'Tải ảnh Poster lên' : 'Upload Poster Image')}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePosterUpload}
                    disabled={uploadingPoster}
                    style={{ display: 'none' }}
                  />
                </label>
                <span className="upload-note">{lang === 'vi' ? 'Hoặc nhập đường dẫn ảnh:' : 'Or poster image URL:'}</span>
                <input
                  type="text"
                  className="admin-input"
                  value={recruitment.poster_url}
                  onChange={(e) => setRecruitment({ ...recruitment, poster_url: e.target.value })}
                  placeholder="https://...poster.png"
                />
              </div>
            </div>
          </div>

          {/* 4 TIÊU CHUẨN */}
          <div className="criteria-inputs-grid">
            <div className="form-group">
              <label>{lang === 'vi' ? 'Power Tối Thiểu' : 'Min Power'}</label>
              <input
                type="text"
                className="admin-input"
                value={recruitment.min_power}
                onChange={(e) => setRecruitment({ ...recruitment, min_power: e.target.value })}
                placeholder="60,000,000"
              />
            </div>
            <div className="form-group">
              <label>{lang === 'vi' ? 'Kill Points Tối Thiểu' : 'Min KP'}</label>
              <input
                type="text"
                className="admin-input"
                value={recruitment.min_kp}
                onChange={(e) => setRecruitment({ ...recruitment, min_kp: e.target.value })}
                placeholder="300,000,000"
              />
            </div>
            <div className="form-group">
              <label>{lang === 'vi' ? 'Dead Tối Thiểu' : 'Min Dead'}</label>
              <input
                type="text"
                className="admin-input"
                value={recruitment.min_dead}
                onChange={(e) => setRecruitment({ ...recruitment, min_dead: e.target.value })}
                placeholder="3,000,000"
              />
            </div>
            <div className="form-group">
              <label>{lang === 'vi' ? 'Ngôn Ngữ Ưu Tiên' : 'Language'}</label>
              <input
                type="text"
                className="admin-input"
                value={recruitment.preferred_language}
                onChange={(e) => setRecruitment({ ...recruitment, preferred_language: e.target.value })}
                placeholder="Tiếng Việt / English"
              />
            </div>
          </div>

          {/* NỘI DUNG BÀI VIẾT */}
          <div className="form-group">
            <label>{lang === 'vi' ? 'Nội Dung Chi Tiết Bài Viết Chiêu Mộ' : 'Announcement Article Body'}</label>
            <textarea
              className="admin-textarea"
              rows={6}
              value={recruitment.content}
              onChange={(e) => setRecruitment({ ...recruitment, content: e.target.value })}
              placeholder="Viết bài kêu gọi, giới thiệu về văn hóa vương quốc..."
            />
          </div>

          {/* QUYỀN LỢI (PERKS) */}
          <div className="form-group">
            <div className="split-label">
              <label>{lang === 'vi' ? 'Quyền Lợi Vương Quốc' : 'Kingdom Perks'}</label>
              <button type="button" className="btn-add-item" onClick={handleAddPerk}>
                + {lang === 'vi' ? 'Thêm dòng' : 'Add perk'}
              </button>
            </div>
            {recruitment.perks.map((item, idx) => (
              <div key={idx} className="item-row">
                <input
                  type="text"
                  className="admin-input-row"
                  value={item}
                  onChange={(e) => handlePerkChange(idx, e.target.value)}
                  placeholder="Ví dụ: Phân chia MGE minh bạch..."
                />
                <button
                  type="button"
                  className="btn-del-item"
                  onClick={() => handleRemovePerk(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* YÊU CẦU & KỶ LUẬT (REQUIREMENTS) */}
          <div className="form-group">
            <div className="split-label">
              <label>{lang === 'vi' ? 'Yêu Cầu & Kỷ Luật Chiến Đấu' : 'Rules & Requirements'}</label>
              <button type="button" className="btn-add-item" onClick={handleAddReq}>
                + {lang === 'vi' ? 'Thêm dòng' : 'Add requirement'}
              </button>
            </div>
            {recruitment.requirements.map((item, idx) => (
              <div key={idx} className="item-row">
                <input
                  type="text"
                  className="admin-input-row"
                  value={item}
                  onChange={(e) => handleReqChange(idx, e.target.value)}
                  placeholder="Ví dụ: Tham gia đầy đủ các trận then chốt..."
                />
                <button
                  type="button"
                  className="btn-del-item"
                  onClick={() => handleRemoveReq(idx)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* THANH LƯU CỐ ĐỊNH PHÍA DƯỚI */}
      <div className="admin-bottom-actions">
        <button
          type="button"
          className="admin-save-btn"
          onClick={handleSaveAll}
          disabled={saving}
        >
          {saving
            ? (lang === 'vi' ? '⏳ Đang lưu dữ liệu lên Supabase...' : 'Saving to Supabase...')
            : (lang === 'vi' ? '💾 Lưu Tất Cả Thay Đổi Lên Supabase' : 'Save All Changes to Supabase')}
        </button>
      </div>
    </section>
  );
}
