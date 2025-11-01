import { createFileRoute } from '@tanstack/react-router'
import { DefaultLayout } from '@/layouts/default';

export const Route = createFileRoute('/account/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <DefaultLayout>Hello "/account/"!</DefaultLayout>;
}
