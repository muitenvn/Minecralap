# IMPLEMENTATION PROGRESS — Minecralap / NetherCraft 26.3

- **Cập nhật lần cuối**: Hoàn tất Wave 18 (Toàn bộ Giai đoạn 1, 2, 3 & 4: Waves 0 → 18).
- **Trạng thái build hiện tại**: Sạch lỗi TypeScript (`tsc --noEmit` 0 lỗi), Build Vite sản xuất thành công, **50/50 unit & integration tests PASS**.

## Nhật ký triển khai theo từng đợt

### Giai đoạn 1 (Waves 0–6) — VERIFIED
- **Wave 1**: Save Schema v2 (`migrateWorldSave`), kho lưu trữ Rương 27 ô & Rương Ender 27 ô, tay trái Offhand (`KeyF`) hỗ trợ Khiên, Totem hồi sinh, sửa bền Mending.
- **Wave 2**: `src/game/brewing.ts` + UI Giàn Pha Thuốc 3 bình, nhiên liệu Bột Quỷ Lửa (20 lượt/bột), đầy đủ nhánh thuốc Java → Splash → Lingering.
- **Wave 3**: `src/game/redstone.ts` — tín hiệu 0–15 BFS, Repeater, Lever/Pressure Plate/Daylight Detector, Đèn Redstone ON/OFF, TNT, Piston/Sticky Piston (≤12 khối), Hopper khóa tín hiệu, Đá Nhạc Kèn Đồng 26.1.
- **Wave 4**: `src/game/trading.ts` + Dân Làng 6 nghề, nhân giống thú non, Bồ Công Anh Vàng 26.1 khóa tuổi, Thẻ Tên, sinh Làng, Trại Bỏ Hoang 26.3 & Pháo Đài Nether.
- **Wave 5**: Nội dung Java 26.1 & 26.3 (`poplar_*`, `shelf_mushroom`, `straw_bed`, `cushion`, `wool_slab`, `dappled_forest`), `src/game/combat.ts` (Attack Cooldown, Chí mạng 1.5×, Đánh lan Kiếm), tự lớn Mía & Cây non.
- **Wave 6**: Tổng kiểm thử Giai đoạn 1 (18/18 tests PASS).

### Giai đoạn 2 (Waves 7–10) — VERIFIED
- **Wave 7**: Câu cá Java (Luck/Lure/Enchanted Book), Composter 0→7 → Bột Xương, Cauldron 0→3, Campfire nướng đồ ăn, Blast Furnace/Smoker 2×, Stonecutter UI.
- **Wave 8**: 5 Mob kinh điển (`skeleton`, `blaze`, `wolf` thuần hóa/Giáp Sói, `iron_golem`, `pillager`) + Đột Kích Làng 3 đợt (`/raid`, BossBar, `hero_of_the_village` -30% giá Ngọc Lục Bảo).
- **Wave 9**: Save Schema **v3**, hệ thống Thành Tựu Java (Toast vàng + bảng Pause Menu) & Redstone nâng cao (`observer`, `dispenser`, `dropper`).
- **Wave 10**: Kiểm thử hồi quy Giai đoạn 2 (31/31 tests PASS).

### Giai đoạn 3 (Waves 11–14) — VERIFIED
- **Wave 11**: `src/game/physicsWorld.ts` — vật lý khối trọng lực (Cát, Cát Đỏ, Sỏi, Đe, Bột Bê Tông hóa Bê Tông khi chạm Nước) + Máy Tạo Đá Cuội (Cobblestone Generator) & Hắc Diện Thạch (Obsidian).
- **Wave 12**: `src/game/bossesAndBeacon.ts` — Boss Wither (300 HP, 3 đầu bay, bệ chữ T Cát/Đất Linh Hồn, BossBar tím, rơi Sao Nether) + Đèn Hiệu Beacon 4 tầng (3×3→9×9, 6 hiệu ứng, cấp II).
- **Wave 13**: 3 Mob sinh tồn kinh điển (`enderman`, `spider`, `slime`) + Đền Thờ Đại Dương Ocean Monument tại `(-3, -3)` + mở rộng `/locate`.
- **Wave 14**: Kiểm thử hồi quy Giai đoạn 3 (41/41 tests PASS).

