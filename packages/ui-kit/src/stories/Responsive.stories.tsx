import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  MediaQuery,
  ContainerQuery,
  useMediaQuery,
  useContainerQuery,
} from '../utils';
import { Badge, Button, Text } from '../atoms';
import layoutStyles from './StoryLayout.module.css';

const meta: Meta = {
  title: 'Utils/Responsive (MediaQuery & ContainerQuery)',
  tags: ['autodocs'],
};

export default meta;

export const CSSMediaQuery: StoryObj = {
  render: () => (
    <div className={layoutStyles.container}>
      <Text variant="caption" tone="muted">
        Измените ширину окна браузера: переключение происходит через CSS (@media) без перерендера React.
      </Text>
      <MediaQuery
        mobile={
          <Badge tone="danger" variant="solid" size="md">
            Mobile Viewport (&lt; 768px)
          </Badge>
        }
        tablet={
          <Badge tone="warning" variant="solid" size="md">
            Tablet Viewport (768px - 1023px)
          </Badge>
        }
        desktop={
          <Badge tone="success" variant="solid" size="md">
            Desktop Viewport (&gt;= 1024px)
          </Badge>
        }
        wide={
          <Badge tone="info" variant="solid" size="md">
            Wide Viewport (&gt;= 1440px)
          </Badge>
        }
      />
    </div>
  ),
};

export const CSSContainerQuery: StoryObj = {
  render: () => {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
      <div className={layoutStyles.container}>
        <Text variant="caption" tone="muted">
          CSS Container Query: перетащите правый нижний угол resize-контейнера.
        </Text>
        <div ref={containerRef} className={layoutStyles.resizableBox}>
          <ContainerQuery containerRef={containerRef}>
            <ContainerQuery.Slot max={399}>
              <div className={layoutStyles.cqStack}>
                <Badge tone="danger">Compact Container (&lt; 400px)</Badge>
                <Button size="sm" fullWidth>
                  Compact Button
                </Button>
              </div>
            </ContainerQuery.Slot>

            <ContainerQuery.Slot min={400} max={699}>
              <div className={layoutStyles.row}>
                <Badge tone="warning">Medium Container (400px - 699px)</Badge>
                <Button size="sm">Medium Button</Button>
              </div>
            </ContainerQuery.Slot>

            <ContainerQuery.Slot min={700}>
              <div className={layoutStyles.row}>
                <Badge tone="success">Wide Container (&gt;= 700px)</Badge>
                <Button variant="primary">Wide Primary Action</Button>
                <Button variant="secondary">Secondary Action</Button>
              </div>
            </ContainerQuery.Slot>
          </ContainerQuery>
        </div>
      </div>
    );
  },
};

export const UseMediaQueryHook: StoryObj = {
  render: () => {
    const layout = useMediaQuery({
      mobile: 'Mobile (1 column)',
      tablet: 'Tablet (2 columns)',
      desktop: 'Desktop (4 columns)',
    });

    return (
      <div className={layoutStyles.container}>
        <Text variant="body">
          Значение хука useMediaQuery: <strong>{layout}</strong>
        </Text>
      </div>
    );
  },
};

export const UseContainerQueryHook: StoryObj = {
  render: () => {
    const [containerRef, layout] = useContainerQuery<'small' | 'medium' | 'large'>('large', [
      { max: 350, value: 'small' },
      { min: 351, max: 600, value: 'medium' },
      { min: 601, value: 'large' },
    ]);

    return (
      <div className={layoutStyles.container}>
        <Text variant="caption" tone="muted">
          useContainerQuery: перетащите блок по горизонтали:
        </Text>
        <div ref={containerRef} className={layoutStyles.resizableBox}>
          <Text variant="mono" tone="primary">
            Текущее значение: {layout}
          </Text>
        </div>
      </div>
    );
  },
};
