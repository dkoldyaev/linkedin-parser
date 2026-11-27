import { Accordion, type AccordionItemProps } from './Accordion';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccordionItemComponent } from './AccordionItemComponent';
import layoutStyles from '../../stories/StoryLayout.module.css';
import React from 'react';
import { Text } from '../../atoms';

const meta: Meta<typeof AccordionItemComponent> = {
  title: 'Molecules/Accordion/AccordionItem',
  component: AccordionItemComponent,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент отдельного элемента аккордеона `Accordion.Item` (`AccordionItemComponent`). Используется при композиционной сборке `<Accordion>` и отвечает за рендеринг шапки с заголовком (`title`), маркера (`bullet`), подписи действия (`actionLabel`), шеврона и раскрываемой панели контента (`content` / `children`).',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    id: 'demo-item',
    title: 'Подтвержденный опыт проектирования компонентных библиотек React 19',
    content:
      'Подробное описание доказательств из резюме кандидата, квантованное по высоте 32px сетки Blueprint.',
    actionLabel: 'Доказательства',
    bullet: true,
    disabled: false,
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Уникальный идентификатор элемента внутри родительского `<Accordion>`.',
    },
    title: {
      control: 'text',
      description: 'Заголовок строки элемента аккордеона.',
    },
    content: {
      control: 'text',
      description: 'Раскрываемое содержимое элемента (альтернатива `children`).',
    },
    actionLabel: {
      control: 'text',
      description: 'Индивидуальная подпись кнопки раскрытия справа рядом с иконкой шеврона.',
    },
    bullet: {
      control: 'boolean',
      description: 'Отображает маркер `•` (или кастомный ReactNode) слева от заголовка пункта.',
    },
    disabled: {
      control: 'boolean',
      description: 'Блокирует раскрытие/сворачивание элемента (`aria-disabled="true"`).',
    },
  },
};

export default meta;
type Story = StoryObj<typeof AccordionItemComponent>;

function WrappedAccordionItem(args: AccordionItemProps): React.ReactElement {
  return (
    <Accordion defaultExpandedIds={[args.id]}>
      <Accordion.Item {...args} />
    </Accordion>
  );
}

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `Accordion.Item`. Настраивайте `title`, `content`, `actionLabel`, `bullet` и `disabled` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          Accordion.Item — Отдельный раскрываемый пункт аккордеона
        </Text>
        <Text variant="caption" tone="secondary">
          Рендерится внутри контекста &lt;Accordion&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <WrappedAccordionItem {...args} />
      </div>
    </div>
  ),
};

export const PropTitleAndContent: Story = {
  name: 'Пропсы: title и content (Заголовок и раскрываемое тело)',
  args: {
    id: 'title-content-demo',
    title: 'Требование: Опыт работы с Vite 8 и Storybook 10',
    content: 'В портфолио присутствуют 3 проекта с настроенной сборкой на Vite и документацией в Storybook.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `title` отображается в постоянно видимой шапке пункта, а `content` — в раскрываемой области `role="region"`. Если `content` (и `children`) не переданы, пункт становится статической строкой без кнопки раскрытия.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: title &amp; content
        </Text>
        <Text variant="caption" tone="secondary">
          Сравнение раскрываемого пункта (с content) и статического пункта (без content):
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion defaultExpandedIds={[args.id]}>
          <Accordion.Item {...args} />
          <Accordion.Item
            id="static-item"
            title="Статический пункт без content (не кликабелен и не имеет шеврона)"
          />
        </Accordion>
      </div>
    </div>
  ),
};

export const PropActionLabelAndBullet: Story = {
  name: 'Пропсы: actionLabel и bullet (Подпись действия и буллит)',
  args: {
    id: 'action-bullet-demo',
    title: 'Индивидуальный маркер и текст кнопки раскрытия',
    actionLabel: 'Показать детали',
    bullet: true,
    content: 'Детальное пояснение по пункту.',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `actionLabel` переопределяет текст справа рядом с шевроном, а `bullet` включает или выключает маркер перед заголовком конкретного пункта.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: actionLabel &amp; bullet
        </Text>
        <Text variant="caption" tone="secondary">
          Измените actionLabel и переключите bullet в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <WrappedAccordionItem {...args} />
      </div>
    </div>
  ),
};

export const PropDisabled: Story = {
  name: 'Пропс: disabled (Заблокированный пункт)',
  args: {
    id: 'disabled-demo',
    title: 'Заблокированный пункт аккордеона (disabled=true)',
    content: 'Этот контент нельзя раскрыть или свернуть, пока disabled=true.',
    disabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `disabled` отключает возможность клика и нажатия `Enter`/`Space` по заголовку элемента.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: disabled (boolean)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключите флаг disabled в панели Controls, чтобы разблокировать пункт:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Accordion>
          <Accordion.Item {...args} />
        </Accordion>
      </div>
    </div>
  ),
};
