"use client";

import { useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading2,
  Quote,
  Undo,
  Redo,
} from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

function exec(cmd: string, value?: string) {
  document.execCommand(cmd, false, value);
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your post…",
  minHeight = "140px",
  disabled = false,
}: RichTextEditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current) {
      if (ref.current.innerHTML !== value) {
        ref.current.innerHTML = value || "";
      }
      lastValue.current = value;
    }
  }, [value]);

  const emit = useCallback(() => {
    if (!ref.current) return;
    const html = ref.current.innerHTML;
    lastValue.current = html;
    onChange(html);
  }, [onChange]);

  const toolbarBtn = (
    title: string,
    onClick: () => void,
    icon: React.ReactNode,
    active?: boolean
  ) => (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
        emit();
      }}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300"
          : "text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800"
      } disabled:opacity-40`}
    >
      {icon}
    </button>
  );

  return (
    <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden focus-within:ring-2 focus-within:ring-brand-500/30 focus-within:border-brand-500 transition-shadow">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-stone-100 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/80">
        {toolbarBtn("Bold", () => exec("bold"), <Bold className="w-4 h-4" />)}
        {toolbarBtn("Italic", () => exec("italic"), <Italic className="w-4 h-4" />)}
        {toolbarBtn(
          "Underline",
          () => exec("underline"),
          <Underline className="w-4 h-4" />
        )}
        <span className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />
        {toolbarBtn(
          "Heading",
          () => exec("formatBlock", "h3"),
          <Heading2 className="w-4 h-4" />
        )}
        {toolbarBtn(
          "Quote",
          () => exec("formatBlock", "blockquote"),
          <Quote className="w-4 h-4" />
        )}
        <span className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />
        {toolbarBtn(
          "Bullet list",
          () => exec("insertUnorderedList"),
          <List className="w-4 h-4" />
        )}
        {toolbarBtn(
          "Numbered list",
          () => exec("insertOrderedList"),
          <ListOrdered className="w-4 h-4" />
        )}
        <span className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />
        {toolbarBtn(
          "Align left",
          () => exec("justifyLeft"),
          <AlignLeft className="w-4 h-4" />
        )}
        {toolbarBtn(
          "Align center",
          () => exec("justifyCenter"),
          <AlignCenter className="w-4 h-4" />
        )}
        {toolbarBtn(
          "Align right",
          () => exec("justifyRight"),
          <AlignRight className="w-4 h-4" />
        )}
        {toolbarBtn(
          "Justify",
          () => exec("justifyFull"),
          <AlignJustify className="w-4 h-4" />
        )}
        <span className="w-px h-5 bg-stone-200 dark:bg-stone-700 mx-1" />
        {toolbarBtn("Undo", () => exec("undo"), <Undo className="w-4 h-4" />)}
        {toolbarBtn("Redo", () => exec("redo"), <Redo className="w-4 h-4" />)}
      </div>

      <div
        ref={ref}
        contentEditable={!disabled}
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="rich-editor px-4 py-3 text-sm text-stone-900 dark:text-stone-100 focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400"
        style={{ minHeight }}
      />
    </div>
  );
}
