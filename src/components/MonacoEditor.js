import React, { useEffect, useRef } from 'react';
import loader from '@monaco-editor/loader';

const LANGUAGE_MAP = {
  zpl: 'plaintext',
  epl: 'plaintext',
  tspl: 'plaintext',
  cpcl: 'plaintext',
  custom: 'plaintext'
};

const DEFAULT_OPTIONS = {
  minimap: { enabled: false },
  fontSize: 14,
  wordWrap: 'on',
  lineNumbers: 'on',
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  fontFamily: 'Consolas, "Courier New", monospace',
  renderWhitespace: 'none',
  accessibilitySupport: 'off'
};

function getLanguage(lang) {
  if (!lang) return 'plaintext';
  return LANGUAGE_MAP[lang.toLowerCase()] || 'plaintext';
}

export default function MonacoEditor({
  value,
  language = 'plaintext',
  onChange,
  options = {}
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const subscriptionRef = useRef(null);
  const lastValueRef = useRef(value || '');

  useEffect(() => {
    let disposed = false;

    loader
      .init()
      .then((monacoApi) => {
        if (!containerRef.current || disposed) {
          return;
        }

        const api = monacoApi?.editor ? monacoApi : window.monaco;

        if (!api || !api.editor) {
          console.error(
            '[Monaco] ⚠️ API do Monaco não disponível mesmo após loader.init(). Valor recebido:',
            monacoApi
          );
          return;
        }

        monacoRef.current = api;

        api.editor.defineTheme('etiquetas-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#1e1e1e',
            'editor.foreground': '#d4d4d4'
          }
        });

        editorRef.current = api.editor.create(containerRef.current, {
          value: value || '',
          language: getLanguage(language),
          theme: 'etiquetas-dark',
          ...DEFAULT_OPTIONS,
          ...options
        });

        subscriptionRef.current = editorRef.current.onDidChangeModelContent(() => {
          if (!editorRef.current) return;
          const newValue = editorRef.current.getValue();
          if (newValue === lastValueRef.current) {
            return;
          }
          lastValueRef.current = newValue;
          onChange?.(newValue);
        });
      })
      .catch((error) => {
        console.error('[Monaco] ❌ Falha ao inicializar editor manual:', error);
      });

    return () => {
      disposed = true;
      subscriptionRef.current?.dispose();
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    const currentValue = editorRef.current.getValue();
    if (value !== undefined && value !== currentValue) {
      const model = editorRef.current.getModel();
      if (!model) return;
      const fullRange = model.getFullModelRange();
      editorRef.current.pushUndoStop();
      editorRef.current.executeEdits('update-value', [
        {
          range: fullRange,
          text: value,
          forceMoveMarkers: true
        }
      ]);
      editorRef.current.pushUndoStop();
      lastValueRef.current = value;
    }
  }, [value]);

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
        monacoRef.current.editor.setModelLanguage(model, getLanguage(language));
  }, [language]);

  useEffect(() => {
    if (!editorRef.current) return;
    editorRef.current.updateOptions({
      ...DEFAULT_OPTIONS,
      ...options
    });
  }, [options]);

  return (
    <div className="h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

