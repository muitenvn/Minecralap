# IMPLEMENTATION PROGRESS — Minecralap

- **Cập nhật lần cuối**: 2026-11-21
- **Trạng thái hiện tại**: Hoàn thành tất cả các đợt (Wave 0 → Wave 6). Không còn công việc dang dở trong phạm vi thực thi client-side web.

## Nhật Ký Triển Khai Chi Tiết

### Wave 0 — Audit & Test Harness (`VERIFIED`)
- Rà soát toàn bộ mã nguồn `src/game/*` và `src/components/*`.
- Bổ sung script `"test": "tsx --test tests/*.test.ts"` trong `package.json`.
- Xác minh chuỗi bản phát hành Java Edition 2026: `1.21.5–1.21.11` → `26.1 Tiny Takeover` → `26.2 Chaos Cubed` → `26.3 Wilderness Bound`.

### Wave 1 — Save Schema v2, Persistent Chests/Ender Chest & Offhand (`VERIFIED`)
- **Files đã sửa**: `src/game/types.ts`, `src/game/storage.ts`, `src/game/engine.ts`, `src/components/ContainerModal.tsx`, `src/components/HudOverlay.tsx`, `src/App.tsx`.
- **Tests**: `tests/wave1_storage_containers.test.ts` — 3/3 PASS.
- **Tính năng**:
  - `migrateWorldSave()` tự động nâng cấp file save v1 cũ sang v2 mà không mất túi đồ hay block đã xây.
  - Rương Đồ 27 ô lưu bền vững theo tọa độ `chests["x,y,z"]` và Rương Ender 27 ô dùng chung toàn thế giới (`enderChest`), hỗ trợ Shift+Click chuyển đồ nhanh.
  - Ô Tay Trái (`offhand`) đổi nhanh bằng phím `F` hoặc bấm trực tiếp bên cạnh thanh Hotbar; hỗ trợ đỡ đòn bằng Khiên và hồi sinh bằng Vật Tổ Bất Tử (Totem) ở tay trái.

### Wave 2 — Brewing Stand & Java Potion Matrix (`VERIFIED`)
- **Files đã tạo/sửa**: `src/game/brewing.ts`, `src/game/engine.ts`, `src/components/ContainerModal.tsx`.
- **Tests**: `tests/wave2_brewing.test.ts` — 3/3 PASS.
- **Tính năng**:
  - Ma trận pha chế chuẩn Java (`BREWING_RULES`): Chai Nước + Bướu Nether → Thuốc Vụng Về → 10+ loại thuốc cơ bản → Đảo hiệu ứng bằng Mắt Nhện Lên Men → Thuốc Ném (Thuốc Súng) → Thuốc Lưu Lại (Hơi Rồng).
  - Bột Quỷ Lửa nạp 20 lượt ủ, tiến trình ủ 8 giây đồng thời cho 3 chai, giao diện Giá Ủ Thuốc có thanh nhiên liệu, thanh tiến trình và bảng hướng dẫn công thức tiếng Việt.

### Wave 3 — Redstone Signal Propagation & Automation (`VERIFIED`)
- **Files đã tạo/sửa**: `src/game/redstone.ts`, `src/game/catalog116.ts`, `src/game/blocks.ts`, `src/game/audio.ts`, `src/game/engine.ts`.
- **Tests**: `tests/wave3_redstone.test.ts` — 5/5 PASS.
- **Tính năng**:
  - Bột Redstone đặt được thành Dây Redstone (`redstone_wire`), truyền tín hiệu 0–15 theo BFS và khuếch đại lại mức 15 qua Bộ Lặp (`repeater`).
  - Cần Gạt (`lever`), Tấm Áp Lực (`oak_pressure_plate`/`stone_pressure_plate`), Cảm Biến Ánh Sáng (`daylight_detector`), Khối/Đuốc Redstone kích hoạt Đèn Redstone (`redstone_lamp` ↔ `redstone_lamp_on`), kích nổ TNT, đẩy tối đa 12 khối (từ chối Đá Nền/Hắc Diện Thạch) với Piston & kéo khối với Piston Dính.
  - Phễu (`hopper`) tự động chuyển vật phẩm giữa 2 Rương xếp chồng và bị khóa khi nhận tín hiệu Redstone (chuẩn Java Edition).
  - Đá Phát Nhạc (`note_block`) nhận diện nhạc cụ theo khối bên dưới — bao gồm **Kèn Đồng (Trumpet — Java 26.1)** khi đặt trên các khối Đồng, tổng hợp âm thanh WebAudio riêng theo cao độ 0–24 bán cung.

