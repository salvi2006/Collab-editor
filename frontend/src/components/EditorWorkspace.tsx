import { useRef } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { forwardRef, useImperativeHandle } from 'react';
import { useThemeContext } from '../context/ThemeContext';
import { Box } from '@mui/material';

interface EditorWorkspaceProps {
  roomId: string;
  username: string;
  language: string;
  onUsersChange?: (users: any[]) => void;
}

export interface EditorRef {
  getCode: () => string;
  setCode: (newCode: string) => void;
  lock: () => void;
}

const EditorWorkspace = forwardRef<EditorRef, EditorWorkspaceProps>(({ roomId, username, language, onUsersChange }, ref) => {
  const { mode } = useThemeContext();
  const editorRef = useRef<any>(null);
  const ytextRef = useRef<Y.Text | null>(null);

  useImperativeHandle(ref, () => ({
    getCode: () => {
      return ytextRef.current?.toString() || '';
    },
    setCode: (newCode: string) => {
      if (ytextRef.current) {
        ytextRef.current.delete(0, ytextRef.current.length);
        ytextRef.current.insert(0, newCode);
      }
    },
    lock: () => {
      editorRef.current?.updateOptions({ readOnly: true });
    }
  }));

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    const ydoc = new Y.Doc();
    const wsUrl = 'ws://localhost:5000/room/' + roomId;
    const wsProvider = new WebsocketProvider(wsUrl, roomId, ydoc);

    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    wsProvider.awareness.setLocalStateField('user', {
      name: username,
      color: randomColor,
      isTyping: false
    });

    wsProvider.awareness.on('change', () => {
      const states = Array.from(wsProvider.awareness.getStates().entries());
      const users = states.map(([clientId, state]: [number, any]) => ({
        clientId,
        ...state.user
      })).filter(u => u.name); // Filter out empty states
      
      if (onUsersChange) {
        onUsersChange(users);
      }
    });

    let typingTimeout: any;
    editor.onKeyDown(() => {
      wsProvider.awareness.setLocalStateField('user', {
        name: username,
        color: randomColor,
        isTyping: true
      });
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        wsProvider.awareness.setLocalStateField('user', {
          name: username,
          color: randomColor,
          isTyping: false
        });
      }, 1500);
    });

    const ytext = ydoc.getText('monaco');
    ytextRef.current = ytext;

    const binding = new MonacoBinding(
      ytext, 
      editorRef.current.getModel(), 
      new Set([editorRef.current]), 
      wsProvider.awareness
    );

    return () => {
      clearTimeout(typingTimeout);
      binding.destroy();
      wsProvider.disconnect();
      ydoc.destroy();
    };
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden', bgcolor: mode === 'dark' ? '#1e1e1e' : '#ffffff' }}>
      <Editor
        height="100%"
        theme={mode === 'dark' ? 'vs-dark' : 'vs'}
        language={language}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          wordWrap: 'on',
          padding: { top: 16 }
        }}
      />
    </Box>
  );
});

export default EditorWorkspace;
