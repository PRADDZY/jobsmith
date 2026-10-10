import type { KnowledgeArticle, SupportCase } from "./contracts";

export function selectPreviewArticle(testCase: SupportCase, articles: KnowledgeArticle[]): KnowledgeArticle | undefined {
  const text = `${testCase.subject} ${testCase.message}`.toLowerCase();
  const preferredId = testCase.category === "billing"
    ? /refund|renewal|cancel|charged/.test(text)
      ? "KB-101"
      : /invoice|tax|vat/.test(text)
        ? "KB-102"
        : undefined
    : testCase.category === "access"
      ? /authenticator|two.factor|2fa|recovery|backup code/.test(text)
        ? "KB-202"
        : "KB-201"
      : undefined;
  return articles.find((article) => article.id === preferredId) ?? articles[0];
}
