import React from 'react';
import { ITEMS_INFO } from '../utils/items';

export default function AdrenalineModal({ opponentItems, onSelect, onClose }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="cyber-card" style={{ maxWidth: '440px', width: '100%', padding: '30px' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-cyan)', fontSize: '1.4rem', marginBottom: '15px', textAlign: 'center' }}>
          💉 CƯỚP VẬT PHẨM ĐỐI THỦ (ADRENALINE)
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px', textAlign: 'center' }}>
          Chọn 1 vật phẩm từ khay đồ đối thủ để cướp và dùng ngay lập tức:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {opponentItems.map((itemKey, idx) => {
            const info = ITEMS_INFO[itemKey] || { nameVi: itemKey, icon: '📦' };
            return (
              <button
                key={idx}
                className="cyber-button"
                onClick={() => onSelect(idx)}
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem' }}
              >
                <span style={{ fontSize: '1.6rem' }}>{info.icon}</span>
                <span>{info.nameVi}</span>
              </button>
            );
          })}
        </div>

        <button className="cyber-button danger" onClick={onClose} style={{ width: '100%' }}>
          HỦY BỎ
        </button>
      </div>
    </div>
  );
}
