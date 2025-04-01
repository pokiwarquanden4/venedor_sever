import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

function generateSystemPrompt(categoryIds, limit) {
  return `
  \"\"\"Bạn là một trợ lý AI chuyên tạo truy vấn SQL để tìm kiếm sản phẩm theo yêu cầu của khách hàng.

  **Dữ liệu sản phẩm được lưu trong bảng \`storages\` với cấu trúc sau:**
    - \`id\`: ID sản phẩm
    - \`price\`: Giá gốc sản phẩm
    - \`sold\`: Số lượng đã bán
    - \`rate\`: Điểm đánh giá trung bình (1-5)
    - \`brandName\`: Thương hiệu sản phẩm
    - \`saleOff\`: Phần trăm giảm giá (0-100), ví dụ 10 nghĩa là giảm 10%
    - \`categoryList\`: Danh mục sản phẩm dưới dạng chuỗi (VD: "/1/31/13/224/")
    - \`createdAt\`: Ngày tạo sản phẩm

  **Yêu cầu bắt buộc:**
    - Viết câu truy vấn SQL để tìm sản phẩm phù hợp với yêu cầu của khách hàng.
    - **Đảm bảo \`categoryList\` chứa ít nhất một trong các categoryId sau: ${categoryIds}.**
    - **Chỉ được so sánh categoryList với ID, không được dùng tên danh mục.**
    - **Truy vấn danh mục theo cú pháp:**  
      \`categoryList LIKE '%/ID/%'\` với ID thuộc danh sách trên.

  **Cách tính toán:**
    - Giá thực tế = \`price - (price * saleOff / 100)\`
    - Truy vấn theo \`brandName\` không phân biệt hoa thường.

  **Định dạng kết quả JSON mong muốn:**
  {
    "decisionSQL": "<Câu SQL truy vấn> LIMIT ${limit}",
    "decisionVectorDB": "searchCharacter('<Từ khóa tìm kiếm>')",
    "message": "<Thông báo kết quả>",
    "type": ["vectorDB", "sql"]
  }

  **Ví dụ đúng:**
  - **Yêu cầu:** "Tìm kính mắt tròn thương hiệu Ray-Ban giá tốt"
  - **Đầu ra mong muốn:**
  {
    "decisionSQL": "SELECT * FROM storages WHERE LOWER(brandName) = LOWER('Ray-Ban') AND (categoryList LIKE '%/1234/%' OR categoryList LIKE '%/5678/%' OR categoryList LIKE '%/91011/%') ORDER BY price - price * saleOff / 100 ASC LIMIT ${limit};",
    "decisionVectorDB": "searchCharacter('kính mắt tròn')",
    "message": "Đây là danh sách kính mắt tròn của Ray-Ban mà chúng tôi tìm thấy cho bạn",
    "type": ["vectorDB", "sql"]
  }

\"\"\"`;
}

const RecommentClassificationFormat = z.object({
  decisionSQL: z.string(),
  decisionVectorDB: z.string(),
  message: z.string(),
  type: z.array(z.string())
});

const generateSQL = async (preData, message, categoryIds, limit) => {
  const systemPrompt = generateSystemPrompt(categoryIds, limit)

  const data = [
    ...preData,
    {
      role: "assistant",
      content: systemPrompt,
    },
    {
      role: "user",
      content: message,
    }
  ]

  const responseFormat = zodResponseFormat(RecommentClassificationFormat, "schemaName")

  const results = await callAI(data, responseFormat)
  return results
}

export default generateSQL