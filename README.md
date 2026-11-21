# Endurance

Robocza wersja rodzinnej aplikacji PWA do planowania treningów rowerowych,
siłowych, regeneracji i podstawowego żywienia. Interfejs jest przygotowany dla
trzech prywatnych profili: Wojtek, Kasia i Maja.

## Co działa

- wybór profilu i pierwsze ustawienie 6-cyfrowej lokalnej blokady PIN;
- automatyczne blokowanie profilu oraz przełączanie bez mieszania stanu;
- osobne motywy, cele i integracje demonstracyjne w trybie `/demo`;
- tygodniowy planer Rouvy + siłownia z regułą regeneracji nóg;
- interaktywny dashboard, dieta, makro, wykresy i galeria postępu;
- responsywny układ desktop/mobile oraz manifest i ikony PWA;
- chmurowe profile, programy i treningi zapisywane w Supabase;
- rower indoor/outdoor, spacery, hiking, siła, mobilność i regeneracja;
- kończenie programu, rozpoczynanie nowego oraz oznaczanie wykonanych sesji;
- tygodniowy kalendarz oraz edycja zaplanowanych i wykonanych treningów;
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

Bez konfiguracji chmurowej aplikacja uruchamia się w trybie przedprodukcyjnym.
Zmiana aktywnego programu i historia zakończonych programów są wtedy zapisywane
lokalnie w przeglądarce.

## Konfiguracja Supabase

Warstwa chmurowa używa Supabase Auth, PostgreSQL oraz Row Level Security. Aby ją
podłączyć:

1. utwórz bezpłatny projekt Supabase;
2. wykonaj po kolei migracje z katalogu `supabase/migrations/`;
3. skopiuj `.env.example` do `.env.local` i uzupełnij URL projektu oraz
   publishable key;
4. uruchom ponownie `pnpm dev`.

Po konfiguracji:

- `/login` — logowanie jednorazowym linkiem e-mail;
- `/auth/confirm` — bezpieczna wymiana kodu na sesję w ciasteczku;
- `/cloud` — chroniona wersja aplikacji, dostępna tylko po zalogowaniu;
- `/demo` — odseparowana prezentacja interfejsu na przykładowych danych;
- pierwsze wejście do `/cloud` tworzy prawdziwą przestrzeń rodzinną i profil
  właściciela w bazie danych.

W ustawieniach Supabase Auth dodaj `http://localhost:3100/auth/confirm` do
dozwolonych Redirect URLs. Po wdrożeniu dodaj również odpowiedni adres HTTPS.

Klucz `service_role` nie jest potrzebny w aplikacji i nie może trafiać do
przeglądarki. Migracja odbiera anonimowy dostęp do tabel oraz ogranicza dane do
uwierzytelnionych członków gospodarstwa.

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

To rozwijany produkt z działającym kontem chmurowym, profilami, programami i
treningami. Oddzielny tryb demonstracyjny nadal korzysta z przykładowych danych.
Lokalny PIN używa
PBKDF2 i losowej soli, ale jest wyłącznie blokadą prototypu na zaufanym
urządzeniu. Nie zastępuje Supabase Auth, passkey ani biometrii. Dane zdrowotne,
zdjęcia i tokeny integracji nie są jeszcze wysyłane ani przechowywane.

Produkcyjny etap wymaga:

1. szerszej historii, raportów i celów mierzonych dystansem lub czasem;
2. serwerowej weryfikacji zaufanego urządzenia, passkeys lub biometrii;
3. zatwierdzonego dostępu Garmin API;
4. natywnej obudowy Capacitor dla Health Connect i HealthKit;
5. testów na rzeczywistych urządzeniach Kasi, Wojtka i Mai.

Nie używamy prywatnych endpointów ani haseł Rouvy. Do czasu uzyskania
oficjalnego dostępu podstawą pozostaje własny plan i import FIT.

## Struktura

- `src/lib/` — model domeny, dane demonstracyjne i algorytm planowania;
- `src/components/profile/` — wybór profilu i lokalna blokada PIN;
- `src/components/dashboard/` — responsywny dashboard;
- `src/components/cloud/` — produkcyjny dashboard oparty na danych Supabase;
- `src/components/pwa/` — pomocnik instalacji;
- `tests/e2e/` — scenariusze desktop/mobile;
- `public/icons/` — ikony wygenerowane z zaakceptowanej grafiki.

Nazwa produktu: „Endurance”.
