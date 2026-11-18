import React, { forwardRef } from 'react';
import {
  Award,
  Ban,
  Banknote,
  Building2,
  ChevronLeft,
  ChevronRight,
  Globe,
  History,
  Home,
  MapPin,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { Badge, Button, Icon, Paragraph, StatusDot, Text } from '../../atoms';
import { ButtonGroup, TokenList } from '../../molecules';
import { Card, CardBody, CardFooter, CardHeader } from '../Card';
import styles from './VacancyCard.module.css';

export interface VacancyCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onClick' | 'title'> {
  readonly title: string;
  readonly company: string;
  readonly sourceUrl?: string;
  readonly matchScore?: number;
  readonly workplace?: 'remote' | 'hybrid' | 'onsite' | string;
  readonly workplaceLabel?: string;
  readonly location?: string;
  readonly salary?: string;
  readonly summary?: string;
  readonly aiPending?: boolean;
  readonly techStack?: readonly string[];
  readonly tags?: readonly string[];
  readonly date?: string;
  readonly historyCount?: number;
  readonly hasHistoryComment?: boolean;
  readonly isClosed?: boolean;
  readonly isRejected?: boolean;
  readonly stageLabel?: string;
  readonly selected?: boolean;
  readonly selectable?: boolean;
  readonly onToggleSelect?: () => void;
  readonly onClick?: () => void;
  readonly onMoveLeft?: (e: React.MouseEvent) => void;
  readonly onMoveRight?: (e: React.MouseEvent) => void;
  readonly onMoveRejected?: (e: React.MouseEvent) => void;
  readonly onRestoreRejected?: (e: React.MouseEvent) => void;
  readonly canMoveLeft?: boolean;
  readonly canMoveRight?: boolean;
  readonly leftLabel?: string;
  readonly rightLabel?: string;
  readonly rejectLabel?: string;
  readonly restoreLabel?: string;
  readonly closedLabel?: string;
  readonly pendingAiLabel?: string;
  readonly checkboxAriaLabel?: string;
}

/**
 * VacancyCard renders a standardized Kanban vacancy card based on the Storybook Vacancy Card Showcase.
 */
