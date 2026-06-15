interface Props {
  label: string;
  value: number;
  onChange: (next: number) => void;
  accent?: 'gold' | 'slate';
}

export default function QtyStepper({ label, value, onChange, accent = 'slate' }: Props) {
  const active = value > 0;
  const valueColor =
    accent === 'gold' && active ? 'text-gold' : active ? 'text-white' : 'text-slate-500';

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-300">{label}</span>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(0, value - 1))}
          disabled={value <= 0}
          className="h-8 w-8 rounded-lg border border-space-600 text-lg leading-none text-slate-200
            hover:border-gold/60 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
        >
          −
        </button>
        <input
          type="number"
          min={0}
          aria-label={label}
          value={value}
          onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
          className={`w-12 bg-transparent text-center text-base font-semibold tabular-nums
            focus:outline-none ${valueColor}`}
        />
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-lg border border-space-600 text-lg leading-none text-slate-200
            hover:border-gold/60 hover:text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}
