# PRN variant `keyed` (`printBluetoothKeyed`)

**Status:** LIVE di app (cetak struk termal Bluetooth dari 1 dokumen)
**Dev spec:** ADA — alur walk-in POS (walkin specs)
**Widget tab:** row 276

## Buat apa

Tombol cetak **struk termal via Bluetooth**: baca 1 dokumen (mis. nota) lalu render template struk (`{{field}}`, LOOP item) ke printer termal. Dipakai kasir walk-in untuk cetak nota.

## Tampilan

```
[  🖨  Cetak Struk  ]  ── tap ──▶ render template → printer Bluetooth
```

## Contoh JSON

(contoh susunan — placeholder diisi nilai wajar)

```json
{"type":"PRN","variant":"keyed","vidtable":"20342033315492","table":"84214220504259//nota","search":"nno◼{nno}","paperSize":"58mm","icon":"print","buttonColor":"blue","textColor":"white","width":"full","position":"262","text":"Cetak Struk◆Menyiapkan...◆Struk siap◆Gagal cetak◆Nota tidak ditemukan","template":"<TEXT align='center' bold='true'>NOTA {{nno}}</TEXT>;<HR/>;<LOOP li>{{item.in}} x{{item.qt}} = {{item.sub|idr}}\n</LOOP>;<HR/>;<TEXT bold='true'>TOTAL {{tot|idr}}</TEXT>;<CUT/>"}
```

## Field

| Field | Wajib? | Isi | Contoh |
|---|---|---|---|
| `type` | otomatis dari template | `PRN` | — |
| `variant` | Wajib | `keyed` — cetak termal Bluetooth | `keyed` |
| `vidtable` / `table` / `search` | Wajib | Data 1 dokumen yang dicetak | `nno◼{nno}` |
| `paperSize` | Wajib | Lebar kertas termal | `58mm` |
| `icon` / `buttonColor` / `textColor` / `width` | Wajib | Tampilan tombol | `print` / `blue` / `white` / `full` |
| `position` | Wajib | Slot tombol (teks angka) | `262` |
| `text` | Wajib | Label + pesan status (dipisah `◆`) | lihat contoh |
| `template` | Wajib | Template struk — baris `;`, tag `<TEXT>` `<HR/>` `<LOOP>` `<CUT/>` `{{field}}` `{{field\|idr}}` | lihat contoh |

## Posisi field gabungan

`text` dipisah `◆` (label + pesan status). `template` = baris dipisah `;`.

## Tips & catatan

- Beda muara dari `sharePdfKeyed` (304, PDF+share): `printBluetoothKeyed` = cetak termal langsung ke printer Bluetooth.
- Untuk QR keyed = `sharePdfKeyed`. Untuk nota, gunakan variant ini.
