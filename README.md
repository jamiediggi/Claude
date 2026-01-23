# SEO Analyzer Agent

A specialized Claude agent for comprehensive SEO analysis, technical audits, and search engine optimization recommendations.

## Overview

The SEO Analyzer agent is designed to help with technical SEO assessments, content optimization, and performance improvements. It provides actionable insights and recommendations to improve search rankings and user experience.

## Agent Configuration

- **Name**: seo-analyzer
- **Model**: Sonnet (claude-sonnet-4-5)
- **Tools**: Read, Write, WebFetch, Grep, Glob

## Capabilities

### Technical SEO Audits
- Site structure analysis and optimization
- URL structure and hierarchy evaluation
- Crawlability and indexability assessment
- Robots.txt and sitemap.xml validation

### Content Optimization
- Meta tags (titles, descriptions) analysis and recommendations
- Header tag structure (H1-H6) optimization
- Keyword optimization and density analysis
- Content quality and readability assessment

### Performance Analysis
- Core Web Vitals evaluation (LCP, FID, CLS)
- Page load performance metrics
- Mobile-first indexing compliance
- Responsive design validation

### Structured Data
- Schema markup implementation and validation
- Rich snippets optimization
- JSON-LD structured data recommendations
- Microdata and RDFa analysis

### Site Architecture
- Internal linking structure analysis
- URL optimization recommendations
- Site navigation and hierarchy assessment
- Breadcrumb implementation

## Usage Examples

### Basic SEO Audit

```bash
# Analyze a website's SEO
claude-agent run seo-analyzer "Perform a comprehensive SEO audit for example.com"
```

### Meta Tag Optimization

```bash
# Review and optimize meta tags
claude-agent run seo-analyzer "Analyze meta tags in index.html and provide optimization recommendations"
```

### Performance Analysis

```bash
# Evaluate Core Web Vitals
claude-agent run seo-analyzer "Analyze Core Web Vitals for the website and suggest improvements"
```

### Schema Markup Implementation

```bash
# Add structured data
claude-agent run seo-analyzer "Implement schema.org markup for product pages"
```

## Output Format

The agent provides:

1. **Priority Rankings**: Issues categorized by severity (Critical, High, Medium, Low)
2. **Specific Recommendations**: Actionable items with implementation examples
3. **Impact Metrics**: Expected improvements in rankings, traffic, or user experience
4. **Code Examples**: Ready-to-use implementations for fixes
5. **Performance Benchmarks**: Before/after comparisons where applicable

## Best Practices

The SEO Analyzer follows these principles:

- **Proactive Analysis**: Automatically identifies issues without explicit prompting
- **Actionable Recommendations**: Every finding includes specific steps to fix
- **Impact-Focused**: Prioritizes changes with the highest potential impact
- **Standards-Compliant**: Follows Google Search Central and W3C guidelines
- **User-Centric**: Balances SEO optimization with user experience

## Integration

This agent can be integrated into:

- CI/CD pipelines for automated SEO checks
- Content management workflows
- Development processes for new features
- Regular site audits and monitoring
- Competitive analysis and benchmarking

## Configuration File

The agent is defined in `agents/seo-analyzer.yaml` with the following structure:

```yaml
name: seo-analyzer
description: SEO analysis and optimization specialist
tools: Read, Write, WebFetch, Grep, Glob
model: sonnet
prompt: |
  [Detailed agent instructions and guidelines]
```

## Contributing

When extending this agent:

1. Maintain focus on actionable, measurable recommendations
2. Include specific code examples in outputs
3. Prioritize issues by potential impact
4. Follow current SEO best practices and guidelines
5. Test recommendations against real-world scenarios

## Resources

- [Google Search Central](https://developers.google.com/search)
- [Core Web Vitals](https://web.dev/vitals/)
- [Schema.org](https://schema.org/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)

## License

Part of the Claude Agent SDK ecosystem.
