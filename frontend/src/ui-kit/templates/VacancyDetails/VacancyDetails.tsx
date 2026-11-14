import React, { useState } from 'react';
import {
  Award,
  Ban,
  Banknote,
  Building2,
  Calendar,
  Check,
  FileText,
  History as HistoryIcon,
  RefreshCw,
  Sparkles,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import {
  Badge,
  Button,
  CompanyLink,
  Icon,
  LocationText,
  SalaryText,
  Text,
  Textarea,
  WorkplaceText,
  type BadgeTone,
  type WorkplaceType,
} from '../../atoms';
import {
  CollapsibleSection,
  EditableTokenList,
  SectionHeader,
  StageStepper,
  Tabs,
  type StageStepItem,
} from '../../molecules';
import {
  ScoreReportAccordion,
  type RequirementItem,
  type SeniorityAssessment,
} from '../../organisms';
import { useBlueprintGrid, useGridScroll } from '../../hooks';
import { cn } from '../../utils';
import styles from './VacancyDetails.module.css';

export interface VacancyScoringData {
  readonly score: number;
  readonly summary: string;
  readonly seniorityAssessment?: SeniorityAssessment;
  readonly matchedRequirements?: readonly RequirementItem[];
  readonly missingRequirements?: readonly RequirementItem[];
  readonly criticalGaps?: readonly RequirementItem[];
  readonly isOutdated?: boolean;
  readonly cvRevision?: number | string;
}

export interface VacancyDetailsData {
  readonly id: string;
  readonly title: string;
  readonly company: string;
  readonly sourceUrl?: string;
  readonly location?: string;
  readonly workplace?: WorkplaceType;
  readonly dateAdded?: string;
  readonly status: string;
  readonly stageTone?: BadgeTone;
  readonly isClosed?: boolean;
  readonly score?: number;
  readonly salaryText?: string;
  readonly aiSummary?: string;
  readonly companyHighlights?: string;
  readonly techStack?: readonly string[];
  readonly tags?: readonly string[];
  readonly notes?: string;
  readonly originalDescription?: string;
  readonly scoringReport?: VacancyScoringData;
  readonly history?: readonly StageStepItem[];
}

export type VacancyDetailsTab = 'overview' | 'compatibility' | 'history' | 'notes';

export interface StageOptionItem {
  readonly id: string;
  readonly label: string;
}

const DEFAULT_STAGES: readonly StageOptionItem[] = [
  { id: 'not_contacted', label: 'Не начато' },
  { id: 'applied', label: 'Отклик' },
  { id: 'interview', label: 'Интервью' },
  { id: 'assessment', label: 'Тестовое' },
  { id: 'offer', label: 'Оффер' },
  { id: 'rejected', label: 'Отказ' },
];

export interface VacancyDetailsProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly vacancy: VacancyDetailsData;
  readonly stages?: readonly StageOptionItem[];
  readonly activeTab?: VacancyDetailsTab;
  readonly defaultTab?: VacancyDetailsTab;
  readonly onTabChange?: (tab: VacancyDetailsTab) => void;
  readonly onStatusChange?: (status: string) => void;
  readonly onTechStackChange?: (tokens: readonly string[]) => void;
  readonly onTagsChange?: (tokens: readonly string[]) => void;
  readonly onNotesChange?: (notes: string) => void;
  readonly onSaveNotes?: (notes: string) => void;
  readonly onReanalyze?: () => void;
  readonly onClose?: () => void;
  readonly onDelete?: () => void;
  readonly analyzing?: boolean;
  readonly readOnly?: boolean;
}

/**
 * VacancyDetails template ("Открытая карточка вакансии").
 * Composes the comprehensive inspection modal / page view for a job vacancy on the 32px Blueprint grid:
 * - Header with company link, vacancy title, match score badge, stage badge, close & delete buttons
 * - Quick pipeline stage switcher
 * - Metadata row (workplace, location, date added, salary)
 * - Tabs navigation (Overview, CV Compatibility, Stage History, Notes)
 * - Deep CV analysis report (`ScoreReportAccordion`)
 * - Editable tech stack & tags (`EditableTokenList`)
 * - Original job posting description (`CollapsibleSection`)
 */
