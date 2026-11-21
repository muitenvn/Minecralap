# FEATURE COMPLETION MATRIX — Minecralap / NetherCraft 26.3

Quy ước trạng thái: `NOT_STARTED` | `IN_PROGRESS` | `IMPLEMENTED` | `TESTED` | `VERIFIED` | `BLOCKED`

| Nhóm hệ thống | Tính năng cụ thể | Trạng thái | Ghi chú & Bằng chứng |
| --- | --- | --- | --- |
| **Save & Data** | Save Schema v3, di trú tự động v1/v2 → v3, xuất/nhập file `.mc263.json` | **VERIFIED** | `tests/wave1_storage_containers.test.ts`, `tests/wave9_advancements_redstone_v2.test.ts` |
| **Kho & Túi đồ** | Rương 27 ô, Thùng, Rương Đồng, Rương Ender 27 ô, **Hòm Shulker di động giữ nguyên 27 ô khi đào/đặt**, Tay trái Offhand (`KeyF`) | **VERIFIED** | `tests/wave1_storage_containers.test.ts`, `tests/wave15_progression_mobs_shulker.test.ts` |
| **Chế tạo & Nung** | Bàn Chế Tạo 3×3, Lò Nung, Lò Cao 2×, Lò Hun Khói 2×, Lửa Trại nướng đồ ăn | **VERIFIED** | `tests/wave7_stations_fishing.test.ts` |
| **Trạm chuyên dụng** | Máy Cắt Đá (Stonecutter UI), Bàn Rèn (Smithing), Bàn Phù Phép, Đe (Anvil), Đá Mài (Grindstone), Máy Phát Nhạc (đủ đĩa nhạc) | **VERIFIED** | `tests/wave7_stations_fishing.test.ts`, `src/game/engine.ts` |
| **Trạm sinh tồn** | Thùng Ủ Phân (Composter 0..7 → Bột Xương), Cái Vạc (Cauldron 0..3 Xô/Chai), Câu cá Java (Luck/Lure/Kho báu) | **VERIFIED** | `tests/wave7_stations_fishing.test.ts` |
| **Pha thuốc** | Giàn Pha Thuốc Java (3 bình, Bột Quỷ Lửa 20 lượt, Awkward → Effects → Splash → Lingering) | **VERIFIED** | `tests/wave2_brewing.test.ts` |
| **Vật lý khối & Chất lỏng** | Cát/Cát Đỏ/Sỏi/Đe rơi theo cột trọng lực, Bột Bê Tông hóa cứng khi chạm Nước, Máy Tạo Đá Cuội (Cobblestone Generator), Nước+Dung Nham tạo Obsidian & lan truyền giới hạn | **VERIFIED** | `tests/wave11_physics_fluids.test.ts` |
| **Chiếu sáng Voxel 15 bậc** | Block-Light BFS 0..15 (suy hao 1/khối, màu RGB, chắn tường đặc) & Skylight 0..15 phân biệt bầu trời với hang tối/nội thất | **VERIFIED** | `tests/wave17_voxel_lighting.test.ts`, `src/game/lighting.ts`, `src/game/chunkMesher.ts` |
| **Redstone cơ bản & Tự động** | Dây Redstone 0–15 BFS, Repeater, Lever, Pressure Plates, Daylight Detector, Đèn ON/OFF, TNT, Piston/Sticky Piston (≤12 khối), Hopper khóa điện, Observer, Dispenser, Dropper, Đá Nhạc Kèn Đồng 26.1 | **VERIFIED** | `tests/wave3_redstone.test.ts`, `tests/wave9_advancements_redstone_v2.test.ts` |
| **Thế giới & Cấu trúc** | Overworld, Nether, The End; Làng, Trại Bỏ Hoang 26.3, Pháo Đài Nether, Đền Thờ Đại Dương `(-3,-3)`, **Biệt Thự Rừng Woodland Mansion `(3,-3)`**, **Kim Tự Tháp Sa Mạc `(-3,2)`**, Cổ Thành/Trial Chamber/Trail Ruins; `/locate` đầy đủ | **VERIFIED** | `tests/wave4_trading_farming_worldgen.test.ts`, `tests/wave13_structures_enderman_loop.test.ts`, `tests/wave16_mansion_pyramid.test.ts` |
| **Dân Làng & Nông trại** | Villager 6 nghề, giao dịch Ngọc Lục Bảo, Thủ thư bán Sách Phù Phép, Nhân giống thú non, Bồ Công Anh Vàng 26.1 | **VERIFIED** | `tests/wave4_trading_farming_worldgen.test.ts` |
| **Boss & Đèn Hiệu (Endgame)** | Rồng Ender, Warden Deep Dark, Boss Wither (300 HP, bệ chữ T Cát/Đất Linh Hồn, BossBar tím, Sao Nether) + Đèn Hiệu Beacon 4 Tầng (3×3→9×9, 6 hiệu ứng, cấp II) | **VERIFIED** | `tests/wave12_wither_beacon.test.ts` |
| **Chiến đấu & Mob Sinh tồn** | Cooldown Java, Chí mạng 1.5×, Đánh lan Kiếm, Chùy Mace 1.21; Skeleton, Blaze, Wolf thuần hóa/Giáp Sói, Iron Golem, Pillager, Enderman, Spider, Slime, **Wither Skeleton, Evoker (Totem), Vindicator, Guardian, Shulker (Levitation)** | **VERIFIED** | `tests/wave5_java263_combat.test.ts`, `tests/wave8_mobs_raid.test.ts`, `tests/wave13_structures_enderman_loop.test.ts`, `tests/wave15_progression_mobs_shulker.test.ts` |
| **Sự kiện Làng** | Đột Kích Làng 3 đợt (`/raid`, Đợt 2 Vindicator, Đợt 3 Evoker + Vindicator), Raid BossBar, Chiến thắng + Anh Hùng Của Làng (-30% giá Ngọc Lục Bảo) | **VERIFIED** | `tests/wave8_mobs_raid.test.ts`, `tests/wave15_progression_mobs_shulker.test.ts` |
| **Java 26.1 – 26.3** | Name Tag chế tạo, Golden Dandelion, Rừng Dương Lốm Đốm, Gỗ Dương Poplar, Nấm Bệ, Giường Rơm, Đệm Ngồi, Phiến Len | **VERIFIED** | `tests/wave5_java263_combat.test.ts` |
| **Thành Tựu (Advancements)** | **25 Thành Tựu Java** (1.16→26.3, gồm Wither, Beacon, Shulker Box, Totem, Mansion), Toast vàng & Bảng Thành Tựu Pause Menu | **VERIFIED** | `tests/wave9_advancements_redstone_v2.test.ts`, `tests/wave17_voxel_lighting.test.ts` |
| **Điều khiển & Âm thanh** | PC chuột PointerLock tự ẩn nút cảm ứng; Mobile 2 chế độ (Nút Đập/Đặt & Chạm đè màn hình); Âm thanh Minecraft/Resource Pack + WebAudio | **VERIFIED** | `compile_applet`, `lint_applet` |
| **Multiplayer mạng** | Chơi nhiều người qua mạng LAN / Dedicated Server | **BLOCKED** | Kiến trúc ứng dụng web thuần client-side không có backend server |
| **Chất lỏng 7 mức & Waterlogging** | Dòng chảy đẩy thực thể 7 mức toàn chunk & waterlogging cầu thang/phiến đá | **IN_PROGRESS** | Đã có lan truyền cục bộ + Máy Tạo Đá Cuội + Obsidian để giữ ổn định FPS WebGL2 |
