"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Template = { id: string; name: string; content: string };

export function ContractTemplatePicker({ templates }: { templates: Template[] }) {
  const t = useTranslations("contractTemplatePicker");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  function applyTemplate(templateId: string) {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setContent(template.content);
    }
  }

  return (
    <>
      {templates.length > 0 && (
        <div>
          <label className="block text-xs font-medium mb-1">{t("useTemplate")}</label>
          <select
            onChange={(e) => applyTemplate(e.target.value)}
            defaultValue=""
            className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          >
            <option value="">{t("chooseTemplate")}</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block text-xs font-medium mb-1">{t("title")}</label>
        <input
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">{t("content")}</label>
        <textarea
          name="content"
          required
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
        />
      </div>
    </>
  );
}
