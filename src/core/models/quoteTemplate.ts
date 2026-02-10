export type QuoteTemplateElementType = 'text' | 'field' | 'image';

export type QuoteTemplateElement = {
  id: string;
  type: QuoteTemplateElementType;
  x: number;
  y: number;
  width?: number;
  fontSize?: number;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
  text?: string;
  html?: string;
  field?: string;
  src?: string;
  height?: number;
};

export type QuoteTemplatePage = {
  id: string;
  elements: QuoteTemplateElement[];
};

export type QuoteTemplate = {
  id: string;
  name: string;
  pages: QuoteTemplatePage[];
  pageSize: 'LETTER';
  updatedAt?: string;
};

export const LETTER_PAGE = {
  width: 612,
  height: 792
};

export const createEmptyTemplate = (id: string, name: string): QuoteTemplate => ({
  id,
  name,
  pageSize: 'LETTER',
  pages: [{ id: `${id}-page-1`, elements: [] }]
});
