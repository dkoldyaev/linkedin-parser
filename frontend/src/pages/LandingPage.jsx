import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BriefcaseBusiness, Check, ChevronRight, Search, Sparkles } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import './LandingPage.css';

const stages = [
  { name: 'Сохранено', color: '#5b8cff', jobs: [['Product Designer', 'Linear', '€65–80k'], ['UX Designer', 'Miro', 'Remote']] },
  { name: 'Отклик', color: '#46b7c8', jobs: [['Senior Product Designer', 'Loom', '€72–90k']] },
  { name: 'Интервью', color: '#e6a94b', jobs: [['Design Lead', 'Vercel', '€90–110k']] },
  { name: 'Оффер', color: '#42c697', jobs: [['Product Designer', 'Northstar', '€85k']] },
];

const features = [
  { n: '01', title: 'Собирайте вакансии в одном месте', copy: 'Сохраняйте подходящие роли с LinkedIn и других площадок. Условия, источник и ссылка остаются рядом.', mark: '01 / СБОР' },
  { n: '02', title: 'Держите поиск под контролем', copy: 'Перемещайте вакансии по этапам, добавляйте заметки и быстро находите нужное с помощью фильтров.', mark: '02 / ПРОЦЕСС' },
  { n: '03', title: 'Находите точное совпадение', copy: 'Сопоставляйте требования вакансии со своим резюме и готовьтесь к отклику с полной картиной.', mark: '03 / ФОКУС' },
];

