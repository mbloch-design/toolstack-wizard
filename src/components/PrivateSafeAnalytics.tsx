import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { beforeSendAnalyticsEvent, sensitiveAnalyticsDocument } from '@/lib/analyticsPrivacy';

export default function PrivateSafeAnalytics() {
  // A cleaned callback URL must not re-enable a raw tracker in this document.
  const [suppressed] = useState(sensitiveAnalyticsDocument);
  return suppressed ? null : <Analytics beforeSend={beforeSendAnalyticsEvent} />;
}
