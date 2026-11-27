import { Button, Icon, Paragraph, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { Section } from './Section';
import { Sparkles } from 'lucide-react';

const meta: Meta<typeof Section> = {
  title: 'Molecules/Section/Section',
  component: Section,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Молекула семантической секции `Section` для сегментации контента внутри модальных окон, карточек и панелей инспектора на 32px сетке Blueprint. Объединяет `<Section.Header>` и `<Section.Body>` с управляемыми разделителями (`divider`), рамками (`bordered`) и внешними отступами (`padding`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    as: 'section',
    divider: true,
    bordered: false,
  },
  argTypes: {
    as: {
      control: 'inline-radio',
      options: ['section', 'div', 'article'],
      description: 'Семантический HTML-тег контейнера секции (`section`, `div`, `article`).',
    },
    padding: {
      control: 'select',
      options: [undefined, 'none', 'xs', 'sm', 'md', 'lg'],
      description: 'Внутренний отступ контейнера секции целиком.',
    },
    divider: {
      control: 'boolean',
      description: 'Отображает нижнюю разделительную линию (`--ui-border-subtle`) между соседними секциями.',
    },
    bordered: {
      control: 'boolean',
      description: 'Добавляет замкнутый 1px контур вокруг всей секции.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Section`. Настраивайте `as`, `padding`, `divider` и `bordered` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Section — Семантический контейнер секции
        </Text>
        <Text variant="caption" tone="secondary">
          Используется для группировки тематических блоков (Зарплата, AI-саммари, Стек, Заметки).
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Section {...args}>
          <Section.Header
            title="AI-САММАРИ ВАКАНСИИ"
            icon={<Icon icon={Sparkles} size="sm" tone="success" />}
            accessory={
              <Button variant="secondary" size="sm">
                ОБНОВИТЬ AI
              </Button>
            }
          />
          <Section.Body padding="md" gap="sm">
            <Paragraph size="sm" spacing="none">
              Компания разрабатывает облачную платформу реального времени для критической
              инфраструктуры.
            </Paragraph>
          </Section.Body>
        </Section>
      </div>
    </div>
  ),
};

export const PropDividerAndBordered: Story = {
  name: 'Пропсы: divider и bordered (Разделитель и контурная рамка)',
  args: {
    divider: true,
    bordered: true,
    padding: 'md',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `divider` добавляет нижнюю линию между секциями в стеке, а `bordered` рисует полный контур вокруг секции.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: divider &amp; bordered (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте флаги divider и bordered в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Section {...args}>
          <Section.Header title="СЕКЦИЯ С НАСТРАИВАЕМЫМ КОНТУРОМ" />
          <Section.Body padding="sm">
            <Text variant="body-sm">
              Содержимое секции с divider={String(args.divider)} и bordered={String(args.bordered)}.
            </Text>
          </Section.Body>
        </Section>
      </div>
    </div>
  ),
};

export const PropPaddingAndAs: Story = {
  name: 'Пропсы: padding и as (Отступы контейнера и HTML-тег)',
  args: {
    as: 'article',
    padding: 'lg',
    bordered: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `padding` задает общий внутренний отступ контейнера `Section` (`none`, `xs`, `sm`, `md`, `lg`), а `as` выбирает семантический тег (`section`, `div`, `article`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: padding &amp; as
        </Text>
        <Text variant="caption" tone="secondary">
          Измените padding и as в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Section {...args}>
          <Text variant="body-sm">
            Контейнер &lt;{args.as}&gt; с внешним отступом padding=&quot;{args.padding}&quot;.
          </Text>
        </Section>
      </div>
    </div>
  ),
};
