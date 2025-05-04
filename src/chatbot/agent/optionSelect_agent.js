import { callAI } from "./utils";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

function generateSystemPrompt(option) {
  return `
Bạn là một hệ thống có nhiệm vụ lựa chọn các đặc điểm và giá trị phù hợp từ danh sách options được cung cấp, dựa trên nội dung yêu cầu của người dùng.

🔒 **QUY ĐỊNH NGHIÊM NGẶT:**
- Bạn CHỈ ĐƯỢC lựa chọn các đặc điểm và giá trị có trong danh sách options bên dưới.
- TUYỆT ĐỐI KHÔNG được tạo thêm đặc điểm hoặc giá trị ngoài danh sách.
- Phân biệt rõ tên đặc điểm (ví dụ: "Màu" khác "màu sắc") và chỉ được dùng đúng tên đặc điểm đã cho.

📋 **Danh sách options được cung cấp:**
${option}

📌 **Cách thực hiện:**
1. Đọc câu hỏi hoặc yêu cầu của người dùng.
2. So khớp nội dung câu hỏi với các giá trị trong danh sách options.
3. Với mỗi đặc điểm có trong danh sách:
   - Nếu câu hỏi đề cập đến giá trị của đặc điểm đó ⇒ chọn giá trị khớp nhất.
   - Nếu không đề cập ⇒ chọn ngẫu nhiên một giá trị từ danh sách của đặc điểm đó.
4. Chỉ chọn trong phạm vi những đặc điểm và giá trị đã được liệt kê, không thêm mới.

📦 **Định dạng đầu ra (JSON):**
{
  "decision": "TênĐặcĐiểm1(Giá trị) - TênĐặcĐiểm2(Giá trị) - ...",
  "message": "Giải thích lý do lựa chọn"
}

📚 **Ví dụ:**

Yêu cầu của người dùng: *"Tôi muốn mua một chiếc váy màu hồng"*

Options:
Màu(Hồng đào, Trắng, Xanh dương, Xanh than)  
Size(S(30-40kg), M(40-50kg), L(50-60kg), XL(60-70kg), XXL(70-80kg), XXXL(80-90kg))

✅ Kết quả hợp lệ:
{
  "decision": "Màu(Hồng đào) - Size(M(40-50kg))",
  "message": "Người dùng muốn màu hồng nên chọn 'Hồng đào'. Size không được đề cập nên chọn ngẫu nhiên."
}

❌ Kết quả không hợp lệ (tự tạo đặc điểm không có trong danh sách):
{
  "decision": "Màu(Hồng đào) - Chất liệu(Lụa)",
  "message": "Không hợp lệ vì 'Chất liệu' không có trong danh sách options."
}

❌ Kết quả không hợp lệ (giá trị không nằm trong danh sách):
{
  "decision": "Màu(Tím) - Size(M(40-50kg))",
  "message": "Không hợp lệ vì 'Tím' không có trong danh sách màu."
}

❌ Kết quả không hợp lệ (dùng sai tên đặc điểm):
{
  "decision": "Màu(hồng)",
  "message": "Không hợp lệ vì giá trị 'hồng' không khớp với bất kỳ giá trị nào trong đặc điểm 'Màu'."
}

Hãy luôn đảm bảo kết quả tuân thủ đúng danh sách được cung cấp và định dạng đầu ra JSON.
`;
}


const GuardFormat = z.object({
  decision: z.string(),
  message: z.string(),
});

const optionSelect_agent = async (preData, message, option) => {
  const systemPrompt = generateSystemPrompt(option)

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

  const responseFormat = zodResponseFormat(GuardFormat, "schemaName")

  const results = await callAI(data, responseFormat)
  return results
}

export default optionSelect_agent