"use client";

import { useRef, useState } from "react";
import { renderTemplate, TEMPLATE_VARIABLES } from "@/lib/messageTemplate";

const SAMPLE_VARS = {
  nombre: "María González",
  evento: "Boda de Ana y Luis",
  fecha: "14 de junio de 2026",
  lugar: "Salón Los Jardines",
  mesa: "Mesa 3",
  pases: "2",
  link: "https://tuapp.com/c/abc123",
};

export function TemplateEditor({ initialTemplate }: { initialTemplate: string }) {
  const [value, setValue] = useState(initialTemplate);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const el = textareaRef.current;
    const token = `{${variable}}`;
    if (!el) {
      setValue((v) => v + token);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {TEMPLATE_VARIABLES.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => insertVariable(v)}
            className="rounded-full bg-indigo-50 px-3 py-1 text-xs text-indigo-700 hover:bg-indigo-100"
          >
            {`{${v}}`}
          </button>
        ))}
      </div>

      <textarea
        ref={textareaRef}
        name="messageTemplate"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        className="w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm"
      />

      <div>
        <p className="mb-1 text-xs font-medium text-gray-500">Vista previa:</p>
        <pre className="whitespace-pre-wrap rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
          {renderTemplate(value, SAMPLE_VARS)}
        </pre>
      </div>
    </div>
  );
}
