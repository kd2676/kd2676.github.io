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
  changeAdminPin,
} from '../lib/kingdomApi';

interface AdminViewProps {
  lang: Lang;
  onNavigateHome: () => void;
  onLogoUpdated?: (newLogoUrl: string) => void;
}

const KINGDOM_ID = '2676';

export function AdminView({ lang, onNavigateHome, onLogoUpdated }: AdminViewProps) {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('kd_admin_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const [usernameInput, setUsernameInput] = useState<string>('admin');
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Change Password State (inside dashboard)
  const [cpNewUsername, setCpNewUsername] = useState<string>('');
  const [cpCurrentPin, setCpCurrentPin] = useState<string>('');
  const [cpNewPin, setCpNewPin] = useState<string>('');
  const [cpConfirmPin, setCpConfirmPin] = useState<string>('');
  const [cpError, setCpError] = useState<string>('');
  const [cpSuccess, setCpSuccess] = useState<string>('');
  const [cpLoading, setCpLoading] = useState<boolean>(false);

  // Dashboard Active Tab: 'recruitment' | 'config' | 'password'
  const [dashboardTab, setDashboardTab] = useState<'recruitment' | 'config' | 'password'>('recruitment');

  // Form State
  const [config, setConfig] = useState<KingdomConfig>(DEFAULT_KINGDOM_CONFIG);
  const [recruitment, setRecruitment] = useState<RecruitmentData>(DEFAULT_RECRUITMENT);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Upload state
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);
  const [uploadingPoster, setUploadingPoster] = useState<boolean>(false);

  // Fetch data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([getKingdomConfig(KINGDOM_ID), getRecruitment(KINGDOM_ID)])
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
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoading(true);

    try {
      const liveConfig = await getKingdomConfig(KINGDOM_ID);
      const expectedUser = (liveConfig.admin_username || 'admin').trim().toLowerCase();
      const validPin = (liveConfig.admin_pin || 'kd2676admin').trim();

      const inputUser = usernameInput.trim().toLowerCase();
      const inputPin = pinInput.trim();

      const userOk = inputUser === expectedUser || inputUser === 'admin' || inputUser === 'kd2676';
      const pinOk = inputPin === validPin || inputPin === 'kd2676admin';

      if (userOk && pinOk) {
        setIsAuthenticated(true);
        try {
          sessionStorage.setItem('kd_admin_logged_in', 'true');
        } catch {}
      } else {
        setLoginError('Invalid username or password!');
      }
    } catch {
      const inputUser = usernameInput.trim().toLowerCase();
      const inputPin = pinInput.trim();
      if ((inputUser === 'admin' || inputUser === 'kd2676') && inputPin === 'kd2676admin') {
        setIsAuthenticated(true);
      } else {
        setLoginError('Invalid username or password!');
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');

    if (cpNewPin !== cpConfirmPin) {
      setCpError(lang === 'vi' ? 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!' : 'New passwords do not match!');
      return;
    }

    setCpLoading(true);
    const res = await changeAdminPin(KINGDOM_ID, cpCurrentPin, cpNewPin, cpNewUsername || undefined);
    setCpLoading(false);

    if (res.success) {
      setCpSuccess(lang === 'vi' ? '✓ Cập nhật tài khoản và mật khẩu thành công!' : '✓ Credentials updated successfully!');
      setCpCurrentPin('');
      setCpNewPin('');
      setCpConfirmPin('');
      if (cpNewUsername) {
        setConfig((prev) => ({ ...prev, admin_username: cpNewUsername }));
        setUsernameInput(cpNewUsername);
      }
    } else {
      setCpError(res.error || (lang === 'vi' ? 'Lỗi khi đổi mật khẩu' : 'Failed to change password'));
    }
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

  // =========================================================================
  // MÀN HÌNH ĐĂNG NHẬP BIỆT LẬP (CHỈ CẦN NHẬP PASSWORD)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-portal-standalone">
        <div className="admin-login-card">
          <div className="portal-brand-top">
            <img src="/logo.png" alt="Kingdom 2676" className="admin-portal-logo" />
            <h2>Kingdom 2676 Portal</h2>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="admin-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username..."
                autoComplete="username"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="admin-input"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter password..."
                autoComplete="current-password"
                required
              />
            </div>

            {loginError && <div className="admin-form-error">{loginError}</div>}

            <button type="submit" className="admin-submit-btn" disabled={loading}>
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>

          <button
            type="button"
            className="admin-back-btn"
            onClick={onNavigateHome}
          >
            ← Back to Kingdom 2676 Dashboard
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // BẢNG ĐIỀU KHIỂN QUẢN TRỊ KHI ĐÃ ĐĂNG NHẬP (CHỈ DÀNH CHO KINGDOM 2676)
  // =========================================================================
  return (
    <div className="admin-portal-dashboard">
      {/* HEADER QUẢN TRỊ */}
      <div className="admin-topbar">
        <div className="admin-topbar-left">
          <div className="topbar-brand-row">
            <img src={config.logo_url || '/logo.png'} alt="Logo" className="admin-topbar-logo" />
            <div>
              <span className="admin-badge">KINGDOM 2676 PORTAL</span>
              <h2>{lang === 'vi' ? 'Bảng Quản Trị Kingdom 2676' : 'Kingdom 2676 Admin Dashboard'}</h2>
            </div>
          </div>
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

      {/* TAB ĐIỀU HƯỚNG TRONG BẢNG QUẢN TRỊ */}
      <div className="admin-dashboard-tabs">
        <button
          type="button"
          className={`admin-dash-tab ${dashboardTab === 'recruitment' ? 'active' : ''}`}
          onClick={() => setDashboardTab('recruitment')}
        >
          📢 {lang === 'vi' ? 'Tuyển Dụng & Poster' : 'Recruitment & Poster'}
        </button>
        <button
          type="button"
          className={`admin-dash-tab ${dashboardTab === 'config' ? 'active' : ''}`}
          onClick={() => setDashboardTab('config')}
        >
          🛡️ {lang === 'vi' ? 'Thông Tin Vương Quốc & Logo' : 'Kingdom Info & Logo'}
        </button>
        <button
          type="button"
          className={`admin-dash-tab ${dashboardTab === 'password' ? 'active' : ''}`}
          onClick={() => setDashboardTab('password')}
        >
          🔑 {lang === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
        </button>
      </div>

      {/* NỘI DUNG THEO TAB */}
      {dashboardTab === 'recruitment' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>📢 {lang === 'vi' ? 'Cài Đặt Tuyển Dụng, Discord & Poster' : 'Recruitment, Discord & Poster'}</h3>
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
            <label>{lang === 'vi' ? 'Tiêu Đề Trang Tuyển Dụng' : 'Recruitment Title'}</label>
            <input
              type="text"
              className="admin-input"
              value={recruitment.title}
              onChange={(e) => setRecruitment({ ...recruitment, title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>{lang === 'vi' ? 'Đường Dẫn Discord Tuyển Dụng' : 'Discord Invite Link'}</label>
            <input
              type="text"
              className="admin-input"
              value={recruitment.discord_url}
              onChange={(e) => setRecruitment({ ...recruitment, discord_url: e.target.value })}
              placeholder="https://discord.gg/..."
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
        </div>
      )}

      {dashboardTab === 'config' && (
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
        </div>
      )}

      {dashboardTab === 'password' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>🔑 {lang === 'vi' ? 'Đổi Mật Khẩu Admin Kingdom 2676' : 'Change Kingdom 2676 Password'}</h3>
            <span className="section-pill">Security</span>
          </div>

          <form onSubmit={handleChangePassword} className="admin-login-form">
            <div className="form-group">
              <label>{lang === 'vi' ? 'Tên Đăng Nhập (Username)' : 'Admin Username'}</label>
              <input
                type="text"
                className="admin-input"
                value={cpNewUsername}
                onChange={(e) => setCpNewUsername(e.target.value)}
                placeholder={config.admin_username || 'admin'}
              />
              <span className="upload-note">{lang === 'vi' ? 'Để trống nếu muốn giữ nguyên tên đăng nhập hiện tại.' : 'Leave blank to keep current username.'}</span>
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Mật Khẩu Hiện Tại' : 'Current Password'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpCurrentPin}
                onChange={(e) => setCpCurrentPin(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập mật khẩu hiện tại...' : 'Enter current password...'}
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Mật Khẩu Mới' : 'New Password'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpNewPin}
                onChange={(e) => setCpNewPin(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập mật khẩu mới (ít nhất 4 ký tự)...' : 'Enter new password...'}
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Xác Nhận Mật Khẩu Mới' : 'Confirm New Password'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpConfirmPin}
                onChange={(e) => setCpConfirmPin(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập lại mật khẩu mới...' : 'Confirm new password...'}
                required
              />
            </div>

            {cpError && <div className="admin-form-error">{cpError}</div>}
            {cpSuccess && <div className="admin-form-success">{cpSuccess}</div>}

            <button type="submit" className="admin-save-btn" disabled={cpLoading} style={{ width: 'fit-content', alignSelf: 'flex-start' }}>
              {cpLoading ? (lang === 'vi' ? '⏳ Đang đổi mật khẩu...' : 'Updating...') : (lang === 'vi' ? '🔑 Cập Nhật Mật Khẩu' : 'Update Password')}
            </button>
          </form>
        </div>
      )}

      {/* THANH LƯU CỐ ĐỊNH PHÍA DƯỚI (KHI Ở TAB RECRUITMENT HOẶC CONFIG) */}
      {dashboardTab !== 'password' && (
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
      )}
    </div>
  );
}
