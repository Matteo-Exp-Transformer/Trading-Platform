# Pagina Checkout — file di contesto (ESEMPIO — cancellare dopo aver capito il modello)

> Esempio compilato per mostrare il livello di dettaglio giusto. È inventato. Cancellalo.

> **Trigger di routing:** «checkout» · «pagina pagamento» → questo file.

---

## 1. Cos'è questa zona

La pagina dove il cliente conferma l'ordine e paga. Dal punto di vista dell'utente: riepilogo
carrello, inserimento dati, scelta metodo pagamento, conferma.

## 2. File coinvolti

| File | Ruolo |
|------|-------|
| `src/pages/CheckoutPage.tsx` | Pagina contenitore, gestisce gli step |
| `src/features/checkout/CartSummary.tsx` | Riepilogo carrello |
| `src/features/checkout/PaymentForm.tsx` | Form pagamento (integra Stripe) |
| `src/features/checkout/useCheckout.ts` | Hook con la logica di submit |

## 3. Invarianti / LOCK locali

```
LOCK  PaymentForm.tsx — integrazione Stripe certificata, modifiche solo con re-test PCI
RULE  L'importo finale si calcola SEMPRE lato server, mai fidarsi del totale dal client
RULE  Mai loggare dati carta — nemmeno mascherati
```

## 4. Dettagli di implementazione (le «Nota:»)

- **Step state machine (12-03):** il flusso ha 3 step (`cart → data → payment`) gestiti da uno
  stato `step` in `CheckoutPage`, non dal routing. Tornare indietro non perde i dati inseriti
  (sono in un context). Non trasformarlo in route separate: si perde lo stato.
- **Totale barrato sconto (15-03):** quando c'è un coupon, `CartSummary` mostra il totale pieno
  barrato + scontato. Il valore barrato viene da `subtotal`, lo scontato da `total` (entrambi
  dal server). Mai ricalcolare lo sconto nel client.
- **Mobile sticky bar (18-03):** sotto 768px il pulsante «Paga» è in una sticky bar in fondo
  (`z-50`), non inline. Appare quando il form esce dalla viewport (IntersectionObserver).

## 5. Come estendere senza rompere

Per aggiungere un metodo di pagamento: estendi `PAYMENT_METHODS` in `useCheckout.ts` e aggiungi
il render in `PaymentForm`. Non toccare il calcolo importo. Aggiungi un test al flusso submit.

## 6. Report di sessione collegati

- `sessioni/18-03-26/Report-checkout-mobile-sticky.md`
