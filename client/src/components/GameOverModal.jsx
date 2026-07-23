import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Skull, RotateCcw, Home } from 'lucide-react';
import { soundManager } from '../audio/soundManager';

export default function GameOverModal({ isWinner, winnerName, onRematch, onLeave }) {
  useEffect(() => {
    if (isWinner) {
      soundManager.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      soundManager.playDefeat();
    }
  }, [isWinner]);

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="cyber-card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '40px 30px',
        textAlign: 'center',
        border: isWinner ? '2px solid var(--accent-gold)' : '2px solid var(--accent-red)',
        boxShadow: isWinner ? '0 0 30px rgba(255, 214, 10, 0.3)' : '0 0 30px rgba(255, 59, 48, 0.4)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '15px' }}>
          {isWinner ? '🏆' : '💀'}
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '2.5rem',
          color: isWinner ? 'var(--accent-gold)' : 'var(--accent-red)',
          marginBottom: '10px',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {isWinner ? 'BẠN ĐÃ CHIẾN THẮNG!' : 'BẠN ĐÃ TỬ TRẬN!'}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: '30px' }}>
          {isWinner
            ? `Xuất sắc! Bạn đã đánh bại đối thủ trong trò chơi sinh tồn!`
            : `Người chiến thắng: ${winnerName || 'Đối thủ'}`}
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <button className="cyber-button" onClick={onRematch} style={{ padding: '14px' }}>
            <RotateCcw size={18} />
            YÊU CẦU ĐẤU LẠI (REMATCH)
          </button>
          <button className="cyber-button danger" onClick={onLeave} style={{ padding: '14px' }}>
            <Home size={18} />
            TRỞ VỀ SẢNH CHỜ
          </button>
        </div>
      </div>
    </div>
  );
}
