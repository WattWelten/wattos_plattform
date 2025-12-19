import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { PrismaClient } from '@wattweiser/db';

/**
 * Agent Worker
 * Verarbeitet Agent-Run-Jobs aus BullMQ
 */

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
});

const prisma = new PrismaClient();

const worker = new Worker(
  'agent-runs',
  async (job) => {
    console.log(`Processing agent run job: ${job.id}`);

    const { agentId, input, userId } = job.data;

    try {
      // Agent aus DB laden
      const agent = await prisma.agent.findUnique({
        where: { id: agentId },
      });

      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // TODO: Agent-Run mit Agent-Service ausführen
      // Für jetzt: Placeholder
      const output = `Agent response for: ${input}`;

      // Agent-Run in DB speichern
      const agentRun = await prisma.agentRun.create({
        data: {
          agentId,
          userId,
          input,
          output,
          status: 'completed',
          metrics: {
            duration: 1000,
            tokenUsage: { prompt: 100, completion: 50, total: 150 },
            costUsd: 0.001,
            toolCallsCount: 0,
            retryCount: 0,
            kpiMetrics: {},
          },
        },
      });

      console.log(`Agent run completed: ${agentRun.id}`);
      return { success: true, runId: agentRun.id };
    } catch (error: any) {
      console.error(`Agent run failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 10, // Max. 10 Agent-Runs parallel
  },
);

worker.on('completed', (job) => {
  console.log(`Agent run job completed: ${job.id}`);
});

worker.on('failed', (job, err) => {
  console.error(`Agent run job failed: ${job?.id} - ${err.message}`);
});

console.log('Agent worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close();
  await redis.quit();
  await prisma.$disconnect();
  process.exit(0);
});


