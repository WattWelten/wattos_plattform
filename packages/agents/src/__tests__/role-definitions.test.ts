import { describe, it, expect } from 'vitest';
import {

  getRoleDefinition,
  getAllRoleDefinitions,
  IT_SUPPORT_ROLE,
  SALES_ROLE,
  MEETING_ROLE,
  MARKETING_ROLE,
  LEGAL_ROLE,
} from '../roles/role-definitions';

describe('Role Definitions', () => {
  it('should have 5 predefined roles', () => {
    expect(getAllRoleDefinitions()).toHaveLength(5);
  });

  it('should return IT Support role by id', () => {
    const role = getRoleDefinition('it-support-assist');
    expect(role).toBeDefined();
    expect(role?.name).toBe('IT-Support Assist');
  });

  it('should return undefined for invalid role id', () => {
    const role = getRoleDefinition('invalid-role');
    expect(role).toBeUndefined();
  });

  it('should have all required fields for IT Support role', () => {
    expect(IT_SUPPORT_ROLE.id).toBe('it-support-assist');
    expect(IT_SUPPORT_ROLE.personaConfig).toBeDefined();
    expect(IT_SUPPORT_ROLE.toolsConfig).toBeDefined();
    expect(IT_SUPPORT_ROLE.policiesConfig).toBeDefined();
    expect(IT_SUPPORT_ROLE.kpiConfig).toBeDefined();
  });

  it('should have all required fields for Sales role', () => {
    expect(SALES_ROLE.id).toBe('sales-backoffice-assist');
    expect(SALES_ROLE.personaConfig).toBeDefined();
    expect(SALES_ROLE.toolsConfig).toBeDefined();
    expect(SALES_ROLE.policiesConfig).toBeDefined();
    expect(SALES_ROLE.kpiConfig).toBeDefined();
  });

  it('should have all required fields for Meeting role', () => {
    expect(MEETING_ROLE.id).toBe('meeting-assist');
    expect(MEETING_ROLE.personaConfig).toBeDefined();
    expect(MEETING_ROLE.toolsConfig).toBeDefined();
    expect(MEETING_ROLE.policiesConfig).toBeDefined();
    expect(MEETING_ROLE.kpiConfig).toBeDefined();
  });

  it('should have all required fields for Marketing role', () => {
    expect(MARKETING_ROLE.id).toBe('marketing-assist');
    expect(MARKETING_ROLE.personaConfig).toBeDefined();
    expect(MARKETING_ROLE.toolsConfig).toBeDefined();
    expect(MARKETING_ROLE.policiesConfig).toBeDefined();
    expect(MARKETING_ROLE.kpiConfig).toBeDefined();
  });

  it('should have all required fields for Legal role', () => {
    expect(LEGAL_ROLE.id).toBe('legal-assist');
    expect(LEGAL_ROLE.personaConfig).toBeDefined();
    expect(LEGAL_ROLE.toolsConfig).toBeDefined();
    expect(LEGAL_ROLE.policiesConfig).toBeDefined();
    expect(LEGAL_ROLE.kpiConfig).toBeDefined();
  });

  it('should have PII redaction enabled for all roles', () => {
    getAllRoleDefinitions().forEach((role) => {
      expect(role.policiesConfig.piiRedaction).toBe(true);
    });
  });
});

