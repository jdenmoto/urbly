import Card from '@/components/Card';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';

type ComingSoonPageProps = {
  title: string;
  subtitle: string;
  description: string;
};

export default function ComingSoonPage({ title, subtitle, description }: ComingSoonPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <Card>
        <EmptyState title={title} description={description} />
      </Card>
    </div>
  );
}
