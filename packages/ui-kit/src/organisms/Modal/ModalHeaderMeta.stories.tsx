import { Badge, Icon, Text } from '../../atoms';
import { Ban, Banknote, Globe, MapPin } from 'lucide-react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import layoutStyles from '../../stories/StoryLayout.module.css';
import { ModalHeaderMeta } from './ModalHeader';

const meta: Meta<typeof ModalHeaderMeta> = {
  title: 'Organisms/Modal/ModalHeaderMeta',
  component: ModalHeaderMeta,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Подкомпонент строки метаданных `ModalHeaderMeta` (`Modal.Header.Meta`) для размещения бейджей локации, формата работы, зарплатной вилки и статусов внутри `<ModalHeader meta={...}>`.',
      },
      source: {
        type: 'dynamic',
      },
    },
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Дополнительный CSS-класс контейнера мета-строки.',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalHeaderMeta>;

export const Base: Story = {
  name: 'Базовая (Interactive Controls)',
  parameters: {
    docs: {
      description: {
        story:
          'Базовая интерактивная демонстрация `ModalHeaderMeta`. Отображает горизонтальный ряд бейджей и индикаторов с переносом строк.',
      },
    },
  },
  render: (args) => (
    <div className={layoutStyles.propDocBox}>
      <div className={layoutStyles.propInfoHeader}>
        <Text variant="mono-label" tone="accent">
          ModalHeaderMeta — Контейнер метаданных в шапке модального окна
        </Text>
        <Text variant="caption" tone="secondary">
          Используется в слоте meta компонента &lt;Modal.Header&gt;.
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalHeaderMeta {...args}>
          <Text variant="caption" tone="secondary" startIcon={<Icon icon={MapPin} size="xs" />}>
            Barcelona, Spain
          </Text>
          <Badge variant="outline" size="xs" tone="accent" icon={<Icon icon={Globe} size="xs" />}>
            Hybrid
          </Badge>
          <Text
            variant="mono"
            tone="success"
            weight="semibold"
            startIcon={<Icon icon={Banknote} size="xs" />}
          >
            €95,000 – €120,000 / yr
          </Text>
          <Badge variant="outline" size="xs" tone="danger" icon={<Icon icon={Ban} size="xs" />}>
            Вакансия закрыта
          </Badge>
        </ModalHeaderMeta>
      </div>
    </div>
  ),
};

export const PropChildren: Story = {
  name: 'Пропс: children (Набор мета-индикаторов)',
  parameters: {
    docs: {
      description: {
        story: 'Пропс `children` принимает любые атомы `<Badge>`, `<Text>` и `<StatusDot>`.',
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
          Пример строки метаданных внутри ModalHeaderMeta:
        </Text>
      </div>
      <div className={layoutStyles.propPreviewArea}>
        <ModalHeaderMeta {...args}>
          <Badge tone="info" size="xs">
            ID: VAC-4091
          </Badge>
          <Badge tone="success" size="xs">
            Match: 94%
          </Badge>
        </ModalHeaderMeta>
      </div>
    </div>
  ),
};
