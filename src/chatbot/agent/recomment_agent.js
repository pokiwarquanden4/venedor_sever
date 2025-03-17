import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

const categoryIds = [
    "8322", "1883", "1789", "2549", "1815", "1882", "1520", "8594",
    "931", "4384", "1975", "915", "17166", "1846", "1686", "4221",
    "1703", "1801", "27498", "44792", "8371", "6000", "11312", "976",
    "27616", "15078"
];


const systemPrompt = `
    \"\"\" 
    Bạn đóng vai một chatbot gợi ý sản phẩm cho một trang thương mại điện tử. Dựa trên danh mục sản phẩm được cung cấp, bạn sẽ phân tích yêu cầu của người dùng và đề xuất danh mục phù hợp nhất.

    Danh mục sản phẩm có sẵn (mã ID - mô tả):
    1. 8322 - Nhà Sách Tiki (Sách các thể loại)
    2. 1883 - Nhà Cửa - Đời Sống (Sản phẩm nội thất, gia dụng)
    3. 1789 - Điện Thoại - Máy Tính Bảng
    4. 2549 - Đồ Chơi - Mẹ & Bé
    5. 1815 - Thiết Bị Số - Phụ Kiện Số
    6. 1882 - Điện Gia Dụng
    7. 1520 - Làm Đẹp - Sức Khỏe
    8. 8594 - Ô Tô - Xe Máy - Xe Đạp
    9. 931 - Thời Trang Nữ
    10. 4384 - Bách Hóa Online
    11. 1975 - Thể Thao - Dã Ngoại
    12. 915 - Thời Trang Nam
    13. 17166 - Cross Border - Hàng Quốc Tế
    14. 1846 - Laptop - Máy Vi Tính - Linh Kiện
    15. 1686 - Giày - Dép Nam
    16. 4221 - Điện Tử - Điện Lạnh
    17. 1703 - Giày - Dép Nữ
    18. 1801 - Máy Ảnh - Máy Quay Phim
    19. 27498 - Phụ Kiện Thời Trang
    20. 44792 - NGON (Thực phẩm, đồ ăn)
    21. 8371 - Đồng Hồ & Trang Sức
    22. 6000 - Balo & Vali
    23. 11312 - Voucher - Dịch Vụ
    24. 976 - Túi Thời Trang Nữ
    25. 27616 - Túi Thời Trang Nam
    26. 15078 - Chăm Sóc Nhà Cửa

    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {
      "decision": "<mã danh mục>",
      "message": ""
    }
    \"\"\"`;

const RecommentFormat = z.object({
    decision: z.enum(categoryIds),
    message: z.string(),
});

const recommentAgent = async (preData, message) => {
    const data = [
        ...preData,
        {
            role: "system",
            content: systemPrompt,
        },
        {
            role: "user",
            content: message,
        }
    ]

    const responseFormat = zodResponseFormat(RecommentFormat, "schemaName")

    const results = await callAI(data, responseFormat)
    return results
}

export default recommentAgent