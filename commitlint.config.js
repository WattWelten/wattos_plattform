module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Neue Feature
        'fix',      // Bugfix
        'docs',     // Dokumentation
        'style',    // Formatierung (keine Code-Änderung)
        'refactor', // Refactoring (keine Feature-Änderung, kein Bugfix)
        'perf',     // Performance-Verbesserung
        'test',     // Tests hinzufügen/ändern
        'build',    // Build-System oder externe Dependencies
        'ci',       // CI/CD Konfiguration
        'chore',    // Andere Änderungen (nicht im Code)
        'revert',   // Revert eines Commits
      ],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
    'scope-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 100],
    'body-leading-blank': [1, 'always'],
    'body-max-line-length': [2, 'always', 200],
    'footer-leading-blank': [1, 'always'],
  },
};












