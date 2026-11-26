import {
  Accordion,
  type AccordionItem,
  SectionHeader,
  type SectionHeaderTone,
} from '../../molecules';
import { Badge, type BadgeTone, Button, Icon, Paragraph } from '../../atoms';
import { LucideIcon, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '../../utils';
import React from 'react';
import styles from './ReportAccordion.module.css';

export interface ReportSectionGroup {
  readonly id: string;
  readonly title: string;
  readonly tone?: SectionHeaderTone;
  readonly items: readonly AccordionItem[];
  readonly defaultExpandedIds?: readonly string[];
  readonly icon?: LucideIcon;
}

export interface ReportAccordionProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  readonly title?: React.ReactNode;
  readonly scoreLabel?: React.ReactNode;
  readonly scoreTone?: BadgeTone;
  readonly summary?: React.ReactNode;
  readonly sections: readonly ReportSectionGroup[];
  readonly onAction?: () => void;
  readonly actionLabel?: string;
  readonly actionLoading?: boolean;
  readonly defaultActionLabel?: string;
}

/**
 * ReportAccordion organism.
 * Universal structured analytical report combining SectionHeader, summary block,
 * score badge, and categorized Accordion sections on the 32px Blueprint grid.
 */
export function ReportAccordion({
  title = 'Analytical Report',
  scoreLabel,
  scoreTone = 'success',
  summary,
  sections,
  onAction,
  actionLabel = 'Re-run Analysis',
  actionLoading = false,
  defaultActionLabel = 'Evidence',
  className,
  ...rest
}: ReportAccordionProps): React.ReactElement {
  return (
    <div className={cn(styles.report, className)} {...rest}>
      <SectionHeader
        title={title}
        icon={<Icon icon={Sparkles} size="sm" tone="success" />}
        divider
        badge={
          scoreLabel !== undefined ? (
            <Badge size="sm" tone={scoreTone}>
              {scoreLabel}
            </Badge>
          ) : undefined
        }
        accessory={
          onAction !== undefined ? (
            <Button
              variant="secondary"
              size="sm"
              loading={actionLoading}
              onClick={onAction}
              startIcon={<Icon icon={RefreshCw} size="xs" />}
            >
              {actionLabel}
            </Button>
          ) : undefined
        }
      />

      {summary !== undefined && (
        <div className={styles.summaryBox}>
          <Paragraph size="sm" tone="secondary" className={styles.summaryText}>
            {summary}
          </Paragraph>
        </div>
      )}

      <div className={styles.sectionsList}>
        {sections.map((section) => (
          <div key={section.id} className={styles.sectionBlock}>
            <SectionHeader
              title={`${section.title} [${section.items.length}]`}
              tone={section.tone ?? 'default'}
              variant="mono"
              divider
            />
            <Accordion
              items={section.items}
              defaultExpandedIds={section.defaultExpandedIds}
              defaultActionLabel={defaultActionLabel}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
