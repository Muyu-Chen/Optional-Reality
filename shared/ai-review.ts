// Use the existing interpretation field so older clients can still decode the
// result. This marker requests human review; it never grants rule permissions.
export const AI_REVIEW_PREFIX = 'AI revised interpretation: ';
export const AI_REVIEW_HEADER = 'x-ai-review';
export const AI_REVIEW_VERSION = 'staged-v1';
export function needsAIReview(message?: { understoodAs?: string }) {
  return message?.understoodAs?.startsWith(AI_REVIEW_PREFIX) ?? false;
}
