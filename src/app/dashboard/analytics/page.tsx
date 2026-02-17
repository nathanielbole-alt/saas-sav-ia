import { getAnalytics } from '@/lib/actions/analytics'
import AnalyticsClient from './analytics-client'

export default async function AnalyticsPage() {
  const analytics = await getAnalytics()

  return <AnalyticsClient analytics={analytics} />
}
