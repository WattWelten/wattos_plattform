/**
 * Vordefinierte Test-Sets für RAG und Agents
 */

import { RAGTestCase } from './rag-evaluator';
import { AgentTestCase } from './agent-evaluator';

/**
 * Standard RAG Test-Set
 */
export const RAG_TEST_SET: RAGTestCase[] = [
  {
    id: 'rag-001',
    query: 'Was ist DSGVO?',
    expectedContext: ['DSGVO', 'Datenschutz', 'EU-Verordnung'],
    knowledgeSpaceId: 'default',
  },
  {
    id: 'rag-002',
    query: 'Wie funktioniert RAG?',
    expectedContext: ['RAG', 'Retrieval', 'Augmented Generation'],
    knowledgeSpaceId: 'default',
  },
];

/**
 * IT-Support Agent Test-Set
 */
export const IT_SUPPORT_TEST_SET: AgentTestCase[] = [
  {
    id: 'it-001',
    role: 'it-support-assist',
    input: 'Ich kann mich nicht anmelden',
    expectedOutput: 'Anmeldeproblem',
    maxCost: 0.50,
    maxTime: 60,
  },
  {
    id: 'it-002',
    role: 'it-support-assist',
    input: 'Mein Passwort funktioniert nicht',
    expectedOutput: 'Passwort-Reset',
    maxCost: 0.30,
    maxTime: 45,
  },
];

/**
 * Sales Agent Test-Set
 */
export const SALES_TEST_SET: AgentTestCase[] = [
  {
    id: 'sales-001',
    role: 'sales-backoffice-assist',
    input: 'Ich interessiere mich für Ihre KI-Plattform',
    expectedOutput: 'Produktinformation',
    maxCost: 0.30,
    maxTime: 120,
  },
];

/**
 * Alle verfügbaren Test-Sets
 */
export const TEST_SETS = {
  rag: RAG_TEST_SET,
  itSupport: IT_SUPPORT_TEST_SET,
  sales: SALES_TEST_SET,
};

