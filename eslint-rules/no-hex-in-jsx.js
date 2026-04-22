// Custom ESLint rule: forbid hard-coded hex colors and raw font-family strings
// inside JSX inline `style={{ ... }}` attributes under apps/frontend/src/**.
// Contract: specs/003-design-handoff/contracts/tokens.contract.md §Consumer rules
const HEX = /#[0-9a-fA-F]{3,8}\b/;
const VALID_FONT_FAMILY = /^var\(--font-(ui|display|mono)\)$/;

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Forbid hard-coded hex colors and raw font-family strings in JSX inline styles. Use tokens from tokens.css.',
    },
    schema: [],
    messages: {
      hex: 'Hard-coded hex color "{{value}}" in inline style. Use a token from tokens.css (e.g., var(--accent-yellow)).',
      font: 'Raw font-family "{{value}}" in inline style. Use var(--font-ui), var(--font-display), or var(--font-mono).',
    },
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.name !== 'style') return;
        if (!node.value || node.value.type !== 'JSXExpressionContainer') return;
        if (node.value.expression.type !== 'ObjectExpression') return;
        for (const prop of node.value.expression.properties) {
          if (prop.type !== 'Property') continue;
          if (prop.value.type !== 'Literal' || typeof prop.value.value !== 'string') continue;
          const value = prop.value.value;
          const key = prop.key.name ?? prop.key.value;
          if (HEX.test(value)) {
            context.report({ node: prop.value, messageId: 'hex', data: { value } });
          }
          if (key === 'fontFamily' && !VALID_FONT_FAMILY.test(value)) {
            context.report({ node: prop.value, messageId: 'font', data: { value } });
          }
        }
      },
    };
  },
};
