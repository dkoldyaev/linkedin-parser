import React, { useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, ExternalLink, Sparkles } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import { useBlueprintGrid } from '../utils/useBlueprintGrid';
import './LandingPage.css';

const stages = [
  { name: 'Сохранено', status: '01', color: 'var(--primary)', jobs: [['Product Designer', 'Linear'], ['UX Designer', 'Miro']] },
  { name: 'Отклик', status: '02', color: 'var(--col-applied)', jobs: [['Senior Product Designer', 'Loom']] },
  { name: 'Интервью', status: '03', color: 'var(--col-interview)', jobs: [['Design Lead', 'Vercel']] },
  { name: 'Оффер', status: '04', color: 'var(--col-offer)', jobs: [['Product Designer', 'Northstar']] },
];

const features = [
  { n: '01', title: 'Собирайте вакансии в одном месте', copy: 'Сохраняйте роли из LinkedIn и других площадок. Ссылка, источник и условия остаются рядом.', mark: 'СБОР' },
  { n: '02', title: 'Переводим с LinkedIn-овского на человеческий', copy: 'AI-саммари коротко объясняет суть вакансии: обязанности и требования, которые прямо указаны в описании.', mark: 'AI-САММАРИ' },
  { n: '03', title: 'Держите поиск под контролем', copy: 'Перемещайте вакансии по этапам, добавляйте заметки и находите нужное с помощью фильтров.', mark: 'ПРОЦЕСС' },
  { n: '04', title: 'Находите точное совпадение', copy: 'Сопоставляйте требования вакансии со своим резюме и готовьтесь к следующему шагу.', mark: 'РЕЗЮМЕ' },
];

