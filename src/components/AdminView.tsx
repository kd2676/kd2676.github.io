import { useState, useEffect } from 'react';
import type { Lang } from '../i18n';
import {
  type KingdomConfig,
  type RecruitmentData,
  type AdminUser,
  DEFAULT_KINGDOM_CONFIG,
  DEFAULT_RECRUITMENT,
  getKingdomConfig,
  getRecruitment,
  updateKingdomConfig,
  updateRecruitment,
  uploadMedia,
  authenticateAdmin,
  getAdminUsers,
  createAdminUser,
  deleteAdminUser,
  updateUserPassword,
  OFFICER_ROLES,
} from '../lib/kingdomApi';

interface AdminViewProps {
  lang: Lang;
  onNavigateHome: () => void;
  onLogoUpdated?: (newLogoUrl: string) => void;
}

type DashboardTab = 'recruitment' | 'config' | 'users' | 'password';

const TAB_TO_PATH: Record<DashboardTab, string> = {
  recruitment: '/admin/recruitment',
  config: '/admin/config',
  users: '/admin/users',
  password: '/admin/password',
};

function getDashboardTabFromUrl(): DashboardTab {
  try {
    const raw = decodeURIComponent(window.location.pathname).toLowerCase().trim().replace(/\/+$/, '');
    if (raw.endsWith('/users')) return 'users';
    if (raw.endsWith('/config') || raw.endsWith('/info') || raw.endsWith('/logo')) return 'config';
    if (raw.endsWith('/password') || raw.endsWith('/pass')) return 'password';
    if (raw.endsWith('/recruitment') || raw.endsWith('/poster')) return 'recruitment';
  } catch {}
  return 'recruitment';
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

  const [currentUser, setCurrentUser] = useState<string>(() => {
    try {
      return sessionStorage.getItem('kd_admin_user') || 'admin';
    } catch {
      return 'admin';
    }
  });

  const [currentUserRole, setCurrentUserRole] = useState<string>(() => {
    try {
      return sessionStorage.getItem('kd_admin_role') || (currentUser === 'admin' ? 'Admin' : 'R4 Officer');
    } catch {
      return currentUser === 'admin' ? 'Admin' : 'R4 Officer';
    }
  });

  const [usernameInput, setUsernameInput] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Dashboard Active Tab: backed by URL (/admin/recruitment, /admin/config, /admin/users, /admin/password)
  const [dashboardTab, setDashboardTabState] = useState<DashboardTab>(getDashboardTabFromUrl);

  const setDashboardTab = (tabKey: DashboardTab, replace = false) => {
    setDashboardTabState(tabKey);
    try {
      const targetPath = TAB_TO_PATH[tabKey];
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ adminTab: tabKey }, '', targetPath);
        } else {
          window.history.pushState({ adminTab: tabKey }, '', targetPath);
        }
      }
    } catch {}
  };

  useEffect(() => {
    const handlePopState = () => {
      setDashboardTabState(getDashboardTabFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      const current = window.location.pathname.replace(/\/+$/, '');
      if (current === '/admin') {
        window.history.replaceState({ adminTab: dashboardTab }, '', TAB_TO_PATH[dashboardTab]);
      }
    }
  }, [isAuthenticated, dashboardTab]);

  // User Management State
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<string>('R4 Officer');
  const [userActionMsg, setUserActionMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [userCreating, setUserCreating] = useState<boolean>(false);

  // Change Password State
  const [cpCurrentPass, setCpCurrentPass] = useState<string>('');
  const [cpNewPass, setCpNewPass] = useState<string>('');
  const [cpConfirmPass, setCpConfirmPass] = useState<string>('');
  const [cpError, setCpError] = useState<string>('');
  const [cpSuccess, setCpSuccess] = useState<string>('');
  const [cpLoading, setCpLoading] = useState<boolean>(false);

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

    Promise.all([
      getKingdomConfig(KINGDOM_ID),
      getRecruitment(KINGDOM_ID),
      getAdminUsers(),
    ])
      .then(([cfg, rec, users]) => {
        if (!isMounted) return;
        setConfig(cfg);
        setRecruitment(rec);
        if (users) setAdminUsers(users);
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
      const res = await authenticateAdmin(usernameInput, pinInput);

      if (res.success && res.user) {
        setIsAuthenticated(true);
        setCurrentUser(res.user.username);
        setCurrentUserRole(res.user.role);
        setPinInput('');
        try {
          sessionStorage.setItem('kd_admin_logged_in', 'true');
          sessionStorage.setItem('kd_admin_user', res.user.username);
          sessionStorage.setItem('kd_admin_role', res.user.role);
        } catch {}
      } else {
        setLoginError(res.error || 'Invalid username or password!');
      }
    } catch {
      setLoginError('Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUsernameInput('');
    setPinInput('');
    setLoginError('');
    try {
      sessionStorage.removeItem('kd_admin_logged_in');
      sessionStorage.removeItem('kd_admin_user');
      sessionStorage.removeItem('kd_admin_role');
    } catch {}
  };

  const currentAccount = adminUsers.find(
    (u) => u.username.toLowerCase() === currentUser.toLowerCase()
  );
  const effectiveRole = currentAccount?.role || (currentUser.toLowerCase() === 'admin' ? 'Admin' : currentUserRole);
  const isR4 = effectiveRole === 'R4 Officer';

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserActionMsg(null);
    setUserCreating(true);

    const res = await createAdminUser(newUserName, newUserRole, effectiveRole);
    setUserCreating(false);

    if (res.success) {
      setUserActionMsg({
        type: 'ok',
        text: lang === 'vi'
          ? `✓ Đã tạo tài khoản "${newUserName}" thành công với mật khẩu mặc định là "kd2676"!`
          : `✓ User "${newUserName}" created successfully with default password "kd2676"!`,
      });
      setNewUserName('');
      const updated = await getAdminUsers();
      setAdminUsers(updated);
    } else {
      setUserActionMsg({
        type: 'error',
        text: res.error || (lang === 'vi' ? 'Lỗi khi tạo tài khoản' : 'Failed to create user'),
      });
    }
  };

  const handleDeleteUser = async (id: string, uname: string, targetRole?: string) => {
    if (isR4 && (targetRole === 'R5 Leader' || targetRole === 'Admin')) {
      alert(lang === 'vi' ? 'Cán bộ R4 không có quyền xóa tài khoản R5 Leader!' : 'R4 Officers cannot delete R5 Leader accounts!');
      return;
    }

    if (!window.confirm(lang === 'vi' ? `Bạn có chắc muốn xóa tài khoản "${uname}"?` : `Are you sure you want to delete user "${uname}"?`)) {
      return;
    }

    const res = await deleteAdminUser(id, uname, effectiveRole, targetRole);
    if (res.success) {
      setUserActionMsg({
        type: 'ok',
        text: lang === 'vi' ? `✓ Đã xóa tài khoản "${uname}"` : `✓ Deleted user "${uname}"`,
      });
      const updated = await getAdminUsers();
      setAdminUsers(updated);
    } else {
      setUserActionMsg({
        type: 'error',
        text: res.error || 'Failed to delete user',
      });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError('');
    setCpSuccess('');

    if (cpNewPass !== cpConfirmPass) {
      setCpError(lang === 'vi' ? 'Mật khẩu mới và xác nhận mật khẩu không trùng khớp!' : 'New passwords do not match!');
      return;
    }

    setCpLoading(true);
    const res = await updateUserPassword(currentUser, cpCurrentPass, cpNewPass);
    setCpLoading(false);

    if (res.success) {
      setCpSuccess(
        lang === 'vi'
          ? `✓ Đổi mật khẩu cho tài khoản "${currentUser}" thành công!`
          : `✓ Password for "${currentUser}" updated successfully!`
      );
      setCpCurrentPass('');
      setCpNewPass('');
      setCpConfirmPass('');
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
  // MÀN HÌNH ĐĂNG NHẬP BIỆT LẬP (USERNAME & PASSWORD)
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="admin-portal-standalone">
        <div className="admin-login-card">
          <div className="portal-brand-top">
            <img src="/logo.png" alt="Kingdom 2676" className="admin-portal-logo" />
            <h2>Kingdom 2676 Portal</h2>
          </div>

          <form onSubmit={handleLogin} className="admin-login-form" autoComplete="off">
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="admin-input"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Enter username..."
                autoComplete="off"
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
                autoComplete="new-password"
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
              <h2>{lang === 'vi' ? 'Bảng Quản Trị Kingdom 2676' : 'Kingdom 2676 Admin Dashboard'}</h2>
            </div>
          </div>
        </div>
        <div className="admin-topbar-actions">
          <span className="logged-in-user-tag">
            {effectiveRole === 'R5 Leader' && <img src="/r5.png" alt="R5" className="topbar-rank-icon" />}
            {effectiveRole === 'R4 Officer' && <img src="/r4.png" alt="R4" className="topbar-rank-icon" />}
            {effectiveRole === 'Admin' && <span className="topbar-admin-crown">👑</span>}
            <strong>{currentUser}</strong>
            <span className={`user-role-mini-pill ${effectiveRole === 'R5 Leader' ? 'pill-r5' : effectiveRole === 'R4 Officer' ? 'pill-r4' : 'pill-admin'}`}>
              {effectiveRole}
            </span>
          </span>
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
          className={`admin-dash-tab ${dashboardTab === 'users' ? 'active' : ''}`}
          onClick={() => setDashboardTab('users')}
        >
          👥 {lang === 'vi' ? 'Tài Khoản R4/R5' : 'User Management'}
        </button>
        <button
          type="button"
          className={`admin-dash-tab ${dashboardTab === 'password' ? 'active' : ''}`}
          onClick={() => setDashboardTab('password')}
        >
          🔑 {lang === 'vi' ? 'Đổi Mật Khẩu' : 'Change Password'}
        </button>
      </div>

      {/* 1. TAB RECRUITMENT */}
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

      {/* 2. TAB CONFIG */}
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

      {/* 3. TAB USER MANAGEMENT (TẠO USER VỚI MẬT KHẨU MẶC ĐỊNH KD2676) */}
      {dashboardTab === 'users' && (
        <div className="admin-card user-management-card">
          <div className="admin-card-header">
            <h3>👥 {lang === 'vi' ? 'Quản Lý Tài Khoản Ban Chỉ Huy (R4 / R5)' : 'R4 / R5 User Management'}</h3>
            <span className="section-pill">Users</span>
          </div>

          {userActionMsg && (
            <div className={`admin-alert ${userActionMsg.type}`}>
              {userActionMsg.type === 'ok' ? '✓ ' : '⚠️ '}
              {userActionMsg.text}
            </div>
          )}

          {/* FORM TẠO USER MỚI (CHỈ R5 LEADER VÀ ADMIN MỚI THẤY) */}
          {!isR4 && (
          <div className="create-user-section">
            <h4 className="sub-title">
              {lang === 'vi' ? '+ Thêm Tài Khoản Admin Mới' : '+ Add New Admin User'}
            </h4>
            <p className="admin-hint">
              {lang === 'vi'
                ? '💡 Mật khẩu mặc định khi tạo mới là "kd2676". Thành viên mới có thể đăng nhập bình thường và tự đổi mật khẩu trong tab Đổi Mật Khẩu.'
                : '💡 Default password is set to "kd2676". The user can log in and change their password anytime.'}
            </p>

            <form onSubmit={handleCreateUser} className="create-user-inline-form">
              <div className="form-group flex-1">
                <label>{lang === 'vi' ? 'Tên Tài Khoản (Username)' : 'Username'}</label>
                <input
                  type="text"
                  className="admin-input"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Ví dụ: r4_john, combat_lead..."
                  required
                />
              </div>

              <div className="form-group flex-1">
                <label>{lang === 'vi' ? 'Vai Trò / Chức Vụ (Chọn từ danh sách)' : 'Role / Title (Select from list)'}</label>
                <select
                  className="admin-input admin-select"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                >
                  {(isR4 ? OFFICER_ROLES.filter((r) => r.id === 'R4 Officer') : OFFICER_ROLES).map((r) => (
                    <option key={r.id} value={r.id}>
                      {lang === 'vi' ? r.labelVi : r.labelEn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group form-submit-wrap">
                <label>&nbsp;</label>
                <button type="submit" className="admin-save-btn" disabled={userCreating}>
                  {userCreating ? '⏳ Đang tạo...' : '+ Tạo Tài Khoản'}
                </button>
              </div>
            </form>
          </div>
          )}

          {/* DANH SÁCH USER HIỆN CÓ */}
          <div className="existing-users-section">
            <h4 className="sub-title">
              {lang === 'vi' ? 'Danh Sách Tài Khoản Đang Hoạt Động' : 'Active Admin Accounts'}
            </h4>
            <div className="users-table-wrap">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>{lang === 'vi' ? 'Vai Trò' : 'Role'}</th>
                    <th>{lang === 'vi' ? 'Thao Tác' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {adminUsers.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="user-name-cell">
                          <span className="user-avatar-dot">👤</span>
                          <strong>{u.username}</strong>
                          {u.username === currentUser && (
                            <span className="you-pill">{lang === 'vi' ? 'Bạn' : 'You'}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="role-cell-wrap">
                          {u.role === 'R5 Leader' && <img src="/r5.png" alt="R5" className="rok-rank-icon" />}
                          {u.role === 'R4 Officer' && <img src="/r4.png" alt="R4" className="rok-rank-icon" />}
                          <span
                            className={`role-tag ${
                              u.role === 'Admin'
                                ? 'role-admin'
                                : u.role === 'R5 Leader'
                                ? 'role-r5'
                                : 'role-r4'
                            }`}
                          >
                            {u.role === 'Admin' ? '👑 Admin' : u.role}
                          </span>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          const isTargetRoot = u.username.toLowerCase() === 'admin';
                          const isSelf = u.username.toLowerCase() === currentUser.toLowerCase();
                          const canDelete =
                            !isTargetRoot &&
                            !isSelf &&
                            !isR4 &&
                            (effectiveRole === 'Admin' || (effectiveRole === 'R5 Leader' && u.role === 'R4 Officer'));

                          if (canDelete) {
                            return (
                              <button
                                type="button"
                                className="btn-del-user"
                                onClick={() => handleDeleteUser(u.id, u.username, u.role)}
                                title={lang === 'vi' ? 'Xóa tài khoản này' : 'Delete'}
                              >
                                🗑️ {lang === 'vi' ? 'Xóa' : 'Delete'}
                              </button>
                            );
                          }
                          return <span className="no-action-dash">—</span>;
                        })()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB CHANGE PASSWORD */}
      {dashboardTab === 'password' && (
        <div className="admin-card">
          <div className="admin-card-header">
            <h3>🔑 {lang === 'vi' ? `Đổi Mật Khẩu Tài Khoản (${currentUser})` : `Change Password (${currentUser})`}</h3>
            <span className="section-pill">Security</span>
          </div>

          <form onSubmit={handleChangePassword} className="admin-login-form">
            <div className="form-group">
              <label>{lang === 'vi' ? 'Mật Khẩu Hiện Tại' : 'Current Password'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpCurrentPass}
                onChange={(e) => setCpCurrentPass(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập mật khẩu hiện tại...' : 'Enter current password...'}
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Mật Khẩu Mới' : 'New Password'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpNewPass}
                onChange={(e) => setCpNewPass(e.target.value)}
                placeholder={lang === 'vi' ? 'Nhập mật khẩu mới (ít nhất 4 ký tự)...' : 'Enter new password...'}
                required
              />
            </div>

            <div className="form-group">
              <label>{lang === 'vi' ? 'Xác Nhận Mật Khẩu Mới' : 'Confirm New Password'}</label>
              <input
                type="password"
                className="admin-input"
                value={cpConfirmPass}
                onChange={(e) => setCpConfirmPass(e.target.value)}
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
      {(dashboardTab === 'recruitment' || dashboardTab === 'config') && (
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
