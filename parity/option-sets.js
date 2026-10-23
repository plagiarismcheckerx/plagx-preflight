// Option sets used for the parity fixtures. Ports read them from expected.json.
export const OPTION_SETS = {
  default: {},
  limits: { minWords: 30, maxWords: 60, requiredHeadings: ['Introduction', 'Conclusion'] },
  mla: { style: 'mla' },
  all: { checks: ['length', 'references', 'punctuation', 'grammar', 'passive-voice'] },
};
