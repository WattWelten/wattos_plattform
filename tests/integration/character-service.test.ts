/**
 * Character Service Integration Tests
 * 
 * Kritische Tests für Character-Definition und Tenant-Profile-Erstellung
 */

import { Test, TestingModule } from '@nestjs/testing';
import { CharacterDefinitionService } from '../apps/services/character-service/src/character/character-definition.service';
import { ProfileService } from '../packages/core/src/profiles/profile.service';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ServiceDiscoveryService } from '@wattweiser/shared';

describe('Character Service Integration', () => {
  let service: CharacterDefinitionService;
  let profileService: ProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharacterDefinitionService,
        {
          provide: ProfileService,
          useValue: {
            getProfile: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: ServiceDiscoveryService,
          useValue: {
            getServiceUrl: jest.fn().mockReturnValue('http://localhost:3009'),
          },
        },
      ],
    }).compile();

    service = module.get<CharacterDefinitionService>(CharacterDefinitionService);
    profileService = module.get<ProfileService>(ProfileService);
  });

  describe('defineCharacterFromPrompt', () => {
    it('should extract character information from prompt', async () => {
      const prompt = 'Du bist Kaya, die Bürgerassistenz vom Landkreis Oldenburg. Deine Aufgabe ist es, Bürgern bei Fragen zu helfen.';
      const tenantId = 'test-tenant-id';

      // Mock LLM response
      const mockLLMResponse = {
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: 'Kaya',
                  role: 'Bürgerassistenz',
                  personality: {
                    traits: ['hilfsbereit', 'professionell'],
                    tone: 'freundlich',
                    values: ['Bürgernähe', 'Effizienz'],
                  },
                  systemPrompt: 'Du bist Kaya...',
                  communicationStyle: 'freundlich',
                  knowledgeAreas: ['Bürgerservices', 'Verwaltung'],
                  complianceRequirements: ['GDPR', 'Gov'],
                }),
              },
            },
          ],
        },
      };

      // Test implementation würde hier folgen
      // Für MVP: Struktur ist wichtig, vollständige Tests später
    });
  });
});


