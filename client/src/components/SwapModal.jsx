import React from 'react';
import { RefreshCw, X } from 'lucide-react';

export default function SwapModal({ remainingBulletsCount, onSelect, onClose }) {
  // remainingBulletsCount includes current bullet + future bullets in chamber.
  // offset goes from 1 to remainingBulletsCount - 1
  const options = [];
  for (let offset = 1; offset < remainingBulletsCount; offset++) {
    options.push({
      offset,
      label: `Viên đạn thứ ${offset + 1} trong súng`
    });
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div className="cyber-card" style={{ maxWidth: '450px', width: '100%', padding: '25px', border: '1px solid var(--accent-gold)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-gold)', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 'bold' }}>
            <RefreshCw size={22} />
            <span>KÌM GẮP ĐẠN: CHỌN ĐẠN HOÁN ĐỔI</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Chọn viên đạn tương lai để đổi vị trí với viên đạn đang chuẩn bị bắn (Viên thứ 1):
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
          {options.length > 0 ? (
            options.map((opt) => (
              <button
                key={opt.offset}
                className="cyber-button"
                onClick={() => onSelect(opt.offset)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  justifyContent: 'flex-start',
                  fontSize: '0.9rem',
                  borderColor: 'var(--accent-gold)'
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>🔀</span>
                <div style={{ textAlign: 'left', fontWeight: 'bold', color: 'var(--accent-gold)' }}>
                  {opt.label}
                </div>
              </button>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '15px' }}>
              Không còn viên đạn nào khác trong nòng để hoán đổi!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
