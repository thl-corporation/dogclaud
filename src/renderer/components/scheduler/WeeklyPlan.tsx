import { useState } from 'react';
import { ScheduleInterval } from '../../../shared/types';
import { DAY_NAMES, DEFAULT_INTERVAL_HOURS } from '../../../core/constants';

interface WeeklyPlanProps {
  intervals: ScheduleInterval[];
  onAddInterval: (interval: ScheduleInterval) => void;
  onUpdateInterval: (id: string, updates: Partial<ScheduleInterval>) => void;
  onRemoveInterval: (id: string) => void;
}

const emptyInterval = (): Partial<ScheduleInterval> => ({
  dayOfWeek: 1,
  startHour: 9,
  startMinute: 0,
  endHour: 18,
  endMinute: 0,
  intervalHours: DEFAULT_INTERVAL_HOURS,
});

function TimeInput({ value, max, onChange }: { value: number; max: number; onChange: (v: number) => void }) {
  return (
    <input
      type="number"
      min="0"
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        width: '100%',
        padding: '8px 10px',
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        fontFamily: 'monospace',
      }}
    />
  );
}

function IntervalForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: Partial<ScheduleInterval>;
  onSubmit: (data: Partial<ScheduleInterval>) => void;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [data, setData] = useState(initial);

  return (
    <div style={{
      padding: '16px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(99,102,241,0.2)',
      borderRadius: '14px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      animation: 'fadeIn 0.2s ease-out',
    }}>
      <div>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Día
        </label>
        <select
          value={data.dayOfWeek}
          onChange={(e) => setData({ ...data, dayOfWeek: Number(e.target.value) })}
          style={{
            width: '100%',
            padding: '8px 10px',
            background: 'rgba(0,0,0,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '13px',
          }}
        >
          {DAY_NAMES.map((day, idx) => (
            <option key={idx} value={idx}>{day}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Inicio
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TimeInput value={data.startHour ?? 9} max={23} onChange={(v) => setData({ ...data, startHour: v })} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>:</span>
            <TimeInput value={data.startMinute ?? 0} max={59} onChange={(v) => setData({ ...data, startMinute: v })} />
          </div>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
            Fin
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <TimeInput value={data.endHour ?? 18} max={23} onChange={(v) => setData({ ...data, endHour: v })} />
            <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 700 }}>:</span>
            <TimeInput value={data.endMinute ?? 0} max={59} onChange={(v) => setData({ ...data, endMinute: v })} />
          </div>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Intervalo (horas)
        </label>
        <TimeInput value={data.intervalHours ?? DEFAULT_INTERVAL_HOURS} max={24} onChange={(v) => setData({ ...data, intervalHours: v })} />
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onSubmit(data)}
          style={{
            flex: 1,
            padding: '10px',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: '10px',
            color: 'white',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
          }}
        >
          {submitLabel}
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 16px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({
  intervals,
  onAddInterval,
  onUpdateInterval,
  onRemoveInterval,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = (data: Partial<ScheduleInterval>) => {
    if (data.dayOfWeek !== undefined) {
      onAddInterval({ ...data, id: Date.now().toString() } as ScheduleInterval);
      setShowForm(false);
    }
  };

  const handleUpdate = (id: string, data: Partial<ScheduleInterval>) => {
    onUpdateInterval(id, data);
    setEditingId(null);
  };

  const getIntervalsForDay = (day: number) => intervals.filter(int => int.dayOfWeek === day);
  const hasAnyIntervals = intervals.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.45)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Plan Semanal
        </span>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          style={{
            padding: '6px 14px',
            background: showForm ? 'rgba(239,68,68,0.15)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: showForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
            borderRadius: '10px',
            color: showForm ? '#ef4444' : 'white',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            boxShadow: showForm ? 'none' : '0 2px 10px rgba(99,102,241,0.3)',
          }}
        >
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>

      {showForm && (
        <IntervalForm
          initial={emptyInterval()}
          onSubmit={handleAdd}
          onCancel={() => setShowForm(false)}
          submitLabel="Agregar Intervalo"
        />
      )}

      {!hasAnyIntervals && !showForm && (
        <div style={{
          padding: '32px 20px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', margin: '0 0 8px' }}>
            No hay intervalos configurados
          </p>
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>
            Agrega intervalos para planificar tu uso semanal de Claude
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {DAY_NAMES.map((day, dayIdx) => {
          const dayIntervals = getIntervalsForDay(dayIdx);
          if (!hasAnyIntervals) return null;

          return (
            <div key={dayIdx} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '12px',
              padding: '12px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.75)' }}>{day}</span>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                  {dayIntervals.length} intervalo{dayIntervals.length !== 1 ? 's' : ''}
                </span>
              </div>

              {dayIntervals.map(int => (
                editingId === int.id ? (
                  <div key={int.id} style={{ marginTop: '10px' }}>
                    <IntervalForm
                      initial={int}
                      onSubmit={(data) => handleUpdate(int.id, data)}
                      onCancel={() => setEditingId(null)}
                      submitLabel="Guardar"
                    />
                  </div>
                ) : (
                  <div key={int.id} style={{
                    marginTop: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '10px',
                    padding: '8px 12px',
                  }}>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', fontFamily: 'monospace' }}>
                      {String(int.startHour).padStart(2, '0')}:{String(int.startMinute).padStart(2, '0')}
                      {' — '}
                      {String(int.endHour).padStart(2, '0')}:{String(int.endMinute).padStart(2, '0')}
                      <span style={{ color: 'rgba(255,255,255,0.3)', marginLeft: '8px', fontSize: '11px' }}>
                        cada {int.intervalHours}h
                      </span>
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => setEditingId(int.id)}
                        title="Editar intervalo"
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(99,102,241,0.1)',
                          border: '1px solid rgba(99,102,241,0.2)',
                          borderRadius: '6px',
                          color: '#818cf8',
                          fontSize: '11px',
                          cursor: 'pointer',
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => onRemoveInterval(int.id)}
                        title="Eliminar intervalo"
                        style={{
                          padding: '4px 8px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.2)',
                          borderRadius: '6px',
                          color: '#ef4444',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
