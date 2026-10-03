import React, { useState, useEffect } from 'react';
import { Route } from '../App';
import { colors, font, spacing, radii, shadows, transitions, styles, formatCNY } from '../styles/theme';
import { experienceApi, Experience } from '../api/client';

interface LandingPageProps {
  navigate: (route: Route) => void;
}

const CITIES = ['伊斯坦布尔', '卡帕多奇亚', '安塔利亚', '博德鲁姆', '伊兹密尔'];
const CATEGORIES = ['滑翔伞', '热气球', '文化体验', '美食', '海岸活动', '历史古迹'];

const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExperiences();
  }, []);

  const loadExperiences = async () => {
    try {
      const data = await experienceApi.explore({ limit: 12 });
      setExperiences(Array.isArray(data) ? data : (data as any).data || []);
    } catch {
      // API may not be running; keep empty state
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (searchQuery.trim()) {
        const data = await experienceApi.search(searchQuery, {
          city: selectedCity || undefined,
          category: selectedCategory || undefined,
        });
        setExperiences(Array.isArray(data) ? data : (data as any).data || []);
      } else {
        await loadExperiences();
        return;
      }
    } catch {
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ ...styles.page, backgroundColor: colors.white }}>
      {/* ─── Top Nav ─── */}
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${spacing.md} ${spacing.xxxl}`,
          backgroundColor: colors.white,
          borderBottom: `1px solid ${colors.borderLight}`,
          position: 'sticky' as const,
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${colors.primary}, ${colors.primaryDark})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: colors.white,
              fontWeight: 700,
            }}
          >
            远
          </div>
          <div>
            <div style={{ fontSize: font.sizes.lg, fontWeight: font.weights.bold, color: colors.text }}>
              Yuanly AI
            </div>
            <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary }}>
              土耳其旅行体验平台
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: spacing.md, alignItems: 'center' }}>
          <button
            onClick={() => navigate('merchant-login')}
            style={styles.buttonSecondary}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = colors.primarySoft; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            商家登录
          </button>
          <button
            onClick={() => navigate('admin-login')}
            style={{
              ...styles.buttonGhost,
              color: colors.textSecondary,
              border: `1px solid ${colors.border}`,
              borderRadius: radii.button,
              padding: '10px 20px',
            }}
          >
            管理后台
          </button>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section
        style={{
          position: 'relative' as const,
          padding: `${spacing.xxxl} ${spacing.xxxl} ${spacing.xxl}`,
          textAlign: 'center' as const,
          background: `linear-gradient(180deg, ${colors.primarySoft} 0%, ${colors.white} 100%)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute' as const,
            top: '-100px',
            right: '-50px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.primary}10, transparent 70%)`,
          }}
        />
        <div
          style={{
            position: 'absolute' as const,
            bottom: '-80px',
            left: '-30px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.secondary}10, transparent 70%)`,
          }}
        />

        <div style={{ position: 'relative' as const, maxWidth: '800px', margin: '0 auto' }}>
          <span
            style={{
              ...styles.pill,
              backgroundColor: colors.white,
              color: colors.primary,
              border: `1px solid ${colors.primaryLight}`,
              marginBottom: spacing.lg,
              display: 'inline-block',
            }}
          >
            ✨ AI 智能推荐 · 200+ 精选体验
          </span>
          <h1
            style={{
              fontSize: font.sizes.display,
              fontWeight: font.weights.bold,
              color: colors.text,
              lineHeight: 1.15,
              marginBottom: spacing.md,
            }}
          >
            探索土耳其的
            <span style={{ color: colors.primary }}>奇妙体验</span>
          </h1>
          <p
            style={{
              fontSize: font.sizes.lg,
              color: colors.textSecondary,
              marginBottom: spacing.xl,
              lineHeight: 1.6,
            }}
          >
            从卡帕多奇亚的热气球到伊斯坦布尔的美食之旅，
            <br />
            为中国游客精心打造的土耳其旅行体验平台
          </p>

          {/* Search bar */}
          <div
            style={{
              display: 'flex',
              gap: spacing.sm,
              maxWidth: '700px',
              margin: '0 auto',
              backgroundColor: colors.white,
              borderRadius: radii.button,
              padding: '8px',
              boxShadow: shadows.lg,
            }}
          >
            <input
              type="text"
              placeholder="搜索体验，如"热气球"、"滑翔伞"..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                padding: '12px 18px',
                fontSize: font.sizes.md,
                fontFamily: font.family,
                color: colors.text,
                backgroundColor: 'transparent',
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                ...styles.buttonPrimary,
                display: 'flex',
                alignItems: 'center',
                gap: spacing.xs,
              }}
            >
              🔍 搜索
            </button>
          </div>

          {/* Quick filters */}
          <div style={{ display: 'flex', gap: spacing.sm, justifyContent: 'center', marginTop: spacing.lg, flexWrap: 'wrap' as const }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSearchQuery(cat);
                  setTimeout(handleSearch, 0);
                }}
                style={{
                  ...styles.pill,
                  backgroundColor: selectedCategory === cat ? colors.primary : colors.white,
                  color: selectedCategory === cat ? colors.white : colors.textSecondary,
                  border: `1px solid ${selectedCategory === cat ? colors.primary : colors.border}`,
                  cursor: 'pointer',
                  transition: transitions.fast,
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── City tabs ─── */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: `${spacing.xl} ${spacing.xl}` }}>
        <div style={{ display: 'flex', gap: spacing.md, marginBottom: spacing.xl, flexWrap: 'wrap' as const }}>
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => {
                setSelectedCity(city);
                setSearchQuery(city);
                setTimeout(handleSearch, 0);
              }}
              style={{
                padding: '10px 24px',
                borderRadius: radii.pill,
                border: `1.5px solid ${selectedCity === city ? colors.primary : colors.border}`,
                backgroundColor: selectedCity === city ? colors.primarySoft : colors.white,
                color: selectedCity === city ? colors.primary : colors.text,
                fontSize: font.sizes.sm,
                fontWeight: font.weights.medium,
                cursor: 'pointer',
                fontFamily: font.family,
                transition: transitions.fast,
              }}
            >
              📍 {city}
            </button>
          ))}
        </div>

        {/* ─── Experiences grid ─── */}
        <h2 style={{ fontSize: font.sizes.xl, fontWeight: font.weights.bold, color: colors.text, marginBottom: spacing.lg }}>
          {loading ? '加载中...' : `精选体验 (${experiences.length})`}
        </h2>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing.lg }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: radii.card,
                  height: '320px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
            ))}
          </div>
        ) : experiences.length === 0 ? (
          <div
            style={{
              ...styles.card,
              textAlign: 'center' as const,
              padding: spacing.xxxl,
              color: colors.textSecondary,
            }}
          >
            <div style={{ fontSize: '48px', marginBottom: spacing.md }}>🗺️</div>
            <div style={{ fontSize: font.sizes.md, marginBottom: spacing.sm }}>暂无体验数据</div>
            <div style={{ fontSize: font.sizes.sm, color: colors.textTertiary }}>
              请确保后端服务正在运行 (http://localhost:5000)
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: spacing.lg }}>
            {experiences.map((exp) => (
              <ExperienceCard key={exp.id} experience={exp} />
            ))}
          </div>
        )}
      </section>

      {/* ─── Feature section ─── */}
      <section
        style={{
          backgroundColor: colors.surface,
          padding: `${spacing.xxxl} ${spacing.xl}`,
          marginTop: spacing.xxl,
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2
            style={{
              fontSize: font.sizes.xxl,
              fontWeight: font.weights.bold,
              color: colors.text,
              textAlign: 'center' as const,
              marginBottom: spacing.xl,
            }}
          >
            为什么选择 Yuanly AI？
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: spacing.lg }}>
            {FEATURES.map((f) => (
              <div
                key={f.title}
                style={{
                  ...styles.card,
                  textAlign: 'center' as const,
                }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '18px',
                    backgroundColor: f.color + '15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '30px',
                    margin: '0 auto ' + spacing.md,
                  }}
                >
                  {f.icon}
                </div>
                <h3 style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.sm }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: font.sizes.sm, color: colors.textSecondary, lineHeight: 1.6 }}>
                  {f.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer
        style={{
          backgroundColor: colors.text,
          padding: `${spacing.xl} ${spacing.xl}`,
          color: colors.white,
          textAlign: 'center' as const,
        }}
      >
        <div style={{ marginBottom: spacing.sm, fontSize: font.sizes.lg, fontWeight: font.weights.bold }}>
          Yuanly AI · 远丽智能
        </div>
        <div style={{ fontSize: font.sizes.sm, color: colors.textTertiary, marginBottom: spacing.md }}>
          为中国游客打造的土耳其旅行体验平台
        </div>
        <div style={{ fontSize: font.sizes.xs, color: colors.textTertiary }}>
          © 2026 Yuanly AI. All rights reserved.
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

// ─── Experience card sub-component ──────────────────────────────────────────

const ExperienceCard: React.FC<{ experience: Experience }> = ({ experience }) => {
  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: radii.card,
        overflow: 'hidden',
        boxShadow: shadows.card,
        transition: transitions.normal,
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = shadows.lg;
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = shadows.card;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Image */}
      <div
        style={{
          height: '200px',
          background: `linear-gradient(135deg, ${colors.primaryLight}, ${colors.secondaryLight})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          position: 'relative' as const,
        }}
      >
        {experience.images?.[0] ? (
          <img
            src={experience.images[0]}
            alt={experience.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span>🎈</span>
        )}
        <span
          style={{
            position: 'absolute' as const,
            top: spacing.sm,
            right: spacing.sm,
            ...styles.pill,
            backgroundColor: colors.white,
            color: colors.text,
          }}
        >
          {experience.category}
        </span>
      </div>

      {/* Content */}
      <div style={{ padding: spacing.lg }}>
        <div style={{ fontSize: font.sizes.xs, color: colors.textSecondary, marginBottom: '4px' }}>
          📍 {experience.city || experience.location}
        </div>
        <h3 style={{ fontSize: font.sizes.md, fontWeight: font.weights.semibold, color: colors.text, marginBottom: spacing.sm, lineHeight: 1.4 }}>
          {experience.titleZh || experience.title}
        </h3>
        <p
          style={{
            fontSize: font.sizes.xs,
            color: colors.textSecondary,
            marginBottom: spacing.md,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap' as const,
          }}
        >
          {experience.descriptionZh || experience.description}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
            <span style={{ color: colors.secondary, fontSize: font.sizes.sm }}>★</span>
            <span style={{ fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: colors.text }}>
              {experience.rating?.toFixed(1) || '5.0'}
            </span>
            <span style={{ fontSize: font.sizes.xs, color: colors.textTertiary }}>
              ({experience.reviewCount || 0})
            </span>
          </div>
          <div style={{ fontSize: font.sizes.lg, fontWeight: font.weights.bold, color: colors.primary }}>
            {formatCNY(experience.price)}
          </div>
        </div>
      </div>
    </div>
  );
};

const FEATURES = [
  {
    icon: '🤖',
    title: 'AI 智能推荐',
    description: '基于您的偏好和预算，智能推荐最合适的旅行体验',
    color: colors.primary,
  },
  {
    icon: '🎯',
    title: '精选体验',
    description: '200+ 经过验证的高质量体验项目，覆盖土耳其各大城市',
    color: colors.secondary,
  },
  {
    icon: '💬',
    title: '中文服务',
    description: '全程中文客服支持，消除语言障碍，安心出行',
    color: colors.accent,
  },
  {
    icon: '🔒',
    title: '安全支付',
    description: '支持微信支付和支付宝，安全可靠的支付体验',
    color: colors.info,
  },
];

export default LandingPage;