import { useState } from 'react';
import {
  ASSET_OPTIONS,
  STILE_OPTIONS,
  OBIETTIVO_OPTIONS,
  validateForm,
  buildTitle,
  buildSummary,
  buildFormContext,
  timeframesFor,
  dataUrlToImagePart,
} from '../../lib/formUtils.js';

const MAX_IMAGES = 3;

// Suggerimento timeframe in base a stile × obiettivo (fedele al kit / CHAT_ANALISI_CONTEXT §4).
function screenshotHint(stile, obiettivo) {
  const tf = timeframesFor(stile);
  if (!tf.decisionale) return 'Carica gli screenshot del grafico (max 3).';
  if (obiettivo === 'Lettura operativa') {
    return `Carica il decisionale ${tf.decisionale} attuale (e, se vuoi, il contesto ${tf.contesto}).`;
  }
  return `Carica il contesto ${tf.contesto} e il decisionale ${tf.decisionale} (max ${MAX_IMAGES}).`;
}

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
  const [images, setImages] = useState([]); // [{ name, mimeType, data, preview }]
  const [imageError, setImageError] = useState(null);

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setImageError(`Massimo ${MAX_IMAGES} screenshot.`);
      return;
    }
    const parts = await Promise.all(
      files.slice(0, room).map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const part = dataUrlToImagePart(reader.result);
              resolve(part ? { ...part, name: file.name, preview: reader.result } : null);
            };
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          }),
      ),
    );
    const valid = parts.filter(Boolean);
    if (valid.length) {
      setImages((prev) => [...prev, ...valid]);
      setImageError(null);
    }
  }

  function removeImage(idx) {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  }

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
    const noImages = images.length === 0;
    if (noImages) setImageError('Carica almeno uno screenshot del grafico.');
    if (!result.valid || noImages) {
      setErrors(result.errors);
      return;
    }
    onSubmit({
      title: buildTitle(values),
      summary: buildSummary(values),
      formContext: buildFormContext(values),
      images: images.map(({ mimeType, data }) => ({ mimeType, data })),
    });
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

        {/* Screenshot — vision obbligatoria nel primo turno */}
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm text-white/70">Screenshot del grafico</legend>
          <p className="text-xs text-white/40">
            {screenshotHint(values.stileOperativo, values.obiettivo)}
          </p>

          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={img.preview}
                    alt={img.name}
                    className="h-20 w-20 object-cover rounded border border-white/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    aria-label={`Rimuovi ${img.name}`}
                    className="absolute -top-2 -right-2 bg-black/80 text-white rounded-full w-5 h-5 text-xs leading-none border border-white/30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < MAX_IMAGES && (
            <label className="cursor-pointer text-sm text-freedom-accent hover:brightness-110 w-fit">
              + Aggiungi screenshot
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          )}

          {imageError && (
            <p role="alert" className="text-red-400 text-xs">
              {imageError}
            </p>
          )}
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
