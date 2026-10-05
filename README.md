# 🛹 Sunset Skater 3D

Ett snyggt, snabbt och engagerande 3D arkad-skateboardspel byggt med **React**, **Three.js** och **TypeScript**. Inspirerat av klassiska Tony Hawk's Pro Skater med dynamisk grafik i gyllene solnedgångsstil ("golden hour"), realistiska och sköna arkad-fysiker, rail grinds, manuals, ramps och synthesiserade ljudeffekter via Web Audio API!

---

## ✨ Funktioner

- 🌴 **3D Sunset Skatepark**: En komplett skateplaza med Quarterpipes för Big Vert Air, Halfpipe (mini-ramp), Central Funbox/Pyramid, Trappor (6-stairs med handrail och hubbas), Rainbow-rail, Kinked rails och bänkar.
- 🛹 **Djupgående Tricksystem**:
  - **Ollie**: Ladda upp hoppet för extra höjd (håll inne Space).
  - **Kickflip & Heelflip**: 360-graders flips i luften.
  - **360 Pop Shuvit**: Horisontell brädsnurr.
  - **Grinds**: Snäpp fast på stålräcken och ledges (50-50 Grind, Boardslide).
  - **Manuals**: Rulla på bakhjulen på plan mark för att kedja ihop enorma combos!
  - **Balansmätare**: Dynamisk mätare under grinds och manuals där du parerar med vänster/höger.
  - **Wipeout & Bail**: Ramlar du eller misslyckas med balansen kraschar du med ljud och respons.
- 🏆 **THPS Combo & Poängsystem**: Multiplicera dina poäng genom att länka samman tricks, grinds och manuals till galna kombokedjor!
- 🔤 **S-K-A-T-E Bokstavsjakt**: Hitta alla 5 gyllene bokstäverna utspridda i parken för en massiv bonus på +25 000 poäng!
- 🎵 **Web Audio Synth Engine**:
  - Dynamiskt rulljud som anpassar sig efter hjulens hastighet.
  - Skarpt Ollie-pop, kickflip-svisch, gnistrande metallgrind och kraschljud.
  - Egen inbyggd chill lo-fi / synthwave skate-beat generator!
- 🎮 **Fullt Kontrollstöd**:
  - **Tangentbord**: WASD / Piltangenter, Space, Shift, J, K, L, M.
  - **Gamepad**: Fullt stöd för Xbox / PlayStation kontroller via Gamepad API!
  - **Mobil / Touch**: Virtuell D-pad och action-knappar för telefoner och surfplattor.
- 🎥 **Flera Kameravinklar**: Växla mellan Follow Cam, Close Action Cam och Bird's Eye översiktsvy.

---

## 🕹️ Kontroller

| Handling | Tangentbord | Gamepad | Touch |
|---|---|---|---|
| **Fart framåt / Skjut fart** | `W` eller `↑` | Vänster spak upp / D-Pad upp | D-Pad ▲ |
| **Sväng vänster / höger** | `A` / `D` eller `←` / `→` | Vänster spak | D-Pad ◀ / ▶ |
| **Bromsa / Backa** | `S` eller `↓` | Vänster spak ner / D-Pad ner | D-Pad ▼ |
| **Ollie (Hopp)** | `SPACE` (Håll för högre) | `A` (Xbox) / `✕` (PS) | Stor OLLIE-knapp |
| **Kickflip** | `J` eller `1` | `X` (Xbox) / `□` (PS) | FLIP |
| **Heelflip** | `K` eller `2` | `RB` | FLIP |
| **360 Pop Shuvit** | `L` eller `3` | `RT` | SHUV |
| **Grind på räcke** | `SHIFT` eller `G` | `Y` (Xbox) / `△` (PS) | GRIND |
| **Manual (Wheelie)** | `M` | `B` (Xbox) / `○` (PS) | MAN |
| **Kamera-läge** | Knapp i HUD | Back / View | Knapp i HUD |
| **Musik På/Av** | Knapp i HUD | - | Knapp i HUD |

---

## 🚀 Publicering på Vercel

Projektet är helt optimerat för Vercel med automatisk byggprocess:

1. Pusha repot till ditt GitHub-konto (redan förberett!).
2. Gå till [vercel.com](https://vercel.com) och logga in.
3. Klicka på **"Add New..."** -> **"Project"**.
4. Välj **`sunset-skater-3d`** från din GitHub-lista.
5. Vercel känner automatiskt av **Vite**:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. Klicka på **Deploy**! Spelet rullas ut på en snabb global CDN på under 1 minut.

---

## 💻 Lokal Utveckling

```bash
# Installera beroenden
npm install

# Starta utvecklingsserver
npm run dev

# Bygg för produktion
npm run build
```

---

Skapad med ❤️ för alla skatesugna!
