# Shop bảng giá linh hoạt

## Cấu trúc file
- `index.html`: giao diện chính
- `style.css`: toàn bộ CSS
- `config.js`: thông tin shop + cấu hình Google Sheet
- `app.js`: logic load sheet, lọc sản phẩm, modal đặt hàng

## Cách up lên GitHub
1. Tạo repository mới trên GitHub.
2. Upload toàn bộ 4 file này lên root của repo.
3. Nếu dùng GitHub Pages:
   - vào **Settings**
   - chọn **Pages**
   - Source: **Deploy from a branch**
   - Branch: **main** / **root**
4. Đợi GitHub build xong rồi mở link Pages.

## File cần sửa nhiều nhất
Chỉnh file `config.js`:
- tên shop
- ảnh logo / avatar
- link liên hệ
- `sheetId`
- `priceGid`
- tên cột Google Sheet

## Lưu ý
Google Sheet phải public hoặc ai có link cũng xem được, không là web không load được CSV.
