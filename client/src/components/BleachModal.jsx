import React from 'react';
import { FlaskConical, X } from 'lucide-react';
import { ITEMS_INFO } from '../utils/items';

export default function BleachModal({ opponentItems, onSelect, onClose }) {
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
      <div className="cyber-card" style={{ maxWidth: '450px', width: '100%', padding: '25px', border: '1px solid var(--accent-red)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff6b6b', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 'bold' }}>
            <FlaskConical size={22} />
            <span>NƯỚC AXIT: CHỌN ĐỒ ĐỂ PHÁ HỦY</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
          Chọn 1 vật phẩm trên khay đồ đối thủ để dội axit tiêu hủy hoàn toàn:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
          {opponentItems && opponentItems.length > 0 ? (
            opponentItems.map((itemKey, idx) => {
              const info = ITEMS_INFO[itemKey] || { icon: '📦', nameVi: itemKey, description: '' };
              return (
                <button
                  key={idx}
                  className="cyber-button danger"
                  onClick={() => onSelect(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px',
                    justifyContent: 'flex-start',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>{info.icon}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 'bold', color: '#ff6b6b' }}>{info.nameVi}</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div style={{ gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-muted)', padding: '15px' }}>
              Đối thủ không có vật phẩm nào!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
