import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

const categories = [
    { id: 8322, name: "Nhà Sách Tiki (Sách các thể loại)" },
    { id: 1883, name: "Nhà Cửa - Đời Sống (Nội thất - Trang trí nhà tắm nhà vệ sinh nhà bếp, Vệ sinh - Tẩy rửa,  Tủ đồ - Lưu trữ, Chăn ga gối nệm, Dụng cụ & Sửa chữa, An ninh - An toàn ngôi nhà, Thiết bị - Vật tư điện nước)" },
    { id: 1789, name: "Điện Thoại - Máy Tính Bảng" },
    { id: 2549, name: "Đồ Chơi - Mẹ & Bé" },
    { id: 1815, name: "Thiết Bị Số - Phụ Kiện Số (Tai Nghe, Cáp và Dây Sạc, Phụ Kiện Máy Tính và Điện Thoại, Loa và Thiết Bị Âm Thanh, Phụ Kiện Điện Thoại, Phụ Kiện Laptop)" },
    { id: 1882, name: "Điện Gia Dụng (Thiết bị nấu cơm, nấu cháo, hầm, hấp, Thiết bị chiên, nướng, nấu lẩu, Máy làm bánh, làm sữa, làm mì, làm kem, Thiết bị pha chế - Xay ép - Đánh trứng, Bếp & Thiết bị đun nấu, Thiết bị điện nhà bếp khác, Quạt và thiết bị làm mát, Thiết bị sưởi & tạo độ ẩm, Thiết bị vệ sinh và làm sạch nhà cửa,  Thiết bị lọc nước & nước nóng lạnh, Thiết bị ủi quần áo, giặt sấy, Máy cạo râu, cắt tóc, làm tóc, Thiết bị may vá)" },
    { id: 1520, name: "Làm Đẹp - Sức Khỏe (Chăm sóc cá nhân, Chăm sóc sức khỏe,  Dụng cụ làm đẹp làm sạch và chăm sóc cá nhân, Sản phẩm dinh dưỡng)" },
    { id: 8594, name: "Ô Tô - Xe Máy - Xe Đạp" },
    { id: 931, name: "Thời Trang Nữ" },
    { id: 4384, name: "Bách Hóa Online (Sữa và sản phẩm từ sữa, Cà phê - Trà - Đồ uống - Đồ uống có cồn, Gạo - Ngũ cốc - Bột, Mì - Bún - Cháo ăn liền, Bánh - Kẹo - Snack, Đồ khô đóng gói, Gia vị - Nước chấm - Dầu, Thực phẩm bổ sung - Hữu cơ - Ăn kiêng, Chăm sóc thú cưng, Đồ dùng gia đình - Vệ sinh)" },
    { id: 1975, name: "Thể Thao - Dã Ngoại (Dụng Cụ Thể Thao & Gym, Dụng Cụ Dã Ngoại, Phụ Kiện Bơi Lội, Phụ Kiện Golf, Thực Phẩm & Dinh Dưỡng Thể Thao)" },
    { id: 915, name: "Thời Trang Nam" },
    { id: 1846, name: "Laptop - Máy Vi Tính - Linh Kiện" },
    { id: 1686, name: "Giày - Dép Nam" },
    { id: 4221, name: "Điện Tử - Điện Lạnh (Tivi & Thiết Bị Liên Quan, Máy Lạnh & Điều Hòa, Máy Giặt & Sấy, Máy Rửa Chén & Phụ Kiện, Tủ Lạnh & Tủ Đông, Máy Nước Nóng)" },
    { id: 1703, name: "Giày - Dép Nữ" },
    { id: 1801, name: "Máy Ảnh - Máy Quay Phim" },
    { id: 27498, name: "Phụ Kiện Thời Trang" },
    { id: 44792, name: "NGON (Thực phẩm, đồ ăn)" },
    { id: 8371, name: "Đồng Hồ & Trang Sức" },
    { id: 6000, name: "Balo & Vali" },
    { id: 976, name: "Túi Thời Trang Nữ" },
    { id: 27616, name: "Túi Thời Trang Nam" },
    { id: 15078, name: "Chăm Sóc Nhà Cửa (Sản Phẩm Vệ Sinh Nhà Cửa, Giặt Giũ & Chăm Sóc Quần Áo, Diệt Côn Trùng, Khử Mùi & Thơm, Giấy Vệ Sinh & Khăn Giấy)" }
];


function generateSystemPrompt(previousChoices) {
    const formatted = categories
        .filter(c => !previousChoices.includes(c.id))
        .map(c => `${c.id} - ${c.name}`)
        .join('\n');

    return `
    Bạn đóng vai một chatbot gợi ý sản phẩm cho một trang thương mại điện tử. Dựa trên danh mục sản phẩm được cung cấp, bạn sẽ phân tích yêu cầu của người dùng và đề xuất danh mục phù hợp nhất.

    Danh mục sản phẩm có sẵn (mã ID - mô tả):
    
    ${formatted}
    
    Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
    {
      "decision": "<mã danh mục>"
      "message": ""
    }
        `;
}

const RecommentFormat = z.object({
    decision: z.number(),
    message: z.string(),
});

const recommentAgent = async (preData, message, previousChoices) => {
    const systemPrompt = generateSystemPrompt(previousChoices)

    const data = [
        {
            role: "assistant",
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