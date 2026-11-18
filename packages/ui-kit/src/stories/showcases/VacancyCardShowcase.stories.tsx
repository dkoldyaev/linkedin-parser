import type { Meta, StoryObj } from '@storybook/react-vite';
import { VacancyCard } from '../../index';
import layoutStyles from '../StoryLayout.module.css';

const meta: Meta<typeof VacancyCard> = {
  title: 'Showcases (Job Tracker)/Vacancy Card Showcase',
  component: VacancyCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof VacancyCard>;

export const AllVacancyCardStates: Story = {
  render: () => (
    <div className={layoutStyles.grid3}>
      <VacancyCard
        title="Staff Frontend Architect — UI Platform"
        company="Stripe"
        sourceUrl="https://linkedin.com/jobs/view/10"
        matchScore={92}
        workplace="remote"
        workplaceLabel="Удаленка"
        location="Remote (EU)"
        salary="USD 16 000 / мес"
        summary="Развитие корпоративной дизайн-системы и компонентной библиотеки на React 19 и TypeScript."
        techStack={['React 19', 'TypeScript', 'Design Systems', 'Storybook 10', 'Playwright']}
        tags={['priority', 'dream-job']}
        date="11 нояб."
        historyCount={3}
        hasHistoryComment
        canMoveLeft={false}
        canMoveRight={true}
      />

      <VacancyCard
        title="Senior Fullstack Developer (Node.js + React)"
        company="Revolut"
        sourceUrl="https://linkedin.com/jobs/view/22"
        matchScore={68}
        workplace="hybrid"
        workplaceLabel="Гибрид"
        location="London / Remote"
        salary="GBP 8 500 / мес"
        summary="Разработка платёжных шлюзов и клиентских интерфейсов для международного банкинга."
        techStack={['Node.js', 'TypeScript', 'React', 'PostgreSQL']}
        isClosed
        closedLabel="Закрыта"
        stageLabel="Applied"
        date="1 нояб."
        historyCount={4}
        canMoveLeft={true}
        canMoveRight={true}
      />

      <VacancyCard
        title="Lead UI Engineer — Design Tooling"
        company="Figma"
        sourceUrl="https://linkedin.com/jobs/view/23"
        workplace="onsite"
        workplaceLabel="Офис"
        location="San Francisco"
        aiPending
        pendingAiLabel="Ожидание AI-анализа..."
        techStack={['TypeScript', 'React', 'WebAssembly']}
        date="Только что"
        canMoveLeft={true}
        canMoveRight={false}
      />
    </div>
  ),
};
