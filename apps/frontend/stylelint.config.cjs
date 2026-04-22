module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    // Phase 1 intent: block raw hex/font values; enforce token usage.
    'color-no-hex': [true, { severity: 'error' }],
    'font-family-name-quotes': 'always-where-recommended',
    'declaration-property-value-disallowed-list': {
      'font-family': ['/^(?!var\\(--font-).*/'],
    },

    // Project conventions (diverges from stylelint-config-standard defaults):
    // CSS Modules use camelCase identifiers, matching TSX consumers.
    'selector-class-pattern': [
      '^[a-z][a-zA-Z0-9]*(-[a-zA-Z0-9]+)*$',
      {
        message:
          'Class selectors should be camelCase (to match TSX `styles.foo` access) or kebab-case.',
      },
    ],
    // Keyframes in this project match the handoff source (claimPulse, timerPulse, etc.).
    'keyframes-name-pattern': [
      '^[a-z][a-zA-Z0-9]*$',
      { message: 'Keyframes use camelCase (matches handoff source).' },
    ],
    // Allow @tailwind / @apply / @layer directives.
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['tailwind', 'apply', 'layer', 'screen', 'variants', 'responsive'] },
    ],
    // The @font-face block in tokens.css packs 3 simple declarations on one
    // line by design — but tokens.css is ignored below. Relax for other files
    // that use the same compact style (e.g. animations.css inline states).
    'declaration-block-single-line-max-declarations': null,
    // Selector ordering is a stylistic preference that reports many false
    // positives across focus/hover/disabled modifier chains.
    'no-descending-specificity': null,
  },
  ignoreFiles: ['**/styles/tokens.css', '**/node_modules/**', '**/public/**'],
};
