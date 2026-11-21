# FEATURE COMPLETION MATRIX — Minecralap (Target: Java Edition 26.3)

Quy ước trạng thái:
- `VERIFIED`: Đã triển khai đầy đủ, có test tự động chạy PASS và build thành công.
- `IMPLEMENTED`: Đã triển khai trong mã nguồn & biên dịch sạch, xác minh chủ yếu qua runtime tương tác UI/WebGL.
- `BLOCKED`: Bị giới hạn bởi kiến trúc trình duyệt / client-only hiện tại (chi tiết trong `KNOWN_LIMITATIONS.md`).

| Nhóm Hệ Thống | Tính Năng | Trạng Thái | Bằng Chứng |
| :--- | :--- | :--- | :--- |
| **Save & Persistence** | Save Schema v2 + nâng cấp tự động save v1 cũ (`migrateWorldSave`) | `VERIFIED` | `tests/wave1_storage_containers.test.ts` |
| **Save & Persistence** | Rương Đồ 27 ô lưu theo tọa độ + Rương Ender 27 ô toàn cục + Shift+Click | `VERIFIED` | `tests/wave1_storage_containers.test.ts` + `ContainerModal.tsx` |
| **Player & Combat** | Ô Tay Trái (Offhand, phím `F`, Khiên đỡ đòn, Totem hồi sinh, Mending) | `VERIFIED` | `tests/wave1_storage_containers.test.ts` + `engine.ts` |
| **Player & Combat** | Hồi chiêu vũ khí Java (0..1) + Thanh dưới tâm ngắm + Chí mạng trên không 1.5× + Quét Kiếm | `VERIFIED` | `tests/wave5_java263_combat.test.ts` + `HudOverlay.tsx` |
| **Player & Combat** | Chùy Mace đập rơi + Phù phép Density & Wind Burst + 22 phù phép chuẩn Java | `IMPLEMENTED` | `src/game/enchanting.ts`, `src/game/engine.ts`, `vite build` |
| **Crafting & Alchemy** | Chế tạo 2×2 & 3×3, Lò Nung, Bàn Rèn Netherite, Bàn Phù Phép, Đe Rèn | `VERIFIED` | `tests/wave5_java263_combat.test.ts` + `ContainerModal.tsx` |
| **Crafting & Alchemy** | Giá Ủ Thuốc (Brewing Stand) chuẩn ma trận Java + Bột Quỷ Lửa 20 lượt + 3 chai đồng thời | `VERIFIED` | `tests/wave2_brewing.test.ts` |
| **Redstone & Automation** | Dây Redstone 0–15 + Bộ Lặp + Cần Gạt + Tấm Áp Lực + Cảm Biến Ánh Sáng | `VERIFIED` | `tests/wave3_redstone.test.ts` |
| **Redstone & Automation** | Đèn Redstone bật/tắt + Kích nổ TNT + Piston đẩy 12 khối / Piston Dính kéo khối | `VERIFIED` | `tests/wave3_redstone.test.ts` |
| **Redstone & Automation** | Phễu (Hopper) chuyển đồ giữa 2 Rương & khóa khi có điện | `VERIFIED` | `tests/wave3_redstone.test.ts` |
| **Redstone & Automation** | Đá Phát Nhạc đa nhạc cụ + **Kèn Đồng Java 26.1** trên khối Đồng | `VERIFIED` | `tests/wave3_redstone.test.ts` + `src/game/audio.ts` |
| **Villager & Farming** | Mob Dân Làng + 6 nghề nghiệp + Giao dịch Ngọc Lục Bảo + Lên cấp + Sách Phù Phép | `VERIFIED` | `tests/wave4_trading_farming_worldgen.test.ts` |
| **Villager & Farming** | Nhân giống động vật, thú non tự lớn, **Bồ Công Anh Vàng (26.1)** khóa tuổi, Thẻ Tên | `VERIFIED` | `tests/wave4_trading_farming_worldgen.test.ts` |
| **Villager & Farming** | Random-Tick tự nhiên mọc Mía & cây non (Sồi, Anh Đào, Gỗ Dương) | `IMPLEMENTED` | `src/game/engine.ts` (`updateWorldSystems`) |
| **World & Structures** | 3 chiều không gian (Overworld, Nether 5 biome, The End + Rồng Ender) | `IMPLEMENTED` | `src/game/worldGen.ts`, `src/game/mobs.ts` |
| **World & Structures** | Cấu trúc Làng Dân Làng, Pháo Đài Nether, Trại Bỏ Hoang 26.3, Stronghold, Trial Chamber, Ancient City | `VERIFIED` | `tests/wave4_trading_farming_worldgen.test.ts` |
| **Java 26.1–26.3 Drops** | 26.1 Tiny Takeover (Thẻ Tên chế tạo, Bồ Công Anh Vàng, Kèn Đồng Note Block) | `VERIFIED` | `tests/wave3_redstone.test.ts`, `tests/wave4_...`, `tests/wave5_...` |
| **Java 26.1–26.3 Drops** | 26.2 Chaos Cubed (Sulfur Caves, Sulfur Cube, Lưu Huỳnh, Chu Sa) | `IMPLEMENTED` | `src/game/catalog116.ts`, `src/game/mobs.ts`, `src/game/worldGen.ts` |
| **Java 26.1–26.3 Drops** | 26.3 Wilderness Bound (Rừng Nắng Đốm, bộ Gỗ Dương, Nấm Thân Cây, Giường Rơm, Đệm, Phiến Len, Trại Bỏ Hoang) | `VERIFIED` | `tests/wave4_...`, `tests/wave5_java263_combat.test.ts` |
| **Controls & Audio** | PC chuột mượt tự ẩn phím cảm ứng + 2 chế độ Mobile (Nút bấm & PE chạm trực tiếp) + Âm thanh Minecraft/Resource Pack | `IMPLEMENTED` | `src/game/engine.ts`, `src/game/audio.ts`, `src/components/HudOverlay.tsx` |
| **World Height (-64..319)** | Tầng âm Y=-64..319 (hiện tại là Y=0..255) | `BLOCKED` | Giới hạn giữ tương thích 100% file save cũ & ngân sách RAM trình duyệt |
| **Multiplayer** | Máy chủ đa người chơi / đồng bộ WebSocket / Realms | `BLOCKED` | Kiến trúc ứng dụng hiện tại là client-only (không có backend server đồng bộ world) |
| **Data/Commands/NBT** | Toàn bộ hệ thống Brigadier NBT, Datapack & Render Vulkan gốc | `BLOCKED` | Giới hạn nền tảng WebGL2/Three.js trên trình duyệt |
