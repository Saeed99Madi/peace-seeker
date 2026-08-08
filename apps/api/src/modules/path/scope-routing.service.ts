import { Injectable, Logger } from '@nestjs/common';
import type { OutOfScopeReason } from '@peace/shared';

export interface ScopeAssessment {
  inScope: boolean;
  reason: OutOfScopeReason | null;
  /** True when the text merits a human read before the case proceeds. */
  needsHumanReview: boolean;
}

/**
 * D-8 — routing out.
 *
 * This is a *screen*, not a classifier, and it is deliberately biased towards
 * false positives: a case wrongly sent for human review costs a delay, while a
 * case of domestic violence wrongly mediated on this platform can cost a life.
 * A positive result never publishes an accusation and never notifies the other
 * party; it stops the case and shows referral information.
 *
 * The term lists below are a starting point for the Foundation's safeguarding
 * advisers to extend per language; they are not a complete safety system, and
 * the platform states plainly that it is not a substitute for legal protection
 * or emergency services.
 */
@Injectable()
export class ScopeRoutingService {
  private readonly logger = new Logger(ScopeRoutingService.name);

  private readonly signals: Array<{ reason: OutOfScopeReason; patterns: RegExp[] }> = [
    {
      reason: 'THREAT_OF_HARM',
      patterns: [/\bkill (you|him|her|them)\b/i, /\bthreaten(ed|ing)? to (kill|hurt|harm)\b/i, /\bهدد(ني|ه|ها)? بالقتل\b/],
    },
    {
      reason: 'DOMESTIC_VIOLENCE',
      patterns: [/\b(beat|beats|beating|hit|hits|hitting) (me|her|him|my wife|my husband)\b/i, /\bdomestic (abuse|violence)\b/i, /\bعنف (أسري|منزلي)\b/],
    },
    {
      reason: 'CHILD_SAFETY',
      patterns: [/\bchild (abuse|neglect|endangerment)\b/i, /\bminor(s)? (harmed|abused)\b/i, /\bإساءة (لطفل|للأطفال)\b/],
    },
    {
      reason: 'CRIMINAL',
      patterns: [/\b(rape|sexual assault|kidnap(ping)?|trafficking)\b/i, /\b(اغتصاب|اختطاف|اتجار بالبشر)\b/],
    },
  ];

  assess(...texts: Array<string | undefined>): ScopeAssessment {
    const haystack = texts.filter(Boolean).join('\n');
    for (const signal of this.signals) {
      if (signal.patterns.some((pattern) => pattern.test(haystack))) {
        this.logger.warn(`Intake routed out of scope: ${signal.reason}`);
        return { inScope: false, reason: signal.reason, needsHumanReview: true };
      }
    }
    return { inScope: true, reason: null, needsHumanReview: false };
  }
}
