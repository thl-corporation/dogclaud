import { useState } from 'react';
import { ScheduleInterval } from '../../../shared/types';
import { DAY_NAMES, DEFAULT_INTERVAL_HOURS } from '../../../core/constants';

interface WeeklyPlanProps {
  intervals: ScheduleInterval[];
  onAddInterval: (interval: ScheduleInterval) => void;
  onUpdateInterval: (id: string, updates: Partial<ScheduleInterval>) => void;
  onRemoveInterval: (id: string) => void;
}

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({
  intervals,
  onAddInterval,
  onUpdateInterval: _onUpdateInterval,
  onRemoveInterval
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newInterval, setNewInterval] = useState<Partial<ScheduleInterval>>({
    dayOfWeek: 1,
    startHour: 9,
    startMinute: 0,
    endHour: 18,
    endMinute: 0,
    intervalHours: DEFAULT_INTERVAL_HOURS
  });
  
  const handleAdd = () => {
    if (newInterval.dayOfWeek !== undefined) {
      onAddInterval({
        ...newInterval,
        id: Date.now().toString()
      } as ScheduleInterval);
      setShowForm(false);
      setNewInterval({
        dayOfWeek: 1,
        startHour: 9,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
        intervalHours: DEFAULT_INTERVAL_HOURS
      });
    }
  };
  
  const getIntervalsForDay = (day: number) => {
    return intervals.filter(int => int.dayOfWeek === day);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-gray-300">Plan Semanal</h4>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          {showForm ? 'Cancelar' : '+ Agregar'}
        </button>
      </div>
      
      {showForm && (
        <div className="p-4 bg-gray-700 rounded-lg space-y-3">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Día</label>
            <select
              value={newInterval.dayOfWeek}
              onChange={(e) => setNewInterval({ ...newInterval, dayOfWeek: Number(e.target.value) })}
              className="w-full p-2 bg-gray-800 text-white rounded"
            >
              {DAY_NAMES.map((day, idx) => (
                <option key={idx} value={idx}>{day}</option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Inicio</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={newInterval.startHour}
                  onChange={(e) => setNewInterval({ ...newInterval, startHour: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
                <span className="text-white self-center">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newInterval.startMinute}
                  onChange={(e) => setNewInterval({ ...newInterval, startMinute: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-1">Fin</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={newInterval.endHour}
                  onChange={(e) => setNewInterval({ ...newInterval, endHour: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
                <span className="text-white self-center">:</span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newInterval.endMinute}
                  onChange={(e) => setNewInterval({ ...newInterval, endMinute: Number(e.target.value) })}
                  className="w-full p-2 bg-gray-800 text-white rounded"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Intervalo (horas)</label>
            <input
              type="number"
              min="1"
              max="24"
              value={newInterval.intervalHours}
              onChange={(e) => setNewInterval({ ...newInterval, intervalHours: Number(e.target.value) })}
              className="w-full p-2 bg-gray-800 text-white rounded"
            />
          </div>
          
          <button
            onClick={handleAdd}
            className="w-full py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Agregar Intervalo
          </button>
        </div>
      )}
      
      <div className="space-y-2">
        {DAY_NAMES.map((day, dayIdx) => {
          const dayIntervals = getIntervalsForDay(dayIdx);
          return (
            <div key={dayIdx} className="p-2 bg-gray-700 rounded">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">{day}</span>
                <span className="text-gray-400 text-sm">
                  {dayIntervals.length} interval(s)
                </span>
              </div>
              {dayIntervals.map(int => (
                <div key={int.id} className="mt-2 flex items-center justify-between bg-gray-800 p-2 rounded">
                  <span className="text-gray-300 text-sm">
                    {String(int.startHour).padStart(2, '0')}:{String(int.startMinute).padStart(2, '0')} - 
                    {String(int.endHour).padStart(2, '0')}:{String(int.endMinute).padStart(2, '0')}
                    <span className="text-gray-500 ml-2">(Cada {int.intervalHours}h)</span>
                  </span>
                  <button
                    onClick={() => onRemoveInterval(int.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
