import type { Meta, StoryObj } from '@storybook/react-vite';
import { ModalBody } from './ModalBody';
import { ModalHeader } from './ModalHeader';
import { Text } from '../../atoms';
import styles from './ModalStory.module.css';

const meta: Meta<typeof ModalBody> = {
  title: 'Organisms/ModalBody',
  component: ModalBody,
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'radio',
      options: ['none', 'sm', 'md', 'lg'],
    },
    scrollable: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ModalBody>;

export const Basic: Story = {
  render: () => (
    <div className={styles.container}>
      <ModalHeader title="Pipeline Stage Details" onClose={() => alert('Close')} />
      <ModalBody padding="md">
        <div className={styles.bodyContent}>
          <Text as="p" variant="body">
            This stage represents candidate evaluation in progress.
          </Text>
          <Text as="p" variant="caption" tone="secondary">
            Transitions into this stage trigger automatic notification to the team lead.
          </Text>
        </div>
      </ModalBody>
    </div>
  ),
};

export const PaddingVariants: Story = {
  render: () => (
    <div className={styles.variantsGrid}>
      {(['none', 'sm', 'md', 'lg'] as const).map((pad) => (
        <div key={pad} className={styles.variantItem}>
          <Text as="span" variant="mono" tone="accent">
            padding=&quot;{pad}&quot;
          </Text>
          <div className={styles.container}>
            <ModalBody padding={pad}>
              <div className={styles.bodyItem}>
                <Text as="p" variant="body">
                  Content inside <strong>{pad}</strong> padding variant.
                </Text>
              </div>
            </ModalBody>
          </div>
        </div>
      ))}
    </div>
  ),
};

export const Scrollable: Story = {
  render: () => (
    <div className={styles.scrollContainer}>
      <ModalHeader title="Scrollable Job Description" onClose={() => alert('Close')} />
      <ModalBody padding="md" scrollable>
        <div className={styles.bodyContent}>
          <Text as="p" variant="body">
            Linear is searching for a Staff UI Engineer to lead foundational web architecture.
          </Text>
          <div className={styles.bodyItem}>
            <Text as="p" variant="caption">
              Requirement 1: 6+ years with TypeScript, React 19, and design system governance.
            </Text>
          </div>
          <div className={styles.bodyItem}>
            <Text as="p" variant="caption">
              Requirement 2: Deep understanding of CSS layout engine, subgrid, and modern CSS layers.
            </Text>
          </div>
          <div className={styles.bodyItem}>
            <Text as="p" variant="caption">
              Requirement 3: Proven track record with accessibility WCAG AA, screen readers, and focus traps.
            </Text>
          </div>
          <div className={styles.bodyItem}>
            <Text as="p" variant="caption">
              Requirement 4: Core Web Vitals optimization (LCP &lt; 2.5s, zero layout shift).
            </Text>
          </div>
          <div className={styles.bodyItem}>
            <Text as="p" variant="caption">
              Requirement 5: Experience with state machines, undo/redo trees, and optimistic local-first UI.
            </Text>
          </div>
        </div>
      </ModalBody>
    </div>
  ),
};

export const NonScrollable: Story = {
  render: () => (
    <div className={styles.container}>
      <ModalHeader title="Non-Scrollable Layout" onClose={() => alert('Close')} />
      <ModalBody padding="md" scrollable={false}>
        <Text as="p" variant="body">
          This container disables internal overflow clipping, ideal when hosting nested dropdowns,
          datepickers, or custom multi-level menus.
        </Text>
      </ModalBody>
    </div>
  ),
};
