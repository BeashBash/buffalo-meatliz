# חיבור טרנזילה — הוראות הפעלה

## מה כבר מוכן במערכת

- ✅ שדות תשלום בטבלת ההזמנות (`payment_token`, `tranzila_txid`, `payment_amount`, ...)
- ✅ RPC functions ב-Supabase (יצירת קישור, אישור תשלום)
- ✅ דף תשלום ללקוח (`/pay/:token`) — מוצג אוטומטי כשמסוף מוגדר
- ✅ Edge Function לוובהוק (`supabase/functions/tranzila-webhook/`)
- ✅ שירות `src/lib/tranzila.ts` עם כל הלוגיקה

---

## שלבי הפעלה

### 1. הוסף משתני סביבה לקובץ `.env`

```env
VITE_TRANZILA_TERMINAL=your_terminal_name   # שם המסוף מטרנזילה
VITE_APP_URL=https://your-domain.co.il      # כתובת האתר בפרודקשן
```

### 2. פרוס את ה-Edge Function

```bash
supabase functions deploy tranzila-webhook --no-verify-jwt
```

### 3. הגדר Webhook בטרנזילה

בבאק-אופיס של טרנזילה ← הגדרות ← URL נוטיפיקציה:

```
https://dbyykuyzgjfmsdtyrwzb.supabase.co/functions/v1/tranzila-webhook
```

---

## זרימת התשלום

```
1. אדמין שוקל הזמנה → סכום סופי
2. אדמין לוחץ "שלח קישור תשלום"
3. המערכת מייצרת token ייחודי + URL לטרנזילה
4. הקישור נשלח ללקוח ב-WhatsApp
5. לקוח לוחץ → רואה דף תשלום עם iframe של טרנזילה
6. לקוח משלם → טרנזילה שולחת Webhook
7. Edge Function מקבלת Webhook → מסמנת הזמנה כ"שולם"
8. דף הלקוח מתעדכן אוטומטי
```

---

## תשלום ידני (מזומן / העברה)

ניתן לסמן הזמנה כשולמת ידנית מפאנל הניהול ← הזמנות ← שנה סטטוס לـ"שולם".

---

## פרמטרים של טרנזילה (מוגדרים ב-tranzila.ts)

| פרמטר | ערך |
|---|---|
| currency | 1 (שקל) |
| tranmode | A (חיוב רגיל) |
| cred_type | 1 (כרטיס אשראי רגיל) |
| lang | heb |

לשינוי פרמטרים — ערוך `src/lib/tranzila.ts` פונקציה `createPaymentLink`.
