import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScoreReportAccordion } from './ScoreReportAccordion';
import styles from './ScoreReportAccordionStory.module.css';

const meta: Meta<typeof ScoreReportAccordion> = {
  title: 'Organisms/ScoreReportAccordion',
  component: ScoreReportAccordion,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ScoreReportAccordion>;

export const HighMatchScore: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <ScoreReportAccordion
        score={88}
        summary="Отличное соответствие профилю Senior Frontend Engineer. Сильные стороны в React 19, TypeScript, архитектуре дизайн-систем и Vite. Требуется минимальная адаптация под внутренний стек CI/CD."
        seniorityAssessment={{
          status: 'matched',
          label: 'Senior / Lead',
          comment: 'Полное соответствие заявленным 6+ годам продакшн-опыта.',
        }}
        matchedRequirements={[
          {
            id: 'm1',
            requirement: '6+ лет глубокого опыта с React и экосистемой TypeScript',
            evidence:
              '8 лет работы с React (Redux, Zustand, Radix, Tailwind, Storybook 8-10). Создание переиспользуемых библиотек компонентов.',
          },
          {
            id: 'm2',
            requirement: 'Опыт разработки дизайн-систем и UI-библиотек с нуля',
            evidence:
              'Автор архитектуры дизайн-системы Blueprint в 3 проектах с единым дизайн-токеном и поддержкой dark/light тем.',
          },
          {
            id: 'm3',
            requirement: 'Понимание Web Core Vitals, оптимизация LCP/CLS и рендеринга',
            evidence:
              'Оптимизировал LCP с 3.8s до 1.1s в дашборде с 50 000+ элементами через виртуализацию и CSS layers.',
          },
        ]}
        missingRequirements={[
          {
            id: 'miss1',
            requirement: 'Опыт работы с GraphQL Apollo Federation v2',
            severity: 'low',
            reason:
              'В CV указан GraphQL (клиент + REST-миграция), но нет прямого упоминания Federation v2 субграфов.',
          },
          {
            id: 'miss2',
            requirement: 'Настройка Kubernetes k8s операторов и Helm чартов',
            severity: 'medium',
            reason:
              'Опыт с Docker и Dokploy есть, но нет опыта production-манифестов для k8s кластеров.',
          },
        ]}
        criticalGaps={[
          {
            id: 'gap1',
            requirement: 'Локация в часовом поясе CET (Германия / Нидерланды)',
            reason:
              'Вакансия требует нахождения в пределах CET +/- 1 час с возможностью гибридного посещения берлинского офиса 1 раз в месяц.',
          },
        ]}
        onReanalyze={() => alert('Запущен повторный скоринг')}
      />
    </div>
  ),
};

export const OutdatedCvNotice: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <ScoreReportAccordion
        score={64}
        isOutdated
        cvRevision={4}
        summary="Скоринг был выполнен для старой ревизии резюме (rev 3). Обновите анализ для получения актуальных рекомендаций."
        matchedRequirements={[
          {
            id: 'm1',
            requirement: 'React, TypeScript',
            evidence: 'Подтверждено в профиле кандидата.',
          },
        ]}
        onReanalyze={() => alert('Запущен повторный скоринг')}
      />
    </div>
  ),
};

export const WithError: Story = {
  render: () => (
    <div className={styles.storyWrapper}>
      <ScoreReportAccordion
        error="Сетевая ошибка при обращении к сервису скоринга. Повторите попытку через минуту."
        onReanalyze={() => alert('Повторный скоринг')}
      />
    </div>
  ),
};
