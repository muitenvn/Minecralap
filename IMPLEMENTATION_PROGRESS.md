# IMPLEMENTATION PROGRESS — Minecralap / NetherCraft 26.3

- **Cập nhật lần cuối**: Hoàn tất Wave 14 (Toàn bộ Giai đoạn 1, Giai đoạn 2 & Giai đoạn 3: Waves 0 → 14).
- **Trạng thái build hiện tại**: Sạch lỗi TypeScript (`tsc --noEmit` 0 lỗi), Build Vite sản xuất thành công, **41/41 unit & integration tests PASS**.

## Nhật ký triển khai theo từng đợt

### Giai đoạn 1 (Waves 0–6) — VERIFIED
- **Wave 1**: Save Schema v2 (`migrateWorldSave`), kho lưu trữ Rương 27 ô & Rương Ender 27 ô bền vững theo chiều không gian, tay trái Offhand (`KeyF`) hỗ trợ Khiên chặn sát thương, Totem hồi sinh, sửa bền Mending.
- **Wave 2**: `src/game/brewing.ts` + UI Giàn Pha Thuốc 3 bình, tiêu thụ Bột Quỷ Lửa (20 lượt/bột), đầy đủ nhánh thuốc Awkward → Speed/Strength/Healing/Fire Resistance/Night Vision/Poison/Slowness/Weakness → Splash → Lingering.
- **Wave 3**: `src/game/redstone.ts` — tín hiệu 0–15 lan truyền BFS, Repeater khuếch đại, Lever/Pressure Plate/Daylight Detector, Đèn Redstone bật/tắt, kích nổ TNT, Piston/Sticky Piston (tối đa 12 khối, chặn Bedrock/Obsidian), Phễu Hopper tự khóa khi nhận tín hiệu, Đá Nhạc hỗ trợ Kèn Đồng 26.1.
- **Wave 4**: `src/game/trading.ts` + Dân Làng 6 nghề (Farmer, Librarian, Armorer, Weaponsmith, Cleric, Toolsmith), nhân giống động vật ra thú non, Bồ Công Anh Vàng 26.1 khóa tuổi vĩnh viễn, Thẻ Tên, sinh cấu trúc Làng, Trại Bỏ Hoang 26.3 & Pháo Đài Nether.
- **Wave 5**: Nội dung Java 26.1 & 26.3 (`poplar_log`, `poplar_planks`, `poplar_leaves`, `shelf_mushroom`, `straw_bed`, `cushion`, `wool_slab`, quần xã `dappled_forest`), `src/game/combat.ts` (Attack Cooldown, Chí mạng trên không 1.5×, Đánh lan Kiếm), tự lớn Mía và Cây non.
- **Wave 6**: Tổng kiểm thử Giai đoạn 1 (18/18 tests PASS) và xuất báo cáo.

### Giai đoạn 2 (Waves 7–10) — VERIFIED
- **Wave 7 (`src/game/stations.ts`, `src/game/engine.ts`, `src/components/ContainerModal.tsx`)**:
  - Bảng câu cá Java: cá, rác, kho báu; hỗ trợ phù phép Luck of the Sea & Lure; giữ nguyên phù phép thật trên Sách Phù Phép & Cung câu được.
  - Thùng Ủ Phân (Composter): mức 0→7 nhận vật phẩm hữu cơ và thu hoạch Bột Xương (lưu bền vững `composterLevels`).
  - Cái Vạc (Cauldron): mức nước 0→3, đổ Xô Nước, múc 3 Chai Nước, múc lại Xô Nước (lưu bền vững `cauldronLevels`).
  - Nướng đồ ăn trực tiếp trên Lửa Trại (Campfire) không tốn nhiên liệu.
  - Lò Cao (Blast Furnace) & Lò Hun Khói (Smoker) chạy tốc độ gấp đôi 2× kèm giao diện tiêu đề đúng loại lò.
  - Giao diện Máy Cắt Đá (Stonecutter UI) chuyên biệt chuyển trực tiếp 1 khối đá sang Cầu thang/Phiến/Tường/Gạch.
- **Wave 8 (`src/game/raid.ts`, `src/game/mobs.ts`, `src/game/commands.ts`, `src/game/catalog116.ts`, `src/components/HudOverlay.tsx`)**:
  - Bổ sung 5 sinh vật kinh điển có mô hình 3D thủ công, trứng triệu hồi & hành vi AI thật: `skeleton` (bắn cung tầm xa), `blaze` (bay + cầu lửa + rơi Que Quỷ Lửa), `wolf` (thuần hóa bằng Xương, đeo Giáp Sói +20 máu, hồi máu bằng thịt, ngồi/đi theo, tự tấn công quái gần), `iron_golem` (100 máu, bảo vệ làng và hất tung quái), `pillager` (nỏ tầm xa + rơi Ngọc Lục Bảo).
  - Hệ thống Đột Kích Làng 3 đợt (`/raid`), thanh BossBar Đột Kích màu đỏ trên HUD, tự gọi đợt tiếp viện và trao thưởng Chiến thắng + hiệu ứng `hero_of_the_village` giảm 30% giá Ngọc Lục Bảo khi giao dịch Dân Làng.