### Giai đoạn 4 (Waves 15–18) — VERIFIED
- **Wave 15 (`src/game/mobs.ts`, `src/game/storage.ts`, `src/game/raid.ts`, `src/game/catalog116.ts`, `src/game/engine.ts`)**:
  - Bổ sung 5 mob hoàn thiện vòng lặp sinh tồn Endgame & Công trình có mô hình 3D thủ công, trứng triệu hồi & hành vi AI chuẩn Java:
    - `wither_skeleton` (Nether — rơi `wither_skeleton_skull`, gây hiệu ứng tối `darkness`).
    - `evoker` (Woodland Mansion & Raid Đợt 3 — tấn công tầm xa, rơi `totem_of_undying`).
    - `vindicator` (Woodland Mansion & Raid Đợt 2–3 — chiến binh rìu tốc độ cao, rơi `emerald`).
    - `guardian` (Ocean Monument — sinh vật dưới nước bắn tia tầm xa, rơi `prismarine_shard`).
    - `shulker` (The End — bắn đạn gây bay lơ lửng `levitation`, rơi `shulker_shell`).
  - **Hòm Shulker di động (`shulker_box`)**: `packShulkerBoxItem` / `unpackShulkerBoxItem` giữ nguyên toàn bộ 27 ô vật phẩm & phù phép bên trong khi đào mang đi và đặt lại ở bất kỳ chiều không gian nào.
  - Nâng cấp **Máy Phát Nhạc (`jukebox`)**: cầm bất kỳ `music_disc_*` nào bấm chuột phải sẽ phát đúng bản nhạc của đĩa đó.
- **Wave 16 (`src/game/worldGen.ts`, `src/game/commands.ts`, `src/game/engine.ts`)**:
  - **Biệt Thự Rừng Woodland Mansion** 2 tầng tất định tại chunk `(3, -3)` (nền Đá Cuội, tường/cột Gỗ Sồi Đen, sảnh Thảm Đỏ, thư viện Kệ Sách, Đuốc chiếu sáng 2 tầng, kho báu Kim Cương/Ngọc Lục Bảo & Rương).
  - **Kim Tự Tháp Sa Mạc Desert Pyramid** tất định tại chunk `(-3, 2)` (Sa Thạch, hoa văn Đất Nung Cam/Xanh, hầm kho báu ngầm kèm Đĩa Áp Lực + bẫy 3×3 TNT + 4 Rương & khối Vàng/Kim Cương).
  - Mở rộng `/locate` & gợi ý lệnh cho `woodland_mansion`, `desert_pyramid`; tự động sinh Evoker/Vindicator quanh Biệt Thự & Guardian quanh Đền Thờ Đại Dương.
- **Wave 17 (`src/game/lighting.ts`, `src/game/chunkMesher.ts`, `src/game/advancements.ts`)**:
  - Xây dựng động cơ **Chiếu sáng Voxel 15 bậc** thuần TypeScript không phát sinh GC (`computeSubchunkLighting`, `sampleVoxelLightLevels`, `sampleCombinedVertexLight`):
    - Block-Light BFS 0..15 suy hao đúng 1/khối qua không khí, trộn màu RGB nguồn sáng và bị chắn hoàn toàn bởi khối đặc.
    - Skylight 0..15 chiếu thẳng từ bầu trời và lan ngang vào cửa hang/mái hiên, giúp hang sâu & phòng kín tối chân thực và bừng sáng ấm áp khi đặt Đuốc/Đèn Biển/Đá Phát Sáng.
  - Bổ sung 3 Thành Tựu mới (`shulker_box_pack`, `evoker_totem`, `mansion_explorer`), nâng tổng lên **25 Thành Tựu Java**.
- **Wave 18**: Kiểm thử hồi quy toàn bộ **50/50 test cases** (`npm test`), kiểm tra kiểu tĩnh (`npm run lint`), build production (`compile_applet` + `lint_applet`) và đồng bộ 5 tài liệu quản lý.
