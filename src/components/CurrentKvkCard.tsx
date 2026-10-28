import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ChronicleStage {
  id: string;
  name: string;
  subtitle: string;
  status: 'completed' | 'active' | 'upcoming' | 'locked';
  iconType: 'fort' | 'pass' | 'arrows' | 'ziggurat' | 'sea' | 'door';
  progressPercent: number;
  utcDate: string;
  desc: {
    en: string;
    vi: string;
  };
  reward: {
    en: string;
    vi: string;
  };
}

export interface CurrentKvkInfo {
  name: string;
  code?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  coverUrl?: string;
  chronicles?: ChronicleStage[];
}

interface CurrentKvkCardProps {
  kvk?: CurrentKvkInfo;
  lang?: 'vi' | 'en';
}

function formatUtcDisplay(utcStr: string, lang: 'vi' | 'en') {
  if (lang !== 'vi') return utcStr;
  return utcStr
    .replace('Sep', 'Th09')
    .replace('Oct', 'Th10')
    .replace('Nov', 'Th11');
}

const DEFAULT_CHRONICLES: ChronicleStage[] = [
  {
    id: 'c1',
    name: 'The Lost Secret',
    subtitle: 'Prologue',
    status: 'completed',
    iconType: 'fort',
    progressPercent: 100,
    utcDate: '25 Sep 00:00 UTC',
    desc: {
      en: 'Defeat Marauders wandering the realm to recover secret map fragments and dispatch scouts to the frontier.',
      vi: 'Tiêu diệt Quân Thổ Phỉ lang thang khắp vương quốc để thu thập mảnh bản đồ mật và phái đội trinh sát tới biên giới.'
    },
    reward: {
      en: '300 Gems, 8h Gathering Boost, 50,000 Food & Wood',
      vi: '300 Đá quý, Tăng tốc thu gom 8h, 50.000 Lương thực & Gỗ'
    }
  },
  {
    id: 'c2',
    name: 'First Steps',
    subtitle: 'Zone 4 Frontier',
    status: 'completed',
    iconType: 'door',
    progressPercent: 100,
    utcDate: '26 Sep 06:00 UTC',
    desc: {
      en: 'Governors establish camp in the starting province of the Lost Kingdom and construct initial Crusader Flags.',
      vi: 'Các Thống đốc dựng trại tại tỉnh xuất phát của Lost Kingdom và xây dựng những lá Cờ Thập tự chinh đầu tiên.'
    },
    reward: {
      en: '500 Gems, Level 4 Random Teleport, 100 Alliance Honor',
      vi: '500 Đá quý, Dịch chuyển ngẫu nhiên Cấp 4, 100 Điểm danh vọng'
    }
  },
  {
    id: 'c3',
    name: 'Lvl 14 Barbarian Forts',
    subtitle: 'Hall of Unity',
    status: 'completed',
    iconType: 'fort',
    progressPercent: 100,
    utcDate: '28 Sep 00:00 UTC',
    desc: {
      en: 'Rally and defeat level 14 Barbarian Forts across provinces to unseal initial borders and build Alliance Honor.',
      vi: 'Tập kích và tiêu diệt các Pháo đài Man rợ cấp 14 trong các tỉnh để mở phong ấn lãnh thổ và tích lũy Danh vọng liên minh.'
    },
    reward: {
      en: '500 Gems, 24h Speedups, Alliance Honor Points, Crusader Chests',
      vi: '500 Đá quý, Tăng tốc 24h, Điểm danh vọng liên minh, Rương Thập tự chinh'
    }
  },
  {
    id: 'c4',
    name: 'Past Glory',
    subtitle: 'Crusader Camp',
    status: 'completed',
    iconType: 'ziggurat',
    progressPercent: 100,
    utcDate: '30 Sep 12:00 UTC',
    desc: {
      en: 'Donate resources, clear lingering marauders, and offer commander sculptures to rebuild ancient Crusader bastions.',
      vi: 'Quyên góp tài nguyên, dọn dẹp thổ phỉ và cúng dường tượng chỉ huy để tái thiết các pháo lũy Thập tự quân cổ xưa.'
    },
    reward: {
      en: 'Alliance Buff: +15% Gathering Speed, 800 Gems, Crusader Chests',
      vi: 'Bùa liên minh: +15% Tốc độ thu gom, 800 Đá quý, Rương Thập tự chinh'
    }
  },
  {
    id: 'c5',
    name: 'Lvl 7 Passes (Unsealed)',
    subtitle: 'Brink of Annihilation',
    status: 'completed',
    iconType: 'pass',
    progressPercent: 100,
    utcDate: '02 Oct 00:00 UTC',
    desc: {
      en: 'Level 7 Passes unseal! Advance from starting zones into contested outer territories of the Lost Kingdom.',
      vi: 'Các Quan ải cấp 7 mở phong ấn! Liên minh vượt ra khỏi tỉnh xuất phát để tiến vào vùng đất tranh chấp Lost Kingdom.'
    },
    reward: {
      en: 'Level 7 Pass Occupation Rights, 1,000 Gems, Individual Acclaim',
      vi: 'Quyền kiểm soát Quan ải cấp 7, 1.000 Đá quý, Điểm Chiến công cá nhân'
    }
  },
  {
    id: 'c6',
    name: 'Ancient Ruins',
    subtitle: 'Zone 5 Sanctum',
    status: 'completed',
    iconType: 'ziggurat',
    progressPercent: 100,
    utcDate: '05 Oct 04:00 UTC',
    desc: {
      en: 'Unseal Ancient Ruins in Zone 5. Secure holy circles against rival kingdoms to earn massive Commander EXP and Honor.',
      vi: 'Mở phong ấn Tàn tích Cổ xưa ở Khu vực 5. Chiếm giữ vòng tròn thánh địa để nhận lượng lớn EXP Chỉ huy và Điểm danh vọng.'
    },
    reward: {
      en: '500,000 Commander EXP, 24h Speedups, 1,000 Gems',
      vi: '500.000 EXP Chỉ huy, Tăng tốc 24h, 1.000 Đá quý'
    }
  },
  {
    id: 'c7',
    name: 'Arrows Nocked',
    subtitle: 'Eve of the Crusade',
    status: 'completed',
    iconType: 'arrows',
    progressPercent: 100,
    utcDate: '08 Oct 00:00 UTC',
    desc: {
      en: 'Defeat roving Marauders and Marauder Encampments to gather Crusade Parchments and bolster military stores.',
      vi: 'Tiêu diệt Quân Thổ Phỉ và Doanh trại Thổ Phỉ để thu thập Mảnh da dê Thập tự chinh và chuẩn bị quân nhu.'
    },
    reward: {
      en: 'Troop Training Speedups, High-tier Resource Packs, Crusader Supplies',
      vi: 'Tăng tốc huấn luyện quân, Gói tài nguyên lớn, Hòm tiếp tế Thập tự chinh'
    }
  },
  {
    id: 'c8',
    name: 'Dark Altars',
    subtitle: 'Sacred Ground',
    status: 'completed',
    iconType: 'ziggurat',
    progressPercent: 100,
    utcDate: '12 Oct 12:00 UTC',
    desc: {
      en: 'Occupy Dark Altars in Zone 5. Fight continuous barbarian waves and opposing coalitions to gain vital kingdom buffs.',
      vi: 'Chiếm đóng Bàn thờ Hắc ám ở Khu vực 5. Chống chọi các đợt quái man rợ và phe địch để nhận bùa chiến đấu vương quốc.'
    },
    reward: {
      en: 'Kingdom Buff: +5% Troop Attack, 1,200 Gems, Gold Keys',
      vi: 'Bùa vương quốc: +5% Tấn công lính, 1.200 Đá quý, Chìa khóa vàng'
    }
  },
  {
    id: 'c9',
    name: 'Forward Fortresses',
    subtitle: 'Bastion of Valor',
    status: 'completed',
    iconType: 'fort',
    progressPercent: 100,
    utcDate: '15 Oct 00:00 UTC',
    desc: {
      en: 'Construct Forward Alliance Fortresses in contested zones to prepare frontline rally bases for the center push.',
      vi: 'Xây dựng các Pháo đài Liên minh tiền tiêu tại vùng tranh chấp để chuẩn bị căn cứ tập kích tiến vào trung tâm.'
    },
    reward: {
      en: 'Alliance Tech Boost, 1,500 Gems, 5x Legendary Starlight Sculptures',
      vi: 'Tăng tốc Công nghệ liên minh, 1.500 Đá quý, 5 Tượng Ánh sao Huyền thoại'
    }
  },
  {
    id: 'c10',
    name: 'Lvl 8 Passes (Unsealed)',
    subtitle: 'Wolves & Lambs',
    status: 'completed',
    iconType: 'pass',
    progressPercent: 100,
    utcDate: '18 Oct 00:00 UTC',
    desc: {
      en: 'Level 8 Passes unseal into the central ring. Coalition camps wage fierce battles over key mountain bottlenecks.',
      vi: 'Quan ải cấp 8 mở phong ấn tiến vào vòng lõi trung tâm. Các phe liên minh giao chiến quyết liệt tại các nút thắt đèo.'
    },
    reward: {
      en: 'Level 8 Pass Control, 1,500 Gems, Legendary Commander Sculptures',
      vi: 'Kiểm soát Quan ải cấp 8, 1.500 Đá quý, Tượng Chỉ huy Huyền thoại'
    }
  },
  {
    id: 'c11',
    name: 'Zone 6 Bastions',
    subtitle: 'The Deep Frontier',
    status: 'completed',
    iconType: 'fort',
    progressPercent: 100,
    utcDate: '21 Oct 06:00 UTC',
    desc: {
      en: 'Establish bastions within Zone 6 and complete legendary commander quests for strategy cards and tactical abilities.',
      vi: 'Thiết lập các cứ điểm trong Khu vực 6 và hoàn thành nhiệm vụ chỉ huy huyền thoại để nhận thẻ chiến thuật.'
    },
    reward: {
      en: '1,500 Gems, 3x Universal Legendary Commander Sculptures, 50h Speedups',
      vi: '1.500 Đá quý, 3 Tượng Chỉ huy Vàng Đa năng, Tăng tốc 50h'
    }
  },
  {
    id: 'c12',
    name: 'The Great Ziggurat',
    subtitle: 'Siege',
    status: 'active',
    iconType: 'ziggurat',
    progressPercent: 65,
    utcDate: '24 Oct 12:00 UTC',
    desc: {
      en: 'Active Stage: Siege and hold the Great Ziggurat at the center of the Lost Kingdom to secure ultimate supremacy!',
      vi: 'Giai đoạn hiện tại: Công hãm và chiếm đóng Đại Đền Ziggurat tại tâm điểm Lost Kingdom để giành ngôi vương tối thượng!'
    },
    reward: {
      en: 'Lost Kingdom Conqueror Crown, 5,000 Gems, City Theme: Ancient Citadel',
      vi: 'Vương miện Quán quân Lost Kingdom, 5.000 Đá quý, Trang phục thành phố Đền Cổ Đại'
    }
  },
  {
    id: 'c13',
    name: 'Lvl 9 Passes (Unsealed)',
    subtitle: 'Holy Site Heroes',
    status: 'upcoming',
    iconType: 'pass',
    progressPercent: 15,
    utcDate: '28 Oct 00:00 UTC',
    desc: {
      en: 'Level 9 Passes unseal to open direct vanguard corridors to holy sites ahead of the final showdown.',
      vi: 'Quan ải cấp 9 mở phong ấn kết nối trực tiếp các mũi xung kích đến các thánh địa trước trận đại quyết chiến.'
    },
    reward: {
      en: 'Pass 9 Control, Alliance Territory Expansion Bonus Points',
      vi: 'Kiểm soát Quan ải cấp 9, Điểm thưởng Chiến công mở rộng lãnh thổ'
    }
  },
  {
    id: 'c14',
    name: 'Kingsland Heart',
    subtitle: 'The Imperial Circle',
    status: 'upcoming',
    iconType: 'ziggurat',
    progressPercent: 5,
    utcDate: '01 Nov 12:00 UTC',
    desc: {
      en: 'Defend inner ring territories around Kingsland and withstand rival coalition pincer counterattacks.',
      vi: 'Bảo vệ các vùng lãnh thổ vòng trong bao quanh Kingsland và đẩy lùi các đợt tập kích gọng kìm của phe địch.'
    },
    reward: {
      en: '2,000 Gems, 5x Legendary Commander Sculptures, 30h Universal Speedups',
      vi: '2.000 Đá quý, 5 Tượng Vàng Chỉ huy, Tăng tốc Đa năng 30h'
    }
  },
  {
    id: 'c15',
    name: 'Stormy Seas',
    subtitle: 'Naval Dominance',
    status: 'locked',
    iconType: 'sea',
    progressPercent: 0,
    utcDate: '05 Nov 00:00 UTC',
    desc: {
      en: 'Complete remaining regional bastion objectives and fortify frontline outposts before the armistice.',
      vi: 'Hoàn thành các mục tiêu cứ điểm chiến lược còn lại và củng cố tiền đồn phòng thủ trước lệnh ngừng bắn.'
    },
    reward: {
      en: 'Acclaim Ranking Chests, Crusade Honor Badges',
      vi: 'Rương xếp hạng Chiến công, Huy hiệu Thập tự chinh'
    }
  },
  {
    id: 'c16',
    name: 'Clash of Titans',
    subtitle: 'The Final Stand',
    status: 'locked',
    iconType: 'arrows',
    progressPercent: 0,
    utcDate: '09 Nov 00:00 UTC',
    desc: {
      en: 'Final open-field clash across contested zones. Alliances expend remaining war stockpiles to secure final Honor rankings.',
      vi: 'Trận đụng độ đánh đồng tổng lực cuối cùng. Các liên minh dốc toàn lực quân nhu để chốt thứ hạng Danh vọng toàn mùa.'
    },
    reward: {
      en: '2,500 Gems, Golden Crusader Chest, 10x Legendary Commander Sculptures',
      vi: '2.500 Đá quý, Rương Thập tự chinh Vàng, 10 Tượng Chỉ huy Vàng'
    }
  },
  {
    id: 'c17',
    name: 'Twilight Vigil',
    subtitle: 'Guardian Watch',
    status: 'locked',
    iconType: 'fort',
    progressPercent: 0,
    utcDate: '13 Nov 00:00 UTC',
    desc: {
      en: 'Combat ceasefire begins. Governors guard occupied holy sites and tally final individual kill and dead points.',
      vi: 'Lệnh ngừng bắn có hiệu lực. Các Thống đốc canh giữ các thánh địa đã chiếm đóng và kết sổ điểm kill/dead cá nhân.'
    },
    reward: {
      en: 'Peace Treaty Chest, 3,000 Gems, Honor Milestone Commendations',
      vi: 'Rương Hiệp ước Hòa bình, 3.000 Đá quý, Tuyên dương cột mốc Danh vọng'
    }
  },
  {
    id: 'c18',
    name: 'The Final Door',
    subtitle: 'Crusader Glory',
    status: 'locked',
    iconType: 'door',
    progressPercent: 0,
    utcDate: '16 Nov 00:00 UTC',
    desc: {
      en: 'The Final Door concludes the Lost Kingdom campaign. Season settlement and individual honors distributed.',
      vi: 'Cánh cửa cuối cùng khép lại chiến dịch Lost Kingdom. Tổng kết mùa giải, phát thưởng vinh danh cá nhân và liên minh.'
    },
    reward: {
      en: 'Season Settlement Rewards, Conqueror / Defender Commendations',
      vi: 'Phần thưởng tổng kết mùa giải, Tuyên dương Kẻ Chinh Phục / Người Bảo Vệ'
    }
  }
];

