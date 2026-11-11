import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertBanner } from './AlertBanner';
import layoutStyles from '../../stories/StoryLayout.module.css';

const meta: Meta<typeof AlertBanner> = {
  title: 'Molecules/AlertBanner',
  component: AlertBanner,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AlertBanner>;

export const AllTones: Story = {
  render: () => (
    <div className={layoutStyles.stack}>
      <AlertBanner tone="info" title="Mercure SSE Connected">
        Listening for real-time CV adaptation updates from background worker.
      </AlertBanner>
      <AlertBanner tone="success" title="CV Adapted Successfully">
        Version #4 generated with 94% keyword alignment.
      </AlertBanner>
      <AlertBanner tone="warning" title="Column Deletion Warning">
        Moving 8 vacancies from Technical Interview to Archive before removal.
      </AlertBanner>
      <AlertBanner
        tone="danger"
        title="Parser Extraction Failed"
        onDismiss={() => undefined}
      >
        LinkedIn rate limit encountered. Task scheduled for automatic retry.
      </AlertBanner>
    </div>
  ),
};
