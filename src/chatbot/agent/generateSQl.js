import { zodResponseFormat } from "openai/helpers/zod.mjs";
import { callAI } from "./utils";
import { z } from "zod";

function generateSystemPrompt(categoryIds, limit) {
  return `
 \"\"\"Bạn là một trợ lý AI công việc của bạn là tạo cho tôi một câu SQL query phù hợp với yêu cầu tìm kiếm sản phẩm của khách hàng.

         Tôi có table storages được lưu trong SQL như sau:
          -id: id của sản phẩm
          -price: giá gốc của sản phẩm
          -sold: số sản phẩm đã bán được
          -rate: 1-5 đánh giá trung bình của người mua hàng
          -brandName: thương hiệu của sản phẩm
          -saleOff: 0-100 giảm giá (VD: 10 => có nghĩa là giảm 10%)
          -categoryList: loại của sản phẩm (VD: /1/31/13/224/ => vậy có nghĩa là sản phẩm sẽ thuộc các categoryId 1,31,13,224)
          -createdAt: ngày tạo ra sản phẩm
          
          Tôi muốn bạn hãy tìm sản phẩm dựa vào yêu cầu của khách hàng và phải đảm bảo categoryList có chứa một trong các categoryId sau (ưu tiên càng nhiều categoryId trùng càng tốt): ${categoryIds}
          
          Lưu ý: 
            -Chỉ được query dựa trên các column trên
            -Giá thực của sản phẩm sẽ = price - price*saleOff/100
            -Nếu compare bằng brandName hãy đảm bảo không phân biệt chữ hoa hay chữ thường
            -categoryList chỉ được query theo ${categoryIds}
        

        Đầu ra của bạn phải ở định dạng JSON có cấu trúc như sau. Hãy đảm bảo tuân thủ đúng định dạng chỉ cần trả về kết quả như dưới không cần giải thích gì thêm:
        {
          "decisionSQL": câu sql của bạn + LIMIT ${limit} (Nếu không có trả về "")
          "decisionVectorDB": searchCharacter('value') (value là tên hoặc đặc điểm mô tả của sản phẩm, Nếu không có trả về "")
          "message": ""
          "type": Nếu có decisionSQL có và decisionVectorDB rỗng => ['sql'], decisionSQL rỗng và decisionVectorDB có => ['vectorDB'], decisionSQL có và decisionVectorDB có => ['vectorDB', 'sql']
        }

        VD: Tôi muốn mua một chiếc áo khoác mùa đông màu hồng của hãng Dior rẻ
        {
          "decisionSQL": "SELECT * FROM storages WHERE LOWER(brandName) = LOWER('Dior') AND (categoryList LIKE '%/49356/%' OR categoryList LIKE '%/27596/%' OR categoryList LIKE '%/67225/%') ORDER BY price - price * saleOff / 100 ASC LIMIT ${limit};",
          "decisionVectorDB": "searchCharacter('áo khoác mùa đông màu hồng')",
          "message": "Đây là danh sách áo hồng của Dior mà chúng tôi tìm ra cho bạn",
          "type": ["vectorDB", "sql"]
        }
        VD: Tôi muốn mua một món quà sinh nhật cho bạn gái rẻ. (Do món quà sinh nhật không phải tên hay đặc điểm nhận dạng nên decisionVectorDB="")
        {
          "decisionSQL": "SELECT * FROM storages WHERE (categoryList LIKE '%/914/%' OR categoryList LIKE '%/933/%' OR categoryList LIKE '%/981/%' OR categoryList LIKE '%/984/%' OR categoryList LIKE '%/1008/%') ORDER BY (price - price * saleOff / 100) ASC LIMIT ${limit};",
          "decisionVectorDB": "", 
          "message": "Đây là danh sách món quà sinh nhật tặng bạn gái rẻ mà tôi tìm được cho bạn",
          "type": ["sql"]
        }
        VD: Tôi muốn tìm áo blazer
        {
          "decisionSQL": "",
          "decisionVectorDB": "searchCharacter('áo blazer')",
          "message": "Đây là danh sách áo blazer mà tôi tìm được cho bạn",
          "type": ["vectorDB"]
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