export function CurrentKvkCard({ kvk, lang = 'vi' }: CurrentKvkCardProps) {
  const [selectedStage, setSelectedStage] = useState<ChronicleStage | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const name = kvk?.name || 'Mighty Assembly';
  const code = kvk?.code || 'C13315';
  const startDate = kvk?.startDate || '2026-09-25';
  const endDate = kvk?.endDate || '2026-11-16';
  const chronicles = kvk?.chronicles && kvk.chronicles.length > 0 ? kvk.chronicles : DEFAULT_CHRONICLES;

  // Calculate overall timeline percentage
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = Date.now();
  const totalDuration = Math.max(1, end - start);
  const elapsed = Math.max(0, Math.min(totalDuration, now - start));
  const progressPercent = Math.round((elapsed / totalDuration) * 100);

  // Auto-scroll to active stage on load
  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeEl = scrollContainerRef.current.querySelector('.chronicle-card.active') as HTMLElement;
      if (activeEl) {
        const container = scrollContainerRef.current;
        const targetScroll = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, []);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const renderChronicleIcon = (type: ChronicleStage['iconType'], status: ChronicleStage['status']) => {
    switch (type) {
      case 'ziggurat':
        return (
          <div className="chronicle-crest-icon ziggurat-crest" title="The Great Ziggurat">
            🏛️
          </div>
        );
      case 'pass':
        return (
          <div
            className={`chronicle-crest-icon pass-crest ${status === 'active' ? 'active' : ''}`}
            title={lang === 'vi' ? 'Quan ải' : 'Pass'}
          >
            🛡️
          </div>
        );
      case 'fort':
        return <div className="chronicle-crest-icon fort-crest">🏰</div>;
      case 'arrows':
        return <div className="chronicle-crest-icon arrows-crest">🏹</div>;
      case 'sea':
        return <div className="chronicle-crest-icon sea-crest">⚓</div>;
      case 'door':
        return <div className="chronicle-crest-icon door-crest">🚪</div>;
      default:
        return <div className="chronicle-crest-icon default-crest">✦</div>;
    }
  };

  const coverUrl = kvk?.coverUrl || '/covers/s21mighty_assembly_cover.png';
  const currentStageIndex = selectedStage ? chronicles.findIndex(c => c.id === selectedStage.id) : -1;

  return (
    <>
      <article
        className="panel current-kvk-card"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(13, 17, 25, 0.94) 0%, rgba(13, 17, 25, 0.72) 48%, rgba(13, 17, 25, 0.22) 100%), url(${coverUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'right center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {/* Header: KvK Dashboard */}
        <div className="current-kvk-header">
          <div className="current-kvk-title-group">
            <span className="kvk-section-title">
              {lang === 'vi' ? 'BẢNG ĐIỀU KHIỂN KVK' : 'KVK DASHBOARD'}
            </span>
            <div className="kvk-code-row">
              <h2 className="kvk-code-heading">#{code}</h2>
              <span className="kvk-name-badge">{name}</span>
              <span className="kvk-status-live">
                <i className="status-dot ready pulse" />
                {lang === 'vi' ? 'Đang diễn ra' : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* KvK Progress ROKStats Style Dual Track */}
        <div className="rok-progress-section">
          <div className="rok-progress-header">
            <div className="rok-progress-label">
              <span>{lang === 'vi' ? 'Tiến độ KvK' : 'KvK Progress'}</span> <b>{progressPercent}%</b>
            </div>
            <div className="rok-progress-schedule">
              {lang === 'vi' ? '25/09/2026 – 16/11/2026' : '25 Sep 2026 — 16 Nov 2026'}
            </div>
          </div>

          <div className="rok-dual-lines">
            {/* Top Line: Lost Kingdom (95.5% orange) + Settlement (4.5% purple) */}
            <div className="rok-line top-line">
              <div className="rok-segment orange" style={{ width: '95.5%' }} />
              <div className="rok-segment purple" style={{ width: '4.5%' }} />
            </div>

            {/* Bottom Line: Current Time Progress (59% blue) */}
            <div className="rok-line bottom-line">
              <div className="rok-segment blue" style={{ width: `${progressPercent}%` }} />
            </div>
          </div>

          <div className="rok-dates-row">
            <span>{lang === 'vi' ? '25/09/2026' : '25 Sep 2026'}</span>
            <span>{lang === 'vi' ? '16/11/2026' : '16 Nov 2026'}</span>
          </div>
        </div>

        {/* Chronicles Section */}
        <div className="chronicles-container">
          <div className="chronicles-header">
            <div className="chronicles-title-wrap">
              <h4>{lang === 'vi' ? 'Biên niên sử' : 'Chronicles'}</h4>
              <span className="chronicles-count-badge">
                {chronicles.length} {lang === 'vi' ? 'Giai đoạn' : 'Stages'}
              </span>
            </div>

            <div className="chronicles-nav-actions">
              <div className="chronicles-scroll-arrows">
                <button
                  type="button"
                  className="chronicles-arrow-btn"
                  onClick={scrollLeft}
                  title={lang === 'vi' ? 'Cuộn sang trái' : 'Scroll left'}
                  aria-label="Scroll left"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="chronicles-arrow-btn"
                  onClick={scrollRight}
                  title={lang === 'vi' ? 'Cuộn sang phải' : 'Scroll right'}
                  aria-label="Scroll right"
                >
                  ›
                </button>
              </div>

              <div className="chronicles-utc-badge">
                <span>UTC</span>
              </div>
            </div>
          </div>

          {/* Chronicles Card Grid / Horizontal Scroll Track */}
          <div className="chronicles-grid" ref={scrollContainerRef}>
            {chronicles.map((stage, idx) => (
              <div
                key={stage.id}
                className={`chronicle-card ${stage.status}`}
                onClick={() => setSelectedStage(stage)}
                title={lang === 'vi' ? `Giai đoạn ${idx + 1}: ${stage.name}` : `Stage ${idx + 1}: ${stage.name}`}
              >
                <div className="card-top-track">
                  <div
                    className={`card-track-fill ${stage.status}`}
                    style={{ width: `${stage.progressPercent || 0}%` }}
                  />
                  {stage.status === 'completed' && <span className="track-marker done" />}
                  {stage.status === 'active' && <span className="track-marker pulse active" />}
                  {stage.status === 'locked' && <span className="track-lock">🔒</span>}
                </div>

                <div className="card-body">
                  <div className="card-text">
                    <div className="card-title-row">
                      <span className="card-stage-num">#{idx + 1}</span>
                      <b className="card-name" title={stage.name}>
                        {stage.name}
                      </b>
                    </div>
                    <span className="card-sub">{stage.subtitle}</span>
                    <small className="card-date">{formatUtcDisplay(stage.utcDate, lang)}</small>
                  </div>

                  <div className="card-icon-wrap">
                    {renderChronicleIcon(stage.iconType, stage.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </article>

      {/* Chronicle Stage Detail Modal */}
      {selectedStage && typeof document !== 'undefined' && createPortal(
        <div className="modal-backdrop" onClick={() => setSelectedStage(null)}>
          <div
            className="modal-box chronicle-detail-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div>
                <span className="section-kicker">
                  {lang === 'vi'
                    ? `BIÊN NIÊN SỬ · GIAI ĐOẠN ${currentStageIndex + 1}/${chronicles.length}`
                    : `CHRONICLE · STAGE ${currentStageIndex + 1}/${chronicles.length}`}
                </span>
                <h3>{selectedStage.name}</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setSelectedStage(null)}
                aria-label={lang === 'vi' ? 'Đóng' : 'Close'}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Stage Subtitle & Status Badge */}
              <div className="chronicle-modal-status-bar">
                <div className="chronicle-modal-meta">
                  <b>{selectedStage.subtitle}</b>
                  <span>·</span>
                  <span className="modal-date-chip">{selectedStage.utcDate}</span>
                </div>
                <span className={`stage-badge-status ${selectedStage.status}`}>
                  {selectedStage.status === 'completed' && (lang === 'vi' ? '✓ Đã hoàn thành' : '✓ Completed')}
                  {selectedStage.status === 'active' && (lang === 'vi' ? '⚔ Đang diễn ra' : '⚔ In Progress')}
                  {selectedStage.status === 'upcoming' && (lang === 'vi' ? '⏳ Sắp mở' : '⏳ Upcoming')}
                  {selectedStage.status === 'locked' && (lang === 'vi' ? '🔒 Đang khóa' : '🔒 Locked')}
                </span>
              </div>


              {/* Stage Rewards */}
              <div className="modal-info-card reward-card">
                <div className="card-heading-icon">
                  <span className="icon">🎁</span>
                  <b>{lang === 'vi' ? 'Phần thưởng' : 'Rewards'}</b>
                </div>
                <p>{lang === 'vi' ? selectedStage.reward.vi : selectedStage.reward.en}</p>
              </div>

              {/* Stage Quick Switcher (All 18 stages) */}
              <div className="stage-quick-nav">
                <span className="nav-label">
                  {lang === 'vi' ? 'Chuyển nhanh giai đoạn:' : 'Jump to stage:'}
                </span>
                <div className="stage-nav-pills scrollable-nav-pills">
                  {chronicles.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`stage-nav-pill ${c.status} ${selectedStage.id === c.id ? 'active' : ''}`}
                      onClick={() => setSelectedStage(c)}
                      title={`${idx + 1}. ${c.name}`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-primary"
                onClick={() => setSelectedStage(null)}
              >
                {lang === 'vi' ? 'Đóng' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