export default function LandingPage({ onLoginSuccess }) {
  const [loginOpen, setLoginOpen] = useState(false);
  useEffect(() => {
    const nodes = document.querySelectorAll('.landing-reveal');
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const start = () => setLoginOpen(true);
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <a className="landing-brand" href="#top" aria-label="LinkedIn Vacancies — наверх"><span className="brand-glyph"><BriefcaseBusiness size={17} /></span><span>vacancy<span className="brand-light">.work</span></span></a>
        <div className="landing-links"><a href="#workflow">Как это работает</a><a href="#features">Возможности</a><a href="/howtouse">Инструкция <ArrowUpRight size={13} /></a></div>
        <button className="landing-nav-cta" onClick={start}>Открыть приложение <ArrowRight size={14} /></button>
      </nav>

      <section className="landing-hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span className="live-dot" /> ВАШ ПОИСК РАБОТЫ — В ОДНОМ ПРОСТРАНСТВЕ</div>
          <h1>Меньше вкладок.<br /><span>Больше</span> движения.</h1>
          <p className="hero-lede">Соберите вакансии, отклики и интервью в понятную систему — чтобы ни одна хорошая возможность не потерялась.</p>
          <div className="hero-actions"><button className="button-primary" onClick={start}>Начать поиск <ArrowRight size={16} /></button><a className="button-quiet" href="#workflow"><span className="play-mark"><ArrowDown size={14} /></span> Посмотреть, как работает</a></div>
          <div className="hero-proof"><div className="avatar-stack"><i>А</i><i>М</i><i>И</i><i>+</i></div><span>Для тех, кто ищет работу<br /><b>осознанно и без хаоса</b></span></div>
        </div>
        <div className="hero-visual" aria-label="Пример доски вакансий">
          <div className="orbit orbit-one" /><div className="orbit orbit-two" />
          <div className="board-window">
            <div className="window-top"><div className="window-lights"><i /><i /><i /></div><span>MY JOB SEARCH / BOARD</span><div className="window-avatar">A</div></div>
            <div className="board-toolbar"><div><span className="board-title">Мой поиск</span><span className="board-date"> · обновлено сегодня</span></div><div className="board-tools"><Search size={14} /><span className="board-filter">Фильтры <span>2</span></span><span className="board-add">+</span></div></div>
            <div className="board-grid">{stages.map((stage, i) => <div className="board-column" key={stage.name} style={{ '--stage-color': stage.color, '--column-delay': `${i * 90}ms` }}><div className="column-label"><span className="stage-dot" />{stage.name}<span className="column-count">0{stage.jobs.length}</span></div>{stage.jobs.map(([title, company, salary]) => <article className="job-card" key={title}><div className="job-company"><span className="company-monogram">{company[0]}</span><span>{company}</span><ArrowUpRight size={11} /></div><h3>{title}</h3><div className="job-meta"><span>{salary}</span><span>↗ Remote</span></div></article>)}</div>)}</div>
            <div className="board-status"><span><span className="live-dot" /> Все изменения сохранены</span><span>5 вакансий <span className="status-separator">/</span> 4 этапа</span></div>
          </div>
          <div className="floating-note note-match"><span className="note-icon"><Sparkles size={15} /></span><span><b>Совпадение найдено</b><small>Резюме подходит на 86%</small></span><span className="match-score">86</span></div>
          <div className="floating-note note-source"><span className="source-in">in</span><span><b>Вакансия сохранена</b><small>LinkedIn · 2 минуты назад</small></span><Check size={15} className="note-check" /></div>
          <span className="visual-index">FIG 01 — ВАША СИСТЕМА ПОИСКА</span>
        </div>
        <a className="hero-scroll" href="#workflow"><span>ЛИСТАЙТЕ, ЧТОБЫ УЗНАТЬ</span><ArrowDown size={13} /></a>
      </section>

      <section className="signal-strip"><div className="signal-inner"><span>ОДНО МЕСТО</span><i /><span>ПОНЯТНЫЕ ЭТАПЫ</span><i /><span>ВАЖНОЕ ПОД РУКОЙ</span><i /><span>ВАШ ТЕМП</span></div></section>

      <section className="workflow-section" id="workflow">
        <div className="section-heading landing-reveal"><div className="eyebrow"><span className="section-number">01</span> ПРОСТОЙ ПРОЦЕСС</div><h2>От первой находки<br />до <em>новой работы.</em></h2><p>Хороший поиск — это последовательность маленьких шагов. Мы собрали их в одном месте.</p></div>
        <div className="workflow-line"><div className="workflow-progress" /></div>
        <div className="workflow-steps">{[['Сохраняйте', 'Добавьте интересную вакансию из источника или вручную.'], ['Раскладывайте', 'Назначьте этап, чтобы понимать, что уже сделано и что дальше.'], ['Действуйте', 'Сравните требования с резюме и подготовьтесь к следующему шагу.']].map(([title, copy], i) => <article className="workflow-step landing-reveal" key={title}><div className="step-marker"><span>0{i + 1}</span></div><h3>{title}</h3><p>{copy}</p><span className="step-arrow"><ChevronRight size={15} /></span></article>)}</div>
      </section>

      <section className="features-section" id="features">
        <div className="features-head landing-reveal"><div><div className="eyebrow"><span className="section-number">02</span> ПРОДУМАНО ДЛЯ ПОИСКА</div><h2>Всё важное.<br /><em>Ничего лишнего.</em></h2></div><p>Инструменты, которые помогают держать фокус на следующем хорошем шаге.</p></div>
        <div className="feature-list">{features.map((item) => <article className="feature-row landing-reveal" key={item.n}><span className="feature-n">{item.n}</span><div className="feature-title"><h3>{item.title}</h3><p>{item.copy}</p></div><span className="feature-mark">{item.mark}</span><ArrowUpRight size={17} className="feature-arrow" /></article>)}</div>
      </section>

      <section className="focus-section"><div className="focus-grid"><div className="focus-copy landing-reveal"><div className="eyebrow"><span className="section-number">03</span> ВАШЕ ПРЕИМУЩЕСТВО</div><h2>Не просто список.<br /><em>Видимый прогресс.</em></h2><p>Когда вакансии, источники, этапы и резюме связаны, проще увидеть приоритеты, не упустить ответ и направить энергию туда, где шанс выше.</p><button className="text-link" onClick={start}>Собрать свой процесс <ArrowRight size={15} /></button></div><div className="focus-visual landing-reveal"><div className="focus-grid-bg" /><div className="focus-card"><span className="focus-card-kicker">ПОИСК / ИТОГО</span><div className="focus-stat"><b>04</b><span>активных<br />этапа</span></div><div className="focus-divider" /><div className="focus-bars"><div><span>Сохранено</span><i><b style={{width:'78%'}} /></i><small>08</small></div><div><span>Отклик</span><i><b style={{width:'55%'}} /></i><small>05</small></div><div><span>Интервью</span><i><b style={{width:'30%'}} /></i><small>02</small></div></div><span className="focus-card-foot"><span className="live-dot" /> ПОИСК ИДЁТ</span></div><div className="focus-orb">↗</div></div></div></section>

      <section className="landing-cta"><div className="cta-glow" /><div className="eyebrow"><span className="live-dot" /> СЛЕДУЮЩИЙ ШАГ ЗА ВАМИ</div><h2>Пусть поиск<br />работает <em>на вас.</em></h2><p>Начните собирать свой процесс в одном месте.</p><button className="button-primary button-cta" onClick={start}>Открыть приложение <ArrowRight size={16} /></button><span className="cta-foot">LINKEDIN VACANCIES <span>·</span> ВАША КАРЬЕРА, ВАШ РИТМ</span></section>

      <footer className="landing-footer"><a className="landing-brand" href="#top"><span className="brand-glyph"><BriefcaseBusiness size={16} /></span><span>vacancy<span className="brand-light">.work</span></span></a><span>Соберите поиск. Сохраните фокус.</span><div><a href="/about">О проекте</a><a href="/howtouse">Как пользоваться</a><span>© 2026</span></div></footer>
      {loginOpen && <div className="landing-login"><button className="login-dismiss" aria-label="Закрыть" onClick={() => setLoginOpen(false)}>×</button><LoginModal onLoginSuccess={onLoginSuccess} /></div>}
    </main>
  );
}
