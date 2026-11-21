# AUTONOMOUS ROADMAP — Minecralap / NetherCraft (Java Edition 26.3 "Wilderness Bound")

**Phiên bản mục tiêu đã xác minh**: Minecraft: Java Edition **26.3 ("Wilderness Bound")** (kế thừa đầy đủ 1.16.5 → 1.21.11 → 26.1 "Tiny Takeover" → 26.3).

## Trạng thái tổng thể các đợt triển khai (Waves 0–14)

| Đợt | Phạm vi triển khai | Trạng thái | Bằng chứng kiểm thử |
| --- | --- | --- | --- |
| **Wave 0** | Phân tích toàn bộ mã nguồn, lập ma trận thiếu hụt & cấu hình test runner `tsx --test` | **VERIFIED** | `npm test`, `tsc --noEmit` |
| **Wave 1** | Save Schema v2→v3 (`migrateWorldSave`), Rương 27 ô (Chest/Barrel/Copper Chest/Dispenser/Dropper), Rương Ender 27 ô, Tay trái Offhand (`KeyF`, Shield/Totem/Mending) | **VERIFIED** | `tests/wave1_storage_containers.test.ts` (3/3 PASS) |
| **Wave 2** | Hệ thống Giàn Pha Thuốc (Brewing Stand) theo ma trận Java chính thức, nhiên liệu Bột Quỷ Lửa (20 lượt), 3 bình thuốc đồng thời & giao diện Brewing UI | **VERIFIED** | `tests/wave2_brewing.test.ts` (3/3 PASS) |
| **Wave 3** | Động cơ Redstone (tín hiệu 0–15 BFS, Repeater, Lever, Pressure Plates, Daylight Detector, Redstone Lamp ON/OFF, TNT, Piston/Sticky Piston, Hopper khóa tín hiệu, Đá Nhạc Kèn Đồng 26.1 + WebAudio) | **VERIFIED** | `tests/wave3_redstone.test.ts` (5/5 PASS) |
| **Wave 4** | Dân Làng (Villager 6 nghề + giao dịch Ngọc Lục Bảo + Thủ thư bán Sách Phù Phép), Nhân giống thú non + Bồ Công Anh Vàng 26.1 khóa tuổi + Thẻ Tên, Làng/Trại Bỏ Hoang 26.3/Pháo Đài Nether | **VERIFIED** | `tests/wave4_trading_farming_worldgen.test.ts` (4/4 PASS) |
| **Wave 5** | Java 26.1 (Thẻ Tên chế tạo, Bồ Công Anh Vàng) & 26.3 (Quần xã Rừng Dương Lốm Đốm, bộ gỗ Dương Poplar, Nấm Bệ, Giường Rơm ngủ được, Đệm Ngồi, Phiến Len), Cơ chế Chiến đấu Java (Attack Cooldown, Chí mạng 1.5× trên không, Đánh lan Kiếm), Tự lớn Mía/Cây non | **VERIFIED** | `tests/wave5_java263_combat.test.ts` (3/3 PASS) |
| **Wave 6** | Kiểm thử hồi quy Giai đoạn 1 & đồng bộ tài liệu theo dõi | **VERIFIED** | `npm test` (18/18 PASS), `compile_applet`, `lint_applet` |
| **Wave 7** | Bảng câu cá Java (Luck of the Sea / Lure / Sách & Cung Phù Phép thật), Thùng Ủ Phân (Composter 0..7 → Bột Xương), Cái Vạc (Cauldron 0..3 Xô/Chai nước), Nướng Lửa Trại (Campfire), Lò Cao & Lò Hun Khói tốc độ 2×, Giao diện Máy Cắt Đá (Stonecutter UI) | **VERIFIED** | `tests/wave7_stations_fishing.test.ts` (4/4 PASS) |
| **Wave 8** | 5 Mob kinh điển có AI & mô hình 3D (`skeleton`, `blaze`, `wolf` thuần hóa/ngồi/Giáp Sói/bảo vệ, `iron_golem` bảo vệ làng, `pillager`) + Đột Kích Làng 3 đợt (`/raid`, thanh Raid BossBar, hiệu ứng `hero_of_the_village` giảm 30% giá Ngọc Lục Bảo) | **VERIFIED** | `tests/wave8_mobs_raid.test.ts` (5/5 PASS) |
| **Wave 9** | Hệ thống Thành Tựu Java (lưu trong Save Schema v3, Toast vàng cổ điển + Bảng Thành Tựu trong Menu Tạm Dừng) + Redstone nâng cao (`observer` phát xung khi khối cạnh đổi, `dispenser` bắn tên/TNT/nước, `dropper` đẩy vật phẩm sang rương kế bên) | **VERIFIED** | `tests/wave9_advancements_redstone_v2.test.ts` (4/4 PASS) |
| **Wave 10** | Kiểm thử hồi quy toàn phần Giai đoạn 2 (31/31 unit tests), `tsc --noEmit`, `vite build` & cập nhật đầy đủ 5 tài liệu quản lý dự án | **VERIFIED** | `npm test` (31/31 PASS), `compile_applet`, `lint_applet` |
| **Wave 11** | Vật lý khối rơi trọng lực (`sand`, `red_sand`, `gravel`, `anvil`, `*_concrete_powder` hóa Bê Tông khi chạm Nước) + Lan truyền chất lỏng có giới hạn & hóa rắn Nước+Dung Nham (**Máy Tạo Đá Cuội Cobblestone Generator** & **Hắc Diện Thạch Obsidian**) | **VERIFIED** | `tests/wave11_physics_fluids.test.ts` (4/4 PASS) |
| **Wave 12** | **Boss Wither** (300 máu, bay 3 đầu, BossBar tím, triệu hồi bằng bệ chữ T Cát/Đất Linh Hồn + Đầu Lâu Wither, rơi **Sao Nether**) + **Đèn Hiệu Beacon 4 Tầng** (kim tự tháp 3×3 → 9×9 Sắt/Vàng/Ngọc Lục Bảo/Kim Cương/Netherite mở khóa Speed/Haste/Resistance/Jump Boost/Strength/Regeneration & cấp II ở Tầng 4) + 2 Thành Tựu mới (`summon_wither`, `activate_beacon`, tổng **22 Thành Tựu**) | **VERIFIED** | `tests/wave12_wither_beacon.test.ts` (3/3 PASS) |
| **Wave 13** | 3 Mob vòng lặp sinh tồn kinh điển có mô hình 3D & AI thật (`enderman` dịch chuyển tức thời khi trúng đòn & rơi Ngọc Ender, `spider` 8 chân nhảy vồ & rơi Tơ, `slime` trong suốt nảy bật & rơi Bóng Nhờn) + **Đền Thờ Đại Dương Ocean Monument** tại chunk `(-3, -3)` (Lăng Kính, Đèn Biển & Kho 8 khối Vàng) + mở rộng `/locate` & gợi ý lệnh | **VERIFIED** | `tests/wave13_structures_enderman_loop.test.ts` (3/3 PASS) |
| **Wave 14** | Kiểm thử hồi quy toàn phần Giai đoạn 3 (**41/41 unit tests**), `tsc --noEmit`, `vite build` (`compile_applet` + `lint_applet`) & đồng bộ toàn bộ 5 tài liệu quản lý | **VERIFIED** | `npm test` (41/41 PASS), `compile_applet`, `lint_applet` |

## Phạm vi ngoài kiến trúc trình duyệt thuần (Đã ghi nhận rõ ở `KNOWN_LIMITATIONS.md`)
- Multiplayer LAN / Dedicated Server (cần máy chủ WebSocket/WebRTC ngoài phạm vi client-side static app).
- Mô phỏng dòng chảy nước 7 bậc waterlogging toàn chunk (đã có lan truyền giới hạn + Máy Tạo Đá Cuội + Obsidian) và hệ thống chiếu sáng block-light 15 bậc đầy đủ toàn chiều cao (đang dùng ánh sáng động cục bộ để giữ ổn định WebGL2 trên điện thoại và máy yếu).
