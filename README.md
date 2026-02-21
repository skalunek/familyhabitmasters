# 🎮 Mistrzowie Nawyków (FamilyHabitMasters)

**Zamień obowiązki dzieci w ekscytujące misje!**

Darmowa, otwartoźródłowa aplikacja webowa (PWA) do grywalizacji codziennych obowiązków dzieci. Walutą w grze jest czas na multimedia (gry/bajki). Aplikacja działa w 100% lokalnie — bez chmury, bez konta, bez opłat.

## ✨ Funkcje

- 🔐 **Podział ról** — rodzic (zabezpieczony PINem) i dziecko (wybór profilu)
- 📋 **Codzienne Questy** — obowiązkowe rutyny pogrupowane wg pory dnia
- ⭐ **Misje Dodatkowe** — zadania za które dziecko zdobywa dodatkowy czas
- ⚠️ **Uchybienia** — kary za złamanie zasad, z opcjonalnymi konsekwencjami na następny dzień
- ⏱️ **System Czasu** — konfigurowalny czas bazowy, maksymalny, krok czasowy
- 📊 **Podsumowanie dnia** — historia zdarzeń i bilans zysków/strat
- 💾 **Eksport/Import** — kopia zapasowa danych jako plik JSON
- 📱 **PWA** — instalowalna na telefonie, działa offline

## 🚀 Uruchomienie

```bash
# Instalacja zależności
npm install

# Uruchomienie serwera deweloperskiego
npm run dev

# Build produkcyjny
npm run build
```

## 🎯 Jak to działa?

### Dla Rodzica:
1. Ustaw PIN przy pierwszym uruchomieniu
2. Dodaj profile dzieci (imię + avatar emoji)
3. Skonfiguruj codzienne questy, misje dodatkowe i uchybienia
4. Ustal punktację (ile minut za co)
5. Podglądaj i zarządzaj dniem dziecka

### Dla Dziecka:
1. Wybierz swój profil
2. Wykonuj codzienne misje (zaznaczaj ✅ lub ❌)
3. Rób misje dodatkowe aby zdobyć czas na multimedia
4. Unikaj uchybień!

### Zasady:
- **Czas bazowy**: 60 minut (konfigurowalny)
- **Czas max**: 90 minut (konfigurowalny)
- **Niewykonany quest** = utrata czasu
- **Misja dodatkowa** = zysk czasu
- **Uchybienie** = utrata czasu (+ opcjonalnie konsekwencja na jutro)

## 🛠️ Technologie

- **React** + **Vite** — UI framework
- **Vanilla CSS** — system designu z dark theme
- **LocalStorage** — persystencja danych
- **lucide-react** — ikony
- **PWA** — Progressive Web App

## 📁 Struktura Projektu

```
src/
├── components/     # (do rozbudowy)
├── contexts/       # AppContext, AuthContext
├── data/           # Domyślne szablony i stałe
├── screens/        # LoginScreen, ChildDashboard, ParentDashboard
├── services/       # storage.js, dayEngine.js
├── App.jsx
├── main.jsx
└── index.css       # Design system
```

## 🗺️ Roadmapa

- [x] **Faza 1** — Standalone PWA z LocalStorage
- [ ] **Faza 2** — Cloud (BYOB: Firebase / Supabase)
- [ ] **Faza 3** — QR Onboarding
- [ ] **Faza 4** — Wydanie Open Source z dokumentacją

## 📄 Licencja

MIT — wolne oprogramowanie dla rodzin! 🏡
