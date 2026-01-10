/**
 * Prisma Config für Prisma 7.2.0+
 * 
 * In Prisma 7.2.0 wurde die `url` Property aus dem `datasource` Block entfernt.
 * Die Connection URL muss jetzt hier definiert werden.
 */

export default {
  datasources: {
    db: {
      provider: 'postgresql',
      url: process.env.DATABASE_URL || '',
    },
  },
};
