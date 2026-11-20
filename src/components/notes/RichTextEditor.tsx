import { useEffect, useRef } from 'react';
import { Bold, Code, Heading2, Italic, List, Quote, RemoveFormatting } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div className="rounded-xl liquid-glass-subtle overflow-hidden">
      <div
        role="toolbar"
        aria-label="Rich text formatting"
        className="flex flex-wrap items-center gap-1 border-b border-white/[0.08] bg-white/[0.03] px-2.5 py-2"
      >
        <button
          type="button"
          onClick={() => exec('bold')}
          aria-label="Bold"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          aria-label="Italic"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', 'H3')}
          aria-label="Heading"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          aria-label="Bullet list"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', 'BLOCKQUOTE')}
          aria-label="Blockquote"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <Quote className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('formatBlock', 'PRE')}
          aria-label="Code block"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <Code className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          aria-label="Clear formatting"
          className="p-1.5 text-slate-300 hover:bg-white/10 hover:text-white rounded"
        >
          <RemoveFormatting className="h-3.5 w-3.5" />
        </button>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        aria-label="Personal notes rich text editor"
        data-placeholder={placeholder || 'Write your personal marketing insights, campaign learnings, and experiments...'}
        onInput={() => {
          if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
          }
        }}
        className="min-h-[160px] px-4 py-3 text-sm text-slate-200 leading-relaxed focus:outline-none [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-white [&_h3]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_blockquote]:border-l [&_blockquote]:border-[#E5B85C]/50 [&_blockquote]:pl-3 [&_blockquote]:text-slate-300 [&_pre]:bg-black/50 [&_pre]:p-2 [&_pre]:rounded [&_pre]:font-mono [&_pre]:text-xs"
      />
    </div>
  );
}
