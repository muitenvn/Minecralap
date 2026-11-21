# KNOWN LIMITATIONS — Minecralap / NetherCraft 26.3

Tài liệu này ghi nhận trung thực các giới hạn kỹ thuật chưa thể đạt 100% tương đương Minecraft: Java Edition gốc trong kiến trúc ứng dụng Web Client-Side hiện tại:

1. **Không hỗ trợ Multiplayer / LAN Server**:
   - Ứng dụng chạy hoàn toàn phía trình duyệt (client-side + IndexedDB), chưa có máy chủ WebSocket/WebRTC đồng bộ thế giới nhiều người chơi.
2. **Chất lỏng (Nước / Dung nham) 7 bậc toàn chunk & Waterlogging**:
   - Đã hỗ trợ vật lý khối trọng lực (Cát, Sỏi, Đe, Bột Bê Tông hóa cứng khi chạm Nước), lan truyền chất lỏng có giới hạn, **Máy Tạo Đá Cuội (Cobblestone Generator)** và tạo **Hắc Diện Thạch (Obsidian)**; tuy nhiên chưa mô phỏng dòng chảy 7 mức đẩy thực thể toàn chunk hay waterlogging cầu thang/phiến đá để giữ FPS WebGL2 mượt trên thiết bị di động.
3. **Hệ thống chiếu sáng Voxel 15 bậc đầy đủ (Flood-fill Skylight & Blocklight)**:
   - Thế giới sử dụng ánh sáng mặt trời/đêm, bóng đổ động và PointLight cục bộ quanh các khối phát sáng gần người chơi thay vì mảng lightmap 4-bit toàn bộ chiều cao Y=0..255.
4. **Một số công trình siêu lớn nhiều phòng ngẫu nhiên**:
   - Đã có Làng, Trại Bỏ Hoang 26.3, Pháo Đài Nether, Đền Thờ Đại Dương Ocean Monument (`(-3, -3)`), Cổ Thành/Trial Chamber/Trail Ruins, Đảo The End với Rồng Ender, Warden Deep Dark, Boss Wither và Đột Kích Làng 3 đợt; vẫn chưa sinh đầy đủ biệt thự rừng Woodland Mansion nhiều tầng hay hệ thống phòng mê cung Jigsaw hoàn chỉnh như Java Edition gốc.
5. **Băng thông tài nguyên âm thanh & texture ngoài**:
   - Ứng dụng ưu tiên âm thanh và hình ảnh từ Resource Pack người dùng nạp hoặc gói mặc định tải về; nếu ngoại tuyến hoàn toàn hoặc Resource Pack chỉ chứa ảnh, động cơ âm thanh tự chuyển sang bộ âm thanh chuẩn tích hợp và WebAudio tổng hợp.
