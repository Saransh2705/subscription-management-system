"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { Mail, Plus, Pencil, Trash2, Eye, Loader2, Power, PowerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  getEmailTemplates,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  toggleTemplateStatus,
} from "@/lib/actions/email-templates";
import type { EmailTemplate } from "@/lib/types/email-template";

// Helper function to render template with sample data
function renderTemplate(template: EmailTemplate, data: Record<string, string>): { subject: string; body: string } {
  let renderedSubject = template.subject;
  let renderedBody = template.body;

  // Replace all variables with actual data
  Object.entries(data).forEach(([key, value]) => {
    const pattern = new RegExp(`{{${key}}}`, 'g');
    renderedSubject = renderedSubject.replace(pattern, value);
    renderedBody = renderedBody.replace(pattern, value);
  });

  return { subject: renderedSubject, body: renderedBody };
}

interface TemplateFormData {
  name: string;
  subject: string;
  body: string;
  variables: string;
}

const initialFormState: TemplateFormData = {
  name: "",
  subject: "",
  body: "",
  variables: "",
};

// Sample data for preview
const getSampleData = (variables: string[]): Record<string, string> => {
  const sampleMap: Record<string, string> = {
    customer_name: "John Doe",
    company_name: "Sublytics Inc.",
    plan_name: "Professional Plan",
    invoice_number: "INV-001",
    amount: "$99.00",
    due_date: "April 15, 2026",
    end_date: "May 15, 2026",
    renewal_date: "May 1, 2026",
    invoice_id: "INV-001",
  };

  const result: Record<string, string> = {};
  variables.forEach(variable => {
    result[variable] = sampleMap[variable] || `[${variable}]`;
  });
  return result;
};

