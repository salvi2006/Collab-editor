import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export interface TerminalRef {
  write: (text: string) => void;
  clear: () => void;
}

const TerminalPanel = forwardRef<TerminalRef, any>((_, ref) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;
    
    xtermRef.current = new Terminal({
      theme: { background: '#1e1e1e' },
      fontFamily: 'Consolas, "Courier New", monospace',
      fontSize: 14,
    });
    fitAddonRef.current = new FitAddon();
    xtermRef.current.loadAddon(fitAddonRef.current);
    xtermRef.current.open(terminalRef.current);
    fitAddonRef.current.fit();

    const handleResize = () => fitAddonRef.current?.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      xtermRef.current?.dispose();
    };
  }, []);

  useImperativeHandle(ref, () => ({
    write: (text: string) => {
      xtermRef.current?.write(text.replace(/\n/g, '\r\n') + '\r\n');
    },
    clear: () => {
      xtermRef.current?.clear();
    }
  }));

  return <div ref={terminalRef} className="w-full h-full p-2 bg-[#1e1e1e] overflow-hidden" />;
});

export default TerminalPanel;