- **Wave 9 (`src/game/advancements.ts`, `src/game/redstone.ts`, `src/game/storage.ts`, `src/components/HudOverlay.tsx`, `src/components/OptionsAndPauseModal.tsx`, `src/App.tsx`)**:
  - Save Schema nâng cấp lên **v3** (di trú an toàn từ v1 & v2, bổ sung `composterLevels`, `cauldronLevels`, `advancements`).
  - Hệ thống Thành Tựu Java có phần thưởng XP, thông báo Toast viền vàng cổ điển góc trên phải khi mở khóa, và bảng **Thành Tựu** trong Menu Tạm Dừng.
  - Redstone nâng cao: Máy Quan Sát (`observer`), Máy Phân Phát (`dispenser`), Máy Bắn (`dropper`).
- **Wave 10**: Kiểm thử toàn bộ 31 test cases (`npm test`), kiểm tra kiểu tĩnh (`npm run lint`), build production (`compile_applet`) và đồng bộ 5 tài liệu quản lý.

### Giai đoạn 3 (Waves 11–14) — VERIFIED
- **Wave 11 (`src/game/physicsWorld.ts`, `src/game/engine.ts`)**:
  - Vật lý khối rơi trọng lực chuẩn Java: `sand`, `red_sand`, `gravel`, `anvil`, `suspicious_sand`, `suspicious_gravel`, và toàn bộ 16 màu `*_concrete_powder` tự sụp đổ theo cột dọc khi phá khối đỡ bên dưới hoặc đặt lơ lửng; Bột Bê Tông tự đông cứng thành khối Bê Tông khi chạm Nước.
  - Lan truyền chất lỏng có kiểm soát (`stepFluidSpread`): Nước & Dung Nham chảy xuống và lan ngang cục bộ, hỗ trợ hoàn chỉnh **Máy Tạo Đá Cuội (Cobblestone Generator)** khi đào ô giữa Nước và Dung Nham, và tạo **Hắc Diện Thạch (Obsidian)** khi đổ Nước lên Dung Nham.
- **Wave 12 (`src/game/bossesAndBeacon.ts`, `src/game/mobs.ts`, `src/game/advancements.ts`, `src/game/engine.ts`)**:
  - **Boss Wither (Khô Héo)**: 300 máu, bay 3 đầu bằng mô hình 3D thủ công, BossBar màu tím trên HUD, tầm giữ chunk 140m, triệu hồi bằng bệ chữ T 4 khối Cát/Đất Linh Hồn + đặt `wither_skeleton_skull` (hoặc `/summon wither` / `wither_spawn_egg`), rơi **Sao Nether (`nether_star`)**.
  - **Đèn Hiệu Beacon 4 Tầng chuẩn Java**: Tự động quét kim tự tháp 3×3 / 5×5 / 7×7 / 9×9 bằng khối Sắt, Vàng, Ngọc Lục Bảo, Kim Cương hoặc Netherite; nhấn chuột phải đổi hiệu ứng mở khóa (`Speed`, `Haste`, `Resistance`, `Jump Boost`, `Strength`, `Regeneration`) và tự phát hào quang mỗi 3 giây trong bán kính 20–50 khối (mở khóa cấp II ở Tầng 4).
  - Bổ sung 2 Thành Tựu mới: `summon_wither` và `activate_beacon` (nâng tổng lên **22 Thành Tựu Java**).
- **Wave 13 (`src/game/mobs.ts`, `src/game/worldGen.ts`, `src/game/commands.ts`, `src/game/catalog116.ts`, `src/game/engine.ts`)**:
  - Bổ sung 3 mob vòng lặp sinh tồn kinh điển kèm mô hình 3D & trứng triệu hồi: `enderman` (40 máu, dịch chuyển tức thời 45% khi bị đánh, rơi `ender_pearl`), `spider` (16 máu, 8 chân vồ nhảy, rơi `string`), `slime` (16 máu, nảy bật trong suốt, rơi `slime_ball`).
  - Sinh cấu trúc **Đền Thờ Đại Dương (Ocean Monument)** tất định tại chunk `(-3, -3)` (và lưới định kỳ 16×16) với kiến trúc Lăng Kính (`prismarine`, `prismarine_bricks`, `dark_prismarine`), Đèn Biển (`sea_lantern`) và Kho 8 khối Vàng (`gold_block`).
  - Mở rộng lệnh `/locate` & tự hoàn tất (autocomplete) cho `ocean_monument`, `village`, `nether_fortress`, `abandoned_camp`.
- **Wave 14**: Kiểm thử hồi quy toàn bộ **41/41 test cases** (`npm test`), kiểm tra kiểu tĩnh (`npm run lint`), build production (`compile_applet` + `lint_applet`) và đồng bộ 5 tài liệu quản lý.
