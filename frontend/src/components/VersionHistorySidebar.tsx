import { useEffect, useState } from 'react';
import axios from 'axios';

interface Snapshot {
  id: string;
  content: string;
  timestamp: string;
}

interface VersionHistorySidebarProps {
  roomId: string;
  onRestore: (content: string) => void;
}

export default function VersionHistorySidebar({ roomId, onRestore }: VersionHistorySidebarProps) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);

  const loadSnapshots = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rooms/${roomId}/snapshots`);
      setSnapshots(res.data);
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSnapshots();
    const interval = setInterval(loadSnapshots, 10000); // Poll every 10s for new snapshots
    return () => clearInterval(interval);
  }, [roomId]);

  return (
    <div className="w-full h-full flex flex-col bg-[#252526] border-r border-[#3c3c3c]">
      <div className="h-10 border-b border-[#3c3c3c] flex items-center justify-between px-4">
        <span className="font-semibold text-gray-300 text-sm tracking-wide">VERSION HISTORY</span>
        <button onClick={loadSnapshots} className="text-xs text-blue-400 hover:text-blue-300">Refresh</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
        {snapshots.length === 0 ? (
          <div className="text-sm text-gray-500 text-center p-4">No snapshots yet... Auto-saving every 60s.</div>
        ) : (
          snapshots.slice().reverse().map((snap, i) => (
            <div key={snap.id} className="bg-[#1e1e1e] border border-gray-700 p-3 rounded-lg hover:border-blue-500 transition cursor-pointer group">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-300">
                  {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                {i === 0 && <span className="bg-green-900/40 text-green-400 text-[10px] px-2 py-0.5 rounded-full">Latest</span>}
              </div>
              <div className="text-xs text-gray-500 truncate mb-3 font-mono">
                {snap.content.substring(0, 30) || '(empty)'}...
              </div>
              <button 
                onClick={() => onRestore(snap.content)}
                className="w-full bg-[#3c3c3c] hover:bg-blue-600 text-gray-200 hover:text-white text-xs font-medium py-1.5 rounded transition"
              >
                Restore Version
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
