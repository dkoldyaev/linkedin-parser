import { Badge, Button, Icon, ModalHeader, ModalHeaderMeta, Tabs, Text } from "@blueprint/ui-kit";
import { Ban, Database, ExternalLink, FileText, RefreshCw, Shield } from "lucide-react";
import { useTranslation } from "../../i18n/I18nContext";
import { Vacancy } from "../../types/models";
import { SalaryBadge } from "../SalaryBadge";
import { LocationBadge } from "../LocationBadge";
import { WorkplaceBadge } from "../WorkplaceBadge";
import { Dispatch, SetStateAction } from "react";
import { resolveCompatScoreTone } from "./vacancyModalHelpers";

export function VacancyModalHeader({
    title,
    companyName,
    link,
    onRefresh,
    refreshing,
    source,
    location,
    workplaceType,
    salaryMax,
    salaryMin,
    salaryCurrency,
    salaryPeriod,
    isClosed,
    activeTab,
    onTabChange,
    matchScore,
}: {
    title: string;
    companyName?: string;
    link?: string;
    location?: string;
    source?: string;
    workplaceType?: Vacancy['workplace_type'];
    onRefresh: () => void;
    refreshing?: boolean;
    salaryMin: Vacancy['salary_min'];
    salaryMax: Vacancy['salary_max'];
    salaryCurrency?: Vacancy['salary_currency'];
    salaryPeriod?: Vacancy['salary_period'];
    isClosed?: Vacancy['is_closed'];
    activeTab: string;
    onTabChange: Dispatch<SetStateAction<string>>;
    matchScore?: Vacancy['calculated_score'];
}) {
    const { t } = useTranslation();
    return (
      <ModalHeader
        title={title}
        description={
          companyName
            ? (
              <Text
                onClick={link ? (() => window.open(link, '_blank')) : undefined}
                endIcon={link && <Icon icon={ExternalLink} size='xs' />}
              >
                {companyName}
              </Text>
            )
            : undefined
        }
        actions={
          <>
            <Button
              variant="secondary"
              loading={refreshing}
              startIcon={<Icon icon={RefreshCw} />}
              onClick={onRefresh}
            >
              {t('vacancyModal.reparse_btn')}
            </Button>
            <Button
              variant="secondary"
              startIcon={<Icon icon={ExternalLink} />}
              onClick={() => window.open(link, '_blank')}
            >
              {source}
            </Button>
          </>
        }
        meta={
          <ModalHeaderMeta>
            <LocationBadge location={location} />
            <WorkplaceBadge workplaceType={workplaceType} />
            <SalaryBadge min={salaryMin} max={salaryMax} period={salaryPeriod} currency={salaryCurrency} />
            {isClosed && (
              <Text
                variant="caption"
                size="xs"
                tone="danger"
                startIcon={<Icon icon={Ban} size="xs" />}
              >
                {t('kanban.closed')}
              </Text>
            )}
          </ModalHeaderMeta>
        }
        tabs={
          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            items={[
              {
                value: 'details',
                label: t('vacancyModal.tab_details'),
                icon: <Icon icon={FileText} size="xs" />,
              },
              {
                value: 'compatibility',
                label: t('vacancyModal.tab_cv_compatibility'),
                icon: <Icon icon={Shield} size="xs" />,
                accessory:
                  matchScore && (
                    <Badge size="xs" tone={resolveCompatScoreTone(matchScore)}>
                      {matchScore}%
                    </Badge>
                  ),
              },
              {
                value: 'raw_data',
                label: t('vacancyModal.tab_raw_data'),
                icon: <Icon icon={Database} size="xs" />,
                align: 'right',
              },
            ]}
          />
        }
      />
    );
}
