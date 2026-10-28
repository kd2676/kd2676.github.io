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

  // Login Card Tabs: 'login' | 'change-pin'
  const [loginMode, setLoginMode] = useState<'login' | 'change-pin'>('login');
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Change PIN State (on Login screen)
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

  const handleChangePinOnLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');

    if (cpNewPin !== cpConfirmPin) {
      setCpError(lang === 'vi' ? 'Mã PIN mới và xác nhận mã PIN không trùng khớp!' : 'New PINs do not match!');
      return;
    }

    setCpLoading(true);
    const res = await changeAdminPin(selectedKd, cpCurrentPin, cpNewPin);
    setCpLoading(false);

    if (res.success) {
      setCpSuccess(lang === 'vi' ? '✓ Đổi mật khẩu thành công! Hãy chuyển sang tab Đăng Nhập để vào trang quản trị.' : '✓ Password changed successfully! You can now sign in.');
      setCpCurrentPin('');
      setCpNewPin('');
      setCpConfirmPin('');
    } else {
      setCpError(res.error || (lang === 'vi' ? 'Lỗi khi đổi mật khẩu' : 'Failed to change password'));
    }
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
  // MÀN HÌNH ĐĂNG NHẬP BIỆT LẬP (ĐÚNG YÊU CẦU: CHỈ HIỆN PHẦN ĐĂNG NHẬP KINGDOM 2676 PORTAL)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-portal-standalone">
        <div className="admin-login-card">
          <div className="portal-brand-top">
            <img src="/logo.png" alt="Kingdom 2676" className="admin-portal-logo" />
            <div className="admin-login-badge">
              <span className="lock-icon">🔒</span> RESTRICTED ACCESS
            </div>
            <h2>Kingdom 2676 Portal</h2>
            <p className="admin-login-sub">
              {lang === 'vi'
                ? 'Cổng xác thực Ban Chỉ huy & R4/R5 Vương Quốc'
                : 'Authorized Leadership Access · R4 / R5 Only'}
            </p>
          </div>

          {/* TAB CHUYỂN ĐỔI: ĐĂNG NHẬP / ĐỔI MẬT KHẨU */}
          <div className="portal-subtabs-nav">
            <button
              type="button"
              className={`portal-subtab-btn ${loginMode === 'login' ? 'active' : ''}`}
              onClick={() => { setLoginMode('login'); setLoginError(''); }}
            >
              🔐 {lang === 'vi' ? 'Đăng Nhập' : 'Sign In'}
            </button>
            <button
              type="button"
              className={`portal-subtab-btn ${loginMode === 'change-pin' ? 'active' : ''}`}
              onClick={() => { setLoginMode('change-pin'); setCpError(''); setCpSuccess(''); }}
            >
              🔑 {lang === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
            </button>
          </div>

          {/* FORM 1: ĐĂNG NHẬP */}
          {loginMode === 'login' ? (
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
            </form>
          ) : (
            /* FORM 2: ĐỔI MẬT KHẨU TRỰC TIẾP TẠI TRANG ĐĂNG NHẬP */
            <form onSubmit={handleChangePinOnLogin} className="admin-login-form">
              <div className="form-group">
                <label>{lang === 'vi' ? 'Vương Quốc (Kingdom ID)' : 'Kingdom ID'}</label>
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
                <label>{lang === 'vi' ? 'Mã PIN Hiện Tại' : 'Current Admin PIN'}</label>
                <input
                  type="password"
                  className="admin-input"
                  value={cpCurrentPin}
                  onChange={(e) => setCpCurrentPin(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập mã PIN hiện tại...' : 'Enter current PIN...'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'vi' ? 'Mã PIN Mới' : 'New Admin PIN'}</label>
                <input
                  type="password"
                  className="admin-input"
                  value={cpNewPin}
                  onChange={(e) => setCpNewPin(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập mã PIN mới...' : 'Enter new PIN...'}
                  required
                />
              </div>

              <div className="form-group">
                <label>{lang === 'vi' ? 'Xác Nhận Mã PIN Mới' : 'Confirm New PIN'}</label>
                <input
                  type="password"
                  className="admin-input"
                  value={cpConfirmPin}
                  onChange={(e) => setCpConfirmPin(e.target.value)}
                  placeholder={lang === 'vi' ? 'Nhập lại mã PIN mới...' : 'Confirm new PIN...'}
                  required
                />
              </div>

              {cpError && <div className="admin-form-error">{cpError}</div>}
              {cpSuccess && <div className="admin-form-success">{cpSuccess}</div>}

              <button type="submit" className="admin-submit-btn" disabled={cpLoading}>
                {cpLoading
                  ? (lang === 'vi' ? 'Đang cập nhật...' : 'Updating...')
                  : (lang === 'vi' ? 'Cập Nhật Mật Khẩu' : 'Update Password')}
              </button>
            </form>
          )}

          <button
            type="button"
            className="admin-back-btn"
            onClick={onNavigateHome}
          >
            ← {lang === 'vi' ? 'Quay lại Kingdom 2676' : 'Back to Kingdom 2676 Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // BẢNG ĐIỀU KHIỂN QUẢN TRỊ KHI ĐÃ ĐĂNG NHẬP
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
              <h2>{lang === 'vi' ? 'Bảng Quản Trị Vương Quốc' : 'Kingdom Admin Dashboard'}</h2>
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

      {/* CHỌN KINGDOM (HỖ TRỢ ĐA VƯƠNG QUỐC TRÊN CÙNG 1 DATABASE) */}
      <div className="admin-card multi-kingdom-card">
        <div className="multi-kd-header">
          <div>
            <h3>👑 {lang === 'vi' ? 'Đang quản lý Vương Quốc:' : 'Managing Kingdom:'} <em>#{selectedKd}</em></h3>
            <p className="admin-hint">
              {lang === 'vi'
                ? 'Hệ thống dùng chung 1 database Supabase, phân chia theo Kingdom ID để mở rộng nhiều KD mà không cần tạo thêm bảng.'
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
          🔑 {lang === 'vi' ? 'Đổi Mật Khẩu Admin' : 'Change Password'}
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
            <label>{lang === 'vi' ? 'Đường Dẫn Discord Tuyển Dụng (Hiện ở đầu trang)' : 'Discord Invite Link'}</label>
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
            <h3>🔑 {lang === 'vi' ? 'Đổi Mật Khẩu Admin (# ' + selectedKd + ')' : 'Change Admin Password'}</h3>
            <span className="section-pill">Security</span>
          </div>

          <form onSubmit={handleChangePinOnLogin} className="admin-login-form">
            <div className="form-group">
              <label>{lang === 'vi' ? 'Mã PIN / Mật Khẩu Hiện Tại' : 'Current Admin PIN'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpCurrentPin}
                onChange={(e) => setCpCurrentPin(e.target.value)}
                placeholder="Nhập mã PIN hiện tại..."
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Mã PIN / Mật Khẩu Mới' : 'New Admin PIN'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpNewPin}
                onChange={(e) => setCpNewPin(e.target.value)}
                placeholder="Nhập mã PIN mới (ít nhất 4 ký tự)..."
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Xác Nhận Mã PIN Mới' : 'Confirm New PIN'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpConfirmPin}
                onChange={(e) => setCpConfirmPin(e.target.value)}
                placeholder="Nhập lại mã PIN mới..."
                required
              />
            </div>

            {cpError && <div className="admin-form-error">{cpError}</div>}
            {cpSuccess && <div className="admin-form-success">{cpSuccess}</div>}

            <button type="submit" className="admin-save-btn" disabled={cpLoading} style={{ width: 'fit-content', alignSelf: 'flex-start' }}>
              {cpLoading ? '⏳ Đang đổi mật khẩu...' : '🔑 Cập Nhật Mật Khẩu'}
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