export const VacancyCard = forwardRef<HTMLDivElement, VacancyCardProps>(
  function VacancyCard(
    {
      title,
      company,
      sourceUrl,
      matchScore,
      workplace = 'remote',
      workplaceLabel,
      location,
      salary,
      summary,
      aiPending = false,
      techStack = [],
      tags = [],
      date,
      historyCount,
      hasHistoryComment = false,
      isClosed = false,
      isRejected = false,
      stageLabel,
      selected = false,
      selectable = true,
      onToggleSelect,
      onClick,
      onMoveLeft,
      onMoveRight,
      onMoveRejected,
      onRestoreRejected,
      canMoveLeft = false,
      canMoveRight = false,
      leftLabel = 'Move previous',
      rightLabel = 'Move next',
      rejectLabel = 'Move to rejected',
      restoreLabel = 'Restore',
      closedLabel = 'Closed',
      pendingAiLabel = 'Ожидание AI-анализа...',
      checkboxAriaLabel = 'Select vacancy card',
      className,
      ...rest
    },
    ref
  ) {
    const scoreTone =
      matchScore === undefined
        ? 'neutral'
        : matchScore >= 75
          ? 'success'
          : matchScore >= 50
            ? 'warning'
            : 'danger';

    const workplaceKey = String(workplace || '').toLowerCase();
    const workplaceIcon =
      workplaceKey === 'remote'
        ? Globe
        : workplaceKey === 'hybrid'
          ? Home
          : Building2;
    const workplaceTone =
      workplaceKey === 'remote'
        ? 'accent'
        : workplaceKey === 'hybrid'
          ? 'warning'
          : 'secondary';
    const resolvedWorkplaceLabel =
      workplaceLabel ||
      (workplaceKey === 'remote'
        ? 'Remote'
        : workplaceKey === 'hybrid'
          ? 'Hybrid'
          : 'On-site');

    return (
      <Card
        ref={ref}
        data-bp-card="true"
        matchScore={matchScore}
        selected={selected}
        interactive
        onClick={onClick}
        className={className}
        {...rest}
      >
        <CardBody>
          <CardHeader
            overline={company}
            overlineHref={sourceUrl}
            title={title}
            selectable={selectable}
            checked={selected}
            onCheckedChange={() => onToggleSelect?.()}
            checkboxAriaLabel={checkboxAriaLabel}
            statusIndicators={
              (stageLabel !== undefined || isClosed) ? (
                <>
                  {stageLabel !== undefined && (
                    <Badge variant="outline" size="xs" tone="info">
                      {stageLabel}
                    </Badge>
                  )}
                  {isClosed && (
                    <Badge
                      variant="solid"
                      size="xs"
                      tone="danger"
                      icon={<Icon icon={Ban} size="2xs" />}
                    >
                      {closedLabel}
                    </Badge>
                  )}
                </>
              ) : undefined
            }
          />

          {(matchScore !== undefined || workplace || location !== undefined || salary !== undefined) && (
            <div className={styles.metaRow}>
              {matchScore !== undefined && (
                <Badge
                  variant="solid"
                  size="xs"
                  tone={scoreTone}
                  icon={<Icon icon={Award} size="2xs" />}
                >
                  {matchScore}%
                </Badge>
              )}
              {workplace && (
                <Text
                  variant="caption"
                  tone={workplaceTone}
                  startIcon={<Icon icon={workplaceIcon} size="xs" />}
                >
                  {resolvedWorkplaceLabel}
                </Text>
              )}
              {location !== undefined && (
                <Text
                  variant="caption"
                  tone="secondary"
                  startIcon={<Icon icon={MapPin} size="xs" />}
                >
                  {location}
                </Text>
              )}
              {salary !== undefined && (
                <Text
                  variant="mono"
                  tone="success"
                  startIcon={<Icon icon={Banknote} size="xs" />}
                >
                  {salary}
                </Text>
              )}
            </div>
          )}

          {summary !== undefined ? (
            <Paragraph size="sm" tone="secondary">
              {summary}
            </Paragraph>
          ) : aiPending ? (
            <Text
              variant="caption"
              tone="muted"
              startIcon={<Icon icon={Sparkles} size="xs" />}
            >
              {pendingAiLabel}
            </Text>
          ) : null}

          {techStack.length > 0 && (
            <TokenList>
              {techStack.slice(0, 4).map((tech) => (
                <Badge key={tech} size="xs" variant="chip">
                  {tech}
                </Badge>
              ))}
              {techStack.length > 4 && (
                <Badge size="xs" variant="chip" tone="neutral" style={{ opacity: 0.6 }}>
                  +{techStack.length - 4}
                </Badge>
              )}
            </TokenList>
          )}

          {tags.length > 0 && (
            <TokenList>
              {tags.map((tag) => (
                <Badge key={tag} size="xs" variant="chip" tone="neutral">
                  #{tag}
                </Badge>
              ))}
            </TokenList>
          )}
        </CardBody>

        <CardFooter
          metaSlot={
            <div className={styles.footerRow}>
              {date !== undefined && (
                <Text variant="caption" tone="muted">
                  {date}
                </Text>
              )}
              {historyCount !== undefined && historyCount > 0 && (
                <Text
                  variant="caption"
                  tone="muted"
                  startIcon={<Icon icon={History} size="2xs" />}
                  endIcon={
                    hasHistoryComment ? (
                      <StatusDot tone="info" size="xs" />
                    ) : undefined
                  }
                >
                  {historyCount}
                </Text>
              )}
            </div>
          }
          actionsSlot={
            isRejected ? (
              <Button
                variant="ghost"
                size="sm"
                tone="accent"
                onClick={onRestoreRejected}
                startIcon={<Icon icon={RotateCcw} size="xs" />}
              >
                {restoreLabel}
              </Button>
            ) : (
              <ButtonGroup>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canMoveLeft}
                  onClick={onMoveLeft}
                  aria-label={leftLabel}
                  title={leftLabel}
                >
                  <Icon icon={ChevronLeft} size="sm" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  tone="danger"
                  onClick={onMoveRejected}
                  aria-label={rejectLabel}
                  title={rejectLabel}
                >
                  <Icon icon={X} size="sm" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={!canMoveRight}
                  onClick={onMoveRight}
                  aria-label={rightLabel}
                  title={rightLabel}
                >
                  <Icon icon={ChevronRight} size="sm" />
                </Button>
              </ButtonGroup>
            )
          }
        />
      </Card>
    );
  }
);
