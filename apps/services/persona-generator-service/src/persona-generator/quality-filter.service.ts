import { Injectable, Logger } from '@nestjs/common';

/**
 * Quality Filter Service
 * 
 * Filtert Personas basierend auf Qualitäts-Kriterien
 */
@Injectable()
export class QualityFilterService {
  private readonly logger = new Logger(QualityFilterService.name);

  /**
   * Qualitäts-Score für eine Persona berechnen
   */
  calculateQualityScore(persona: {
    name: string;
    description: string;
    traits: Record<string, unknown>;
    characteristics: Record<string, unknown>;
    painPoints: string[];
    goals: string[];
    communicationStyle: Record<string, unknown>;
  }): number {
    let score = 0;
    let maxScore = 0;

    // Name vorhanden und aussagekräftig (0-10 Punkte)
    maxScore += 10;
    if (persona.name && persona.name.length > 5) {
      score += 10;
    } else if (persona.name) {
      score += 5;
    }

    // Beschreibung vorhanden und detailliert (0-20 Punkte)
    maxScore += 20;
    if (persona.description && persona.description.length >= 200) {
      score += 20;
    } else if (persona.description && persona.description.length >= 100) {
      score += 10;
    } else if (persona.description) {
      score += 5;
    }

    // Traits vorhanden und vollständig (0-15 Punkte)
    maxScore += 15;
    if (persona.traits) {
      const traitsKeys = Object.keys(persona.traits);
      if (traitsKeys.length >= 3) {
        score += 15;
      } else if (traitsKeys.length >= 2) {
        score += 10;
      } else if (traitsKeys.length >= 1) {
        score += 5;
      }
    }

    // Characteristics vorhanden (0-15 Punkte)
    maxScore += 15;
    if (persona.characteristics && Object.keys(persona.characteristics).length > 0) {
      score += 15;
    }

    // Pain Points vorhanden und aussagekräftig (0-20 Punkte)
    maxScore += 20;
    if (persona.painPoints && persona.painPoints.length >= 3) {
      score += 20;
    } else if (persona.painPoints && persona.painPoints.length >= 2) {
      score += 10;
    } else if (persona.painPoints && persona.painPoints.length >= 1) {
      score += 5;
    }

    // Goals vorhanden und aussagekräftig (0-20 Punkte)
    maxScore += 20;
    if (persona.goals && persona.goals.length >= 3) {
      score += 20;
    } else if (persona.goals && persona.goals.length >= 2) {
      score += 10;
    } else if (persona.goals && persona.goals.length >= 1) {
      score += 5;
    }

    // Communication Style vorhanden (0-10 Punkte)
    maxScore += 10;
    if (persona.communicationStyle && Object.keys(persona.communicationStyle).length > 0) {
      score += 10;
    }

    // Normalisieren auf 0-1
    const normalizedScore = maxScore > 0 ? score / maxScore : 0;

    return Math.round(normalizedScore * 100) / 100; // Auf 2 Dezimalstellen runden
  }

  /**
   * Persona-Liste nach Qualität filtern
   */
  filterByQuality(
    personas: Array<{ qualityScore?: number }>,
    minScore: number = 0.7,
  ): Array<{ qualityScore?: number }> {
    return personas.filter((p) => (p.qualityScore || 0) >= minScore);
  }

  /**
   * Duplikate entfernen (basierend auf Name-Ähnlichkeit)
   */
  removeDuplicates(personas: Array<{ name: string }>): Array<{ name: string }> {
    const seen = new Set<string>();
    return personas.filter((persona) => {
      const normalizedName = persona.name.toLowerCase().trim();
      if (seen.has(normalizedName)) {
        return false;
      }
      seen.add(normalizedName);
      return true;
    });
  }
}

