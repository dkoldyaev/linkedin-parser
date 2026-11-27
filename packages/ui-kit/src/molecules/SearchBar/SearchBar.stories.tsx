import type { Meta, StoryObj } from '@storybook/react-vite';
import React, { useEffect, useState } from 'react';
import { SearchBar, type SearchBarProps } from './SearchBar';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Text } from '../../atoms';

const meta: Meta<typeof SearchBar> = {
  title: 'Molecules/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула строки поиска `SearchBar` (`role="searchbox"`), собранная из `<Input mono>`, иконки `Search` из `lucide-react` и кнопки быстрой очистки с иконкой `X`. Поддерживает адаптивное расширение ширины по фокусу (`expandOnFocus`) на 32px сетке Blueprint и сброс фокуса клавишей `Escape`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    value: 'Senior React Architect',
    placeholder: 'Поиск по компании, должности, стеку...',
    expandOnFocus: false,
    disabled: false,
    clearLabel: 'Очистить поиск',
  },
  argTypes: {
    value: {
      control: 'text',
      description: 'Текущий поисковый запрос.',
    },
    placeholder: {
      control: 'text',
      description: 'Текст-подсказка в пустом поле поиска.',
    },
    expandOnFocus: {
      control: 'boolean',
      description:
        'Если `true`, в состоянии покоя поле имеет компактную ширину и плавно расширяется до полной ширины по сетке при фокусе.',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует ввод и скрывает кнопку очистки.',
    },
    clearLabel: {
      control: 'text',
      description: 'Доступная метка `aria-label` для кнопки быстрой очистки (`X`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

function ControlledSearchBar(args: SearchBarProps): React.ReactElement {
  const [query, setQuery] = useState(args.value);

  useEffect(() => {
    setQuery(args.value);
  }, [args.value]);

  return (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          SearchBar — Поисковое поле с автоочисткой и поддержкой Escape
        </Text>
        <Text variant="caption" tone="secondary">
          Введите текст или нажмите крестик справа для мгновенного сброса запроса.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <SearchBar {...args} value={query} onValueChange={setQuery} aria-label="Search vacancies" />
      </div>
    </div>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `SearchBar`. Настраивайте `value`, `placeholder`, `expandOnFocus`, `disabled` и `clearLabel` через панель Controls.',
      },
    },
  },
  render: (args) => <ControlledSearchBar {...args} />,
};

export const PropExpandOnFocus: Story = {
  name: 'Пропс: expandOnFocus (Адаптивное раскрытие по фокусу)',
  args: {
    value: 'TypeScript',
    placeholder: 'Кликните для раскрытия по фокусу...',
    expandOnFocus: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `expandOnFocus` включает компактный режим в шапке приложения (`Header`), плавно увеличивающий ширину поля при получении фокуса.',
      },
    },
  },
  render: (args) => <ControlledSearchBar {...args} />,
};

export const PropValueAndClearLabel: Story = {
  name: 'Пропсы: value, placeholder и clearLabel',
  args: {
    value: 'Distributed Systems',
    placeholder: 'Введите ключевое слово...',
    clearLabel: 'Стереть поисковый запрос',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Когда `value` не пусто, справа автоматически появляется кнопка очистки с `aria-label={clearLabel}`.',
      },
    },
  },
  render: (args) => <ControlledSearchBar {...args} />,
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Заблокированный поиск)',
  args: {
    value: 'Locked search query',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `disabled` отключает поле поиска и скрывает кнопку очистки.',
      },
    },
  },
  render: (args) => <ControlledSearchBar {...args} />,
};
