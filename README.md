# TrailVelo Family

Robocza wersja rodzinnej aplikacji PWA do planowania treningów rowerowych,
siłowych, regeneracji i podstawowego żywienia. Interfejs jest przygotowany dla
trzech prywatnych profili: Wojtek, Kasia i Maja.

## Co działa

- wybór profilu i pierwsze ustawienie 6-cyfrowej lokalnej blokady PIN;
- automatyczne blokowanie profilu oraz przełączanie bez mieszania stanu;
- osobne motywy, cele i integracje demonstracyjne dla każdego profilu;
- tygodniowy planer Rouvy + siłownia z regułą regeneracji nóg;
- interaktywny dashboard, dieta, makro, wykresy i galeria postępu;
- responsywny układ desktop/mobile oraz manifest i ikony PWA;
- przygotowane kanały danych: FIT, Garmin, Health Connect i HealthKit;
- testy jednostkowe oraz E2E na desktopowym i mobilnym Chromium.

## Uruchomienie

Wymagane są Node.js 24 i pnpm 11.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

Aplikacja nasłuchuje na `0.0.0.0:3100`. Kontrola gotowości:

```bash
curl --fail http://127.0.0.1:3100/
```

## Weryfikacja

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
```

Polecenie `pnpm check` wykonuje lint, typecheck, testy jednostkowe i build.

## Granice obecnej wersji

To zweryfikowany front-end MVP na danych demonstracyjnych. Lokalny PIN używa
PBKDF2 i losowej soli, ale jest wyłącznie blokadą prototypu na zaufanym
urządzeniu. Nie zastępuje Supabase Auth, passkey ani biometrii. Dane zdrowotne,
zdjęcia i tokeny integracji nie są jeszcze wysyłane ani przechowywane.

Produkcyjny etap wymaga:

1. Supabase Auth/PostgreSQL/Storage i reguł Row Level Security;
2. serwerowej weryfikacji zaufanego urządzenia oraz bezpiecznych sesji;
3. zatwierdzonego dostępu Garmin API;
4. natywnej obudowy Capacitor dla Health Connect i HealthKit;
5. testów na rzeczywistych urządzeniach Kasi, Wojtka i Mai.

Nie używamy prywatnych endpointów ani haseł Rouvy. Do czasu uzyskania
oficjalnego dostępu podstawą pozostaje własny plan i import FIT.

## Struktura

- `src/lib/` — model domeny, dane demonstracyjne i algorytm planowania;
- `src/components/profile/` — wybór profilu i lokalna blokada PIN;
- `src/components/dashboard/` — responsywny dashboard;
- `src/components/pwa/` — pomocnik instalacji;
- `tests/e2e/` — scenariusze desktop/mobile;
- `public/icons/` — ikony wygenerowane z zaakceptowanej grafiki.

Nazwa „TrailVelo Family” jest nazwą roboczą do czasu decyzji brandingowej.
