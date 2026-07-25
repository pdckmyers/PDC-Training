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

const IMAGE_SIZES = {
  Small: "33%",
  Medium: "66%",
  Large: "100%",
} as const;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const selectedImageRef = useRef<HTMLImageElement | null>(null);
  const selectedTableRef = useRef<HTMLTableElement | null>(null);

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

  function insertTable(e: React.MouseEvent) {
    e.preventDefault();
    const rowsInput = window.prompt(
      "How many rows (label/value pairs)?",
      "4"
    );
    if (!rowsInput) return;
    const rows = Math.max(1, Math.min(20, parseInt(rowsInput, 10) || 4));
    const title = window.prompt("Table title (optional):", "") ?? "";

    let html = "<table>";
    if (title.trim()) {
      html += `<thead><tr><th colspan="2">${escapeHtml(title.trim())}</th></tr></thead>`;
    }
    html += "<tbody>";
    for (let i = 0; i < rows; i++) {
      html += "<tr><td><b>Label</b></td><td><i>Detail</i></td></tr>";
    }
    html += "</tbody></table><br>";

    document.execCommand("insertHTML", false, html);
    onChange(ref.current?.innerHTML ?? "");
  }

  function handleEditorClick(e: React.MouseEvent) {
    const target = e.target;
    selectedImageRef.current =
      target instanceof HTMLImageElement ? target : null;
    selectedTableRef.current =
      target instanceof HTMLElement
        ? target.closest("table")
        : null;
  }

  function resizeSelectedImage(e: React.MouseEvent, width: string) {
    e.preventDefault();
    const img = selectedImageRef.current;
    if (!img) {
      window.alert("Click an image in the text first, then pick a size.");
      return;
    }
    img.style.width = width;
    img.style.height = "auto";
    onChange(ref.current?.innerHTML ?? "");
  }

  function addTableRow(e: React.MouseEvent) {
    e.preventDefault();
    const table = selectedTableRef.current;
    if (!table) {
      window.alert("Click inside a table first, then add a row.");
      return;
    }
    const tbody = table.querySelector("tbody") ?? table;
    const newRow = document.createElement("tr");
    newRow.innerHTML = "<td><b>Label</b></td><td><i>Detail</i></td>";
    tbody.appendChild(newRow);
    onChange(ref.current?.innerHTML ?? "");
  }

  function removeTableRow(e: React.MouseEvent) {
    e.preventDefault();
    const table = selectedTableRef.current;
    if (!table) {
      window.alert("Click inside a table first, then remove a row.");
      return;
    }
    const rows = table.querySelectorAll("tbody tr");
    if (rows.length <= 1) {
      window.alert("This table only has one row left.");
      return;
    }
    rows[rows.length - 1].remove();
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
        {(Object.keys(IMAGE_SIZES) as (keyof typeof IMAGE_SIZES)[]).map(
          (label) => (
            <button
              key={label}
              type="button"
              title={`Click an image, then resize it to ${label.toLowerCase()}`}
              onMouseDown={(e) => resizeSelectedImage(e, IMAGE_SIZES[label])}
              className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
            >
              {label[0]}
            </button>
          )
        )}
        <span className="mx-1 h-4 w-px bg-stone-300" />
        <button
          type="button"
          title="Insert a table here"
          onMouseDown={insertTable}
          className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
        >
          ▦ Table
        </button>
        <button
          type="button"
          title="Click inside a table, then add a row"
          onMouseDown={addTableRow}
          className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
        >
          + Row
        </button>
        <button
          type="button"
          title="Click inside a table, then remove its last row"
          onMouseDown={removeTableRow}
          className="rounded px-2.5 py-1 text-sm text-stone-700 hover:bg-stone-200"
        >
          − Row
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
        onClick={handleEditorClick}
        className="min-h-[180px] rounded-b-md border border-stone-300 px-3 py-2 font-serif text-lg text-brand-ink focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand [&_div]:mb-3 [&_hr]:my-3 [&_hr]:border-t-2 [&_hr]:border-dashed [&_hr]:border-brand [&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-stone-300 [&_th]:border [&_th]:border-stone-300 [&_th]:bg-brand [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white [&_td]:border [&_td]:border-stone-300 [&_td]:px-3 [&_td]:py-2 [&_td]:align-top"
      />
      <p className="mt-1 text-xs text-stone-500">
        The dashed line is a page break — employees see it as separate pages
        with Next/Previous buttons. Images are inserted where your cursor is,
        so put one before a page break to keep it on that page. Click an
        image, then use S / M / L to resize it. Click inside a table, then
        use + Row / − Row to add or remove rows.
      </p>
    </div>
  );
}
