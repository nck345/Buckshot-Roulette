import React, { useEffect, useRef } from 'react';
import { Terminal } from 'lucide-react';

export default function ActionLog({ logs }) {
  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="cyber-card" style={{ padding: '15px', height: '180px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '0.8rem',
        color: 'var(--accent-cyan)',
        borderBottom: '1px solid var(--panel-border)',
        paddingBottom: '8px',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        <Terminal size={14} />
        BẢNG NHẬT KÝ DIỄN BIẾN (ACTION CONSOLE)
      </div>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
      }}>
        {logs.length === 0 ? (
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '10px 0' }}>
            Chưa có hành động nào được ghi nhận...
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ color: log.text.includes('💥') || log.text.includes('THẮNG') ? '#ff6b6b' : log.text.includes('💨') ? '#00e5ff' : '#cfd8dc' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginRight: '8px' }}>[{log.time}]</span>
              {log.text}
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}
