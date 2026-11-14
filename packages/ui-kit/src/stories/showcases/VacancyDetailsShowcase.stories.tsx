import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Award,
  Banknote,
  ExternalLink,
  Globe,
  History,
  MapPin,
  StickyNote,
  Trash2,
} from 'lucide-react';
import {
  Badge,
  Button,
  Icon,
  Modal,
  ReportAccordion,
  SectionHeader,
  Select,
  Stepper,
  Tabs,
  Text,
  Textarea,
  TokenList,
} from '../../index';
import showcaseStyles from './Showcase.module.css';

const meta: Meta = {
  title: 'Showcases (Job Tracker)/Vacancy Details Showcase',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

function VacancyDetailsModalDemo(): React.ReactElement {
  const [isOpen, setIsOpen] = useState(true);
  const [stage, setStage] = useState('interview');
  const [activeTab, setActiveTab] = useState('overview');
  const [techStack, setTechStack] = useState<string[]>([
    'React 19',
    'TypeScript',
    'Storybook 10',
    'Radix UI',
  ]);
  const [tags, setTags] = useState<string[]>(['priority', 'remote-eu']);
  const [notes, setNotes] = useState(
    'Созвон с техлидом прошел отлично. Следующий этап — архитектурное интервью.'
  );

  return (
    <div>
      <Button variant="primary" onClick={() => setIsOpen(true)}>
        Открыть карточку вакансии
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="xl">
        <Modal.Header
          title="Staff Frontend Architect — Design Systems"
          description="Stripe • Remote (EU)"
          actions={
            <>
              <Select
                value={stage}
                onValueChange={setStage}
                ariaLabel="Этап воронки"
                options={[
                  { value: 'backlog', label: 'Не связывались' },
                  { value: 'applied', label: 'Откликнулся' },
                  { value: 'interview', label: 'Техническое интервью' },
                  { value: 'offer', label: 'Оффер' },
                ]}
              />
              <Button
                variant="secondary"
                size="sm"
                startIcon={<Icon icon={ExternalLink} size="xs" />}
              >
                LinkedIn
              </Button>
            </>
          }
          meta={
            <Modal.Header.Meta>
              <Badge
                variant="solid"
                size="sm"
                tone="success"
                icon={<Icon icon={Award} size="xs" />}
              >
                94% Match
              </Badge>
              <Text
                variant="caption"
                tone="accent"
                startIcon={<Icon icon={Globe} size="xs" />}
              >
                Удаленка
              </Text>
              <Text
                variant="caption"
                tone="secondary"
                startIcon={<Icon icon={MapPin} size="xs" />}
              >
                Dublin / EU Remote
              </Text>
              <Text
                variant="mono"
                tone="success"
                startIcon={<Icon icon={Banknote} size="xs" />}
              >
                €145 000 – €170 000 / год
              </Text>
            </Modal.Header.Meta>
          }
          tabs={
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              items={[
                { value: 'overview', label: 'Обзор и AI-отчет' },
                { value: 'history', label: 'История переходов', count: 3 },
              ]}
            />
          }
        />

        <Modal.Body padding="md">
          {activeTab === 'overview' ? (
            <>
              <div className={showcaseStyles.detailsGrid}>
                <div className={showcaseStyles.detailsSection}>
                  <SectionHeader title="Технологический стек" divider />
                  <div className={showcaseStyles.detailsSectionBody}>
                    <TokenList
                      mode="editable"
                      tokens={techStack}
                      onChange={setTechStack}
                      placeholder="Добавить технологию..."
                    />
                  </div>
                </div>

                <div className={showcaseStyles.detailsSection}>
                  <SectionHeader title="Теги вакансии" divider />
                  <div className={showcaseStyles.detailsSectionBody}>
                    <TokenList
                      mode="editable"
                      variant="tag"
                      prefix="#"
                      tokens={tags}
                      onChange={setTags}
                      placeholder="Добавить тег..."
                    />
                  </div>
                </div>
              </div>

              <ReportAccordion
                title="AI Отчет совместимости"
                scoreLabel="94% Match"
                scoreTone="success"
                summary="Кандидат полностью закрывает требования по архитектуре UI-китов, дизайн-токенам, строгой типизации TypeScript и автоматизации Storybook."
                onAction={() => undefined}
                actionLabel="Пересчитать"
                sections={[
                  {
                    id: 'matches',
                    title: 'СОВПАДЕНИЯ',
                    tone: 'mint',
                    defaultExpandedIds: ['m1'],
                    items: [
                      {
                        id: 'm1',
                        title: 'Опыт проектирования независимых UI-библиотек и дизайн-систем',
                        content: 'Реализовал архитектуру @blueprint/ui-kit с нулевыми нарушениями токенов и покрытием тестами.',
                      },
                      {
                        id: 'm2',
                        title: 'Глубокая экспертиза в React 19, TypeScript и Radix UI',
                        content: 'Полная поддержка WAI-ARIA, клавиатурной навигации и контролируемых состояний.',
                      },
                    ],
                  },
                ]}
              />

              <div className={showcaseStyles.detailsSection}>
                <SectionHeader
                  title="Личные заметки"
                  icon={StickyNote}
                  divider
                />
                <div className={showcaseStyles.detailsSectionBody}>
                  <Textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Личные заметки"
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={showcaseStyles.detailsSection}>
              <SectionHeader
                title="История переходов"
                icon={History}
                iconTone="accent"
                divider
              />
              <div className={showcaseStyles.detailsSectionBody}>
                <Stepper
                  items={[
                    {
                      id: '1',
                      label: 'Не связывались',
                      timestamp: '10 нояб., 09:00',
                      tone: 'neutral',
                    },
                    {
                      id: '2',
                      fromLabel: 'Не связывались',
                      label: 'Откликнулся',
                      duration: '3ч',
                      timestamp: '10 нояб., 12:00',
                      tone: 'info',
                    },
                    {
                      id: '3',
                      fromLabel: 'Откликнулся',
                      label: 'Техническое интервью',
                      duration: '2д',
                      timestamp: '12 нояб., 16:30',
                      tone: 'success',
                      active: true,
                      description: 'Назначено системное дизайн-интервью с командой платформы.',
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </Modal.Body>

        <Modal.Footer justify="between">
          <Button
            variant="danger"
            size="sm"
            startIcon={<Icon icon={Trash2} size="xs" />}
            onClick={() => setIsOpen(false)}
          >
            Удалить вакансию
          </Button>
          <Modal.Footer.Actions>
            <Button variant="secondary" size="sm" onClick={() => setIsOpen(false)}>
              Закрыть
            </Button>
          </Modal.Footer.Actions>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export const InteractiveVacancyDetailsModal: StoryObj = {
  render: () => <VacancyDetailsModalDemo />,
};
