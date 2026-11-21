# FEATURE COMPLETION MATRIX — Minecralap / NetherCraft 26.3

Quy ước trạng thái: `NOT_STARTED` | `IN_PROGRESS` | `IMPLEMENTED` | `TESTED` | `VERIFIED` | `BLOCKED`

| Nhóm hệ thống | Tính năng cụ thể | Trạng thái | Ghi chú & Bằng chứng |
| --- | --- | --- | --- |
| **Save & Data** | Save Schema v3, di trú tự động v1/v2 → v3, xuất/nhập file `.mc263.json` | **VERIFIED** | `tests/wave1_storage_containers.test.ts`, `tests/wave9_advancements_redstone_v2.test.ts` |
| **Kho & Túi đồ** | Rương 27 ô, Thùng, Rương Đồng, Rương Ender 27 ô, Tay trái Offhand (`KeyF`) | **VERIFIED** | `tests/wave1_storage_containers.test.ts` |
| **Chế tạo & Nung** | Bàn Chế Tạo 3×3, Lò Nung, Lò Cao 2×, Lò Hun Khói 2×, Lửa Trại nướng đồ ăn | **VERIFIED** | `tests/wave7_stations_fishing.test.ts` |
| **Trạm chuyên dụng** | Máy Cắt Đá (Stonecutter UI), Bàn Rèn (Smithing), Bàn Phù Phép, Đe (Anvil), Đá Mài (Grindstone) | **VERIFIED** | `tests/wave7_stations_fishing.test.ts`, `src/components/ContainerModal.tsx` |
| **Trạm sinh tồn** | Thùng Ủ Phân (Composter 0..7 → Bột Xương), Cái Vạc (Cauldron 0..3 Xô/Chai), Câu cá Java (Luck/Lure/Kho báu) | **VERIFIED** | `tests/wave7_stations_fishing.test.ts` |
| **Pha thuốc** | Giàn Pha Thuốc Java (3 bình, Bột Quỷ Lửa 20 lượt, Awkward → Effects → Splash → Lingering) | **VERIFIED** | `tests/wave2_brewing.test.ts` |
| **Vật lý khối & Chất lỏng** | Cát/Cát Đỏ/Sỏi/Đe rơi theo cột trọng lực, Bột Bê Tông hóa cứng khi chạm Nước, Máy Tạo Đá Cuội (Cobblestone Generator), Nước+Dung Nham tạo Obsidian & lan truyền giới hạn | **VERIFIED** | `tests/wave11_physics_fluids.test.ts` |
| **Redstone cơ bản** | Dây Redstone 0–15 BFS, Repeater, Lever, Pressure Plates, Daylight Detector, Đèn ON/OFF, TNT | **VERIFIED** | `tests/wave3_redstone.test.ts` |
| **Redstone tự động** | Piston/Sticky Piston (≤12 khối), Hopper tự khóa khi có điện, Observer, Dispenser, Dropper, Đá Nhạc (Kèn Đồng 26.1) | **VERIFIED** | `tests/wave3_redstone.test.ts`, `tests/wave9_advancements_redstone_v2.test.ts` |
| **Thế giới & Cấu trúc** | Overworld, Nether, The End; Làng, Trại Bỏ Hoang 26.3, Pháo Đài Nether, Đền Thờ Đại Dương Ocean Monument (`(-3,-3)`), Cổ Thành/Trial Chamber/Trail Ruins; Cây/Mía tự lớn; `/locate` mở rộng | **VERIFIED** | `tests/wave4_trading_farming_worldgen.test.ts`, `tests/wave13_structures_enderman_loop.test.ts` |
| **Dân Làng & Nông trại** | Villager 6 nghề, giao dịch Ngọc Lục Bảo, Thủ thư bán Sách Phù Phép, Nhân giống thú non, Bồ Công Anh Vàng 26.1 | **VERIFIED** | `tests/wave4_trading_farming_worldgen.test.ts` |
| **Boss & Đèn Hiệu (Endgame)** | Rồng Ender, Warden Deep Dark, **Boss Wither** (300 HP, triệu hồi chữ T Cát/Đất Linh Hồn, BossBar tím, rơi Sao Nether) + **Đèn Hiệu Beacon 4 Tầng** (3×3→9×9, 6 hiệu ứng, cấp II) | **VERIFIED** | `tests/wave12_wither_beacon.test.ts` |
| **Chiến đấu & Mob Sinh tồn** | Cooldown Java, Chí mạng 1.5×, Đánh lan Kiếm, Chùy Mace 1.21; Skeleton, Blaze, Wolf thuần hóa/Giáp Sói, Iron Golem, Pillager, **Enderman** (dịch chuyển + Ngọc Ender), **Spider** (Tơ), **Slime** (Bóng Nhờn) | **VERIFIED** | `tests/wave5_java263_combat.test.ts`, `tests/wave8_mobs_raid.test.ts`, `tests/wave13_structures_enderman_loop.test.ts` |
| **Sự kiện Làng** | Đột Kích Làng 3 đợt (`/raid`), Raid BossBar, Chiến thắng + hiệu ứng Anh Hùng Của Làng (-30% giá Ngọc Lục Bảo) | **VERIFIED** | `tests/wave8_mobs_raid.test.ts` |
| **Java 26.1 – 26.3** | Name Tag chế tạo, Golden Dandelion, Rừng Dương Lốm Đốm, Gỗ Dương Poplar, Nấm Bệ, Giường Rơm, Đệm Ngồi, Phiến Len | **VERIFIED** | `tests/wave5_java263_combat.test.ts` |
| **Thành Tựu (Advancements)** | **22 Thành Tựu Java** (1.16→26.3, gồm Wither & Beacon), Toast vàng góc trên phải, Bảng Thành Tựu trong Pause Menu | **VERIFIED** | `tests/wave9_advancements_redstone_v2.test.ts`, `tests/wave12_wither_beacon.test.ts` |
| **Điều khiển & Âm thanh** | PC chuột PointerLock tự ẩn nút cảm ứng; Mobile 2 chế độ (Nút Đập/Đặt & Chạm đè màn hình); Âm thanh Minecraft/Resource Pack + WebAudio | **VERIFIED** | `compile_applet`, `lint_applet` |
| **Multiplayer mạng** | Chơi nhiều người qua mạng LAN / Dedicated Server | **BLOCKED** | Kiến trúc ứng dụng web thuần client-side không có backend server |
| **Chất lỏng 7 mức waterlogging & Chunk Light 15 bậc** | Dòng chảy đẩy thực thể 7 mức toàn chunk, waterlogging & lan truyền ánh sáng block-light 4-bit toàn chiều cao | **IN_PROGRESS** | Đã có lan truyền giới hạn + Máy Tạo Đá Cuội + Obsidian + ánh sáng động cục bộ để giữ ổn định FPS WebGL2 |
