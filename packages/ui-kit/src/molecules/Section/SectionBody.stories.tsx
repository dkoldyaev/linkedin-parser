import { Badge, Paragraph, Text } from '../../atoms';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section, SectionBody } from './Section';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof SectionBody> = {
  title: 'Molecules/Section/SectionBody',
  component: SectionBody,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент тела секции `SectionBody` (`Section.Body`). Обеспечивает стандартизированные внутренние отступы (`padding`, `paddingX`, `paddingY`) и вертикальный интервал между дочерними блоками (`gap`) под заголовком `<SectionHeader>` на сетке Blueprint.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  args: {
    padding: 'md',
    gap: 'sm',
  },
  argTypes: {
    padding: {
      control: 'inline-radio',
      options: ['none', 'xs', 'sm', 'md', 'lg'],
      description: 'Базовый внутренний отступ со всех сторон (`none`, `xs`, `sm`, `md`, `lg`).',
    },
    paddingX: {
      control: 'select',
      options: [undefined, 'none', 'xs', 'sm', 'md', 'lg'],
      description: 'Переопределение горизонтальных отступов (слева и справа).',
    },
    paddingY: {
      control: 'select',
      options: [undefined, 'none', 'xs', 'sm', 'md', 'lg'],
      description: 'Переопределение вертикальных отступов (сверху и снизу).',
    },
    gap: {
      control: 'inline-radio',
      options: ['none', 'xs', 'sm', 'md', 'lg'],
      description: 'Расстояние (`gap`) между дочерними элементами внутри `SectionBody`.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SectionBody>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `SectionBody`. Настраивайте `padding`, `paddingX`, `paddingY` и `gap` через панель Controls.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          SectionBody — Контейнер содержимого секции
        </Text>
        <Text variant="caption" tone="secondary">
          Управляет внутренними полями и расстоянием между элементами внутри &lt;Section&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Section bordered>
          <Section.Header title="DEMO SECTION HEADER" divider />
          <SectionBody {...args}>
            <Paragraph size="sm" spacing="none">
              Первый блок контента внутри SectionBody.
            </Paragraph>
            <Paragraph size="sm" spacing="none" tone="secondary">
              Второй блок контента для демонстрации вертикального интервала gap=&quot;{args.gap}
              &quot;.
            </Paragraph>
          </SectionBody>
        </Section>
      </div>
    </div>
  ),
};

export const PropPaddingAndOverrides: Story = {
  name: 'Пропсы: padding, paddingX и paddingY (Настройка полей)',
  args: {
    padding: 'md',
    paddingX: 'lg',
    paddingY: 'xs',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Пропс `padding` задает равномерные поля, а `paddingX` и `paddingY` позволяют независимо переопределить горизонтальные и вертикальные отступы.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          props: padding, paddingX &amp; paddingY
        </Text>
        <Text variant="caption" tone="secondary">
          Измените padding, paddingX и paddingY в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Section bordered>
          <Section.Header title="НАСТРОЙКА ПОЛЕЙ SECTIONBODY" divider />
          <SectionBody {...args}>
            <Text variant="body-sm">
              padding=&quot;{args.padding}&quot; | paddingX=&quot;{args.paddingX ?? 'auto'}&quot; |
              paddingY=&quot;{args.paddingY ?? 'auto'}&quot;
            </Text>
          </SectionBody>
        </Section>
      </div>
    </div>
  ),
};

export const PropGap: Story = {
  name: 'Пропс: gap (Расстояние между дочерними элементами)',
  args: {
    padding: 'md',
    gap: 'md',
  },
  parameters: {
    docs: {
      description: {
        story: 'Пропс `gap` задает расстояние между дочерними элементами (`none`, `xs`, `sm`, `md`, `lg`).',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          prop: gap (&quot;none&quot; | &quot;xs&quot; | &quot;sm&quot; | &quot;md&quot; | &quot;lg&quot;)
        </Text>
        <Text variant="caption" tone="secondary">
          Переключайте gap в панели Controls:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <Section bordered>
          <SectionBody {...args}>
            <div>
              <Badge tone="primary">Элемент 1</Badge>
            </div>
            <div>
              <Badge tone="success">Элемент 2 (интервал gap=&quot;{args.gap}&quot;)</Badge>
            </div>
            <div>
              <Badge tone="accent">Элемент 3</Badge>
            </div>
          </SectionBody>
        </Section>
      </div>
    </div>
  ),
};
