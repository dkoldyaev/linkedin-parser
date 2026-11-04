import InterceptedVacancyModal from './InterceptedVacancyModal';

export const dynamic = 'force-dynamic';

export default async function ModalSlot({ params }) {
  const { id } = await params;
  return <InterceptedVacancyModal vacancyId={id} />;
}
