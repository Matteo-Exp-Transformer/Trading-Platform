import { useState } from 'react';
import {
  ASSET_OPTIONS,
  STILE_OPTIONS,
  OBIETTIVO_OPTIONS,
  validateForm,
  buildTitle,
  buildSummary,
  buildFormContext,
  screenshotSlots,
  dataUrlToImagePart,
} from '../../lib/formUtils.js';
import { compressImageToDataUrl } from '../../lib/imageCompression.js';

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

// Uno slot screenshot etichettato per timeframe: o mostra l'anteprima caricata, o il picker.
function ScreenshotSlot({ slot, image, busy, error, onPick, onRemove }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded bg-white/5 border border-white/10">
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">
          {slot.label}
          {slot.required ? (
            <span className="text-freedom-accent ml-1" aria-label="obbligatorio">*</span>
          ) : (
            <span className="text-white/40 ml-1 text-xs">(opzionale)</span>
          )}
        </div>
        {error && (
          <p role="alert" className="text-red-400 text-xs mt-1">{error}</p>
        )}
      </div>

      {image ? (
        <div className="relative shrink-0">
          <img
            src={image.preview}
            alt={`${slot.label} — ${image.name}`}
            className="h-16 w-16 object-cover rounded border border-white/20"
          />
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Rimuovi ${slot.label}`}
            className="absolute -top-2 -right-2 bg-black/80 text-white rounded-full w-5 h-5 text-xs leading-none border border-white/30"
          >
            ×
          </button>
        </div>
      ) : (
        <label
          className={`cursor-pointer text-sm px-3 py-2 rounded border border-white/20 shrink-0 ${
            busy ? 'text-white/40' : 'text-freedom-accent hover:brightness-110'
          }`}
        >
          {busy ? 'Carico…' : '+ Carica'}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            disabled={busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              onPick(file);
            }}
          />
        </label>
      )}
    </div>
  );
}

export function NewAnalysisForm({ onSubmit, loading }) {
  const [values, setValues] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  // Immagini per-slot: { [slotKey]: { name, mimeType, data, preview } }
  const [slotImages, setSlotImages] = useState({});
  const [slotErrors, setSlotErrors] = useState({});
  const [busySlot, setBusySlot] = useState(null); // slot in compressione

  const slots = screenshotSlots(values.stileOperativo, values.obiettivo);

  function set(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // Cambiare "come operi" cambia i timeframe: gli screenshot già caricati non valgono più.
  function handleStileChange(v) {
    set('stileOperativo', v);
    setSlotImages({});
    setSlotErrors({});
  }

  function handleObiettivoChange(o) {
    set('obiettivo', o);
    if (o !== 'Lettura operativa') set('hasPosizione', '');
    // Lo slot GoldenTrend esiste solo in "Analisi completa": scartalo altrove.
    if (o !== 'Analisi completa') {
      setSlotImages((prev) => {
        if (!prev.goldentrend) return prev;
        const next = { ...prev };
        delete next.goldentrend;
        return next;
      });
    }
  }

  async function handleSlotFile(slotKey, file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setSlotErrors((prev) => ({ ...prev, [slotKey]: 'Formato non valido: carica un’immagine.' }));
      return;
    }
    setBusySlot(slotKey);
    setSlotErrors((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
    try {
      const dataUrl = await compressImageToDataUrl(file);
      const part = dataUrlToImagePart(dataUrl);
      if (!part) {
        setSlotErrors((prev) => ({ ...prev, [slotKey]: 'Immagine non leggibile. Riprova.' }));
        return;
      }
      setSlotImages((prev) => ({
        ...prev,
        [slotKey]: { ...part, name: file.name, preview: dataUrl },
      }));
    } catch {
      setSlotErrors((prev) => ({ ...prev, [slotKey]: 'Caricamento non riuscito. Riprova.' }));
    } finally {
      setBusySlot(null);
    }
  }

  function removeSlot(slotKey) {
    setSlotImages((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    const result = validateForm(values);

    // Screenshot: ogni slot obbligatorio deve avere un'immagine.
    const nextSlotErrors = {};
    for (const slot of slots) {
      if (slot.required && !slotImages[slot.key]) {
        nextSlotErrors[slot.key] = 'Screenshot obbligatorio.';
      }
    }
    const slotsOk = Object.keys(nextSlotErrors).length === 0;

    if (!result.valid || !slotsOk) {
      setErrors(result.errors);
      setSlotErrors(nextSlotErrors);
      return;
    }

    // Immagini + etichette nello stesso ordine (top-down): il modello sa quale grafico è quale.
    const attached = slots.filter((s) => slotImages[s.key]);
    onSubmit({
      title: buildTitle(values),
      summary: buildSummary(values, attached.map((s) => s.label)),
      formContext: buildFormContext(values),
      images: attached.map((s) => {
        const img = slotImages[s.key];
        return { mimeType: img.mimeType, data: img.data };
      }),
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
            onChange={handleStileChange}
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

        {/* Screenshot — slot fissi per timeframe (vision obbligatoria nel primo turno) */}
        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm text-white/70">Screenshot del grafico</legend>

          {slots.length === 0 ? (
            <p className="text-xs text-white/40">
              Scegli <span className="text-white/60">«Come operi»</span> e{' '}
              <span className="text-white/60">«Cosa vuoi da questa analisi»</span> per vedere quali
              grafici caricare.
            </p>
          ) : (
            <>
              <p className="text-xs text-white/40">
                Carica lo screenshot giusto per ogni timeframe. Il decisionale è sempre obbligatorio.
              </p>
              <div className="flex flex-col gap-3">
                {slots.map((slot) => (
                  <ScreenshotSlot
                    key={slot.key}
                    slot={slot}
                    image={slotImages[slot.key]}
                    busy={busySlot === slot.key}
                    error={slotErrors[slot.key]}
                    onPick={(file) => handleSlotFile(slot.key, file)}
                    onRemove={() => removeSlot(slot.key)}
                  />
                ))}
              </div>
            </>
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
