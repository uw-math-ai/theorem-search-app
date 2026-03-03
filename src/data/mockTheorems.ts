export interface Theorem {
  id: string;
  title: string;
  authors: string[];
  source: string;
  sourceUrl: string;
  prose: string;
  latex: string;
  year: number;
}

export const mockTheorems: Theorem[] = [
  {
    id: "1",
    title: "Bolzano-Weierstrass Theorem",
    authors: ["Bernard Bolzano", "Karl Weierstrass"],
    source: "Principles of Mathematical Analysis",
    sourceUrl: "https://example.com/analysis",
    prose: "In a complete metric space, every bounded sequence contains a convergent subsequence. This is a fundamental result in real analysis characterizing compactness. Specifically, for any sequence of real numbers that is bounded, there exists a subsequence that converges to a limit within the same space. This theorem is crucial for proving many other results, such as the Extreme Value Theorem and the Heine-Borel Theorem. It highlights the property that closed and bounded sets in Euclidean space are sequentially compact, meaning every sequence has a cluster point.",
    latex: "\\text{Let } (x_n)_{n=1}^\\infty \\text{ be a bounded sequence in } \\mathbb{R}^d. \\text{ Then there exists a subsequence } (x_{n_k})_{k=1}^\\infty \\text{ and a point } L \\in \\mathbb{R}^d \\text{ such that } \\lim_{k \\to \\infty} x_{n_k} = L. \\text{ Furthermore, } L \\text{ is a limit point of the set } \\{x_n : n \\in \\mathbb{N}\\}.",
    year: 1817
  },
  {
    id: "2",
    title: "Fundamental Theorem of Calculus",
    authors: ["Isaac Newton", "Gottfried Wilhelm Leibniz"],
    source: "Philosophiæ Naturalis Principia Mathematica",
    sourceUrl: "https://example.com/calculus",
    prose: "The definite integral of a function can be computed by using any one of its infinitely many antiderivatives. It links the concept of differentiating a function with the concept of integrating a function.",
    latex: "If $f$ is continuous on $[a, b]$, then $\\int_a^b f(x) dx = F(b) - F(a)$, where $F' = f$.",
    year: 1666
  },
  {
    id: "3",
    title: "Cauchy's Integral Theorem",
    authors: ["Augustin-Louis Cauchy"],
    source: "Mémoire sur les intégrales définies",
    sourceUrl: "https://example.com/complex",
    prose: "For a holomorphic function, the line integral along a closed path is zero. This is a central statement in complex analysis.",
    latex: "If $f(z)$ is holomorphic in a simply connected domain $D$, then $\\oint_{\\gamma} f(z) dz = 0$ for every closed path $\\gamma$ in $D$.",
    year: 1825
  },
  {
    id: "4",
    title: "Central Limit Theorem",
    authors: ["Pierre-Simon Laplace", "Aleksandr Lyapunov"],
    source: "Théorie Analytique des Probabilités",
    sourceUrl: "https://example.com/stats",
    prose: "The sum of a large number of independent and identically distributed random variables will be approximately normally distributed, regardless of the underlying distribution.",
    latex: "$\\sqrt{n}(\\bar{X}_n - \\mu) \\xrightarrow{d} N(0, \\sigma^2)$ as $n \\to \\infty$.",
    year: 1810
  },
  {
    id: "5",
    title: "Euler's Identity",
    authors: ["Leonhard Euler"],
    source: "Introductio in analysin infinitorum",
    sourceUrl: "https://example.com/euler",
    prose: "A remarkable equation in complex analysis that establishes the fundamental relationship between five basic mathematical constants.",
    latex: "$e^{i\\pi} + 1 = 0$",
    year: 1748
  }
];
