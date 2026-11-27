import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReportAccordion, type ReportSectionGroup } from './ReportAccordion';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const SAMPLE_SECTIONS: readonly ReportSectionGroup[] = [
  {
    id: 'matches',
    title: 'ПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
    tone: 'success',
    defaultExpandedIds: ['m1'],
    items: [
      {
        id: 'm1',
        title: '6+ лет опыта с React, TypeScript и Design Systems',
        content:
          'Руководил архитектурой 3 компонентных библиотек со строгой валидацией дизайн-токенов.',
      },
      {
        id: 'm2',
        title: 'Оптимизация производительности и Core Web Vitals',
        content: 'Сократил размер бандла на 42% и улучшил показатель LCP до 1.1s.',
      },
    ],
  },
  {
    id: 'gaps',
    title: 'НЕПОДТВЕРЖДЁННЫЕ ТРЕБОВАНИЯ',
    tone: 'warning',
    items: [
      {
        id: 'g1',
        title: 'Опыт разработки Rust WebAssembly-модулей',
        content: 'Использовал готовые WASM-модули в продакшене, но не писал Rust-крейты напрямую.',
      },
    ],
  },
  {
    id: 'critical',
    title: 'КРИТИЧЕСКИЕ НЕСООТВЕТСТВИЯ',
    tone: 'danger',
    items: [
      {
        id: 'c1',
        title: 'Опыт работы в домене гражданской авиации (24/7 OCC)',
        content: 'В резюме отсутствует упоминание авиационных диспетчерских систем.',
      },
    ],
  },
];

const meta: Meta<typeof ReportAccordion> = {
  title: 'Organisms/ReportAccordion',
  component: ReportAccordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Организм структурированного аналитического отчета `ReportAccordion` на 32px сетке Blueprint. Композирует главную шапку `<SectionHeader>` с иконкой `Sparkles`, бейджем итоговой оценки (`scoreLabel`, `scoreTone`) и кнопкой перезапуска анализа (`onAction`, `actionLabel`, `actionLoading`), блок текстового резюме `summary` (`<Paragraph>`) и категоризированные группы секций `sections`, каждая из которых содержит собственный `<SectionHeader>` и `<Accordion>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'ОТЧЁТ СОВМЕСТИМОСТИ С CV',
    scoreLabel: '88% Match',
    scoreTone: 'success',
    summary:
      'Высокое соответствие по архитектуре фронтенда, дизайн-системам на TypeScript и автоматизации тестирования.',
    sections: SAMPLE_SECTIONS,
    actionLabel: 'Проверить повторно',
    actionLoading: false,
    defaultActionLabel: 'Доказательства',
  },
  argTypes: {
    title: {
      control: 'text',
      description: 'Главный заголовок отчета в верхней шапке `<SectionHeader>`.',
    },
    scoreLabel: {
      control: 'text',
      description: 'Текст бейджа итоговой оценки рядом с главным заголовком.',
    },
    scoreTone: {
      control: 'select',
      options: [
        'neutral',
        'primary',
        'secondary',
        'muted',
        'accent',
        'success',
        'warning',
        'danger',
        'info',
      ],
      description: 'Семантический цветовой тон бейджа оценки (`scoreLabel`).',
    },
    summary: {
      control: 'text',
      description: 'Текстовое резюме анализа, отображаемое в выделенном блоке под шапкой отчета.',
    },
    sections: {
      control: 'object',
      description:
        'Массив групп отчета `ReportSectionGroup[]` (`id`, `title`, `tone`, `items`, `defaultExpandedIds`).',
    },
    actionLabel: {
      control: 'text',
      description: 'Подпись кнопки перезапуска анализа в правом слоте шапки.',
    },
    actionLoading: {
      control: 'boolean',
      description: 'Включает индикатор загрузки на кнопке действия (`onAction`).',
    },
    defaultActionLabel: {
      control: 'text',
      description: 'Подпись кнопки раскрытия пунктов аккордеона по умолчанию.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ReportAccordion>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ReportAccordion`. Настраивайте `title`, `scoreLabel`, `scoreTone`, `summary`, `actionLabel`, `actionLoading` и `defaultActionLabel` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ReportAccordion — Аналитический отчет с категоризированными аккордеонами
        </Text>
        <Text variant="caption" tone="secondary">
          Используется на вкладке «Совместимость с CV» для отображения результатов LLM-анализа.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ReportAccordion {...args} onAction={() => undefined} />
      </div>
    </div>
  ),
};

export const PropTitleScoreAndSummary: Story = {
  name: 'Пропсы: title, scoreLabel, scoreTone и summary',
  args: {
    title: 'AI АНАЛИЗ КАНДИДАТА',
    scoreLabel: '55% Partial Match',
    scoreTone: 'warning',
    summary:
      'Кандидат соответствует по базовому стеку React/TypeScript, но имеет пробелы в специфичных требованиях домена.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `title`, `scoreLabel` и `scoreTone` формируют верхнюю строку отчета, а `summary` выводит вводный абзац оценки.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title, scoreLabel, scoreTone &amp; summary
        </Text>
        <Text variant="caption" tone="secondary">
          Измените scoreLabel, scoreTone и summary в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ReportAccordion {...args} />
      </div>
    </div>
  ),
};

export const PropActionAndLoading: Story = {
  name: 'Пропсы: onAction, actionLabel, actionLoading и defaultActionLabel',
  args: {
    actionLabel: 'Пересчет совместимости...',
    actionLoading: true,
    defaultActionLabel: 'Цитата из CV',
  },
  parameters: {
    docs: {
      description: {
        story:
          'При передаче `onAction` в шапке появляется кнопка с иконкой `RefreshCw`, текстом `actionLabel` и состоянием загрузки `actionLoading`.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: actionLabel, actionLoading &amp; defaultActionLabel
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг actionLoading в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ReportAccordion {...args} onAction={() => undefined} />
      </div>
    </div>
  ),
};
