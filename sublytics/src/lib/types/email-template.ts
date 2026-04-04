export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateEmailTemplateInput {
  name: string;
  subject: string;
  body: string;
  variables?: string[];
  is_active?: boolean;
}

export interface UpdateEmailTemplateInput extends Partial<CreateEmailTemplateInput> {}

export interface TemplatePreviewData {
  template: EmailTemplate;
  sampleData: Record<string, string>;
  renderedSubject: string;
  renderedBody: string;
}
