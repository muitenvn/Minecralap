# TEST REPORT — Minecralap Autonomous Complete Upgrade

- **Thời điểm chạy kiểm thử cuối**: 2026-11-21
- **Môi trường kiểm thử**: Node.js (`tsx --test`), TypeScript (`tsc --noEmit`), Vite production bundler (`vite build` qua `compile_applet` & `lint_applet`).

## 1. Kết Quả Unit & Integration Tests (`npm test`)

Tổng số test case: **18 / 18 PASSED (0 failed, 0 skipped)**

| Bộ Test | Số Test | Kết Quả | Nội Dung Xác Minh |
| :--- | :---: | :---: | :--- |
| `tests/wave1_storage_containers.test.ts` | 3 | `PASS` | Khởi tạo World Schema v2, migration save v1→v2 không mất dữ liệu, khởi tạo Rương 27 ô & Giá Ủ Thuốc |
| `tests/wave2_brewing.test.ts` | 3 | `PASS` | Ma trận pha chế Java (Awkward → Hiệu ứng → Đảo mắt nhện → Splash → Lingering), tiêu hao nhiên liệu Bột Quỷ Lửa, ủ 3 chai đồng thời, hủy tiến trình khi rút nguyên liệu |
| `tests/wave3_redstone.test.ts` | 5 | `PASS` | Suy hao tín hiệu Redstone 0–15 + khuếch đại Repeater, Cần Gạt bật/tắt Đèn & kích nổ TNT, Piston đẩy 3 khối / từ chối Obsidian / Piston Dính kéo khối, Kèn Đồng Note Block 26.1, Phễu chuyển đồ & khóa khi có điện |
| `tests/wave4_trading_farming_worldgen.test.ts` | 4 | `PASS` | 6 nghề Dân Làng + Thủ Thư bán Sách Phù Phép, thực thi giao dịch + lên cấp + khóa hết hàng, thú non tự lớn & khóa tuổi bằng Bồ Công Anh Vàng 26.1, sinh cấu trúc Làng (2,1), Trại Bỏ Hoang (-2,2) & Pháo Đài Nether (1,1) |
| `tests/wave5_java263_combat.test.ts` | 3 | `PASS` | Chế tạo Thẻ Tên & Bồ Công Anh Vàng (26.1), 12 block & công thức 26.3 Wilderness Bound + quần xã Rừng Nắng Đốm, hồi chiêu chiến đấu Java + Chí mạng 1.5× + Quét Kiếm |

## 2. Kết Quả Kiểm Tra Kiểu & Biên Dịch

- **`lint_applet` (`tsc --noEmit`)**: **PASS** (0 lỗi TypeScript trên toàn bộ `src/`).
- **`compile_applet` (`vite build`)**: **PASS** (biên dịch gói production hoàn chỉnh thành công).

## 3. Lỗi Phát Hiện Trong Quá Trình Kiểm Thử & Đã Sửa

1. `engine.ts`: tham chiếu `this.activeContainer` không tồn tại ở tick Brewing Stand → sửa bằng cờ `activeBrewChanged` gắn với `this.activeBrewingKey`.
2. `audio.ts`: gọi `this.ensureContext()` thay vì `this.ensureCtx()` trong `playNoteBlockSound` → đã sửa và `tsc` đạt 0 lỗi.
3. `worldGen.ts` & `wave4`: chữ ký `generateChunk(dimension, cx, cz, mods)` và đảm bảo Làng vùng xuất phát `(2,1)` luôn sinh kể cả khi seed rơi vào vùng đỉnh núi → đã sửa và test 15/15 PASS.
4. `engine.ts`: gọi `addPlayerXp` thay vì `grantPlayerXp` → đổi sang `grantPlayerXp` (đồng thời kích hoạt tự sửa Mending cho cả Ô Tay Trái).
5. `worldGen.ts` & `catalog116.ts`: `poplar_leaves` dùng `texStyle: 'stone'` hợp lệ và bổ sung `dappled_forest` vào nhánh sinh cây Overworld → 18/18 PASS và `tsc` đạt 0 lỗi.
