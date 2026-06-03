import React, { useEffect, useRef } from 'react';

function tryPlaySound() {
  try {
    // Web Audio API: short beep
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (_) {
    // ignore — user didn't interact or browser blocks audio
  }
}

export default function PressureGauge({ pressureData }) {
  const highItems = pressureData.filter((p) => p.level === 'MEDIUM' || p.level === 'HIGH');
  const playedRef = useRef(false);

  useEffect(() => {
    const hasHigh = pressureData.some((p) => p.level === 'HIGH');
    if (hasHigh && !playedRef.current) {
      playedRef.current = true;
      tryPlaySound();
    }
  }, [pressureData]);

  if (highItems.length === 0) {
    return (
      <div className="pressure-section">
        <p style={{ color: '#4ade80', textAlign: 'center', padding: '20px' }}>
          ✅ Все заказали примерно поровну. Никакого давления!
        </p>
      </div>
    );
  }

  return (
    <div className="pressure-section">
      <h3 style={{ color: '#ffcc80', marginBottom: '16px', fontSize: '1.05rem' }}>
        ⚡ Шкала социального давления
      </h3>
      {pressureData
        .filter((p) => p.level === 'MEDIUM' || p.level === 'HIGH')
        .map((item) => {
          const widthPercent = Math.min(Math.abs(item.deviationPercent), 100);

          return (
            <div className="pressure-card" key={item.name}>
              <div className="pressure-label">
                {item.name}, ты заказал на{' '}
                <strong>{item.deviationPercent}%</strong>{' '}
                {item.deviationPercent > 0 ? 'выше' : 'ниже'} среднего.
                {item.level === 'HIGH' && ' Может, тебе и десерт оплатить? 🍰'}
              </div>

              <div className="pressure-bar-track">
                <div
                  className={`pressure-bar-fill ${item.level === 'HIGH' ? 'high' : 'medium'}`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <div className="pressure-percent">
                Отклонение: {item.deviationPercent}%
              </div>
            </div>
          );
        })}
    </div>
  );
}