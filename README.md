# 🎮 Mistrzowie Nawyków (FamilyHabitMasters)

Live demo: https://skalunek.github.io/familyhabitmasters/

**Zamień obowiązki dzieci w ekscytujące misje!**

Darmowa, otwartoźródłowa aplikacja webowa (PWA) do grywalizacji codziennych obowiązków dzieci. Walutą w grze jest czas na multimedia (gry/bajki) oraz **XP (punkty doświadczenia)**. Aplikacja działa w 100% lokalnie — bez chmury, bez konta, bez opłat.

## ✨ Funkcje

- 🔐 **Podział ról** — rodzic (zabezpieczony PINem) i dziecko (wybór profilu)
- 📋 **Codzienne Questy** — obowiązkowe rutyny pogrupowane wg pory dnia (poranne, popołudniowe, wieczorne, boss)
- ⭐ **Misje Dodatkowe** — zadania za które dziecko zdobywa dodatkowy czas i XP
- ⚠️ **Uchybienia** — kary za złamanie zasad, z opcjonalnymi konsekwencjami na następny dzień
- 🔒 **Blokada Czasu (Time Gating)** — czas na multimedia odblokowany dopiero po zamknięciu porannych i popołudniowych questów
- ⭐ **System XP i Leveli** — punkty doświadczenia + konfigurowane progi z nagrodami (lody, książka, kino...)
- 📅 **Dni bez ekranów** — harmonogram stały (dni tygodnia) + kalendarz wyjątków + przycisk "na dziś"; w te dni licznik czasu wyłączony, a zadania dają XP z mnożnikiem ×2
- 🔄 **Inteligentny carry-over** — konsekwencje z poprzedniego dnia przenoszone na pierwszy dzień z ekranami (pomijają dni offline)
- 👤 **Indywidualne zadania** — questy, bonusy i uchybienia przypisywane do konkretnych dzieci
- ⏱️ **System Czasu** — konfigurowalny czas bazowy, maksymalny, krok czasowy
- 🔁 **Jednorazowe/wielokrotne** — bonusy i uchybienia z flagą single-use/multi-use
- 📊 **Kompaktowanie logów** — logi starsze niż 14 dni automatycznie kompaktowane do statystyk
- ⚡ **Carry-over** — konsekwencje przenoszone na następny dzień z ekranami (pomijają dni offline, łańcuchowo)
- 💾 **Eksport/Import** — kopia zapasowa danych jako plik JSON
- 📱 **PWA** — instalowalna na telefonie

## 🚀 Uruchomienie

```bash
npm install        # Instalacja zależności
npm run dev        # Serwer deweloperski
npm test           # Testy (Vitest)
npm run test:watch # Testy w trybie ciągłym
npm run build      # Build produkcyjny
```

## 🎯 Jak to działa?

### Dla Rodzica:
1. Ustaw PIN przy pierwszym uruchomieniu
2. Dodaj profile dzieci (imię + avatar emoji)
3. Skonfiguruj questy, bonusy i uchybienia (z przypisaniem do dzieci)
4. Ustaw progi XP i nagrody w zakładce "Levele"
5. Zaznacz dni bez ekranów w ustawieniach (stałe + wyjątki w kalendarzu)
6. Zaplanuj przyszłe przerwy od ekranów w kalendarzu wyjątków
7. Podglądaj i zarządzaj dniem dziecka

### Dla Dziecka:
1. Wybierz swój profil
2. Wykonuj codzienne misje → zdobywaj XP
3. **Zamknij poranne i popołudniowe misje aby odblokować czas!**
4. Rób misje dodatkowe → zysk czasu + XP
5. W dni bez ekranów → zbieraj XP z bonusowym mnożnikiem ×2 (licznik czasu wyłączony)

### Zasady:
- **Czas bazowy**: 60 minut | **Max**: 90 minut (konfigurowalne)
- **Niewykonany quest** = utrata czasu
- **Misja dodatkowa** = zysk czasu + XP
- **Uchybienie** = utrata czasu (+ opcjonalnie konsekwencja jutro, + opcjonalnie utrata XP)
- **Levelowanie** = zbieraj XP za zadania → odblokuj nagrody

## 🛠️ Technologie

- **React** + **Vite** — UI framework
- **Vanilla CSS** — system designu z dark theme
- **LocalStorage** — persystencja danych
- **Vitest** — testy automatyczne (64+ testów)
- **GitHub Actions** — CI pipeline + deploy na GitHub Pages
- **lucide-react** — ikony
- **PWA** — Progressive Web App

## 📁 Struktura Projektu

```
src/
├── __tests__/      # Testy (dayEngine.test.js, defaults.test.js)
├── contexts/       # AppContext, AuthContext
├── data/           # Domyślne szablony, stałe, progi leveli
├── screens/        # LoginScreen, ChildDashboard, ParentDashboard
├── services/       # storage.js, dayEngine.js
├── App.jsx
├── main.jsx
└── index.css       # Design system
```

## 🗺️ Roadmapa

- [x] **Faza 1.0** — Standalone PWA z LocalStorage
- [x] **Faza 1.5** — XP, levele, time gating, dni offline, per-child assignment
- [ ] **Faza 2.0** — Cloud (BYOB: Firebase / Supabase)
- [ ] **Faza 3.0** — QR Onboarding + wizualna personalizacja

## 📄 Licencja

MIT — wolne oprogramowanie dla rodzin! 🏡
