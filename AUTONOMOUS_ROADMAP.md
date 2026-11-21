# AUTONOMOUS ROADMAP — Minecralap (Minecraft: Java Edition 26.3 Parity Upgrade)

- **Phiên bản mục tiêu chính thức đã xác minh**: **Minecraft: Java Edition 26.3 ("Wilderness Bound")** (kèm các bản cập nhật chính thức từ 1.16 → 1.21.11 → 26.1 "Tiny Takeover" → 26.2 "Chaos Cubed" → 26.3 "Wilderness Bound").
- **Ngày hoàn tất thực thi tự động**: 2026-11-21
- **Trạng thái tổng thể**: Toàn bộ 6 đợt (Wave 0 → Wave 6) trong lộ trình đã hoàn tất triển khai, kiểm thử đơn vị (18/18 PASS), kiểm tra kiểu (`tsc --noEmit` 0 lỗi) và biên dịch production (`vite build` thành công).

## Lộ Trình Theo Đợt (Waves)

| Đợt | Phạm Vi Chính | Trạng Thái | Bằng Chứng Kiểm Thử |
| :--- | :--- | :--- | :--- |
| **Wave 0** | Kiểm toán toàn bộ repo, xác minh phiên bản Java 26.3, cài đặt `npm test` (`tsx --test`), khởi tạo 5 tài liệu theo dõi | `VERIFIED` | `package.json`, 5 file báo cáo |
| **Wave 1** | Save Schema v2 & migration tương thích ngược từ v1, Rương 27 ô (Chest) & Rương Ender 27 ô lưu theo tọa độ, Ô Tay Trái (Offhand + phím `F`, Khiên & Totem) | `VERIFIED` | `tests/wave1_storage_containers.test.ts` (3/3 PASS) |
| **Wave 2** | Hệ thống Giá Ủ Thuốc (Brewing Stand) đầy đủ ma trận pha chế Java Edition (Bột Quỷ Lửa 20 lượt, Awkward → 10+ hiệu ứng → đảo mắt nhện lên men → Splash → Lingering), UI Giá Ủ Thuốc & múc Chai Nước | `VERIFIED` | `tests/wave2_brewing.test.ts` (3/3 PASS) |
| **Wave 3** | Động cơ Redstone tín hiệu 0–15 (`redstone_wire`, `repeater`, `lever`, `redstone_lamp`/`redstone_lamp_on`, `tnt`, `piston`, `sticky_piston`, `pressure_plate`, `daylight_detector`, khóa Phễu `hopper` khi có điện) & Đá Phát Nhạc Kèn Đồng Java 26.1 | `VERIFIED` | `tests/wave3_redstone.test.ts` (5/5 PASS) |
| **Wave 4** | Mob Dân Làng (`villager`) + 6 nghề nghiệp chuẩn Java + Giao dịch Ngọc Lục Bảo (Thủ Thư bán Sách Phù Phép thật) + nhân giống thú non (`isBaby`) + khóa tuổi Bồ Công Anh Vàng (26.1) + Thẻ Tên + Cấu trúc Làng, Pháo Đài Nether & Trại Bỏ Hoang 26.3 | `VERIFIED` | `tests/wave4_trading_farming_worldgen.test.ts` (4/4 PASS) |
| **Wave 5** | Nội dung chính thức Java 26.1 (Thẻ Tên chế tạo được, Bồ Công Anh Vàng) & 26.3 (Quần xã Rừng Nắng Đốm `dappled_forest`, bộ gỗ Dương `poplar_*`, Nấm Thân Cây, Giường Rơm chức năng, Đệm Ngồi, Phiến Len) + Hồi chiêu chiến đấu Java, Chí mạng trên không 1.5×, Quét Kiếm + Cây trồng & Mầm cây tự lớn theo Random Tick | `VERIFIED` | `tests/wave5_java263_combat.test.ts` (3/3 PASS) |
| **Wave 6** | Kiểm thử hồi quy toàn hệ thống (`npm test`, `tsc --noEmit`, `vite build`), đồng bộ đầy đủ 5 tài liệu quản lý & ghi rõ giới hạn kiến trúc | `VERIFIED` | 18/18 unit tests PASS, `compile_applet` PASS, `lint_applet` PASS |
