# KNOWN LIMITATIONS — Minecralap / NetherCraft 26.3

Tài liệu này ghi nhận trung thực các giới hạn kỹ thuật chưa thể đạt 100% tương đương Minecraft: Java Edition gốc trong kiến trúc ứng dụng Web Client-Side hiện tại:

1. **Không hỗ trợ Multiplayer / LAN Server**:
   - Ứng dụng chạy hoàn toàn phía trình duyệt (client-side + IndexedDB), chưa có máy chủ WebSocket/WebRTC đồng bộ thế giới nhiều người chơi.
2. **Chất lỏng (Nước / Dung nham) 7 bậc toàn chunk & Waterlogging**:
   - Đã hỗ trợ vật lý khối trọng lực (Cát, Sỏi, Đe, Bột Bê Tông hóa cứng khi chạm Nước), lan truyền chất lỏng có giới hạn, **Máy Tạo Đá Cuội (Cobblestone Generator)** và tạo **Hắc Diện Thạch (Obsidian)**; tuy nhiên chưa mô phỏng dòng chảy 7 mức đẩy thực thể toàn chunk hay waterlogging cầu thang/phiến đá để giữ FPS WebGL2 mượt trên thiết bị di động.
3. **Phạm vi Skylight vượt quá +24 khối trên đỉnh Subchunk**:
   - Động cơ chiếu sáng Voxel 15 bậc (`src/game/lighting.ts`) tính đầy đủ Block-Light BFS 0..15 và Skylight 0..15 trong vùng đệm 32³ quanh mỗi subchunk kèm kiểm tra mái che cao +24 khối; một hang sâu có trần dày nhưng rỗng trên 24 khối phía trên vẫn dùng ngưỡng tối cục bộ để tránh phải quét cả 256 tầng mỗi khung hình remesh.
4. **Cấu trúc Jigsaw ngẫu nhiên vô hạn nhiều phòng**:
   - Đã có Làng, Trại Bỏ Hoang 26.3, Pháo Đài Nether, Đền Thờ Đại Dương Ocean Monument (`(-3, -3)`), Biệt Thự Rừng Woodland Mansion 2 tầng (`(3, -3)`), Kim Tự Tháp Sa Mạc (`(-3, 2)`), Cổ Thành/Trial Chamber/Trail Ruins, Đảo The End với Rồng Ender, Warden Deep Dark, Boss Wither và Đột Kích Làng 3 đợt; các công trình được sinh theo kiến trúc đa phòng tất định tối ưu cho chunk 16×16 thay vì bộ ghép khối Jigsaw nhiều chunk ngẫu nhiên hoàn toàn như máy chủ Java gốc.
5. **Băng thông tài nguyên âm thanh & texture ngoài**:
   - Ứng dụng ưu tiên âm thanh và hình ảnh từ Resource Pack người dùng nạp hoặc gói mặc định tải về; nếu ngoại tuyến hoàn toàn hoặc Resource Pack chỉ chứa ảnh, động cơ âm thanh tự chuyển sang bộ âm thanh chuẩn tích hợp và WebAudio tổng hợp.
