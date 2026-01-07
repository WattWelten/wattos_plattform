/**
 * Kaya Character Policy
 * Richtlinien für Antworten und Verhalten
 */

export interface KayaPolicy {
  answerStyle: 'kurz+schritt';
  showSources: true;
  showDate: true;
  maxTokens: 450;
  escalation: {
    phone?: string;
    email?: string;
  };
  compliance: {
    gdpr: true;
    sourceRequired: true;
    noPII: true;
  };
}

export const kayaDefaultPolicy: KayaPolicy = {
  answerStyle: 'kurz+schritt',
  showSources: true,
  showDate: true,
  maxTokens: 450,
  escalation: {
    email: 'service@oldenburg-kreis.de',
  },
  compliance: {
    gdpr: true,
    sourceRequired: true,
    noPII: true,
  },
};