export default function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState<TemplateFormData>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [openCreateEdit, setOpenCreateEdit] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    const result = await getEmailTemplates();
    if (result.success && result.data) {
      setTemplates(result.data);
      if (result.data.length > 0 && !selected) {
        setSelected(result.data[0].id);
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load email templates",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setForm(initialFormState);
    setOpenCreateEdit(true);
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      subject: template.subject,
      body: template.body,
      variables: template.variables.join(", "),
    });
    setOpenCreateEdit(true);
  };

  const handlePreview = (template: EmailTemplate) => {
    setPreviewTemplate(template);
    setOpenPreview(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.subject || !form.body) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Parse variables from comma-separated string
      const variables = form.variables
        .split(",")
        .map(v => v.trim())
        .filter(v => v.length > 0);

      const templateData = {
        name: form.name,
        subject: form.subject,
        body: form.body,
        variables,
      };

      let result;
      if (editingTemplate) {
        result = await updateEmailTemplate(editingTemplate.id, templateData);
      } else {
        result = await createEmailTemplate(templateData);
      }

      if (result.success) {
        toast({
          title: "Success",
          description: `Template ${editingTemplate ? 'updated' : 'created'} successfully`,
        });
        setOpenCreateEdit(false);
        loadTemplates();
      } else {
        toast({
          title: "Error",
          description: result.error || `Failed to ${editingTemplate ? 'update' : 'create'} template`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    const result = await deleteEmailTemplate(id);
    if (result.success) {
      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
      if (selected === id) {
        setSelected(null);
      }
      loadTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleTemplateStatus(id, !currentStatus);
    if (result.success) {
      toast({
        title: "Success",
        description: `Template ${!currentStatus ? 'activated' : 'deactivated'}`,
      });
      loadTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  const currentTemplate = templates.find((t) => t.id === selected);

  if (loading) {
    return (
      <div className="page-container animate-fade-in">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Email Templates</h1>
          <p className="page-subtitle">Manage automated email notifications with preview</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Create Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-96">
            <Mail className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No email templates yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first email template</p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" /> Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">Templates ({templates.length})</h3>
            {templates.map((template) => (
              <div
                key={template.id}
                className={`group relative border rounded-lg p-4 transition-all cursor-pointer ${
                  selected === template.id
                    ? "border-primary bg-accent/50"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                }`}
                onClick={() => setSelected(template.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h4 className="font-medium text-sm truncate">{template.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{template.subject}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={template.is_active ? "default" : "secondary"} className="text-xs">
                        {template.is_active ? "Active" : "Inactive"}
                      </Badge>
                      {template.variables.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {template.variables.length} var{template.variables.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(template);
                      }}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(template);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Template Details */}
          <div className="lg:col-span-2">
            {currentTemplate ? (
              <Card className="border border-border/50 shadow-sm">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {currentTemplate.name}
                        <Badge variant={currentTemplate.is_active ? "default" : "secondary"}>
                          {currentTemplate.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </CardTitle>
                      {currentTemplate.variables.length > 0 ? (
                        <CardDescription className="mt-2 flex flex-wrap gap-1 items-center">
                          <span className="text-xs">Available variables:</span>
                          {currentTemplate.variables.map((v) => (
                            <Badge key={v} variant="outline" className="font-mono text-xs">
                              {`{{${v}}}`}
                            </Badge>
                          ))}
                        </CardDescription>
                      ) : (
                        <CardDescription className="mt-2">
                          <span className="text-xs">No variables defined</span>
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(currentTemplate.id, currentTemplate.is_active)}
                      >
                        {currentTemplate.is_active ? <PowerOff className="h-4 w-4 mr-2" /> : <Power className="h-4 w-4 mr-2" />}
                        {currentTemplate.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(currentTemplate)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(currentTemplate)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(currentTemplate.id, currentTemplate.name)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Subject</Label>
                    <div className="p-3 bg-muted/30 rounded-md">
                      <p className="text-sm">{currentTemplate.subject}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Body</Label>
                    <div className="p-3 bg-muted/30 rounded-md max-h-96 overflow-y-auto">
                      <div 
                        className="text-sm prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: currentTemplate.body }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground pt-2">
                    Created: {new Date(currentTemplate.created_at).toLocaleString()}
                    {currentTemplate.updated_at !== currentTemplate.created_at && (
                      <> • Updated: {new Date(currentTemplate.updated_at).toLocaleString()}</>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center h-96">
                  <p className="text-muted-foreground">Select a template to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openCreateEdit} onOpenChange={setOpenCreateEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? "Edit" : "Create"} Email Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Welcome Email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line *</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. Welcome to {{company_name}}!"
              />
              <p className="text-xs text-muted-foreground">Use {`{{variable_name}}`} for dynamic content</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Email Body (HTML) *</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="<h1>Welcome!</h1><p>Dear {{customer_name}},</p>..."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Supports HTML. Use {`{{variable_name}}`} for dynamic content</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="variables">Variables (comma-separated)</Label>
              <Input
                id="variables"
                value={form.variables}
                onChange={(e) => setForm({ ...form, variables: e.target.value })}
                placeholder="customer_name, company_name, plan_name"
              />
              <p className="text-xs text-muted-foreground">
                List all variables used in your template (without {`{{}}`})
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreateEdit(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                editingTemplate ? 'Update Template' : 'Create Template'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={openPreview} onOpenChange={setOpenPreview}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template Preview: {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <Tabs defaultValue="preview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview with Sample Data</TabsTrigger>
                <TabsTrigger value="raw">Raw Template</TabsTrigger>
              </TabsList>
              <TabsContent value="preview" className="space-y-4 mt-4">
                <div className="border rounded-lg p-6 bg-white dark:bg-gray-950">
                  <div className="mb-4 pb-4 border-b">
                    <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                    <div className="font-semibold">
                      {renderTemplate(previewTemplate, getSampleData(previewTemplate.variables)).subject}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-2">Body:</div>
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: renderTemplate(previewTemplate, getSampleData(previewTemplate.variables)).body 
                      }}
                    />
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <strong>Note:</strong> Preview uses sample data. Actual emails will use real customer data.
                </div>
              </TabsContent>
              <TabsContent value="raw" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-xs">Subject Template</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm">
                    {previewTemplate.subject}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Body Template</Label>
                  <div className="p-3 bg-muted rounded-md font-mono text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
                    {previewTemplate.body}
                  </div>
                </div>
                {previewTemplate.variables.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-xs">Variables</Label>
                    <div className="flex flex-wrap gap-1">
                      {previewTemplate.variables.map((v) => (
                        <Badge key={v} variant="outline" className="font-mono text-xs">
                          {`{{${v}}}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPreview(false)}>
              Close
            </Button>
            {previewTemplate && (
              <Button onClick={() => {
                setOpenPreview(false);
                handleEdit(previewTemplate);
              }}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Template
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
