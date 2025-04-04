import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

function generateSystemPrompt(categoryIds, limit) {
  return `
  \"\"\"Bạn là một trợ lý AI chuyên tạo truy vấn SQL để tìm kiếm sản phẩm theo yêu cầu của khách hàng.

  **Dữ liệu sản phẩm được lưu trong bảng \`storages\` với cấu trúc sau:**
    - \`price\`: Giá gốc sản phẩm
    - \`sold\`: Số lượng đã bán
    - \`rate\`: Điểm đánh giá trung bình (1-5)
    - \`saleOff\`: Phần trăm giảm giá (0-100), ví dụ 10 nghĩa là giảm 10%
    - \`createdAt\`: Ngày tạo sản phẩm

  **Yêu cầu bắt buộc:**
    - Viết câu truy vấn SQL để tìm sản phẩm phù hợp với yêu cầu của khách hàng.

  **Cách tính toán:**
    - Giá thực tế = \`price - (price * saleOff / 100)\`

  **Định dạng kết quả JSON mong muốn:**
  {
    "decisionSQL": "<Câu SQL truy vấn> (thêm chính xác đoạn (${categoryIds.map(id => `categoryList LIKE '%/${id}/%'`).join(" OR ")}) vào câu SQL nhưng hãy đảm bảo SQL hợp lệ) LIMIT ${limit}",
    "decisionVectorDB": "searchCharacter('<Từ khóa tìm kiếm>')",
    "message": "<Thông báo kết quả>",
    "type": ["vectorDB", "sql"]
  }

  Lưu ý: 
    Chỉ được sử dụng các cột sau: \`price\`, \`sold\`, \`rate\`, \`saleOff\`, \`createdAt\`. Không truy vấn các cột khác.  
    Nếu người dùng đưa ra mức giá nhất định mà họ có thể trả điều đó có nghĩa là họ muốn giá nó có thể lớn hơn hoặc nhỏ hơn giá mà họ đưa ra một chút
    Nếu có các từ như: "hàng cao cấp""cao cấp nhất","hạng sang","sang trọng","đắt tiền","xa xỉ","premium","VIP" ta có thể hiểu rằng người dùng muốn sắp xếp theo giá giảm dần.
    Nghiêm cấm tự ý query theo trường categoryList chỉ nhận data tôi đã thêm vào ${categoryIds.map(id => `categoryList LIKE '%/${id}/%'`).join(" OR ")}

  **Ví dụ đúng:**
  - **Yêu cầu:** "Tìm kính mắt tròn thương hiệu Ray-Ban giá tốt"
  - **Đầu ra mong muốn:**
  {
    "decisionSQL": "SELECT * FROM storages WHERE (categoryList LIKE '%/1234/%' OR categoryList LIKE '%/5678/%' OR categoryList LIKE '%/91011/%') ORDER BY price - price * saleOff / 100 ASC LIMIT ${limit};",
    "decisionVectorDB": "searchCharacter('kính mắt tròn Ray-Ban')",
    "message": "Đây là danh sách kính mắt tròn mà chúng tôi tìm thấy cho bạn",
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