### Wave 4 — Villagers, Emerald Trading, Breeding & Procedural Structures (`VERIFIED`)
- **Files đã tạo/sửa**: `src/game/trading.ts`, `src/game/mobs.ts`, `src/game/worldGen.ts`, `src/game/engine.ts`, `src/components/ContainerModal.tsx`, `src/App.tsx`.
- **Tests**: `tests/wave4_trading_farming_worldgen.test.ts` — 4/4 PASS.
- **Tính năng**:
  - Mob Dân Làng (`villager`) với 6 nghề nghiệp chuẩn Java (`farmer`, `librarian`, `weaponsmith`, `armorer`, `cleric`, `toolsmith`), lên cấp 1→5 theo XP giao dịch, giới hạn tồn kho (`maxUses`), Thủ Thư bán Sách Phù Phép thật (Mending, Efficiency IV, Sharpness IV, Unbreaking III, Fortune III, Protection IV...).
  - Nhân giống động vật (Cừu/Heo/Lạc Đà/Dê) sinh thú non (`isBaby`, kích thước 0.55×) tự lớn sau 120s, hỗ trợ **Bồ Công Anh Vàng (26.1)** khóa tuổi vĩnh viễn và **Thẻ Tên** đặt tên mob.
  - Sinh cấu trúc xác định theo seed: **Làng Dân Làng** (nhà gỗ/đá sa thạch có rương, giường, bàn chế tạo, ruộng lúa mì tưới nước), **Pháo Đài Nether** (cầu gạch Nether, vườn Bướu Nether trên Cát Linh Hồn, rương kho báu), và **Trại Bỏ Hoang 26.3** (lửa trại, giường rơm, rương, lều vải).

### Wave 5 — Java 26.1–26.3 Parity, Combat Cooldown & Natural Random-Tick Growth (`VERIFIED`)
- **Files đã tạo/sửa**: `src/game/combat.ts`, `src/game/catalog116.ts`, `src/game/worldGen.ts`, `src/game/engine.ts`, `src/components/HudOverlay.tsx`.
- **Tests**: `tests/wave5_java263_combat.test.ts` — 3/3 PASS.
- **Tính năng**:
  - **26.1 Tiny Takeover**: Công thức chế tạo Thẻ Tên (`paper` + `iron_nugget`/`gold_nugget`) và Bồ Công Anh Vàng (`dandelion` + 8 `gold_nugget`).
  - **26.3 Wilderness Bound**: Quần xã mới **Rừng Nắng Đốm (`dappled_forest`)** có cây Gỗ Dương (`poplar_log`, `poplar_leaves`, `shelf_mushroom`), đầy đủ bộ chế tạo `poplar_planks/slab/stairs/fence`, `straw_bed` (ngủ & hồi sinh được), `cushion`, `white_wool_slab`, `red_wool_slab`, cùng Trứng Dân Làng (`villager_spawn_egg`).
  - **Chiến đấu chuẩn Java**: Thanh hồi chiêu đánh dưới tâm ngắm, nhân sát thương theo độ nạp (`0.2 + 0.8 * cd^2`), **Đòn Chí Mạng trên không 1.5×** kèm hạt vàng, và **Đòn Quét Kiếm (Sweeping)** đánh lan mob lân cận trong bán kính 2.5m.
  - **Random-Tick tự nhiên**: Mía tự mọc cao tối đa 3 khối và cây non (Sồi, Anh Đào, Gỗ Dương) tự lớn thành cây hoàn chỉnh theo thời gian.

### Wave 6 — Final Regression & Documentation Sync (`VERIFIED`)
- Chạy đầy đủ `npm test` (18/18 PASS), `lint_applet` (`tsc --noEmit` 0 lỗi), và `compile_applet` (`vite build` thành công).
- Cập nhật toàn bộ 5 file báo cáo phản ánh trung thực trạng thái từng tính năng và giới hạn kỹ thuật.
