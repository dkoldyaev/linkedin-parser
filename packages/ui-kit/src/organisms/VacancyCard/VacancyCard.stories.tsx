import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';
import { VacancyCard } from './VacancyCard';

const meta: Meta<typeof VacancyCard> = {
  title: 'Organisms/VacancyCard',
  component: VacancyCard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Стандартизированный организм карточки вакансии `VacancyCard` на 32px сетке Blueprint. Композирует `<Card>`, `<CardHeader>`, `<CardBody>`, `<CardFooter>`, `<Badge>`, `<Text>`, `<Paragraph>`, `<TokenList>`, `<ButtonGroup>` и иконки из `lucide-react` (`Award`, `Ban`, `Banknote`, `Building2`, `Globe`, `Home`, `MapPin`, `History`, `Sparkles`). Автоматически окрашивает акцент карточки по `matchScore` (`>= 75` -> `success`, `>= 50` -> `warning`, `< 50` -> `danger`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    title: 'Staff Frontend Architect — UI Platform',
    company: 'Stripe',
    sourceUrl: 'https://linkedin.com/jobs/view/10',
    matchScore: 92,
    workplace: 'remote',
    workplaceLabel: 'Удаленка',
    location: 'Remote (EU)',
    salary: 'USD 16 000 / мес',
    summary:
      'Развитие корпоративной дизайн-системы и компонентной библиотеки на React 19 и TypeScript.',
    aiPending: false,
    techStack: ['React 19', 'TypeScript', 'Design Systems', 'Storybook 10', 'Playwright'],
    tags: ['priority', 'dream-job'],
    date: '11 нояб.',
    historyCount: 3,
    hasHistoryComment: true,
    isClosed: false,
    isRejected: false,
    stageLabel: 'Interview',
    selected: false,
    selectable: true,
    canMoveLeft: true,
    canMoveRight: true,
  },
  argTypes: {
    title: { control: 'text', description: 'Название должности.' },
    company: { control: 'text', description: 'Название компании (отображается в `overline`).' },
    sourceUrl: { control: 'text', description: 'Ссылка на источник вакансии (например LinkedIn).' },
    matchScore: {
      control: { type: 'number', min: 0, max: 100, step: 1 },
      description: 'Процент совместимости с CV (0..100). Определяет семантический тон бейджа и карточки.',
    },
    workplace: {
      control: 'inline-radio',
      options: ['remote', 'hybrid', 'onsite'],
      description: 'Формат работы (`remote` -> иконка `Globe`, `hybrid` -> `Home`, `onsite` -> `Building2`).',
    },
    workplaceLabel: { control: 'text', description: 'Локализованная подпись формата работы.' },
    location: { control: 'text', description: 'Географическая локация с иконкой `MapPin`.' },
    salary: { control: 'text', description: 'Отформатированная строка зарплатной вилки.' },
    summary: { control: 'text', description: 'Краткое AI-саммари вакансии.' },
    aiPending: {
      control: 'boolean',
      description: 'Если `summary` еще не готово и `aiPending={true}`, отображает индикатор ожидания AI-анализа со `Sparkles`.',
    },
    techStack: {
      control: 'object',
      description: 'Массив технологий (отображаются первые 4 чипа + счетчик `+N`).',
    },
    tags: { control: 'object', description: 'Массив пользовательских хеш-тегов.' },
    date: { control: 'text', description: 'Дата добавления карточки в левой части футера.' },
    historyCount: {
      control: { type: 'number', min: 0, max: 20, step: 1 },
      description: 'Количество переходов в истории этапов.',
    },
    hasHistoryComment: {
      control: 'boolean',
      description: 'Добавляет светящуюся точку `<StatusDot tone="info">` рядом со счетчиком истории.',
    },
    isClosed: { control: 'boolean', description: 'Отображает красный бейдж «Закрыта» в шапке карточки.' },
    isRejected: {
      control: 'boolean',
      description: 'Заменяет стрелки перемещения в футере на кнопку «Восстановить» (`onRestoreRejected`).',
    },
    stageLabel: { control: 'text', description: 'Бейдж текущего этапа в правом верхнем углу.' },
    selected: { control: 'boolean', description: 'Отмечает чекбокс и выделяет карточку.' },
    selectable: { control: 'boolean', description: 'Показывает чекбокс выбора карточки.' },
    canMoveLeft: { control: 'boolean', description: 'Разрешает кнопку перемещения на предыдущий этап.' },
    canMoveRight: { control: 'boolean', description: 'Разрешает кнопку перемещения на следующий этап.' },
  },
};

export default meta;
type Story = StoryObj<typeof VacancyCard>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `VacancyCard`. Настраивайте все пропсы (`matchScore`, `workplace`, `salary`, `summary`, `aiPending`, `techStack`, `tags`, `isClosed`, `isRejected`, `selected`) через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          VacancyCard — Полная карточка вакансии для Канбан-доски
        </Text>
        <Text variant="caption" tone="secondary">
          Изменяйте matchScore (0..100) в Controls для проверки автоматической смены цветового тона.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <div className={layoutStyles.narrowBox}>
          <VacancyCard {...args} />
        </div>
      </div>
    </div>
  ),
};

export const PropMatchScoreWorkplaceAndSalary: Story = {
  name: 'Пропсы: matchScore, workplace, location и salary (Мета-строка)',
  args: {
    matchScore: 68,
    workplace: 'hybrid',
    workplaceLabel: 'Гибрид',
    location: 'London, UK',
    salary: 'GBP 8 500 / мес',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропсы `matchScore`, `workplace`, `location` и `salary` формируют компактную мета-строку под заголовком карточки.',
      },
    },
  },
  render: Base.render,
};

export const PropSummaryAndAiPending: Story = {
  name: 'Пропсы: summary, aiPending и pendingAiLabel (Состояние AI-саммари)',
  args: {
    summary: undefined,
    aiPending: true,
    pendingAiLabel: 'Ожидание генерации AI-саммари...',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Когда `summary` еще не получено (`undefined`) и `aiPending={true}`, вместо абзаца текста отображается строка ожидания с иконкой `Sparkles`.',
      },
    },
  },
  render: Base.render,
};

export const PropIsClosedAndIsRejected: Story = {
  name: 'Пропсы: isClosed, isRejected, canMoveLeft и canMoveRight',
  args: {
    isClosed: true,
    isRejected: true,
    closedLabel: 'Закрыта',
    restoreLabel: 'Восстановить из отказа',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `isClosed` добавляет бейдж закрытой вакансии в шапку, а `isRejected` переключает футер в режим архива с кнопкой восстановления.',
      },
    },
  },
  render: Base.render,
};
