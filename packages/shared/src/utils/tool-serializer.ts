/**
 * Tool-Serialisierungs-Utilities
 * Bereinigt und konvertiert Tool-Definitionen für sichere Serialisierung
 */

/**
 * OpenAI Tool Format (Function Calling)
 */
export interface OpenAITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties?: Record<string, any>;
      required?: string[];
    };
  };
}

/**
 * Tool Definition (aus Tool-Service)
 */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  type?: string;
  schema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
  adapter?: string;
  requiresAuth?: boolean;
  requiresApproval?: boolean;
  timeout?: number;
  retryCount?: number;
}

/**
 * Schema bereinigen - entfernt nicht-serialisierbare Felder
 * Verwendet rekursive Bereinigung, um zirkuläre Referenzen und nicht-serialisierbare Werte zu vermeiden
 */
export function sanitizeToolSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') {
    return { type: 'object', properties: {} };
  }

  const visited = new WeakSet();

  try {
    // Rekursive Bereinigung aller Werte
    const sanitizeValue = (value: any, depth: number = 0): any => {
      // Maximale Rekursionstiefe verhindern
      if (depth > 10) {
        return null;
      }

      // Primitivwerte direkt zurückgeben
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return value;
      }

      // Funktionen, Klassen, etc. entfernen
      if (typeof value === 'function') {
        return undefined;
      }

      // Arrays bereinigen
      if (Array.isArray(value)) {
        return value
          .map((item) => sanitizeValue(item, depth + 1))
          .filter((item) => item !== undefined);
      }

      // Objekte bereinigen
      if (typeof value === 'object') {
        // Zirkuläre Referenzen prüfen (nur für Objekte, nicht für Primitivwerte)
        if (visited.has(value)) {
          return null;
        }
        visited.add(value);

        const cleaned: any = {};
        for (const key in value) {
          // Überspringe nicht-serialisierbare Felder und Prototype-Eigenschaften
          if (
            key === 'execute' ||
            key === 'adapter' ||
            key === 'healthCheck' ||
            key === '__proto__' ||
            key === 'constructor' ||
            !Object.prototype.hasOwnProperty.call(value, key)
          ) {
            continue;
          }

          const cleanedValue = sanitizeValue(value[key], depth + 1);
          if (cleanedValue !== undefined) {
            cleaned[key] = cleanedValue;
          }
        }
        return cleaned;
      }

      return null;
    };

    const cleaned = sanitizeValue(schema);

    // Sicherstellen, dass es ein gültiges JSON Schema ist
    const result: any = {
      type: cleaned?.type || 'object',
      properties: cleaned?.properties || {},
    };

    // Required-Feld bereinigen
    if (cleaned?.required && Array.isArray(cleaned.required)) {
      result.required = cleaned.required.filter(
        (r: any) => typeof r === 'string' && r.length > 0,
      );
    }

    // Properties bereinigen - stelle sicher, dass alle Werte serialisierbar sind
    if (result.properties && typeof result.properties === 'object') {
      const cleanedProperties: Record<string, any> = {};
      for (const key in result.properties) {
        if (!Object.prototype.hasOwnProperty.call(result.properties, key)) {
          continue;
        }
        const prop = result.properties[key];
        if (prop && typeof prop === 'object') {
          cleanedProperties[key] = {
            type: typeof prop.type === 'string' ? prop.type : 'string',
            description: typeof prop.description === 'string' ? prop.description : undefined,
            enum: Array.isArray(prop.enum) ? prop.enum : undefined,
            default: prop.default !== undefined ? prop.default : undefined,
          };
          // Entferne undefined-Werte
          Object.keys(cleanedProperties[key]).forEach(
            (k) => cleanedProperties[key][k] === undefined && delete cleanedProperties[key][k],
          );
        }
      }
      result.properties = cleanedProperties;
    }

    // Finale Validierung: Versuche zu serialisieren
    JSON.stringify(result);

    return result;
  } catch (error) {
    // Bei Fehler: Fallback auf leeres Schema
    return { type: 'object', properties: {} };
  }
}

/**
 * Tools ins OpenAI-Format konvertieren
 * Entfernt nicht-serialisierbare Felder und konvertiert Tool-Definitionen
 */
export function convertToOpenAIToolFormat(tools: any[]): OpenAITool[] {
  if (!tools || !Array.isArray(tools) || tools.length === 0) {
    return [];
  }

  const converted = tools
    .map((tool) => {
      try {
        // Wenn Tool bereits im OpenAI-Format ist, validieren und bereinigen
        if (tool.type === 'function' && tool.function) {
          const name = String(tool.function.name || '').trim();
          if (!name) {
            return null;
          }

          const convertedTool = {
            type: 'function' as const,
            function: {
              name,
              description: String(tool.function.description || '').trim(),
              parameters: sanitizeToolSchema(tool.function.parameters || {}),
            },
          };

          // Validierung: Versuche zu serialisieren
          JSON.stringify(convertedTool);
          return convertedTool;
        }

        // Wenn Tool eine ToolDefinition ist, konvertieren
        if (tool.id && tool.name && tool.schema) {
          const name = String(tool.name || '').trim();
          if (!name) {
            return null;
          }

          const convertedTool = {
            type: 'function' as const,
            function: {
              name,
              description: String(tool.description || '').trim(),
              parameters: sanitizeToolSchema(tool.schema),
            },
          };

          // Validierung: Versuche zu serialisieren
          JSON.stringify(convertedTool);
          return convertedTool;
        }

        // Wenn Tool nur eine ID ist (string), überspringen (wird separat behandelt)
        if (typeof tool === 'string') {
          return null;
        }

        // Fallback: Versuche aus vorhandenen Feldern zu konstruieren
        if (tool.name) {
          const name = String(tool.name || '').trim();
          if (!name) {
            return null;
          }

          const convertedTool = {
            type: 'function' as const,
            function: {
              name,
              description: String(tool.description || '').trim(),
              parameters: sanitizeToolSchema(tool.parameters || tool.schema || {}),
            },
          };

          // Validierung: Versuche zu serialisieren
          JSON.stringify(convertedTool);
          return convertedTool;
        }

        return null;
      } catch (error) {
        // Bei Fehler: Tool überspringen
        return null;
      }
    })
    .filter((tool) => tool !== null) as OpenAITool[];

  // Finale Validierung: Stelle sicher, dass alle Tools serialisierbar sind
  try {
    JSON.stringify(converted);
    return converted;
  } catch (error) {
    // Bei Fehler: Leeres Array zurückgeben
    return [];
  }
}

/**
 * Validiert, ob Tools korrekt serialisiert werden können
 * @param tools Array von Tools zum Validieren
 * @returns true wenn serialisierbar, false sonst
 */
export function validateToolSerialization(tools: any[]): boolean {
  if (!tools || !Array.isArray(tools)) {
    return false;
  }

  try {
    const converted = convertToOpenAIToolFormat(tools);
    JSON.stringify(converted);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validiert einen Request-Body mit Tools
 * @param requestBody Request-Body mit optionalem tools-Feld
 * @returns true wenn serialisierbar, false sonst
 */
export function validateRequestWithTools(requestBody: any): boolean {
  try {
    if (requestBody.tools && Array.isArray(requestBody.tools)) {
      if (!validateToolSerialization(requestBody.tools)) {
        return false;
      }
    }
    JSON.stringify(requestBody);
    return true;
  } catch {
    return false;
  }
}




