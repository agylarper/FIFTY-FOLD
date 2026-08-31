# Fiftyfold

Puzzle platformer 50 stage yang berjalan langsung di browser.

Tujuannya sederhana: ambil semua buah, buka portal, lalu jangan mati. Setiap 10 stage membentuk satu biome dan ditutup dengan sesi kejar-kejaran melawan Rock Head atau Spike Head.

## Main

Tidak perlu install dependency atau menjalankan proses build. Buka `index.html` langsung di browser, atau jalankan server lokal dari folder project:

```bash
python3 -m http.server 8000
```

Setelah itu buka `http://localhost:8000`.

## Kontrol

| Tombol | Aksi |
| --- | --- |
| `A` / `D` atau panah | Bergerak |
| `Space`, `W`, atau panah atas | Lompat |
| `E` | Kemampuan karakter |
| `Q` | Ganti karakter |
| `Esc` | Pause |

## Karakter

- **Mask Dude** — double jump.
- **Ninja Frog** — menempel dan melompat dari dinding.
- **Pink Man** — phase melewati barrier ungu.
- **Virtual Guy** — mematikan mesin dan laser selama 2,5 detik.

Karakter baru terbuka setiap menyelesaikan satu biome. Stage terakhir mengharuskan pemain memanfaatkan seluruh kemampuan yang sudah didapat.

## Aturan run

- Semua buah dalam stage harus diambil sebelum portal terbuka.
- Pemain mendapat tiga nyawa untuk setiap biome.
- Kehabisan nyawa mengembalikan run ke awal biome tersebut.
- Timer tetap menghitung kematian dan pengulangan stage.
- Timer berhenti ketika game di-pause atau browser ditutup.
- Progress, achievement, pengaturan, dan leaderboard disimpan di browser dengan `localStorage`.

Tidak ada server atau akun. Leaderboard hanya berlaku pada browser yang sedang digunakan.

## Isi project

```text
index.html   Struktur layar, menu, HUD, dan modal
style.css    Tampilan utama dan layout responsif
themes.css   Tekstur tambahan untuk panel
game.js      Level, physics, collision, rendering, audio, dan save data
Background/  Latar pixel art
Items/       Buah, box, dan checkpoint
Main Characters/
Menu/
Other/
Terrain/
Traps/
```

Seluruh 173 file PNG di project masuk ke manifest game. Aset utama digunakan selama permainan, sedangkan daftar lengkapnya bisa dilihat lewat **Achievements → Asset Codex**.

## Catatan teknis

Game dibuat dengan HTML, CSS, JavaScript, dan Canvas API tanpa framework. Efek suara dibuat saat runtime menggunakan Web Audio API; project ini tidak memiliki file audio terpisah.

Kalau perubahan JavaScript tidak langsung terlihat setelah refresh, lakukan hard refresh (`Ctrl+Shift+R`) supaya browser tidak memakai cache lama.
