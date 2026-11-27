import { Badge, Icon, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Tag } from 'lucide-react';
import { TokenList } from './TokenList';

const meta: Meta<typeof TokenList> = {
  title: 'Molecules/TokenList',
  component: TokenList,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула-контейнер `TokenList` для отображения списков бейджей, тегов и технологических чипов с единообразным переносом строк (`flex-wrap: wrap`) и токенизированными отступами Blueprint.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс для flex-контейнера списка токенов.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof TokenList>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `TokenList`. Группирует набор атомов `<Badge variant="chip">` в аккуратную сетку тегов.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          TokenList — Контейнер для коллекций чипов и бейджей
        </Text>
        <Text variant="caption" tone="secondary">
          Используется в карточках вакансий, панели фильтров FilterBar и организме TagsList.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <TokenList {...args}>
          <Badge variant="chip" size="sm" tone="info">
            TypeScript
          </Badge>
          <Badge variant="chip" size="sm" tone="accent">
            React 19
          </Badge>
          <Badge variant="chip" size="sm" tone="success">
            Node.js
          </Badge>
          <Badge variant="chip" size="sm" tone="neutral">
            Storybook 10
          </Badge>
          <Badge variant="chip" size="sm" tone="warning">
            Docker
          </Badge>
        </TokenList>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Набор дочерних токенов и удаляемых тегов)',
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `children` принимает произвольный список элементов `<Badge>` (включая интерактивные и удаляемые теги).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: children (React.ReactNode)
        </Text>
        <Text variant="caption" tone="secondary">
          Пример композиции удаляемых тегов с иконками из lucide-react внутри TokenList:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <TokenList {...args}>
          <Badge
            variant="outline"
            size="xs"
            tone="neutral"
            icon={<Icon icon={Tag} size="2xs" />}
            onRemove={() => undefined}
          >
            #fintech
          </Badge>
          <Badge
            variant="outline"
            size="xs"
            tone="neutral"
            icon={<Icon icon={Tag} size="2xs" />}
            onRemove={() => undefined}
          >
            #remote-eu
          </Badge>
          <Badge
            variant="outline"
            size="xs"
            tone="neutral"
            icon={<Icon icon={Tag} size="2xs" />}
            onRemove={() => undefined}
          >
            #high-priority
          </Badge>
        </TokenList>
      </div>
    </div>
  ),
};
