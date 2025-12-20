import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface CircuitBreakerOptions {
  failureThreshold: number; // Anzahl Fehler bevor Circuit öffnet
  resetTimeout: number; // Zeit in ms bis Retry
  monitoringPeriod: number; // Zeitfenster für Fehler-Tracking
}

export enum CircuitState {
  CLOSED = 'closed', // Normal operation
  OPEN = 'open', // Circuit open, requests rejected
  HALF_OPEN = 'half_open', // Testing if service recovered
}

@Injectable()
export class CircuitBreakerService {
  private readonly logger = new Logger(CircuitBreakerService.name);
  private circuits: Map<string, {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    lastUsed: number;
    successCount: number;
    options: CircuitBreakerOptions;
  }> = new Map();

  constructor(private configService?: ConfigService) {}

  /**
   * Führt eine Operation mit Circuit Breaker aus
   */
  async execute<T>(
    circuitName: string,
    operation: () => Promise<T>,
    options?: Partial<CircuitBreakerOptions>,
  ): Promise<T> {
    const circuit = this.getOrCreateCircuit(circuitName, options);
    const state = this.getCircuitStateInternal(circuit);

    // Circuit ist offen - sofort ablehnen
    if (state === CircuitState.OPEN) {
      this.logger.warn(`Circuit ${circuitName} is OPEN, rejecting request`);
      throw new Error(`Circuit breaker is OPEN for ${circuitName}`);
    }

    // Circuit ist halb-offen - nur einen Request durchlassen
    if (state === CircuitState.HALF_OPEN && circuit.successCount > 0) {
      this.logger.warn(`Circuit ${circuitName} is HALF_OPEN, rejecting request (already testing)`);
      throw new Error(`Circuit breaker is HALF_OPEN for ${circuitName}`);
    }

    try {
      const result = await operation();
      
      // Update lastUsed
      circuit.lastUsed = Date.now();
      
      // Erfolg - Circuit schließen oder im HALF_OPEN Zustand Erfolge zählen
      this.onSuccess(circuitName, circuit);
      return result;
    } catch (error: unknown) {
      // Update lastUsed auch bei Fehlern
      circuit.lastUsed = Date.now();
      
      // Fehler - Circuit öffnen oder Fehler zählen
      this.onFailure(circuitName, circuit);
      throw error;
    }
  }

  /**
   * Circuit-Status abrufen
   */
  getCircuitState(circuitName: string): CircuitState {
    const circuit = this.circuits.get(circuitName);
    if (!circuit) {
      return CircuitState.CLOSED;
    }
    return this.getCircuitStateInternal(circuit);
  }

  /**
   * Circuit zurücksetzen
   */
  resetCircuit(circuitName: string): void {
    const circuit = this.circuits.get(circuitName);
    if (circuit) {
      circuit.state = CircuitState.CLOSED;
      circuit.failures = 0;
      circuit.successCount = 0;
      this.logger.log(`Circuit ${circuitName} reset`);
    }
  }

  private getOrCreateCircuit(
    circuitName: string,
    options?: Partial<CircuitBreakerOptions>,
  ) {
    if (!this.circuits.has(circuitName)) {
      const defaultOptions: CircuitBreakerOptions = {
        failureThreshold: this.configService?.get<number>('CIRCUIT_BREAKER_FAILURE_THRESHOLD', 5) || 5,
        resetTimeout: this.configService?.get<number>('CIRCUIT_BREAKER_RESET_TIMEOUT', 60000) || 60000,
        monitoringPeriod: this.configService?.get<number>('CIRCUIT_BREAKER_MONITORING_PERIOD', 60000) || 60000,
      };

      this.circuits.set(circuitName, {
        state: CircuitState.CLOSED,
        failures: 0,
        lastFailureTime: 0,
        lastUsed: Date.now(),
        successCount: 0,
        options: { ...defaultOptions, ...options },
      });
    }
    return this.circuits.get(circuitName)!;
  }

  private getCircuitStateInternal(circuit: {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    lastUsed: number;
    successCount: number;
    options: CircuitBreakerOptions;
  }): CircuitState {
    const now = Date.now();
    const timeSinceLastFailure = now - circuit.lastFailureTime;

    // Wenn Circuit offen ist und Reset-Timeout abgelaufen, zu HALF_OPEN wechseln
    if (circuit.state === CircuitState.OPEN && timeSinceLastFailure >= circuit.options.resetTimeout) {
      circuit.state = CircuitState.HALF_OPEN;
      circuit.successCount = 0;
      this.logger.log(`Circuit transitioning to HALF_OPEN`);
      return CircuitState.HALF_OPEN;
    }

    return circuit.state;
  }

  /**
   * Cleanup ungenutzte Circuits (läuft stündlich)
   */
  @Cron(CronExpression.EVERY_HOUR)
  cleanupUnusedCircuits(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 Stunden

    for (const [name, circuit] of this.circuits.entries()) {
      if (now - circuit.lastUsed > maxAge && circuit.state === CircuitState.CLOSED) {
        this.circuits.delete(name);
        this.logger.log(`Cleaned up unused circuit: ${name}`);
      }
    }
  }

  private onSuccess(circuitName: string, circuit: {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    lastUsed: number;
    successCount: number;
    options: CircuitBreakerOptions;
  }): void {
    if (circuit.state === CircuitState.HALF_OPEN) {
      circuit.successCount++;
      // Nach einigen Erfolgen Circuit schließen
      if (circuit.successCount >= 2) {
        circuit.state = CircuitState.CLOSED;
        circuit.failures = 0;
        this.logger.log(`Circuit ${circuitName} closed after successful recovery`);
      }
    } else {
      // Im CLOSED Zustand: Fehler-Zähler zurücksetzen
      circuit.failures = 0;
    }
  }

  private onFailure(circuitName: string, circuit: {
    state: CircuitState;
    failures: number;
    lastFailureTime: number;
    lastUsed: number;
    successCount: number;
    options: CircuitBreakerOptions;
  }): void {
    circuit.failures++;
    circuit.lastFailureTime = Date.now();

    if (circuit.state === CircuitState.HALF_OPEN) {
      // Im HALF_OPEN Zustand: Sofort wieder öffnen
      circuit.state = CircuitState.OPEN;
      circuit.successCount = 0;
      this.logger.warn(`Circuit ${circuitName} opened again after failure in HALF_OPEN state`);
    } else if (circuit.failures >= circuit.options.failureThreshold) {
      // Fehler-Schwelle erreicht: Circuit öffnen
      circuit.state = CircuitState.OPEN;
      this.logger.error(`Circuit ${circuitName} opened after ${circuit.failures} failures`);
    }
  }
}






