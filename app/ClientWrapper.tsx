'use client';

import { MathJaxContext } from 'better-react-mathjax';

const MATHJAX_CONFIG = {
  tex: {
    inlineMath: [['$', '$'], ['\\(', '\\)']],
    displayMath: [['$$', '$$'], ['\\[', '\\]']],
  },
};

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  return <MathJaxContext config={MATHJAX_CONFIG}>{children}</MathJaxContext>;
}
