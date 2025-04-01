import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

function generateSystemPrompt(categoryIds) {
  return `
 \"\"\"Bạn là một trợ lý AI công việc của bạn là tạo cho tôi một câu SQL query phù hợp với yêu cầu tìm kiếm sản phẩm của khách hàng.

         Tôi có table storages được lưu trong SQL như sau:
          -id: id của sản phẩm
          -productName: tên của sản phẩm
          -price: giá gốc của sản phẩm
          -sold: số sản phẩm đã bán được
          -rate: 1-5 đánh giá trung bình của người mua hàng
          -brandName: thương hiệu của sản phẩm
          -saleOff: 0-100 giảm giá (VD: 10 => có nghĩa là giảm 10%)
          -categoryList: loại của sản phẩm (VD: /1/31/13/224/ => vậy có nghĩa là sản phẩm sẽ thuộc các categoryId 1,31,13,224)
          -createdAt: ngày tạo ra sản phẩm

          Lưu ý: 
            -Chỉ được query dựa trên các column trên
            -Giá thực của sản phẩm sẽ = price - price*saleOff/100
        
        Tôi muốn bạn hãy tìm sản phẩm dựa vào yêu cầu của khách hàng và phải đảm bảo categoryList có chứa một trong các categoryId sau (ưu tiên càng nhiều categoryId trùng càng tốt): ${categoryIds}

        Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
        {
          "decision": câu sql của bạn + LIMIT 5
          "message": ""
          "type": 'sql'
        }
        VD: Tôi muốn mua một chiếc áo khoác mùa đông rẻ 
        {
          "decision": SELECT * FROM storages WHERE categoryList LIKE '%/49356/%' OR categoryList LIKE '%/27596/%' OR categoryList LIKE '%/67225/%' ORDER BY price - price * saleOff / 100 ASC LIMIT 5
          "message": "Đây là danh sách áo khoác mùa đông rẻ dành cho bạn"
          "type": 'sql'
        }
        VD: Tôi muốn mua laptop hãng Dell giá khoảng 20 triệu. 
        {
          decision: "SELECT * FROM storages WHERE LOWER(brandName) = LOWER('Dell')  AND price - price * saleOff / 100 <= 20000000 AND categoryList LIKE '%/8095/%' ORDER BY price - price * saleOff / 100 ASC LIMIT 5",
          message: 'Đây là danh sách laptop Dell giá khoảng 20 triệu dành cho bạn',
          type: 'sql'
        }

        Hoặc nếu người dùng muốn tìm theo tên riêng hoặc đặc điểm cụ thể của sản phẩm thì hãy trả về như sau
        {
          "decision": searchCharacter('value')
          "message": ""
          "type": 'vectorDB'
        }
        VD: Tôi muốn mua một chiếc áo khoác màu tím 
        {
          "decision": searchCharacter('áo khoác màu tím')
          "message": "Đây là danh sách áo khoác màu tìm dành cho bạn"
          "type": 'vectorDB'
        }
\"\"\"`;
}

const RecommentClassificationFormat = z.object({
  decision: z.string(),
  message: z.string(),
  type: z.string()
});

const generateSQL = async (preData, message, categoryIds) => {
  const systemPrompt = generateSystemPrompt(categoryIds)

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