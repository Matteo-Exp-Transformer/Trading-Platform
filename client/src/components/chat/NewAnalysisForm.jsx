import { useState } from 'react';
import {
  ASSET_OPTIONS,
  STILE_OPTIONS,
  OBIETTIVO_OPTIONS,
  validateForm,
  buildTitle,
  buildSummary,
} from '../../lib/formUtils.js';

const DISCLAIMER =
  "Strumento di supporto all'analisi tecnica. Non è consulenza finanziaria.";

const INITIAL = {
  asset: '',
  altroAsset: '',
  stileOperativo: '',
  obiettivo: '',
  hasPosizione: '',
  tipoPosizione: '',
  prezzoApertura: '',
  sl: '',
  tp: '',
  idea: '',
};

function ToggleGroup({ options, value, onChange, labelMap }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-4 py-2 rounded border text-sm transition-colors ${
            value === opt
              ? 'bg-freedom-accent border-freedom-accent text-black font-semibold'
              : 'border-white/20 text-white/70 hover:border-white/50'
          }`}
        >
          {labelMap ? labelMap[opt] : opt}
        </button>
      ))}
    </div>
  );
}

export function NewAnalysisForm({ onSubmit, loading }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function handleObiettivoChange(o) {
    set('obiettivo', o);
    if (o !== 'Lettura operativa') set('hasPosizione', '');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const result = validateForm(values);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    onSubmit({ title: buildTitle(values), summary: buildSummary(values) });
  }

  const richiedePosizione = values.obiettivo === 'Lettura operativa';

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-6 flex flex-col gap-5">
      <h2 className="text-lg font-semibold text-white">Nuova analisi</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>

        {/* Asset */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-white/70">Quale asset?</legend>
          <select
            value={values.asset}
            onChange={(e) => set('asset', e.target.value)}
            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white focus:outline-none focus:border-freedom-accent"
          >
            <option value="" className="bg-freedom-bg text-white">— Seleziona —</option>
            {ASSET_OPTIONS.map((a) => (
              <option key={a} value={a} className="bg-freedom-bg text-white">
                {a}
              </option>
            ))}
            <option value="__altro__" className="bg-freedom-bg text-white">Altro (scrivi il simbolo)</option>
          </select>
          {values.asset === '__altro__' && (
            <input
              type="text"
              placeholder="Es. USOIL, GBPJPY…"
              value={values.altroAsset}
              onChange={(e) => set('altroAsset', e.target.value)}
              className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-freedom-accent"
            />
          )}
          {errors.asset && (
            <p role="alert" className="text-red-400 text-xs">
              {errors.asset}
            </p>
          )}
        </fieldset>

        {/* Come operi */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-white/70">Come operi?</legend>
          <ToggleGroup
            options={STILE_OPTIONS}
            value={values.stileOperativo}
            onChange={(v) => set('stileOperativo', v)}
          />
          {errors.stileOperativo && (
            <p role="alert" className="text-red-400 text-xs">
              {errors.stileOperativo}
            </p>
          )}
        </fieldset>

        {/* Obiettivo */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-white/70">Cosa vuoi da questa analisi?</legend>
          <ToggleGroup
            options={OBIETTIVO_OPTIONS}
            value={values.obiettivo}
            onChange={handleObiettivoChange}
          />
          {errors.obiettivo && (
            <p role="alert" className="text-red-400 text-xs">
              {errors.obiettivo}
            </p>
          )}
        </fieldset>

        {/* Posizione */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-white/70">
            Hai una posizione aperta?
            {richiedePosizione && (
              <span className="text-freedom-accent ml-1" aria-label="obbligatorio">
                *
              </span>
            )}
          </legend>
          <ToggleGroup
            options={['si', 'no']}
            value={values.hasPosizione}
            onChange={(v) => set('hasPosizione', v)}
            labelMap={{ si: 'Sì', no: 'No' }}
          />
          {errors.hasPosizione && (
            <p role="alert" className="text-red-400 text-xs">
              {errors.hasPosizione}
            </p>
          )}

          {values.hasPosizione === 'si' && (
            <div className="flex flex-col gap-3 mt-1 p-3 rounded bg-white/5 border border-white/10">
              {/* Direzione */}
              <div className="flex flex-col gap-1">
                <span className="text-xs text-white/60">Direzione</span>
                <ToggleGroup
                  options={['Long', 'Short']}
                  value={values.tipoPosizione}
                  onChange={(v) => set('tipoPosizione', v)}
                />
                {errors.tipoPosizione && (
                  <p role="alert" className="text-red-400 text-xs">
                    {errors.tipoPosizione}
                  </p>
                )}
              </div>

              {/* Prezzo apertura */}
              <div className="flex flex-col gap-1">
                <label className="text-xs text-white/60">
                  Prezzo apertura <span className="text-freedom-accent">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Es. 2350.50"
                  value={values.prezzoApertura}
                  onChange={(e) => set('prezzoApertura', e.target.value)}
                  className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-freedom-accent"
                />
                {errors.prezzoApertura && (
                  <p role="alert" className="text-red-400 text-xs">
                    {errors.prezzoApertura}
                  </p>
                )}
              </div>

              {/* SL e TP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Stop Loss (opz.)</label>
                  <input
                    type="text"
                    placeholder="Es. 2330"
                    value={values.sl}
                    onChange={(e) => set('sl', e.target.value)}
                    className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-freedom-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-white/60">Take Profit (opz.)</label>
                  <input
                    type="text"
                    placeholder="Es. 2400"
                    value={values.tp}
                    onChange={(e) => set('tp', e.target.value)}
                    className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-freedom-accent"
                  />
                </div>
              </div>
            </div>
          )}
        </fieldset>

        {/* Idea */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-white/70">La tua idea (facoltativo)</legend>
          <textarea
            placeholder="Breve nota personale…"
            value={values.idea}
            onChange={(e) => set('idea', e.target.value)}
            rows={2}
            className="bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-freedom-accent"
          />
        </fieldset>

        <p className="text-xs text-white/40 text-center">{DISCLAIMER}</p>

        <button
          type="submit"
          disabled={loading}
          className="bg-freedom-accent text-black font-semibold py-3 rounded hover:brightness-110 disabled:opacity-50 transition-opacity"
        >
          {loading ? 'Avvio in corso…' : 'Avvia analisi'}
        </button>
      </form>
    </div>
  );
}
