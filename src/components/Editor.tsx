import Editor from '@monaco-editor/react'

export default function EditorPane() {
  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        defaultLanguage="plaintext"
        theme="vs-dark"
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
        }}
      />
    </div>
  )
}
