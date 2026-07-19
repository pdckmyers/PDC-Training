"use client";

import { useEffect, useRef } from "react";

function ToolbarButton({
  command,
  label,
  title,
}: {
  command: string;
  label: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault();
        document.execCommand(command);
      }}
      className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
    >
      {label}
    </button>
  );
}

export default function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = value;
      initialized.current = true;
    }
    // Make Enter produce <p> instead of the inconsistent <div>/<br>
    // markup browsers otherwise default to.
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, [value]);

  function insertPageBreak(e: React.MouseEvent) {
    e.preventDefault();
    document.execCommand("insertHTML", false, "<hr><br>");
    onChange(ref.current?.innerHTML ?? "");
  }

  function insertImage(e: React.MouseEvent) {
    e.preventDefault();
    const url = window.prompt("Paste the image URL:");
    if (!url) return;

    if (!/^https:\/\//i.test(url.trim())) {
      window.alert("Please use a link that starts with https://");
      return;
    }

    const escaped = url.trim().replace(/"/g, "&quot;");
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${escaped}" alt="" /><br>`
    );
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-stone-300 bg-stone-50 p-1">
        <ToolbarButton command="bold" label={<strong>B</strong>} title="Bold" />
        <ToolbarButton command="italic" label={<em>I</em>} title="Italic" />
        <ToolbarButton
          command="insertUnorderedList"
          label="• List"
          title="Bullet list"
        />
        <span className="mx-1 h-4 w-px bg-stone-300" />
        <button
          type="button"
          title="Insert an image here"
          onMouseDown={insertImage}
          className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
        >
          🖼 Image
        </button>
        <span className="mx-1 h-4 w-px bg-stone-300" />
        <button
          type="button"
          title="Split into a new page here"
          onMouseDown={insertPageBreak}
          className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
        >
          ⤵ Page break
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className="min-h-[180px] rounded-b-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [&_div]:mb-3 [&_hr]:my-3 [&_hr]:border-t-2 [&_hr]:border-dashed [&_hr]:border-brand [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5"
      />
      <p className="mt-1 text-xs text-stone-500">
        The dashed line is a page break — employees see it as separate pages
        with Next/Previous buttons. Images are inserted where your cursor is,
        so put one before a page break to keep it on that page.
      </p>
    </div>
  );
}
