# TEST REPORT — Minecralap / NetherCraft 26.3 (Waves 1–18)

## 1. Kết quả Unit & Integration Tests (`npm test` → `tsx --test tests/*.test.ts`)

- **Tổng số bài kiểm thử**: **50**
- **Đạt (PASS)**: **50 / 50** (100%)
- **Thất bại (FAIL)**: **0**
- **Thời gian chạy**: ~6.4 giây

| Tệp kiểm thử | Số test | Kết quả | Nội dung đã xác minh |
| --- | --- | --- | --- |
| `tests/wave1_storage_containers.test.ts` | 3 | PASS | Save Schema v3, di trú v1→v3 giữ nguyên túi đồ/biến đổi khối, mảng Rương 27 ô & Giàn Pha Thuốc 3 bình |
| `tests/wave2_brewing.test.ts` | 3 | PASS | Ma trận pha thuốc Java, tiêu thụ Bột Quỷ Lửa, ủ 3 bình đồng thời, hủy tiến trình khi rút nguyên liệu |
| `tests/wave3_redstone.test.ts` | 5 | PASS | Suy hao Redstone 0–15 & Repeater, Lever bật/tắt Đèn & TNT, Piston/Sticky Piston + chặn Obsidian/Bedrock, Đá Nhạc Kèn Đồng 26.1, Hopper truyền đồ & khóa tín hiệu |
| `tests/wave4_trading_farming_worldgen.test.ts` | 4 | PASS | 6 nghề Dân Làng + Sách Phù Phép, giao dịch & thăng cấp giới hạn kho, thú non lớn lên & Bồ Công Anh Vàng 26.1 khóa tuổi, sinh cấu trúc Làng / Trại Bỏ Hoang 26.3 / Pháo Đài Nether |
| `tests/wave5_java263_combat.test.ts` | 3 | PASS | Công thức Thẻ Tên & Bồ Công Anh Vàng 26.1, khối/công thức/quần xã Rừng Dương 26.3, Attack Cooldown + Chí mạng 1.5× + Đánh lan Kiếm |
| `tests/wave7_stations_fishing.test.ts` | 4 | PASS | Câu cá Java (Luck/Lure/Enchanted Book), Composter 0→7 → Bột Xương, Cauldron 0→3 Xô/Chai, Stonecutter + Campfire + Blast Furnace/Smoker 2× |
| `tests/wave8_mobs_raid.test.ts` | 5 | PASS | 5 mob kinh điển + trứng + mesh 3D (`skeleton`, `blaze`, `wolf`, `iron_golem`, `pillager`), Đột Kích Làng 3 đợt & Chiến thắng, Anh Hùng Của Làng giảm giá 30%, Iron Golem & Sói thuần hóa tấn công quái (Sói ngồi đứng yên), lệnh `/raid` |
| `tests/wave9_advancements_redstone_v2.test.ts` | 4 | PASS | 25 Thành Tựu Java duy nhất + mở khóa idempotent + phần trăm tiến độ, Save Schema v3 di trú `advancements`/`composterLevels`/`cauldronLevels`, Observer kích đèn khi khối cạnh đổi, Dispenser bắn TNT/Nước & Dropper đẩy vật phẩm sang rương |
| `tests/wave11_physics_fluids.test.ts` | 4 | PASS | Nhận diện khối trọng lực, sụp đổ cột Cát/Sỏi/Đe, đông cứng Bột Bê Tông chạm Nước thành Bê Tông, Máy Tạo Đá Cuội (Cobblestone Generator), Nước đổ lên Dung Nham tạo Obsidian & lan truyền chất lỏng giới hạn |
| `tests/wave12_wither_beacon.test.ts` | 3 | PASS | Khung chữ T Cát/Đất Linh Hồn (trục X & Z) triệu hồi Wither, Kim Tự Tháp Đèn Hiệu Beacon Tầng 0→4 (bán kính 20→50, 6 hiệu ứng, cấp II ở Tầng 4), Boss Wither 300 HP / Sao Nether / `/summon wither` |
| `tests/wave13_structures_enderman_loop.test.ts` | 3 | PASS | Enderman (40 HP / `ender_pearl`), Spider (`string`), Slime (`slime_ball`) + trứng & `/summon`, sinh tất định Đền Thờ Đại Dương Ocean Monument tại `(-3, -3)` với Lăng Kính / Đèn Biển / 8 khối Vàng, lệnh `/locate` mở rộng |
| `tests/wave15_progression_mobs_shulker.test.ts` | 3 | PASS | 5 mob tiến trình (`wither_skeleton`, `evoker`, `vindicator`, `guardian`, `shulker`) + trứng + mô hình 3D, Hòm Shulker di động `packShulkerBoxItem`/`unpackShulkerBoxItem` giữ nguyên 27 ô & phù phép không dính tham chiếu, Đột Kích Làng Đợt 2 Vindicator & Đợt 3 Evoker + `/summon` |
| `tests/wave16_mansion_pyramid.test.ts` | 3 | PASS | Biệt Thự Rừng Woodland Mansion 2 tầng tại `(3, -3)` (Gỗ Sồi Đen, Kệ Sách, Đuốc, Rương, Kim Cương/Ngọc Lục Bảo), Kim Tự Tháp Sa Mạc tại `(-3, 2)` (Sa Thạch, Đĩa Áp Lực, chính xác 9 khối TNT, 4 Rương & Kim Cương), `/locate woodland_mansion` & `/locate desert_pyramid` |
| `tests/wave17_voxel_lighting.test.ts` | 3 | PASS | Block-Light BFS 0..15 suy hao đúng 1/khối & bị tường đá chắn, Skylight 15 ngoài trời vs 0 trong hang kín và bừng sáng ấm áp khi đặt Đuốc, 25 Thành Tựu Java (`shulker_box_pack`, `evoker_totem`, `mansion_explorer`) |

## 2. Kiểm tra kiểu tĩnh & Build sản xuất
- `npm run lint` (`tsc --noEmit`): **0 lỗi**.
- `compile_applet` (`npm run build` / Vite production bundle): Xác minh đồng thời cùng `lint_applet` ở bước chốt Wave 18.