export default function LandingPage({ onLoginSuccess }) {
  const [loginOpen, setLoginOpen] = useState(false);
  const pageRef = useBlueprintGrid();
  const start = () => setLoginOpen(true);

  return (
    <main ref={pageRef} className="landing-page bp-page">
      <div className="bp-container">
        <header className="app-header landing-nav">
          <a href="#top" className="brand" aria-label="LinkedIn Vacancies — наверх">
            <span className="brand-icon"><span className="blueprint-mark" aria-hidden="true" /></span>
            <span className="landing-brand-copy"><span className="brand-title">LinkedIn Vacancies</span><span className="brand-subtitle">ПОИСК РАБОТЫ / WORKSPACE</span></span>
          </a>
          <nav className="landing-nav-links" aria-label="Навигация по лендингу">
            <a href="#workflow" className="btn btn-secondary">Процесс</a>
            <a href="#features" className="btn btn-secondary">Возможности</a>
            <button className="btn btn-primary" onClick={start}>Открыть приложение <ArrowRight size={14} /></button>
          </nav>
        </header>

        <section className="landing-hero bp-grid-row" id="top" data-cols="2">
          <div className="hero-copy bp-snap" data-min-grids="14">
            <div className="landing-kicker"><span className="sys-status-dot" /> ПОИСК РАБОТЫ / ВАШ ПРОЦЕСС</div>
            <h1 className="info-title">Меньше вкладок.<br /><span>Больше</span> движения.</h1>
            <p className="info-text hero-lede">Соберите вакансии и отклики в одном месте. А LinkedIn-овский язык вакансий мы переведём на человеческий.</p>
            <div className="hero-actions">
              <button className="btn btn-primary" onClick={start}>Начать поиск <ArrowRight size={14} /></button>
              <a className="btn btn-secondary" href="#workflow"><ArrowDown size={13} /> Как это работает</a>
            </div>
            <div className="hero-proof"><span className="column-index">ПОИСК</span><span>Вакансии, этапы и резюме — в одной доске.</span></div>
          </div>

          <div className="hero-board bp-snap" data-min-grids="14" aria-label="Пример доски вакансий">
            <div className="column-header landing-board-header">
              <div className="column-title-group"><span className="column-index">01</span><span className="column-dot" style={{ background: 'var(--primary)' }} /><span className="column-name">МОЙ ПОИСК</span></div>
              <span className="column-badge">5 вакансий</span>
            </div>
            <div className="kanban-board landing-demo-board">
              {stages.map((stage) => (
                <section className="kanban-column landing-demo-column" key={stage.name}>
                  <header className="column-header landing-stage-header">
                    <div className="column-title-group"><span className="column-index">{stage.status}</span><span className="column-dot" style={{ background: stage.color }} /><span className="column-name">{stage.name}</span></div>
                    <span className="column-badge">{stage.jobs.length}</span>
                  </header>
                  <div className="column-cards landing-demo-cards">
                    {stage.jobs.map(([title, company]) => (
                      <article className="kanban-card landing-demo-card" key={title}>
                        <div className="card-grid-content"><div className="card-grid-body-content">
                          <div className="card-header-meta"><span className="card-source-link">LINKEDIN <ExternalLink size={10} /></span></div>
                          <h3 className="card-title">{title}</h3>
                          <span className="landing-company">{company} <span>·</span> Remote</span>
                        </div></div>
                        <div className="card-footer"><span>ОБНОВЛЕНО СЕГОДНЯ</span><ArrowUpRight size={12} /></div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="landing-board-status"><span><span className="sys-status-dot" /> ИЗМЕНЕНИЯ СОХРАНЕНЫ</span><span>ДОСКА / 04 ЭТАПА</span></div>
          </div>
        </section>

        <div className="landing-signal column-header"><span>ОДНО МЕСТО</span><span className="column-dot" style={{ background: 'var(--primary)' }} /><span>ПОНЯТНЫЕ ЭТАПЫ</span><span className="column-dot" style={{ background: 'var(--aspen-mint)' }} /><span>ВАЖНОЕ ПОД РУКОЙ</span><span className="column-dot" style={{ background: 'var(--primary)' }} /><span>ВАШ ТЕМП</span></div>

        <section className="landing-section" id="workflow">
          <header className="column-header landing-section-header"><div className="column-title-group"><span className="column-index">01</span><span className="column-dot" style={{ background: 'var(--primary)' }} /><span className="column-name">ПРОСТОЙ ПРОЦЕСС</span></div><span className="bp-col-tag">ОТ НАХОДКИ ДО ОТКЛИКА</span></header>
          <div className="landing-section-intro bp-snap" data-min-grids="6"><h2 className="info-title">От первой находки<br />до <span>новой работы.</span></h2><p className="info-text">Хороший поиск — это последовательность понятных шагов, собранных в одном месте.</p></div>
          <div className="landing-steps bp-grid-row" data-cols="3">
            {[
              ['01', 'Сохраняйте', 'Добавьте вакансию из LinkedIn или другой площадки. Источник и ссылка сохранятся вместе с ней.'],
              ['02', 'Разбирайтесь', 'Читайте короткое AI-саммари вместо длинного корпоративного описания вакансии.'],
              ['03', 'Действуйте', 'Отслеживайте отклики, интервью и следующие шаги на своей доске.'],
            ].map(([n, title, copy]) => (
              <article className="bp-col landing-step" key={n}>
                <div className="column-header"><div className="column-title-group"><span className="column-index">{n}</span><span className="column-dot" style={{ background: n === '02' ? 'var(--aspen-mint)' : 'var(--primary)' }} /><span className="column-name">{title}</span></div></div>
                <div className="bp-cell-intro bp-snap landing-step-copy" data-min-grids="4"><p className="info-text">{copy}</p></div>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section" id="features">
          <header className="column-header landing-section-header"><div className="column-title-group"><span className="column-index">02</span><span className="column-dot" style={{ background: 'var(--aspen-mint)' }} /><span className="column-name">ИНСТРУМЕНТЫ ПОИСКА</span></div><span className="bp-col-tag">СОБРАНО В ОДНОМ WORKSPACE</span></header>
          <div className="landing-section-intro bp-snap" data-min-grids="5"><h2 className="info-title">Всё важное.<br /><span>Без лишнего.</span></h2><p className="info-text">Больше ясности в каждой вакансии и каждом следующем шаге.</p></div>
          <div className="landing-features">
            {features.map((item) => (
              <article className="landing-feature" key={item.n}>
                <div className="column-title-group"><span className="column-index">{item.n}</span><span className="column-dot" style={{ background: item.n === '02' ? 'var(--aspen-mint)' : 'var(--primary)' }} /></div>
                <div className="landing-feature-copy"><h3 className="column-name">{item.title}</h3><p className="info-text">{item.copy}</p></div>
                <span className="bp-col-tag">{item.mark}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section landing-advantage">
          <header className="column-header landing-section-header"><div className="column-title-group"><span className="column-index">03</span><span className="column-dot" style={{ background: 'var(--primary)' }} /><span className="column-name">ВАШЕ ПРЕИМУЩЕСТВО</span></div><span className="bp-col-tag">ПОИСК / ИТОГО</span></header>
          <div className="landing-advantage-grid bp-grid-row" data-cols="2">
            <div className="landing-section-intro bp-snap" data-min-grids="8"><h2 className="info-title">Не просто список.<br /><span>Видимый прогресс.</span></h2><p className="info-text">Когда вакансии, источники, этапы и резюме связаны, проще увидеть приоритеты и направить внимание на следующий шаг.</p><button className="btn btn-primary" onClick={start}>Собрать свой процесс <ArrowRight size={14} /></button></div>
            <div className="kanban-column landing-summary-column">
              <div className="column-header"><div className="column-title-group"><span className="column-index">СЕЙЧАС</span><span className="column-dot" style={{ background: 'var(--aspen-mint)' }} /><span className="column-name">ПОИСК ИДЁТ</span></div></div>
              <div className="column-cards landing-summary-cards">
                {stages.slice(0, 3).map((stage, i) => <div className="landing-summary-row" key={stage.status}><span className="column-index">{stage.status}</span><span className="column-name">{stage.name}</span><span className="column-badge">{['08', '05', '02'][i]}</span></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="landing-cta bp-snap" data-min-grids="10">
          <div className="column-header landing-section-header"><div className="column-title-group"><span className="column-index">04</span><span className="column-dot" style={{ background: 'var(--aspen-mint)' }} /><span className="column-name">СЛЕДУЮЩИЙ ШАГ ЗА ВАМИ</span></div><span className="bp-col-tag">LINKEDIN VACANCIES</span></div>
          <div className="landing-cta-content"><h2 className="info-title">Пусть поиск<br />работает <span>на вас.</span></h2><p className="info-text">Начните собирать свой процесс в одном месте.</p><button className="btn btn-primary" onClick={start}>Открыть приложение <ArrowRight size={14} /></button></div>
        </section>

        <footer className="landing-footer"><a href="#top" className="brand"><span className="brand-icon"><span className="blueprint-mark" aria-hidden="true" /></span><span className="brand-title">LinkedIn Vacancies</span></a><span className="landing-footer-copy">ПОИСК РАБОТЫ / WORKSPACE</span><a className="btn btn-secondary" href="/about">О проекте <ArrowUpRight size={13} /></a></footer>
      </div>
      {loginOpen && <div className="landing-login"><button className="login-dismiss" aria-label="Закрыть" onClick={() => setLoginOpen(false)}>×</button><LoginModal onLoginSuccess={onLoginSuccess} /></div>}
    </main>
  );
}
