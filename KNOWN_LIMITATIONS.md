# KNOWN LIMITATIONS — Minecralap

Tài liệu này ghi nhận trung thực các giới hạn kỹ thuật chưa thể đạt 100% tương đương Minecraft: Java Edition gốc trong kiến trúc web client-only hiện tại.

1. **Chiều cao thế giới (`Y = 0..255` thay vì `-64..319`)**:
   - Chunk hiện lưu mảng 16 subchunk (`0..255`) để tối ưu bộ nhớ trình duyệt (đặc biệt trên điện thoại) và giữ tương thích ngược 100% với các file thế giới đã lưu trước đó. Tầng âm `-64..-1` chưa được bật.
2. **Đa người chơi (Multiplayer / Realms / LAN)**:
   - Ứng dụng chạy hoàn toàn ở phía trình duyệt (`localStorage`), chưa có máy chủ WebSocket/authoritative backend để đồng bộ thế giới và thực thể giữa nhiều người chơi.
3. **Đồ họa WebGL2 thay vì Vulkan / Vibrant Visuals gốc**:
   - Engine sử dụng Three.js WebGL2, chưa có ray-tracing phần cứng, volumetric lighting đầy đủ hay render pipeline Vulkan gốc của Java Edition 26.x.
4. **Hành vi Redstone nâng cao & Quasi-Connectivity**:
   - Đã hỗ trợ truyền tín hiệu 0–15, Repeater, Lever, Pressure Plate, Daylight Detector, Redstone Lamp, TNT, Piston/Sticky Piston (đẩy 12 khối / kéo 1 khối), Note Block đa nhạc cụ (gồm Kèn Đồng 26.1) và khóa Hopper. Tuy nhiên chưa mô phỏng chi tiết Quasi-Connectivity (QC), Comparator chế độ trừ tín hiệu phức tạp hay độ trễ tick chính xác 1/20s của mạch đồng hồ siêu nhanh.
5. **AI Dân Làng, Đột Kích (Raid) & Đường đi (Pathfinding 3D)**:
   - Dân Làng đã có 6 nghề nghiệp, giao dịch Ngọc Lục Bảo, lên cấp và Sách Phù Phép, nhưng chưa có lịch trình ngày/đêm đi ngủ – làm việc tại workstation hay sự kiện Pillager Raid.
6. **Hệ thống Lệnh Brigadier / NBT / Datapack**:
   - Có các lệnh cơ bản (`/gamemode`, `/tp`, `/give`, `/time`, `/weather`, `/xp`, `/summon`, `/gamerule`...) nhưng chưa hỗ trợ cú pháp selector/NBT đầy đủ và Datapack/Mod loader của Java Edition.
7. **Kiểm thử tự động WebGL trực quan**:
   - 18/18 unit/integration tests xác minh chặt chẽ logic cốt lõi (Save/Migration, Brewing, Redstone, Trading, Breeding, WorldGen, Combat, Recipes), trong khi tương tác đồ họa 3D/touch/WebAudio được xác minh qua kiểm tra kiểu TypeScript và biên dịch bundle production (`compile_applet` + `lint_applet`).