export function VacancyDetails({
  vacancy,
  stages = DEFAULT_STAGES,
  activeTab: controlledTab,
  defaultTab = 'overview',
  onTabChange,
  onStatusChange,
  onTechStackChange,
  onTagsChange,
  onNotesChange,
  onSaveNotes,
  onReanalyze,
  onClose,
  onDelete,
  analyzing = false,
  readOnly = false,
  className,
  ...rest
}: VacancyDetailsProps): React.ReactElement {
  const [internalTab, setInternalTab] = useState<VacancyDetailsTab>(defaultTab);
  const currentTab = controlledTab !== undefined ? controlledTab : internalTab;

  const [techStack, setTechStack] = useState<readonly string[]>(vacancy.techStack ?? []);
  const [tags, setTags] = useState<readonly string[]>(vacancy.tags ?? []);
  const [addModeTech, setAddModeTech] = useState(false);
  const [addModeTags, setAddModeTags] = useState(false);
  const [notes, setNotes] = useState(vacancy.notes ?? '');

  const containerRef = useBlueprintGrid<HTMLDivElement>({
    deps: [currentTab, vacancy.id, techStack.length, tags.length],
  });
  const handleGridScroll = useGridScroll();

  const handleTabClick = (tab: VacancyDetailsTab) => {
    if (controlledTab === undefined) {
      setInternalTab(tab);
    }
    onTabChange?.(tab);
  };

  const handleTechChange = (next: readonly string[]) => {
    setTechStack(next);
    onTechStackChange?.(next);
  };

  const handleTagsChange = (next: readonly string[]) => {
    setTags(next);
    onTagsChange?.(next);
  };

  const handleNotesTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
    onNotesChange?.(e.target.value);
  };

  const handleSaveNotesClick = () => {
    onSaveNotes?.(notes);
  };

  const stageTone: BadgeTone =
    vacancy.stageTone ??
    (vacancy.status === 'rejected'
      ? 'rejected'
      : vacancy.status === 'offer'
        ? 'offer'
        : vacancy.status === 'interview'
          ? 'interview'
          : vacancy.status === 'assessment'
            ? 'assessment'
            : vacancy.status === 'applied'
              ? 'applied'
              : 'backlog');

  return (
    <div
      ref={containerRef}
      data-bp-scroller="true"
      onScroll={(e) => handleGridScroll(e, 'y')}
      className={cn(styles.container, className)}
      {...rest}
    >
      {/* 1. Header */}
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.companyGroup}>
            <Icon icon={Building2} size="sm" tone="muted" />
            <CompanyLink company={vacancy.company} href={vacancy.sourceUrl} />
          </div>

          <div className={styles.headerActions}>
            {onDelete && !readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                aria-label="Удалить вакансию"
                title="Удалить вакансию"
              >
                <Icon icon={Trash2} size="sm" tone="danger" />
              </Button>
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Закрыть карточку"
                title="Закрыть"
              >
                <Icon icon={X} size="md" />
              </Button>
            )}
          </div>
        </div>

        <div className={styles.badgesRow}>
          {vacancy.score !== undefined && (
            <Badge
              variant="match"
              tone={vacancy.score >= 75 ? 'high' : vacancy.score >= 50 ? 'medium' : 'low'}
              icon={<Award size={11} aria-hidden="true" />}
            >
              {vacancy.score}%
            </Badge>
          )}
          <Badge variant="stage" tone={stageTone}>
            {vacancy.status.toUpperCase()}
          </Badge>
          {vacancy.isClosed && (
            <Badge variant="stage" tone="rejected" icon={<Ban size={11} aria-hidden="true" />}>
              Закрыта
            </Badge>
          )}
        </div>

        <h1 className={styles.title}>{vacancy.title}</h1>
      </header>

      {/* 2. Pipeline Stage Selector */}
      {!readOnly && stages.length > 0 && (
        <nav aria-label="Этап вакансии" className={styles.stageBar}>
          <span className={styles.stageLabel}>Этап:</span>
          <div className={styles.stageButtons}>
            {stages.map((stage) => {
              const isActive = vacancy.status === stage.id;
              return (
                <button
                  key={stage.id}
                  type="button"
                  className={cn(
                    styles.stageOption,
                    isActive && styles.stageOptionActive
                  )}
                  aria-pressed={isActive}
                  onClick={() => onStatusChange?.(stage.id)}
                >
                  {stage.label}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* 3. Metadata bar */}
      <div className={styles.metaBar}>
        {vacancy.workplace !== undefined && (
          <WorkplaceText workplace={vacancy.workplace} />
        )}
        {vacancy.location !== undefined && (
          <LocationText location={vacancy.location} />
        )}
        {vacancy.dateAdded !== undefined && (
          <span className={styles.companyGroup}>
            <Icon icon={Calendar} size="xs" tone="muted" />
            <Text variant="mono" tone="muted">
              {vacancy.dateAdded}
            </Text>
          </span>
        )}
        {vacancy.salaryText !== undefined && (
          <SalaryText amount={vacancy.salaryText} />
        )}
      </div>

      {/* 4. Tabs navigation */}
      <div className={styles.tabsRoot}>
        <Tabs
          value={currentTab}
          onValueChange={(val) => handleTabClick(val as VacancyDetailsTab)}
          items={[
            { value: 'overview', label: 'Обзор' },
            { value: 'compatibility', label: 'Совместимость с резюме' },
            { value: 'history', label: 'История переходов' },
            { value: 'notes', label: 'Заметки' },
          ]}
          ariaLabel="Секции вакансии"
        />

        {/* Tab 1: Overview */}
        {currentTab === 'overview' && (
          <div role="tabpanel" className={styles.tabContent}>
            {/* AI Summary */}
            {vacancy.aiSummary !== undefined && (
              <section className={styles.sectionBlock}>
                <SectionHeader
                  title="AI Саммари вакансии"
                  icon={Sparkles}
                  iconTone="mint"
                  tone="mint"
                  divider
                  accessory={
                    onReanalyze && (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={analyzing}
                        onClick={onReanalyze}
                        startIcon={<Icon icon={RefreshCw} size="xs" />}
                      >
                        Переанализировать
                      </Button>
                    )
                  }
                />
                <div className={styles.sectionBody}>
                  <p>{vacancy.aiSummary}</p>
                  {vacancy.companyHighlights !== undefined && (
                    <p>{vacancy.companyHighlights}</p>
                  )}
                </div>
              </section>
            )}

            {/* Salary Breakdown */}
            {vacancy.salaryText !== undefined && (
              <section className={styles.sectionBlock}>
                <SectionHeader
                  title="Зарплатная вилка"
                  icon={Banknote}
                  iconTone="mint"
                  divider
                />
                <div className={styles.salaryDisplay}>
                  <span>{vacancy.salaryText}</span>
                </div>
              </section>
            )}

            {/* Tech Stack */}
            <section className={styles.sectionBlock}>
              <div className={styles.tokenListContainer}>
                <EditableTokenList
                  label="Технологический стек"
                  value={techStack}
                  onChange={handleTechChange}
                  addMode={addModeTech}
                  onAddModeChange={setAddModeTech}
                  placeholder="Добавить технологию..."
                  readOnly={readOnly}
                />
              </div>
            </section>

            {/* User Tags */}
            <section className={styles.sectionBlock}>
              <div className={styles.tokenListContainer}>
                <EditableTokenList
                  label="Пользовательские теги"
                  value={tags}
                  onChange={handleTagsChange}
                  addMode={addModeTags}
                  onAddModeChange={setAddModeTags}
                  placeholder="Добавить тег..."
                  showTagIcon
                  tone="primary"
                  readOnly={readOnly}
                />
              </div>
            </section>

            {/* Original Vacancy Description */}
            {vacancy.originalDescription !== undefined && (
              <section className={styles.sectionBlock}>
                <CollapsibleSection
                  title="Оригинальное описание вакансии"
                  icon={FileText}
                  defaultOpen={false}
                >
                  <div className={cn(styles.sectionBody, styles.sectionBodyMono)}>
                    {vacancy.originalDescription}
                  </div>
                </CollapsibleSection>
              </section>
            )}
          </div>
        )}

        {/* Tab 2: CV Compatibility Scoring Report */}
        {currentTab === 'compatibility' && (
          <div role="tabpanel" className={styles.tabContent}>
            {vacancy.scoringReport !== undefined ? (
              <ScoreReportAccordion
                score={vacancy.scoringReport.score}
                summary={vacancy.scoringReport.summary}
                seniorityAssessment={vacancy.scoringReport.seniorityAssessment}
                matchedRequirements={vacancy.scoringReport.matchedRequirements}
                missingRequirements={vacancy.scoringReport.missingRequirements}
                criticalGaps={vacancy.scoringReport.criticalGaps}
                isOutdated={vacancy.scoringReport.isOutdated}
                cvRevision={vacancy.scoringReport.cvRevision}
                onReanalyze={onReanalyze}
                analyzing={analyzing}
              />
            ) : (
              <div className={styles.sectionBody}>
                <Text tone="secondary">
                  Анализ совместимости с резюме еще не проводился. Нажмите «Переанализировать», чтобы запустить расчет.
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Stage History */}
        {currentTab === 'history' && (
          <div role="tabpanel" className={styles.tabContent}>
            <SectionHeader
              title="История переходов по этапам"
              icon={HistoryIcon}
              iconTone="accent"
              divider
            />
            <div className={styles.historyContainer}>
              <StageStepper items={vacancy.history} />
            </div>
          </div>
        )}

        {/* Tab 4: Personal Notes */}
        {currentTab === 'notes' && (
          <div role="tabpanel" className={styles.tabContent}>
            <SectionHeader
              title="Личные заметки"
              icon={StickyNote}
              iconTone="muted"
              divider
            />
            <div className={styles.sectionBody}>
              <Textarea
                value={notes}
                onChange={handleNotesTextChange}
                placeholder="Заметки о процессе, контактах, впечатлениях от интервью..."
                rows={6}
                readOnly={readOnly}
                className={styles.notesArea}
              />
            </div>
            {!readOnly && onSaveNotes !== undefined && (
              <div className={styles.notesActions}>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveNotesClick}
                  startIcon={<Icon icon={Check} size="xs" />}
                >
                  Сохранить заметки
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
